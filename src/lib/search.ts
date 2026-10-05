import Fuse from "fuse.js";
import { Product } from "./types";
import { SEARCH_SYNONYMS } from "./catalog/synonyms";
import { normalizeProductName } from "./catalog/normalize";

let fuseInstance: Fuse<Product> | null = null;
let fuseProducts: Product[] | null = null;
const normalizedNames = new Map<string, string>();
function displayName(name: string): string {
  if (!normalizedNames.has(name)) normalizedNames.set(name, normalizeProductName(name));
  return normalizedNames.get(name)!;
}

export function normalizeSearchText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getSearchableText(product: Product): string {
  const text = normalizeSearchText(`${product.nombre} ${displayName(product.nombre)} ${product.brand} ${product.id} ${product.cat} ${product.ref || ""} ${product.sku || ""} ${(product.tags || []).join(" ")}`);
  const names = normalizeSearchText(product.nombre);
  const aliases = SEARCH_SYNONYMS.filter(group => group.some(term => names.includes(term))).flat();
  return text + " " + aliases.join(" ");
}

export function getFuseInstance(products: Product[]): Fuse<Product> {
  // Re-crear el índice si cambia la lista (ej: /ofertas vs /catalogo)
  if (!fuseInstance || fuseProducts !== products) {
    fuseProducts = products;
    fuseInstance = new Fuse(products, {
      keys: [
        { name: "nombre", weight: 0.4 },
        { name: "brand", weight: 0.15 },
        { name: "ref", weight: 0.2 },
        { name: "sku", weight: 0.1 },
        { name: "id", weight: 0.1 },
        { name: "cat", weight: 0.05 },
        { name: "tags", weight: 0.1 },
      ],
      threshold: 0.35,
      distance: 200,
      ignoreLocation: true,
      ignoreDiacritics: true,
      useExtendedSearch: false,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }
  return fuseInstance;
}

function startsWithTerm(text: string, term: string): boolean {
  return text.startsWith(term) && (!text[term.length] || /[^\p{L}\p{N}]/u.test(text[term.length]));
}

/** Alternatives affect relevance only; identifiers and the existing match set stay literal. */
function leadingQueryVariants(query: string): string[] {
  const variants = new Set([query]);
  for (const group of SEARCH_SYNONYMS) {
    for (const term of group) {
      if (!startsWithTerm(query, term)) continue;
      const tail = query.slice(term.length);
      for (const alternative of group) variants.add(alternative + tail);
    }
  }
  return [...variants];
}

function relevanceRank(product: Product, query: string, tokens: string[], variants: string[]): number[] {
  const names = [normalizeSearchText(product.nombre), normalizeSearchText(displayName(product.nombre))];
  const isIdentifier = (value?: string) => !!value && normalizeSearchText(value) === query;
  const identifier = isIdentifier(product.id) ? 3 : isIdentifier(product.sku) ? 2 : isIdentifier(product.ref) ? 1 : 0;
  const exactName = names.includes(query) ? 2 : variants.some(variant => names.includes(variant)) ? 1 : 0;
  const prefix = names.some(name => name.startsWith(tokens[0])) || variants.slice(1).some(variant => {
    const first = variant.split(/\s+/)[0];
    return names.some(name => startsWithTerm(name, first) || startsWithTerm(name, first + "s"));
  });
  const inName = variants.some(variant => {
    const words = variant.split(/\s+/).filter(Boolean);
    return names.some(name => words.every(word => name.includes(word)));
  });
  // Lexicographic tiers keep stock or a promotion from outranking an exact SKU or name prefix.
  return [identifier, exactName, Number(prefix), Number(inName),
    Number(normalizeSearchText(product.brand).includes(query)), Number(product.stock > 0), Number(!!product.disc && product.disc > 0)];
}

function compareRanks(a: number[], b: number[]): number {
  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) return b[index] - a[index];
  }
  return 0;
}

/**
 * Hybrid search: exact tokenized match first, then fuzzy fallback
 */
export function searchProducts(
  products: Product[],
  query: string
): { results: Product[]; isFuzzy: boolean } {
  const q = query.trim();
  if (!q) return { results: products, isFuzzy: false };

  const normalizedQuery = normalizeSearchText(q);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  // 1. Tokenized exact match
  const exactResults = products.filter((p) => {
    const searchable = getSearchableText(p);
    return tokens.every((t) => searchable.includes(t));
  });

  if (exactResults.length > 0) {
    const variants = leadingQueryVariants(tokens.join(" "));
    const ranked = exactResults.map(product => ({ product, rank: relevanceRank(product, normalizedQuery, tokens, variants) }));
    ranked.sort((a, b) => compareRanks(a.rank, b.rank));
    return { results: ranked.map(({ product }) => product), isFuzzy: false };
  }

  // 2. Fuzzy fallback
  const fuse = getFuseInstance(products);
  const fuseResults = fuse.search(normalizedQuery);
  return {
    results: fuseResults.map((r) => r.item),
    isFuzzy: fuseResults.length > 0,
  };
}

import Fuse from "fuse.js";
import { Product } from "./types";

let fuseInstance: Fuse<Product> | null = null;
let fuseProducts: Product[] | null = null;

export function normalizeSearchText(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getSearchableText(product: Product): string {
  return normalizeSearchText(`${product.nombre} ${product.brand} ${product.id} ${product.cat} ${product.ref || ""} ${product.sku || ""} ${(product.tags || []).join(" ")}`);
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
    // Score and sort exact results
    exactResults.sort((a, b) => {
      const score = (p: Product) => {
        let s = 0;
        const nameL = normalizeSearchText(p.nombre);
        if ([p.id, p.ref, p.sku].some(value => value && normalizeSearchText(value) === normalizedQuery)) s += 100;
        if (tokens.every((t) => nameL.includes(t))) s += 50;
        if (nameL.startsWith(tokens[0])) s += 30;
        if (normalizeSearchText(p.brand).includes(normalizedQuery)) s += 20;
        if (p.stock > 0) s += 5;
        if (p.disc && p.disc > 0) s += 3;
        return s;
      };
      return score(b) - score(a);
    });
    return { results: exactResults, isFuzzy: false };
  }

  // 2. Fuzzy fallback
  const fuse = getFuseInstance(products);
  const fuseResults = fuse.search(normalizedQuery);
  return {
    results: fuseResults.map((r) => r.item),
    isFuzzy: fuseResults.length > 0,
  };
}

import Fuse from "fuse.js";
import { Product } from "./types";

let fuseInstance: Fuse<Product> | null = null;

export function getFuseInstance(products: Product[]): Fuse<Product> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(products, {
      keys: [
        { name: "nombre", weight: 0.4 },
        { name: "brand", weight: 0.15 },
        { name: "ref", weight: 0.2 },
        { name: "id", weight: 0.1 },
        { name: "cat", weight: 0.05 },
        { name: "tags", weight: 0.1 },
      ],
      threshold: 0.35,
      distance: 200,
      ignoreLocation: true,
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

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

  // 1. Tokenized exact match
  const exactResults = products.filter((p) => {
    const searchable = `${p.nombre} ${p.brand} ${p.id} ${p.cat} ${p.ref || ""} ${p.sku || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
    return tokens.every((t) => searchable.includes(t));
  });

  if (exactResults.length > 0) {
    // Score and sort exact results
    exactResults.sort((a, b) => {
      const score = (p: Product) => {
        let s = 0;
        const nameL = p.nombre.toLowerCase();
        if (p.id === q || (p.ref && p.ref.toLowerCase() === q.toLowerCase())) s += 100;
        if (tokens.every((t) => nameL.includes(t))) s += 50;
        if (nameL.startsWith(tokens[0])) s += 30;
        if (p.brand.toLowerCase().includes(q.toLowerCase())) s += 20;
        if (p.img) s += 5;
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
  const fuseResults = fuse.search(q, { limit: 100 });
  return {
    results: fuseResults.map((r) => r.item),
    isFuzzy: true,
  };
}

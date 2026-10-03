import type { Product } from "./types";

export type CatalogFacet = { name: string; count: number };

export type CatalogSuggestion = {
  type: "product" | "category" | "brand";
  label: string;
  value: string;
  description?: string;
  img?: string;
};

export type CatalogResponse = {
  products: Product[];
  total: number;
  page: number;
  pageSize: 24;
  totalPages: number;
  isFuzzy: boolean;
  categories: CatalogFacet[];
  brands: CatalogFacet[];
  priceBounds?: { min: number; max: number };
  suggestions: CatalogSuggestion[];
  filtersValid: boolean;
};

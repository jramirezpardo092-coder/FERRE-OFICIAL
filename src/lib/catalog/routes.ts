import { CATEGORIES } from "../constants";
import type { Product } from "../types";
import { normalizeProductNameForRoute } from "./normalize";

export function getProductSlug(product: Pick<Product, "id" | "nombre">): string {
  const name = normalizeProductNameForRoute(product.nombre).toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${product.id}-${name || "producto"}`;
}
export const getProductPath = (product: Pick<Product, "id" | "nombre">) => `/producto/${encodeURIComponent(getProductSlug(product))}`;
export function getCategoryPath(name: string): string {
  const category = CATEGORIES.find((item) => item.name === name || item.slug === name);
  return category ? `/catalogo/${category.slug}` : "/catalogo";
}
export function toSearchParams(values: Record<string, string | string[] | undefined> = {}): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string") params.set(key, value);
    else if (value?.[0]) params.set(key, value[0]);
  }
  return params;
}

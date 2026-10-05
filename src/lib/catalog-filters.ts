import type { Product } from "./types";
import type { CatalogPriceMode } from "./catalog-types";
import { getAvailableQuantity, getDiscountPercent, getTaxRate, hasVerifiedPrice } from "./utils";

export type FiltersValue = {
  category: string;
  brand: string;
  priceMin: string;
  priceMax: string;
  priceMode?: CatalogPriceMode;
  availability: "all" | "in-stock" | "on-request";
  offersOnly: boolean;
};

export const DEFAULT_FILTERS: Readonly<FiltersValue> = Object.freeze({
  category: "",
  brand: "",
  priceMin: "",
  priceMax: "",
  priceMode: "gross",
  availability: "all",
  offersOnly: false,
});

export type FiltersValidation = {
  valid: boolean;
  min?: number;
  max?: number;
  errors: { priceMin?: string; priceMax?: string; priceRange?: string; priceMode?: string };
};

export function isCatalogPriceMode(mode: unknown): mode is CatalogPriceMode {
  return mode === "gross" || mode === "net";
}

/** Ranges and sorting compare the same integer COP amount presented to the customer. */
export function getCatalogPrice(product: Product, mode: CatalogPriceMode = "gross"): number | null {
  if (!hasVerifiedPrice(product)) return null;
  if (mode === "net") return Math.round(product.precio);
  const rate = getTaxRate(product);
  if (rate === null) return null;
  const gross = product.precio * (1 + rate / 100);
  if (!Number.isFinite(gross)) return null;
  return Math.round(gross);
}

export function normalizeCatalogFilters(value: Partial<FiltersValue>): FiltersValue & { priceMode: CatalogPriceMode } {
  const text = (input: unknown) => typeof input === "string" ? input.trim() : "";
  return {
    category: text(value.category),
    brand: text(value.brand),
    priceMin: text(value.priceMin),
    priceMax: text(value.priceMax),
    priceMode: isCatalogPriceMode(value.priceMode) ? value.priceMode : "gross",
    availability: value.availability === "in-stock" || value.availability === "on-request" ? value.availability : "all",
    offersOnly: value.offersOnly === true,
  };
}

export function validateCatalogFilters(value: FiltersValue): FiltersValidation {
  const errors: FiltersValidation["errors"] = {};
  if (value.priceMode !== undefined && !isCatalogPriceMode(value.priceMode)) errors.priceMode = "Selecciona precios con IVA o sin IVA.";
  const parse = (text: string, field: "priceMin" | "priceMax") => {
    if (!text.trim()) return undefined;
    const price = Number(text);
    if (!Number.isFinite(price) || price < 0 || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text.trim())) {
      errors[field] = "Ingresa un precio mayor o igual a cero.";
      return undefined;
    }
    if (Math.abs(price * 100 - Math.round(price * 100)) > 0.000001) {
      errors[field] = "Usa hasta dos decimales.";
      return undefined;
    }
    return price;
  };
  const min = parse(value.priceMin, "priceMin");
  const max = parse(value.priceMax, "priceMax");
  if (min !== undefined && max !== undefined && min > max) {
    errors.priceRange = "El precio mínimo debe ser menor o igual al máximo.";
  }
  return { valid: Object.keys(errors).length === 0, min, max, errors };
}

export function getActiveFilterCount(value: FiltersValue): number {
  return Number(!!value.category) + Number(!!value.brand) + Number(!!(value.priceMin.trim() || value.priceMax.trim()))
    + Number(value.availability !== "all") + Number(value.offersOnly);
}

/** Stock filters are optional; catalog eligibility/rotation is decided upstream. */
export function applyCatalogFilters<T extends Product>(products: readonly T[], value: FiltersValue): T[] {
  const filters = normalizeCatalogFilters(value);
  const validation = validateCatalogFilters(filters);
  // Keep the results useful while an incomplete price range is being corrected.
  const min = validation.valid ? validation.min : undefined;
  const max = validation.valid ? validation.max : undefined;
  const usesPrice = min !== undefined || max !== undefined;
  return products.filter((product) => {
    if (filters.category && product.cat !== filters.category) return false;
    if (filters.brand && product.brand !== filters.brand) return false;
    const inStock = getAvailableQuantity(product) > 0;
    if (filters.availability === "in-stock" && !inStock) return false;
    if (filters.availability === "on-request" && inStock) return false;
    if (usesPrice) {
      const price = getCatalogPrice(product, filters.priceMode);
      if (price === null || (min !== undefined && price < min) || (max !== undefined && price > max)) return false;
    }
    if (filters.offersOnly && !(hasVerifiedPrice(product) && typeof product.original === "number"
      && Number.isFinite(product.original) && product.original > product.precio && (getDiscountPercent(product) ?? 0) > 0)) return false;
    return true;
  });
}

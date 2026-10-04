import "server-only";

import productsData from "@/data/products.json";
import type { Product } from "./types";
import type { CatalogFacet, CatalogResponse, CatalogSuggestion } from "./catalog-types";
import { applyCatalogFilters, normalizeCatalogFilters, validateCatalogFilters } from "./catalog-filters";
import { enrichProducts, getLocalProductImagePath } from "./product-enrichment";
import { normalizeSearchText, searchProducts } from "./search";
import { getAvailableQuantity, getDiscountPercent, hasVerifiedPrice } from "./utils";
import { getProductSlug } from "./catalog/routes";
import { displayBrand, normalizeProductName } from "./catalog/normalize";

const PAGE_SIZE = 24;
const SORT_OPTIONS = new Set(["relevance", "availability", "price-asc", "price-desc", "discount", "name"]);

/** A published Product is the only data allowed across the server/client boundary. */
function publicProduct(product: Product): Product {
  return {
    id: product.id,
    nombre: product.nombre,
    precio: product.precio,
    unidad: product.unidad,
    stock: product.stock,
    cat: product.cat,
    brand: product.brand,
    ...(product.original === null || (typeof product.original === "number" && Number.isFinite(product.original)) ? { original: product.original } : {}),
    ...(product.disc === null || (typeof product.disc === "number" && Number.isFinite(product.disc)) ? { disc: product.disc } : {}),
    ...(typeof product.img === "string" ? { img: product.img } : {}),
    ...(typeof product.ref === "string" ? { ref: product.ref } : {}),
    ...(typeof product.sku === "string" ? { sku: product.sku } : {}),
    ...(Array.isArray(product.tags) ? { tags: product.tags.filter((tag) => typeof tag === "string") } : {}),
    ...(product.taxRate === 0 || product.taxRate === 5 || product.taxRate === 19 ? { taxRate: product.taxRate } : {}),
    ...(typeof product.priceVerified === "boolean" ? { priceVerified: product.priceVerified } : {}),
    ...(Array.isArray(product.gallery) ? { gallery: product.gallery.filter((image) => image.verified === true && typeof image.src === "string").map((image) => ({
      src: image.src,
      verified: true as const,
      ...(typeof image.alt === "string" ? { alt: image.alt } : {}),
    })) } : {}),
    ...(Array.isArray(product.specs) ? { specs: product.specs.filter((spec) => spec.verified === true && typeof spec.label === "string" && typeof spec.value === "string").map((spec) => ({
      label: spec.label, value: spec.value, verified: true as const,
    })) } : {}),
  };
}

const catalog = enrichProducts(productsData as Product[]).map(publicProduct);
const catalogById = new Map(catalog.map((product) => [product.id, product]));
const catalogBySlug = new Map(catalog.map((product) => [getProductSlug(product), product]));
const displayNames = new Map(catalog.map((product) => [product.id, normalizeProductName(product.nombre)]));
const catalogByCategory = new Map<string, Product[]>();
for (const product of catalog) {
  const category = catalogByCategory.get(product.cat) || [];
  category.push(product);
  catalogByCategory.set(product.cat, category);
}

/** Server consumers receive their own data, so mutation cannot alter another request. */
export function getCatalogProducts(): Product[] {
  return catalog.map(publicProduct);
}

/** Home highlights use the same approved photos as the catalog, without hiding other references. */
export function getFeaturedCatalogProducts(): Product[] {
  const candidates = catalog.filter((product) => {
    const primary = getLocalProductImagePath(product.img);
    return hasVerifiedPrice(product) && getAvailableQuantity(product) > 0 && !!primary
      && product.gallery?.some((image) => image.verified === true && getLocalProductImagePath(image.src) === primary);
  });
  const featured: Product[] = [];
  const selectedIds = new Set<string>();
  const selectedCategories = new Set<string>();
  const add = (product: Product) => {
    featured.push(publicProduct(product));
    selectedIds.add(product.id);
  };
  // Give photographed categories a place first, keeping the published order.
  for (const product of candidates) {
    if (selectedCategories.has(product.cat) || selectedIds.has(product.id)) continue;
    add(product);
    selectedCategories.add(product.cat);
    if (featured.length === 8) return featured;
  }
  // Categories without an approved photograph do not create empty cards.
  for (const product of candidates) {
    if (selectedIds.has(product.id)) continue;
    add(product);
    if (featured.length === 8) break;
  }
  return featured;
}

export function getCatalogProduct(id: string): Product | undefined {
  const product = catalogById.get(id) || catalogBySlug.get(id);
  return product ? publicProduct(product) : undefined;
}

export function getRelatedCatalogProducts(id: string, limit = 4): Product[] {
  const product = catalogById.get(id);
  if (!product) return [];
  const maximum = Number.isFinite(limit) ? Math.max(0, Math.min(12, Math.floor(limit))) : 4;
  if (!maximum) return [];
  const related: Product[] = [];
  for (const candidate of catalogByCategory.get(product.cat) || []) {
    if (candidate.id !== id) related.push(publicProduct(candidate));
    if (related.length === maximum) break;
  }
  return related;
}

function facets(products: Product[], field: "cat" | "brand"): CatalogFacet[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const name = product[field];
    if (name.trim() && (field !== "brand" || displayBrand(name))) counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, "es"));
}

const categoryOptions = facets(catalog, "cat");
const brandOptions = facets(catalog, "brand");

function search(query: string): { results: Product[]; isFuzzy: boolean } {
  if (query) {
    const normalized = normalizeSearchText(query);
    // Textual equality keeps 0044 distinct from 44 and outranks substring/fuzzy names.
    const identifiers = catalog.filter((product) => [product.id, product.ref, product.sku]
      .some((value) => value && normalizeSearchText(value) === normalized));
    if (identifiers.length) return { results: identifiers, isFuzzy: false };
  }
  return searchProducts(catalog, query);
}

function suggestions(query: string, results: Product[]): CatalogSuggestion[] {
  if (query.length < 2) return [];
  const tokens = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  const matches = (name: string) => tokens.every((token) => normalizeSearchText(name).includes(token));
  const categories = categoryOptions.filter((item) => matches(item.name)).slice(0, 2);
  const brands = brandOptions.filter((item) => matches(item.name)).slice(0, 2);
  return [
    ...results.slice(0, 4).map((product): CatalogSuggestion => ({
      type: "product", label: normalizeProductName(product.nombre), value: product.id,
      description: [displayBrand(product.brand), product.cat].filter(Boolean).join(" · "),
      ...(product.img ? { img: product.img } : {}),
    })),
    ...categories.map((item): CatalogSuggestion => ({ type: "category", label: item.name, value: item.name, description: `${item.count.toLocaleString("es-CO")} referencias` })),
    ...brands.map((item): CatalogSuggestion => ({ type: "brand", label: item.name, value: item.name, description: `${item.count.toLocaleString("es-CO")} referencias` })),
    ...results.slice(4, 8).map((product): CatalogSuggestion => ({
      type: "product", label: normalizeProductName(product.nombre), value: product.id,
      description: [displayBrand(product.brand), product.cat].filter(Boolean).join(" · "),
      ...(product.img ? { img: product.img } : {}),
    })),
  ].slice(0, 8);
}

export function queryCatalog(params: URLSearchParams, offersOnly = false): CatalogResponse {
  const q = (params.get("q") || "").trim().slice(0, 120);
  const rawCategory = (params.get("cat") ?? params.get("category") ?? "").trim();
  const rawBrand = (params.get("brand") || "").trim();
  const availability = params.get("availability") || "all";
  const filters = normalizeCatalogFilters({
    category: rawCategory.slice(0, 80), brand: rawBrand.slice(0, 80),
    priceMin: params.get("min") ?? params.get("priceMin") ?? "",
    priceMax: params.get("max") ?? params.get("priceMax") ?? "",
    availability: availability === "in-stock" || availability === "on-request" ? availability : "all",
    offersOnly: offersOnly || params.get("ofertas") === "true" || params.get("offersOnly") === "true",
  });
  const filtersValid = validateCatalogFilters(filters).valid && rawCategory.length <= 80 && rawBrand.length <= 80
    && ["all", "in-stock", "on-request"].includes(availability);
  const searchResult = search(q);
  const selected = applyCatalogFilters(searchResult.results, filters);
  const sort = params.get("sort") || "relevance";
  const safeSort = SORT_OPTIONS.has(sort) ? sort : "relevance";
  const byName = (a: Product, b: Product) => displayNames.get(a.id)!.localeCompare(displayNames.get(b.id)!, "es-CO") || a.id.localeCompare(b.id);
  const byAvailability = (a: Product, b: Product) => Number(getAvailableQuantity(b) > 0) - Number(getAvailableQuantity(a) > 0);
  if (safeSort === "name") selected.sort(byName);
  else if (safeSort === "availability") selected.sort((a, b) => byAvailability(a, b) || byName(a, b));
  else if (safeSort === "relevance" && !q) selected.sort((a, b) => byAvailability(a, b) || Number(!!b.img) - Number(!!a.img) || byName(a, b));
  else if (safeSort === "price-asc" || safeSort === "price-desc") {
    const direction = safeSort === "price-asc" ? 1 : -1;
    selected.sort((a, b) => {
      const aKnown = hasVerifiedPrice(a);
      const bKnown = hasVerifiedPrice(b);
      return Number(bKnown) - Number(aKnown) || (aKnown && bKnown ? direction * (a.precio - b.precio) : 0);
    });
  } else if (safeSort === "discount") {
    const discount = (product: Product) => hasVerifiedPrice(product) && typeof product.original === "number" && product.original > product.precio
      ? getDiscountPercent(product) || 0 : 0;
    selected.sort((a, b) => discount(b) - discount(a));
  }
  // No sales counts exist in the public source. The fallback is explicit, and exhausted references remain searchable.
  const total = selected.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rawPage = params.get("page") || "1";
  const parsedPage = /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  const page = Math.max(1, Math.min(totalPages, Number.isSafeInteger(parsedPage) ? parsedPage : 1));
  const confirmedPrices = applyCatalogFilters(searchResult.results, { ...filters, priceMin: "", priceMax: "" })
    .filter(hasVerifiedPrice).map((product) => product.precio);
  return {
    products: selected.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(publicProduct),
    total, page, pageSize: PAGE_SIZE, totalPages,
    isFuzzy: searchResult.isFuzzy,
    categories: facets(applyCatalogFilters(searchResult.results, { ...filters, category: "" }), "cat"),
    brands: facets(applyCatalogFilters(searchResult.results, { ...filters, brand: "" }), "brand"),
    ...(confirmedPrices.length ? { priceBounds: { min: Math.min(...confirmedPrices), max: Math.max(...confirmedPrices) } } : {}),
    suggestions: suggestions(q, applyCatalogFilters(searchResult.results, filters)),
    filtersValid,
  };
}

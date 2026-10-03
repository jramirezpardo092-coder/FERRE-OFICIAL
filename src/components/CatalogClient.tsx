"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Product } from "@/lib/types";
import type { CatalogResponse, CatalogSuggestion } from "@/lib/catalog-types";
import { getActiveFilterCount, normalizeCatalogFilters, type FiltersValue } from "@/lib/catalog-filters";
import { cn } from "@/lib/utils";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import CatalogFilters from "./catalog/CatalogFilters";
import CatalogFilterDrawer from "./catalog/CatalogFilterDrawer";
import CatalogSearch from "./catalog/CatalogSearch";
import CatalogPagination from "./catalog/CatalogPagination";
import CatalogEmptyState from "./catalog/CatalogEmptyState";
import ParditoState from "./catalog/ParditoState";

const SORT_OPTIONS = ["relevance", "price-asc", "price-desc", "discount", "name"];

/** Only one page of public products reaches the browser. Sales data stay on the server. */
export default function CatalogClient({ offersOnly = false }: { offersOnly?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const query = searchParams.get("q") || "";
  const sort = SORT_OPTIONS.includes(searchParams.get("sort") || "") ? searchParams.get("sort")! : "relevance";
  const filters = useMemo(() => {
    const params = new URLSearchParams(paramsKey);
    return normalizeCatalogFilters({
      category: params.get("cat") || "", brand: params.get("brand") || "",
      priceMin: params.get("min") ?? params.get("priceMin") ?? "",
      priceMax: params.get("max") ?? params.get("priceMax") ?? "",
      availability: params.get("availability") as FiltersValue["availability"],
      offersOnly: offersOnly || params.get("ofertas") === "true",
    });
  }, [paramsKey, offersOnly]);
  const [search, setSearch] = useState(query);
  const [result, setResult] = useState<{ key: string; data: CatalogResponse } | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const requestKey = (offersOnly ? "offers:" : "catalog:") + paramsKey;
  const loading = !result || result.key !== requestKey;
  const data = result?.data;
  const busy = loading && !error;

  // Shareable URLs also keep filters aligned with browser Back/Forward.
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || !value.trim()) params.delete(key);
      else params.set(key, value);
    }
    const next = params.toString();
    const url = window.location.pathname + (next ? "?" + next : "") + window.location.hash;
    if (url !== window.location.pathname + window.location.search + window.location.hash) window.history.pushState(null, "", url);
  }, []);
  useEffect(() => { setSearch(query); }, [query]);
  useEffect(() => {
    const restoreSearch = () => setSearch(new URLSearchParams(window.location.search).get("q") || "");
    window.addEventListener("popstate", restoreSearch);
    return () => window.removeEventListener("popstate", restoreSearch);
  }, []);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setDrawerOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    if (search === query) return;
    const timer = setTimeout(() => updateParams({ q: search.slice(0, 120), page: null }), 300);
    return () => clearTimeout(timer);
  }, [search, query, updateParams]);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setError(false);
    const params = new URLSearchParams(paramsKey);
    if (offersOnly) params.set("ofertas", "true");
    async function load() {
      try {
        const response = await fetch("/api/catalogo?" + params, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Catalog unavailable");
        const body = await response.json() as CatalogResponse;
        if (current) setResult({ key: requestKey, data: body });
      } catch {
        if (current && !controller.signal.aborted) setError(true);
      }
    }
    void load();
    // Slow requests cannot replace the results of a newer search.
    return () => { current = false; controller.abort(); };
  }, [paramsKey, offersOnly, requestKey, retry]);

  const changeFilters = (next: FiltersValue) => updateParams({
    cat: next.category, brand: next.brand, min: next.priceMin, max: next.priceMax,
    priceMin: null, priceMax: null, availability: next.availability === "all" ? null : next.availability,
    ofertas: !offersOnly && next.offersOnly ? "true" : null, page: null,
  });
  const clearAll = () => {
    setSearch("");
    updateParams({ q: null, cat: null, brand: null, min: null, max: null, priceMin: null, priceMax: null, availability: null, ofertas: null, page: null, sort: null });
  };
  const chooseSuggestion = (suggestion: CatalogSuggestion) => {
    if (suggestion.type === "product") router.push("/producto/" + encodeURIComponent(suggestion.value));
    else {
      setSearch("");
      updateParams({ q: null, [suggestion.type === "category" ? "cat" : "brand"]: suggestion.value, page: null });
    }
  };
  const activeCount = getActiveFilterCount({ ...filters, offersOnly: !offersOnly && filters.offersOnly }) + Number(!!query.trim());
  const filterProps = { value: filters, onChange: changeFilters, onClear: clearAll,
    categories: data?.categories || [], brands: data?.brands || [], priceBounds: data?.priceBounds, offersLocked: offersOnly };
  const chips = [
    query && { key: "q", label: "Búsqueda: " + query },
    filters.category && { key: "cat", label: filters.category },
    filters.brand && { key: "brand", label: filters.brand },
    filters.availability !== "all" && { key: "availability", label: filters.availability === "in-stock" ? "En stock" : "Consultar disponibilidad" },
    (filters.priceMin || filters.priceMax) && { key: "price", label: "Precio: " + (filters.priceMin || "0") + " – " + (filters.priceMax || "sin máximo") + " COP" },
    !offersOnly && filters.offersOnly && { key: "ofertas", label: "Solo ofertas" },
  ].filter((chip): chip is { key: string; label: string } => !!chip);

  return <div ref={topRef} className="mx-auto max-w-[1400px] scroll-mt-24 px-4 py-6 md:py-8">
    <div className="mx-auto mb-6 max-w-3xl">
      <CatalogSearch value={search} onChange={setSearch} suggestions={!loading && query === search ? data?.suggestions || [] : []} onSelect={chooseSuggestion} loading={busy || search !== query} />
      <p className="mt-2 px-1 text-xs text-gray-500 dark:text-gray-400">Busca por nombre, SKU o referencia. Todos incluye productos agotados para consultar.</p>
    </div>
    {chips.length > 0 && <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Filtros activos">
      {chips.map(chip => <button key={chip.key} type="button" onClick={() => {
        if (chip.key === "q") setSearch("");
        updateParams(chip.key === "price" ? { min: null, max: null, priceMin: null, priceMax: null, page: null } : { [chip.key]: null, page: null });
      }} className="inline-flex max-w-full items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-brand-red dark:border-red-900 dark:bg-red-900/20 dark:text-red-300" aria-label={"Quitar filtro " + chip.label}>
        <span className="truncate">{chip.label}</span><span aria-hidden="true">✕</span>
      </button>)}
      <button type="button" onClick={clearAll} className="px-2 py-2 text-xs font-semibold text-brand-red hover:underline dark:text-red-300">Limpiar todo</button>
    </div>}
    <div className="flex items-start gap-6">
      <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] w-64 shrink-0 overflow-y-auto lg:block"><CatalogFilters {...filterProps} idPrefix="desktop-catalog" /></aside>
      <section className="min-w-0 flex-1" aria-label="Productos del catálogo" aria-busy={busy}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
            {error ? "Catálogo no disponible" : loading ? "Buscando productos…" : data && data.total > 0 ? <><strong className="text-gray-900 dark:text-white">{(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)}</strong> de <strong className="text-gray-900 dark:text-white">{data.total.toLocaleString("es-CO")}</strong> productos</> : "Sin resultados"}
            {!loading && data?.isFuzzy && <span className="mt-1 block text-xs text-amber-700 dark:text-amber-400">Coincidencias aproximadas: verifica la referencia.</span>}
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button type="button" onClick={() => setDrawerOpen(true)} aria-haspopup="dialog" aria-expanded={drawerOpen} className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white lg:hidden">Filtros{activeCount > 0 ? " (" + activeCount + ")" : ""}</button>
            <select aria-label="Ordenar productos" value={sort} onChange={event => updateParams({ sort: event.target.value === "relevance" ? null : event.target.value, page: null })} className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:flex-none">
              <option value="relevance">Relevancia</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option><option value="discount">Mayor descuento</option><option value="name">A–Z</option>
            </select>
            <div className="hidden gap-1 sm:flex" aria-label="Vista de productos">
              {(["grid", "list"] as const).map(mode => <button type="button" key={mode} onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode} aria-label={mode === "grid" ? "Vista cuadrícula" : "Vista lista"} className={cn("rounded-lg px-3 py-2 text-sm", viewMode === mode ? "bg-brand-red text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800")}>{mode === "grid" ? "▦" : "☰"}</button>)}
            </div>
          </div>
        </div>
        {!loading && data?.filtersValid === false && <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">Revisa los filtros. Un rango de precio inválido no se aplica; puedes corregirlo en Filtros.</p>}
        {error ? <ParditoState mode="error" onRetry={() => setRetry(value => value + 1)} /> : loading ? <ParditoState /> : data?.products.length ? <>
          <div className={cn(viewMode === "grid" ? "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 md:gap-4" : "flex flex-col gap-3")}>
            {data.products.map(product => <ProductCard key={product.id} product={product} onOpenModal={setModalProduct} viewMode={viewMode} />)}
          </div>
          <CatalogPagination page={data.page} totalPages={data.totalPages} onPageChange={page => {
            updateParams({ page: page === 1 ? null : String(page) });
            topRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
          }} />
        </> : <CatalogEmptyState query={query} onClear={clearAll} onCategory={category => { clearAll(); updateParams({ cat: category }); }} categories={data?.categories.map(category => category.name) || []} />}
      </section>
    </div>
    <CatalogFilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}><CatalogFilters {...filterProps} idPrefix="mobile-catalog" /></CatalogFilterDrawer>
    <ProductModal product={modalProduct} onClose={() => setModalProduct(null)} />
  </div>;
}

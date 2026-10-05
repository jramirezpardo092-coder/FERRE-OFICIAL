"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Product } from "@/lib/types";
import type { CatalogResponse, CatalogSuggestion } from "@/lib/catalog-types";
import { getActiveFilterCount, normalizeCatalogFilters, type FiltersValue } from "@/lib/catalog-filters";
import { cn, formatCOP } from "@/lib/utils";
import { getCategoryPath } from "@/lib/catalog/routes";
import CatalogUrlSync from "./catalog/CatalogUrlSync";
import { CatalogPriceModeProvider, getPricePreference, setPricePreference, type PriceMode } from "@/lib/price-preference";
import { CATEGORIES } from "@/lib/constants";
import PricePreferenceToggle from "./catalog/PricePreferenceToggle";
import ProductCard from "./ProductCard";
import CatalogFilters from "./catalog/CatalogFilters";
import CatalogFilterDrawer from "./catalog/CatalogFilterDrawer";
import CatalogSearch from "./catalog/CatalogSearch";
import CatalogPagination from "./catalog/CatalogPagination";
import CatalogEmptyState from "./catalog/CatalogEmptyState";
import ParditoState from "./catalog/ParditoState";

const SORT_OPTIONS = ["relevance", "availability", "price-asc", "price-desc", "discount", "name"];
// La vista rápida se descarga cuando el cliente abre una ficha.
const ProductModal = dynamic(() => import("./ProductModal"), { ssr: false });

/** Only one page of public products reaches the browser. Sales data stay on the server. */
export default function CatalogClient({ offersOnly = false, initialData, initialParamsKey = "", category = "" }: { offersOnly?: boolean; initialData?: CatalogResponse; initialParamsKey?: string; category?: string }) {
  const router = useRouter();
  const [paramsKey, setParamsKey] = useState(initialParamsKey);
  const searchParams = useMemo(() => new URLSearchParams(paramsKey), [paramsKey]);
  const query = searchParams.get("q") || "";
  const sort = SORT_OPTIONS.includes(searchParams.get("sort") || "") ? searchParams.get("sort")! : "relevance";
  const filters = useMemo(() => {
    const params = new URLSearchParams(paramsKey);
    return normalizeCatalogFilters({
      category: category || params.get("cat") || "", brand: params.get("brand") || "",
      priceMin: params.get("min") ?? params.get("priceMin") ?? "",
      priceMax: params.get("max") ?? params.get("priceMax") ?? "",
      priceMode: params.get("priceMode") as PriceMode,
      availability: params.get("availability") as FiltersValue["availability"],
      offersOnly: offersOnly || params.get("ofertas") === "true",
    });
  }, [paramsKey, offersOnly, category]);
  const [search, setSearch] = useState(query);
  const resultKey = (key: string) => (offersOnly ? "offers:" : "catalog:") + category + ":" + key;
  const [result, setResult] = useState<{ key: string; data: CatalogResponse } | null>(() => initialData ? { key: resultKey(initialParamsKey), data: initialData } : null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"responsive" | "grid" | "list">("responsive");
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const preferenceRestored = useRef(false);
  const requestKey = resultKey(paramsKey);
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
    const nextCategory = Object.prototype.hasOwnProperty.call(updates, "cat") ? updates.cat : category || params.get("cat");
    const path = offersOnly ? "/ofertas" : getCategoryPath(nextCategory || "");
    if (!nextCategory || path !== "/catalogo") params.delete("cat");
    const nextQuery = params.toString();
    const url = path + (nextQuery ? "?" + nextQuery : "");
    if (path !== window.location.pathname) router.push(url);
    else if (url !== window.location.pathname + window.location.search) {
      window.history.pushState(null, "", url);
      // Initial preference restoration can run before Next hydrates its history subscription.
      setParamsKey(nextQuery);
    }
  }, [category, offersOnly, router]);
  const changePriceMode = useCallback((mode: PriceMode) => updateParams({ priceMode: mode === "net" ? "net" : null, page: null }), [updateParams]);
  const pricePreference = useMemo(() => ({ mode: filters.priceMode, onModeChange: changePriceMode }), [filters.priceMode, changePriceMode]);
  useEffect(() => {
    if (!preferenceRestored.current) {
      preferenceRestored.current = true;
      // Restore a saved preference only on a clean first visit; shared filters and Back stay authoritative.
      if (!paramsKey && getPricePreference() === "net") {
        updateParams({ priceMode: "net" });
        return;
      }
    }
    setPricePreference(filters.priceMode);
  }, [paramsKey, filters.priceMode, updateParams]);
  useEffect(() => {
    if (initialData) {
      const key = (offersOnly ? "offers:" : "catalog:") + category + ":" + initialParamsKey;
      setResult(previous => previous?.key === key && previous.data === initialData ? previous : { key, data: initialData });
    }
  }, [initialData, initialParamsKey, category, offersOnly]);
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
    if (result?.key === requestKey && retry === 0) return;
    const controller = new AbortController();
    let current = true;
    setError(false);
    const params = new URLSearchParams(paramsKey);
    if (category) params.set("cat", category);
    if (offersOnly) params.set("ofertas", "true");
    async function load() {
      try {
        const response = await fetch("/api/catalogo?" + params, { signal: controller.signal });
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
  }, [paramsKey, offersOnly, category, requestKey, retry, result?.key]);

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
    // The SKU redirect resolves the stable canonical URL; display names can expand abbreviations.
    if (suggestion.type === "product") router.push(`/producto/${encodeURIComponent(suggestion.value)}`);
    else {
      setSearch("");
      updateParams({ q: null, [suggestion.type === "category" ? "cat" : "brand"]: suggestion.value, page: null });
    }
  };
  const activeCount = getActiveFilterCount({ ...filters, offersOnly: !offersOnly && filters.offersOnly }) + Number(!!query.trim());
  const filterProps = { value: filters, onChange: changeFilters, onClear: clearAll,
    categories: data?.categories || [], brands: data?.brands || [], priceBounds: data?.priceMode === filters.priceMode ? data.priceBounds : undefined, offersLocked: offersOnly };
  const chips = [
    query && { key: "q", label: "Búsqueda: " + query },
    filters.category && { key: "cat", label: filters.category },
    filters.brand && { key: "brand", label: filters.brand },
    filters.availability !== "all" && { key: "availability", label: filters.availability === "in-stock" ? "En stock" : "Consultar disponibilidad" },
    (filters.priceMin || filters.priceMax) && { key: "price", label: (filters.priceMode === "net" ? "Precio sin IVA: " : "Precio con IVA: ") + formatCOP(Number(filters.priceMin || 0)) + " – " + (filters.priceMax ? formatCOP(Number(filters.priceMax)) : "sin máximo") },
    !offersOnly && filters.offersOnly && { key: "ofertas", label: "Solo ofertas" },
  ].filter((chip): chip is { key: string; label: string } => !!chip);
  const visibleCategoryChips = CATEGORIES.flatMap(item => {
    const count = data?.categories.find(facet => facet.name === item.name)?.count || 0;
    return count > 0 ? [{ ...item, count }] : [];
  });

  return <CatalogPriceModeProvider value={pricePreference}><div ref={topRef} className="mx-auto max-w-site scroll-mt-24 px-4 pt-3 pb-24 md:px-6 lg:px-8">
    <Suspense fallback={null}><CatalogUrlSync onChange={setParamsKey} /></Suspense>
    <div className="lg:mb-3 lg:flex lg:items-center lg:gap-3">
      <div className="mb-3 min-w-0 flex-1 lg:mb-0">
      <CatalogSearch value={search} onChange={setSearch} suggestions={!loading && query === search ? data?.suggestions || [] : []} onSelect={chooseSuggestion} loading={busy || search !== query} />
      </div>
      {chips.length > 0 && <div role="group" className="mb-3 flex flex-wrap items-center gap-2 lg:mb-0 lg:max-w-[65%] lg:shrink-0 lg:self-center" aria-label="Filtros activos">
        {chips.map(chip => <button key={chip.key} type="button" onClick={() => {
          if (chip.key === "q") setSearch("");
          updateParams(chip.key === "price" ? { min: null, max: null, priceMin: null, priceMax: null, page: null } : { [chip.key]: null, page: null });
        }} className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-chip border border-ink bg-ink px-3 py-2 text-sm font-semibold text-on-ink" aria-label={"Quitar filtro " + chip.label}>
          <span className="truncate">{chip.label}</span><span aria-hidden="true">✕</span>
        </button>)}
        <button type="button" onClick={clearAll} className="min-h-11 px-2 py-2 text-sm font-semibold text-ink-2 hover:text-ink hover:underline">Limpiar filtros</button>
      </div>}
    </div>
    {visibleCategoryChips.length > 1 && <p className="mb-1 text-xs text-ink-2 sm:hidden">Categorías <span aria-hidden="true">· desliza para explorar →</span></p>}
    {visibleCategoryChips.length > 0 && <nav data-design-categories aria-label="Categorías del catálogo" className="mb-3 flex gap-2 overflow-x-auto pb-2">
      {visibleCategoryChips.map(item => <a key={item.slug} href={getCategoryPath(item.name)} onClick={event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); setSearch(""); updateParams({ cat: item.name, q: null, page: null });
      }} aria-current={category === item.name ? "page" : undefined} className={cn("inline-flex min-h-11 shrink-0 items-center gap-2 rounded-chip border px-4 text-sm font-semibold transition-colors duration-150 motion-reduce:transition-none", category === item.name ? "border-ink bg-ink text-on-ink" : "border-control bg-surface text-ink-2 hover:border-ink hover:text-ink")}>
        {item.name}<span className="font-mono text-xs tracking-[0.025em]">{item.count.toLocaleString("es-CO")}</span>
      </a>)}
    </nav>}
    <div className="flex items-start gap-6">
      <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] w-64 shrink-0 overflow-y-auto lg:block"><CatalogFilters {...filterProps} idPrefix="desktop-catalog" /></aside>
      <section className="min-w-0 flex-1" aria-label="Productos del catálogo" aria-busy={busy}>
        <h2 className="sr-only">Productos para cotizar</h2>
        <div data-design-controls className="mb-3 grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2 border-b border-line pb-3 sm:flex sm:flex-wrap">
          <div className="min-w-0 font-mono text-xs leading-4 tracking-[0.025em] text-ink-2 sm:mr-auto" role="status" aria-live="polite">
            {error ? "Catálogo no disponible" : loading ? "Buscando productos…" : data && data.total > 0 ? <><strong className="font-medium text-ink">{(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)}</strong> de <strong className="font-medium text-ink">{data.total.toLocaleString("es-CO")}</strong><span className="sr-only"> productos</span></> : "Sin resultados"}
            {!loading && data?.isFuzzy && <span className="mt-1 block font-sans text-xs text-ink-2">Coincidencias aproximadas: verifica la referencia.</span>}
          </div>
            <button type="button" onClick={() => setDrawerOpen(true)} aria-haspopup="dialog" aria-expanded={drawerOpen} className="min-h-11 rounded-control border border-control bg-surface px-2 py-2.5 text-sm font-semibold text-ink hover:border-ink lg:hidden">Filtros{activeCount > 0 ? " (" + activeCount + ")" : ""}</button>
            <select aria-label="Ordenar productos" value={sort} onChange={event => updateParams({ sort: event.target.value === "relevance" ? null : event.target.value, page: null })} className="min-h-11 min-w-0 w-full rounded-control border border-control bg-surface px-2 py-2.5 text-sm text-ink sm:w-44">
              <option value="relevance">{query ? "Relevancia" : "Recomendados"}</option><option value="availability">Disponibles primero</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option><option value="discount">Mayor descuento</option><option value="name">A–Z</option>
            </select>
            <PricePreferenceToggle idPrefix="catalog-price" className="col-span-3 justify-self-start" />
            <div role="group" className="hidden gap-1 sm:flex" aria-label="Vista de productos">
              {(["grid", "list"] as const).map(mode => <button type="button" key={mode} onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode || (viewMode === "responsive" && mode === "grid")} aria-label={mode === "grid" ? "Vista cuadrícula" : "Vista lista"} className={cn("min-h-11 min-w-11 rounded-control border px-3 py-2 text-sm", viewMode === mode || (viewMode === "responsive" && mode === "grid") ? "border-ink bg-ink text-on-ink" : "border-control bg-surface text-ink-2 hover:text-ink")}><svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={1.75} d={mode === "grid" ? "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" : "M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1"} /></svg></button>)}
            </div>
        </div>
        {!loading && data?.filtersValid === false && <p role="status" className="mb-4 rounded-control border border-control bg-surface p-3 text-sm text-ink">Revisa los filtros. Un rango de precio inválido no se aplica; puedes corregirlo en Filtros.</p>}
        {error ? <ParditoState mode="error" onRetry={() => setRetry(value => value + 1)} /> : loading ? <ParditoState /> : data?.products.length ? <>
          <div data-catalog-grid={viewMode !== "list" ? true : undefined} className={cn(viewMode !== "list" && "catalog-product-grid", viewMode === "responsive" ? "grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4 xl:grid-cols-4" : viewMode === "grid" ? "grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4" : "flex flex-col gap-3")}>
            {data.products.map(product => <ProductCard key={product.id} product={product} onOpenModal={setModalProduct} viewMode={viewMode} />)}
          </div>
          <CatalogPagination page={data.page} totalPages={data.totalPages} pageHref={page => {
            const params = new URLSearchParams(paramsKey);
            if (page > 1) params.set("page", String(page)); else params.delete("page");
            return (offersOnly ? "/ofertas" : getCategoryPath(category)) + (params.size ? "?" + params.toString() : "");
          }} onPageChange={page => {
            updateParams({ page: page === 1 ? null : String(page) });
            topRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
          }} />
        </> : <CatalogEmptyState query={query} onClear={clearAll} onCategory={nextCategory => { setSearch(""); updateParams({ q: null, cat: nextCategory, brand: null, min: null, max: null, availability: null, page: null }); }} categories={CATEGORIES.map(item => item.name)} />}
      </section>
    </div>
    <div role="group" className="mt-8 grid gap-4 border-t border-line pt-5 sm:grid-cols-2 lg:grid-cols-4 text-xs leading-4 text-ink-2" aria-label="Información para cotizar">
      <span className="inline-flex shrink-0 items-center gap-2"><svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M3 10l2-6h14l2 6M4 10v10h16V10M3 10h18M9 20v-6h6v6" /></svg>Recoge en tienda · Calle 72 No. 50-23</span>
      <span className="inline-flex shrink-0 items-center gap-2"><svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M3 6h11v11H3V6zm11 5h4l3 4v2h-7M8 19a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0z" /></svg>Envíos: consulta condiciones</span>
      <span className="inline-flex shrink-0 items-center gap-2"><svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6m-6 4h6" /></svg>Factura electrónica</span>
      <span className="inline-flex shrink-0 items-center gap-2"><svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M3 5h18v14H3V5zm0 5h18m-14 5h3" /></svg>Nequi, Daviplata, tarjetas</span>
    </div>
    <CatalogFilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}><CatalogFilters {...filterProps} idPrefix="mobile-catalog" /></CatalogFilterDrawer>
    {modalProduct && <ProductModal product={modalProduct} onClose={() => setModalProduct(null)} />}
  </div></CatalogPriceModeProvider>;
}

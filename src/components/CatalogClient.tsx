"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Product } from "@/lib/types";
import { CATEGORIES, BRANDS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { searchProducts } from "@/lib/search";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";

const ITEMS_PER_PAGE = 24;

/* ── Icons ────────────────────────── */
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const GridIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
    <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0110.5 1h3A1.5 1.5 0 0115 2.5v3A1.5 1.5 0 0113.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0110.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z"/>
  </svg>
);
const ListIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z"/>
  </svg>
);
const ChevronDown = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
const ChevronUp = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

interface Props {
  products: Product[];
}

export default function CatalogClient({ products }: Props) {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("cat") || "";
  const initialOfertas = searchParams.get("ofertas") === "true";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState(initialCat);
  const [brand, setBrand] = useState("");
  const [onlyPhoto, setOnlyPhoto] = useState(false);
  const [onlyOfertas, setOnlyOfertas] = useState(initialOfertas);
  const [sortBy, setSortBy] = useState("relevance");
  const [page, setPage] = useState(1);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [brandsExpanded, setBrandsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFuzzy, setIsFuzzy] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, brand, onlyPhoto, onlyOfertas, sortBy]);

  // Filtered products — hybrid search (tokenized + fuzzy fallback)
  const filtered = useMemo(() => {
    let result: Product[];
    let fuzzy = false;

    if (debouncedSearch.trim()) {
      const { results, isFuzzy: wasFuzzy } = searchProducts(products, debouncedSearch);
      result = [...results];
      fuzzy = wasFuzzy;
    } else {
      result = [...products];
    }

    if (category) {
      result = result.filter((p) => p.cat === category);
    }

    if (brand) {
      result = result.filter((p) => p.brand === brand);
    }

    if (onlyPhoto) {
      result = result.filter((p) => !!p.img);
    }

    if (onlyOfertas) {
      result = result.filter((p) => p.disc && p.disc > 0);
    }

    // Only re-sort if user explicitly chose a sort option or no search
    if (sortBy !== "relevance" || !debouncedSearch.trim()) {
      switch (sortBy) {
        case "price-asc":
          result.sort((a, b) => a.precio - b.precio);
          break;
        case "price-desc":
          result.sort((a, b) => b.precio - a.precio);
          break;
        case "discount":
          result.sort((a, b) => (b.disc || 0) - (a.disc || 0));
          break;
        case "name":
          result.sort((a, b) => a.nombre.localeCompare(b.nombre));
          break;
        default:
          // No search active: sort by image first, then discount
          result.sort((a, b) => {
            if (a.img && !b.img) return -1;
            if (!a.img && b.img) return 1;
            return (b.disc || 0) - (a.disc || 0);
          });
      }
    }
    // When search is active + relevance sort, keep search engine order

    setIsFuzzy(fuzzy);
    return result;
  }, [products, debouncedSearch, category, brand, onlyPhoto, onlyOfertas, sortBy]);

  // Search suggestions (tokenized)
  const suggestions = useMemo(() => {
    if (search.length < 2) return [];
    const tokens = search.toLowerCase().split(/\s+/).filter(Boolean);
    const cats = CATEGORIES.filter(c => {
      const name = c.name.toLowerCase();
      return tokens.every(t => name.includes(t));
    }).map(c => ({ type: "cat" as const, label: c.name, icon: c.icon }));
    const brs = BRANDS.filter(b => {
      const name = b.toLowerCase();
      return tokens.every(t => name.includes(t));
    }).map(b => ({ type: "brand" as const, label: b, icon: "🏷️" }));
    const prods = products
      .filter(p => {
        const searchable = `${p.nombre} ${p.brand} ${p.ref || ""} ${p.id}`.toLowerCase();
        return tokens.every(t => searchable.includes(t));
      })
      .slice(0, 5)
      .map(p => ({ type: "product" as const, label: p.nombre, icon: p.img ? "📸" : "📦", id: p.id }));
    return [...cats, ...brs, ...prods].slice(0, 8);
  }, [search, products]);

  const [showSuggestions, setShowSuggestions] = useState(false);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const start = (page - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(page * ITEMS_PER_PAGE, filtered.length);

  const activeFilters: { key: string; label: string }[] = [];
  if (category) activeFilters.push({ key: "category", label: category });
  if (brand) activeFilters.push({ key: "brand", label: brand });
  if (onlyPhoto) activeFilters.push({ key: "photo", label: "Solo con foto" });
  if (onlyOfertas) activeFilters.push({ key: "ofertas", label: "Solo ofertas" });

  const removeFilter = (key: string) => {
    if (key === "category") setCategory("");
    if (key === "brand") setBrand("");
    if (key === "photo") setOnlyPhoto(false);
    if (key === "ofertas") setOnlyOfertas(false);
  };

  const clearAll = () => {
    setSearch("");
    setCategory("");
    setBrand("");
    setOnlyPhoto(false);
    setOnlyOfertas(false);
    setSortBy("relevance");
  };

  const goToPage = useCallback((p: number) => {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Category counts (cached) — tokenized search
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const tokens = debouncedSearch.trim() ? debouncedSearch.toLowerCase().split(/\s+/).filter(Boolean) : [];
    const baseFiltered = products.filter(p => {
      if (tokens.length > 0) {
        const searchable = `${p.nombre} ${p.brand} ${p.id} ${p.cat} ${p.ref || ""} ${p.sku || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
        if (!tokens.every(t => searchable.includes(t))) return false;
      }
      if (brand && p.brand !== brand) return false;
      if (onlyPhoto && !p.img) return false;
      if (onlyOfertas && !(p.disc && p.disc > 0)) return false;
      return true;
    });
    CATEGORIES.forEach(cat => {
      counts[cat.name] = baseFiltered.filter(p => p.cat === cat.name).length;
    });
    counts["__all"] = baseFiltered.length;
    return counts;
  }, [products, debouncedSearch, brand, onlyPhoto, onlyOfertas]);

  // Brand counts — tokenized search
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const tokens = debouncedSearch.trim() ? debouncedSearch.toLowerCase().split(/\s+/).filter(Boolean) : [];
    const baseFiltered = products.filter(p => {
      if (tokens.length > 0) {
        const searchable = `${p.nombre} ${p.brand} ${p.id} ${p.cat} ${p.ref || ""} ${p.sku || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
        if (!tokens.every(t => searchable.includes(t))) return false;
      }
      if (category && p.cat !== category) return false;
      if (onlyPhoto && !p.img) return false;
      if (onlyOfertas && !(p.disc && p.disc > 0)) return false;
      return true;
    });
    BRANDS.forEach(b => {
      counts[b] = baseFiltered.filter(p => p.brand === b).length;
    });
    return counts;
  }, [products, debouncedSearch, category, onlyPhoto, onlyOfertas]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6" ref={topRef}>
      {/* ── Search bar ─────────────────────────── */}
      <div className="mb-5 relative">
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </div>
          <input
            ref={searchInputRef}
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Buscar por nombre, referencia, marca o categoría..."
            className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red outline-none transition-all shadow-sm hover:border-gray-300"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); searchInputRef.current?.focus(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <CloseIcon />
            </button>
          )}
          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  onMouseDown={() => {
                    if (s.type === "cat") { setCategory(s.label); setSearch(""); }
                    else if (s.type === "brand") { setBrand(s.label); setSearch(""); }
                    else { setSearch(s.label); }
                    setShowSuggestions(false);
                  }}
                >
                  <span className="text-base">{s.icon}</span>
                  <span className="flex-1 truncate">{s.label}</span>
                  <span className="text-[10px] uppercase text-gray-400 font-medium">
                    {s.type === "cat" ? "Categoría" : s.type === "brand" ? "Marca" : "Producto"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Category quick-filter pills (horizontal scroll) ─── */}
      <div className="mb-5 -mx-4 px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-1">
          <button
            onClick={() => setCategory("")}
            className={cn(
              "shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border",
              !category
                ? "bg-brand-red text-white border-brand-red shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-red hover:text-brand-red"
            )}
          >
            Todas
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.name === category ? "" : cat.name)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5",
                category === cat.name
                  ? "bg-brand-red text-white border-brand-red shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-red hover:text-brand-red"
              )}
            >
              <span>{cat.icon}</span>
              {cat.name}
              <span className={cn("text-[10px]", category === cat.name ? "text-green-200" : "text-gray-400")}>
                {catCounts[cat.name] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Active filter chips ─────────────────── */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-gray-400 font-medium">Filtros activos:</span>
          {activeFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => removeFilter(f.key)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-brand-red text-xs font-semibold rounded-full border border-red-200 hover:bg-red-100 transition-colors group"
            >
              {f.label}
              <span className="w-3.5 h-3.5 rounded-full bg-brand-red/10 group-hover:bg-brand-red/20 flex items-center justify-center">
                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            </button>
          ))}
          <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-700 font-medium ml-1 hover:underline">
            Limpiar todo
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* ── Mobile filter toggle ─────────────── */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed bottom-20 left-4 z-50 bg-brand-red text-white font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-sm hover:bg-brand-red-dark transition-colors"
        >
          <FilterIcon />
          Filtros
          {activeFilters.length > 0 && (
            <span className="bg-white text-brand-red text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilters.length}
            </span>
          )}
        </button>

        {/* ── Sidebar ──────────────────────────── */}
        <aside className={cn(
          "shrink-0 w-64",
          "max-lg:fixed max-lg:inset-0 max-lg:z-[80] max-lg:bg-black/50 max-lg:backdrop-blur-sm",
          !sidebarOpen && "max-lg:hidden"
        )}>
          <div className={cn(
            "bg-white rounded-2xl border border-gray-100 p-5 space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:scrollbar-hide",
            "max-lg:absolute max-lg:left-0 max-lg:top-0 max-lg:h-full max-lg:w-80 max-lg:overflow-y-auto max-lg:rounded-none max-lg:animate-slide-in-right"
          )}>
            {/* Mobile close */}
            <div className="lg:hidden flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">Filtros</h3>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Categoría</h4>
              <div className="space-y-0.5">
                <button
                  onClick={() => setCategory("")}
                  className={cn("w-full text-left text-sm px-3 py-2 rounded-lg transition-colors",
                    !category ? "bg-red-50 text-brand-red font-semibold border border-red-200" : "text-gray-600 hover:bg-gray-50")}
                >
                  Todas ({catCounts["__all"] || products.length})
                </button>
                {CATEGORIES.map((cat) => {
                  const count = catCounts[cat.name] || 0;
                  return (
                    <button
                      key={cat.slug}
                      onClick={() => setCategory(cat.name === category ? "" : cat.name)}
                      className={cn("w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-between",
                        category === cat.name ? "bg-red-50 text-brand-red font-semibold border border-red-200" : "text-gray-600 hover:bg-gray-50")}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon}</span>
                        <span className="truncate">{cat.name}</span>
                      </span>
                      <span className={cn("text-[11px] font-medium tabular-nums", count === 0 ? "text-gray-300" : "text-gray-400")}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brands — collapsible */}
            <div>
              <button
                onClick={() => setBrandsExpanded(!brandsExpanded)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2"
              >
                Marca
                {brandsExpanded ? <ChevronUp /> : <ChevronDown />}
              </button>
              <div className={cn("space-y-0.5 overflow-hidden transition-all", brandsExpanded ? "max-h-[500px]" : "max-h-[180px]")}>
                <button
                  onClick={() => setBrand("")}
                  className={cn("w-full text-left text-sm px-3 py-2 rounded-lg transition-colors",
                    !brand ? "bg-red-50 text-brand-red font-semibold border border-red-200" : "text-gray-600 hover:bg-gray-50")}
                >
                  Todas
                </button>
                {BRANDS.map((b) => {
                  const count = brandCounts[b] || 0;
                  return (
                    <button
                      key={b}
                      onClick={() => setBrand(b === brand ? "" : b)}
                      className={cn("w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-between",
                        brand === b ? "bg-red-50 text-brand-red font-semibold border border-red-200" : "text-gray-600 hover:bg-gray-50")}
                    >
                      <span className="truncate">{b}</span>
                      <span className={cn("text-[11px] font-medium tabular-nums", count === 0 ? "text-gray-300" : "text-gray-400")}>{count}</span>
                    </button>
                  );
                })}
              </div>
              {!brandsExpanded && BRANDS.length > 5 && (
                <button onClick={() => setBrandsExpanded(true)} className="w-full text-xs text-brand-red font-medium mt-1 hover:underline">
                  Ver todas las marcas ({BRANDS.length})
                </button>
              )}
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-1 border-t border-gray-100">
              <label className="flex items-center gap-2.5 text-sm cursor-pointer py-1 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                <input type="checkbox" checked={onlyPhoto} onChange={(e) => setOnlyPhoto(e.target.checked)}
                       className="w-4 h-4 rounded text-brand-red focus:ring-brand-red border-gray-300" />
                <span className="flex-1">Solo con foto real</span>
                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-medium">
                  {products.filter(p => !!p.img).length}
                </span>
              </label>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer py-1 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                <input type="checkbox" checked={onlyOfertas} onChange={(e) => setOnlyOfertas(e.target.checked)}
                       className="w-4 h-4 rounded text-brand-red focus:ring-brand-red border-gray-300" />
                <span className="flex-1">Solo ofertas</span>
                <span className="text-[10px] bg-red-50 px-2 py-0.5 rounded-full text-red-500 font-medium">
                  {products.filter(p => p.disc && p.disc > 0).length}
                </span>
              </label>
            </div>

            {activeFilters.length > 0 && (
              <button onClick={clearAll} className="w-full text-xs text-red-500 hover:text-red-700 font-medium py-2 border-t border-gray-100 mt-2">
                Limpiar todos los filtros
              </button>
            )}
          </div>
        </aside>

        {/* ── Main content ─────────────────────── */}
        <main className="flex-1 min-w-0">
          {/* Toolbar: results + sort + view toggle */}
          <div className="flex items-center justify-between mb-4 bg-gray-50 rounded-xl px-4 py-3">
            <div className="text-sm text-gray-500">
              {filtered.length > 0 ? (
                <>
                  Mostrando <span className="font-bold text-gray-900">{start}–{end}</span> de{" "}
                  <span className="font-bold text-gray-900">{filtered.length.toLocaleString("es-CO")}</span> productos
                  {isFuzzy && debouncedSearch.trim() && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      Resultados aproximados
                    </span>
                  )}
                </>
              ) : (
                <span className="text-gray-400">Sin resultados</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn("p-2 transition-colors", viewMode === "grid" ? "bg-brand-red text-white" : "bg-white text-gray-400 hover:text-gray-600")}
                  title="Vista cuadrícula"
                >
                  <GridIcon />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn("p-2 transition-colors", viewMode === "list" ? "bg-brand-red text-white" : "bg-white text-gray-400 hover:text-gray-600")}
                  title="Vista lista"
                >
                  <ListIcon />
                </button>
              </div>
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-red/20 outline-none font-medium"
              >
                <option value="relevance">Relevancia</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="discount">Mayor descuento</option>
                <option value="name">A–Z</option>
              </select>
            </div>
          </div>

          {/* Products grid */}
          {paged.length > 0 ? (
            <div className={cn(
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
                : "flex flex-col gap-3"
            )}>
              {paged.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenModal={setModalProduct}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-2xl">
              <svg className="w-20 h-20 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="font-semibold text-gray-600 text-lg">No se encontraron productos</p>
              <p className="text-sm mt-1 text-gray-400">Intenta ajustar los filtros o buscar con otros términos</p>
              <button onClick={clearAll} className="mt-4 px-5 py-2 bg-brand-red text-white font-semibold text-sm rounded-lg hover:bg-brand-red-dark transition-colors">
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-3 mt-8">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  ← Anterior
                </button>
                <div className="flex items-center gap-1">
                  {page > 3 && totalPages > 5 && (
                    <>
                      <button onClick={() => goToPage(1)} className="w-10 h-10 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 transition-colors">1</button>
                      {page > 4 && <span className="px-1 text-gray-400">...</span>}
                    </>
                  )}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={cn(
                          "w-10 h-10 rounded-lg text-sm font-medium transition-all",
                          page === pageNum
                            ? "bg-brand-red text-white shadow-md shadow-red-900/20"
                            : "bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {page < totalPages - 2 && totalPages > 5 && (
                    <>
                      {page < totalPages - 3 && <span className="px-1 text-gray-400">...</span>}
                      <button onClick={() => goToPage(totalPages)} className="w-10 h-10 rounded-lg text-sm font-medium bg-white border border-gray-200 hover:bg-gray-50 transition-colors">{totalPages}</button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => goToPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2.5 rounded-lg bg-white border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Siguiente →
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Página {page} de {totalPages}
              </p>
            </div>
          )}
        </main>
      </div>

      <ProductModal product={modalProduct} onClose={() => setModalProduct(null)} />
    </div>
  );
}

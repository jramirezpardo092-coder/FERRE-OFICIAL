"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Product } from "@/lib/types";
import { CATEGORIES, BRANDS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";

const ITEMS_PER_PAGE = 24;

interface Props {
  products: Product[];
}

export default function CatalogClient({ products }: Props) {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("cat") || "";
  const initialOfertas = searchParams.get("ofertas") === "true";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCat);
  const [brand, setBrand] = useState("");
  const [onlyPhoto, setOnlyPhoto] = useState(false);
  const [onlyOfertas, setOnlyOfertas] = useState(initialOfertas);
  const [sortBy, setSortBy] = useState("relevance");
  const [page, setPage] = useState(1);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [search, category, brand, onlyPhoto, onlyOfertas, sortBy]);

  const filtered = useMemo(() => {
    let result = [...products];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.id.includes(q) ||
          p.cat.toLowerCase().includes(q)
      );
    }

    // Category
    if (category) {
      result = result.filter((p) => p.cat === category);
    }

    // Brand
    if (brand) {
      result = result.filter((p) => p.brand === brand);
    }

    // Photo
    if (onlyPhoto) {
      result = result.filter((p) => !!p.img);
    }

    // Ofertas
    if (onlyOfertas) {
      result = result.filter((p) => p.disc && p.disc > 0);
    }

    // Sort
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
        // Relevance: photos first, then discount
        result.sort((a, b) => {
          if (a.img && !b.img) return -1;
          if (!a.img && b.img) return 1;
          return (b.disc || 0) - (a.disc || 0);
        });
    }

    return result;
  }, [products, search, category, brand, onlyPhoto, onlyOfertas, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const activeFilters = [category, brand, onlyPhoto && "foto", onlyOfertas && "ofertas"].filter(Boolean).length;

  const clearAll = () => {
    setSearch("");
    setCategory("");
    setBrand("");
    setOnlyPhoto(false);
    setOnlyOfertas(false);
    setSortBy("relevance");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, referencia, marca o categoría..."
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Mobile filter toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed bottom-20 left-4 z-50 bg-brand-green text-white font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
          {activeFilters > 0 && (
            <span className="bg-white text-brand-green text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>

        {/* Sidebar */}
        <aside className={cn(
          "shrink-0 w-64",
          "max-lg:fixed max-lg:inset-0 max-lg:z-[80] max-lg:bg-black/50 max-lg:backdrop-blur-sm",
          !sidebarOpen && "max-lg:hidden"
        )}>
          <div className={cn(
            "bg-white rounded-2xl border border-gray-100 p-5 space-y-5 lg:sticky lg:top-24",
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
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Categoría</h4>
              <div className="space-y-0.5">
                <button
                  onClick={() => setCategory("")}
                  className={cn("w-full text-left text-sm px-3 py-2 rounded-lg transition-colors",
                    !category ? "bg-green-50 text-brand-green font-semibold" : "text-gray-600 hover:bg-gray-50")}
                >
                  Todas ({products.length})
                </button>
                {CATEGORIES.map((cat) => {
                  const count = products.filter((p) => p.cat === cat.name).length;
                  return (
                    <button
                      key={cat.slug}
                      onClick={() => setCategory(cat.name === category ? "" : cat.name)}
                      className={cn("w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-between",
                        category === cat.name ? "bg-green-50 text-brand-green font-semibold" : "text-gray-600 hover:bg-gray-50")}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{cat.icon}</span>
                        {cat.name}
                      </span>
                      <span className="text-xs text-gray-400">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Brands */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Marca</h4>
              <div className="space-y-0.5">
                <button
                  onClick={() => setBrand("")}
                  className={cn("w-full text-left text-sm px-3 py-2 rounded-lg transition-colors",
                    !brand ? "bg-green-50 text-brand-green font-semibold" : "text-gray-600 hover:bg-gray-50")}
                >
                  Todas
                </button>
                {BRANDS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBrand(b === brand ? "" : b)}
                    className={cn("w-full text-left text-sm px-3 py-2 rounded-lg transition-colors",
                      brand === b ? "bg-green-50 text-brand-green font-semibold" : "text-gray-600 hover:bg-gray-50")}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={onlyPhoto} onChange={(e) => setOnlyPhoto(e.target.checked)}
                       className="w-4 h-4 rounded text-brand-green focus:ring-brand-green" />
                Solo con foto real
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={onlyOfertas} onChange={(e) => setOnlyOfertas(e.target.checked)}
                       className="w-4 h-4 rounded text-brand-green focus:ring-brand-green" />
                Solo ofertas
              </label>
            </div>

            {activeFilters > 0 && (
              <button onClick={clearAll} className="w-full text-xs text-red-500 hover:text-red-700 font-medium py-2">
                Limpiar todos los filtros
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Sort + results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{filtered.length.toLocaleString("es-CO")}</span> productos encontrados
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-green/20 outline-none"
            >
              <option value="relevance">Relevancia</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="discount">Mayor descuento</option>
              <option value="name">A–Z</option>
            </select>
          </div>

          {/* Products grid */}
          {paged.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {paged.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenModal={setModalProduct}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="font-medium text-gray-500">No se encontraron productos</p>
              <p className="text-sm mt-1">Intenta ajustar los filtros</p>
              <button onClick={clearAll} className="mt-3 text-brand-green font-semibold text-sm hover:underline">
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium disabled:opacity-40 hover:bg-gray-200 transition-colors"
              >
                ← Anterior
              </button>
              <div className="flex items-center gap-1">
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
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
                        page === pageNum
                          ? "bg-brand-green text-white"
                          : "bg-gray-100 hover:bg-gray-200"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium disabled:opacity-40 hover:bg-gray-200 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          )}
        </main>
      </div>

      <ProductModal product={modalProduct} onClose={() => setModalProduct(null)} />
    </div>
  );
}

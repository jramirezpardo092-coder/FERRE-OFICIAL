"use client";

import { SITE } from "@/lib/constants";
import ParditoPortrait from "./ParditoPortrait";

interface Props { query: string; onClear: () => void; onCategory: (category: string) => void; categories: string[] }

/** Vacío interactivo: conserva la búsqueda y ofrece acciones de recuperación concretas. */
export default function CatalogEmptyState({ query, onClear, onCategory, categories }: Props) {
  const help = `https://wa.me/57${SITE.phone2}?${new URLSearchParams({ text: `Hola, busco ${query.trim() || "un producto"} en el catálogo de Ferretería Pardo. ¿Me ayudan a identificar su referencia?` })}`;
  return <section className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center dark:border-gray-700 dark:bg-gray-900" aria-labelledby="catalog-empty-title">
    <ParditoPortrait decorative />
    <h2 id="catalog-empty-title" className="mt-3 text-xl font-bold text-gray-900 dark:text-white">PARDITO te ayuda a encontrarlo</h2>
    <p className="mx-auto mt-3 max-w-md break-words text-sm text-gray-600 dark:text-gray-300">{query ? <>No encontramos resultados para <strong>“{query}”</strong> con estos filtros.</> : "No encontramos productos con esta combinación de filtros."} Prueba el código, la referencia de fábrica o un nombre más corto.</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <button type="button" onClick={onClear} className="rounded-xl bg-brand-red px-5 py-3 text-sm font-bold text-white hover:bg-brand-red-dark">Limpiar búsqueda y filtros</button>
      <a href={help} target="_blank" rel="noreferrer" className="rounded-xl border border-green-700 px-5 py-3 text-sm font-bold text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950">Pregúntanos por WhatsApp</a>
    </div>
    {categories.length > 0 && <div role="group" className="mt-7 flex flex-wrap justify-center gap-2" aria-label="Explorar categorías">{categories.slice(0, 4).map(category => <button key={category} type="button" onClick={() => onCategory(category)} className="min-h-11 rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-brand-red dark:bg-gray-800 dark:text-gray-200">{category}</button>)}</div>}
  </section>;
}

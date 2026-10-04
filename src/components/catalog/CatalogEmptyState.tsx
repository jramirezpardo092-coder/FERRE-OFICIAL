"use client";

import { SITE } from "@/lib/constants";
import BrandStripes from "@/components/BrandStripes";
import ParditoPortrait from "./ParditoPortrait";

interface Props { query: string; onClear: () => void; onCategory: (category: string) => void; categories: string[] }

/** Vacío interactivo: conserva la búsqueda y ofrece acciones de recuperación concretas. */
export default function CatalogEmptyState({ query, onClear, onCategory, categories }: Props) {
  const help = `https://wa.me/57${SITE.phone2}?${new URLSearchParams({ text: `Hola, busco ${query.trim() || "un producto"} en el catálogo de Ferretería Pardo. ¿Me ayudan a identificar su referencia?` })}`;
  return <section className="rounded-card border border-line bg-surface px-4 py-8 text-center sm:px-6" aria-labelledby="catalog-empty-title">
    <ParditoPortrait decorative className="h-[180px] w-[180px]" sizes="180px" />
    <BrandStripes className="mx-auto mt-3 h-8 w-14" />
    <h2 id="catalog-empty-title" className="mt-3 font-display text-[28px] font-bold leading-8 text-ink">PARDITO te ayuda a encontrarlo</h2>
    <p className="mx-auto mt-3 max-w-md break-words text-sm leading-5 text-ink-2">{query ? <>No encontramos resultados para <strong>“{query}”</strong> con estos filtros.</> : "No encontramos productos con esta combinación de filtros."} Prueba el código, la referencia de fábrica o un nombre más corto.</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <button type="button" onClick={onClear} className="min-h-11 rounded-control bg-ink px-5 py-3 text-sm font-semibold text-on-ink hover:bg-ink/90">Limpiar búsqueda y filtros</button>
      <a href={help} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-wa-edge bg-surface px-5 py-3 text-sm font-semibold text-ink hover:border-ink"><svg aria-hidden="true" className="h-4 w-4 shrink-0 text-wa" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.5 8.5 0 01-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1121 11.5z" /></svg>Pregúntanos por WhatsApp</a>
    </div>
    {categories.length > 0 && <div role="group" className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Explorar categorías">{categories.slice(0, 4).map(category => <button key={category} type="button" onClick={() => onCategory(category)} className="min-h-11 rounded-chip border border-control bg-surface px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-paper hover:text-ink">{category}</button>)}</div>}
  </section>;
}

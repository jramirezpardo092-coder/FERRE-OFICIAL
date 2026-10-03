"use client";

import { cn } from "@/lib/utils";

export type CatalogPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function CatalogPagination({ page, totalPages, onPageChange }: CatalogPaginationProps) {
  const pages = Number.isFinite(totalPages) ? Math.max(1, Math.floor(totalPages)) : 1;
  const current = Number.isFinite(page) ? Math.max(1, Math.min(pages, Math.floor(page))) : 1;
  if (pages <= 1) return null;
  // Three nearby numbers keep the touch targets comfortable at 375px, even for a long catalog.
  const start = Math.max(1, Math.min(current - 1, pages - 2));
  const visible = Array.from({ length: Math.min(3, pages) }, (_, index) => start + index);
  const buttonClass = "flex h-11 min-w-11 items-center justify-center rounded-xl border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red disabled:cursor-default disabled:opacity-40";
  const inactiveClass = "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800";
  return (
    <nav aria-label="Paginación del catálogo" className="mt-8 flex flex-col items-center gap-3">
      <p className="text-xs text-gray-500 dark:text-gray-400">Página {current.toLocaleString("es-CO")} de {pages.toLocaleString("es-CO")}</p>
      <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        <button type="button" disabled={current <= 1} onClick={() => onPageChange(current - 1)} aria-label="Página anterior" className={cn(buttonClass, inactiveClass, "gap-1.5 px-2.5 sm:px-3")}>
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" /></svg>
          <span className="hidden sm:inline">Anterior</span>
        </button>
        {start > 1 && <span aria-hidden="true" className="px-0.5 text-gray-400">…</span>}
        {visible.map((number) => <button type="button" key={number} aria-label={`Ir a la página ${number}`} aria-current={current === number ? "page" : undefined}
          onClick={() => { if (number !== current) onPageChange(number); }}
          className={cn(buttonClass, "px-2", current === number ? "border-brand-red bg-brand-red text-white shadow-sm" : inactiveClass)}>{number.toLocaleString("es-CO")}</button>)}
        {start + visible.length - 1 < pages && <span aria-hidden="true" className="px-0.5 text-gray-400">…</span>}
        <button type="button" disabled={current >= pages} onClick={() => onPageChange(current + 1)} aria-label="Página siguiente" className={cn(buttonClass, inactiveClass, "gap-1.5 px-2.5 sm:px-3")}>
          <span className="hidden sm:inline">Siguiente</span>
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
    </nav>
  );
}

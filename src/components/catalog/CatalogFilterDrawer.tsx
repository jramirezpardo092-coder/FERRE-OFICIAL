"use client";

import { useRef, type ReactNode } from "react";
import { useDialog } from "@/lib/useDialog";

export default function CatalogFilterDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(open, dialogRef, onClose);
  if (!open) return null;
  return <div className="fixed inset-0 z-[85] bg-black/40 lg:hidden" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="mobile-filters-title" tabIndex={-1} className="flex h-full w-[min(90vw,380px)] flex-col bg-white shadow-xl dark:bg-gray-900">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700"><h2 id="mobile-filters-title" className="font-bold text-gray-900 dark:text-white">Filtros del catálogo</h2><button type="button" onClick={onClose} aria-label="Cerrar filtros" className="rounded-lg px-3 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">✕</button></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      <div className="shrink-0 border-t border-gray-200 p-4 dark:border-gray-700"><button type="button" onClick={onClose} className="w-full rounded-xl bg-brand-red py-3 text-sm font-bold text-white hover:bg-brand-red-dark">Ver resultados</button></div>
    </div>
  </div>;
}

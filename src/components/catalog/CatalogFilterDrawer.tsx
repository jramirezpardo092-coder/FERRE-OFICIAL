"use client";

import { useRef, type ReactNode } from "react";
import { useDialog } from "@/lib/useDialog";

export default function CatalogFilterDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(open, dialogRef, onClose);
  if (!open) return null;
  return <div className="fixed inset-0 z-[85] bg-overlay/40 lg:hidden" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="mobile-filters-title" tabIndex={-1} className="flex h-full w-[min(90vw,380px)] flex-col bg-paper text-ink">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3"><h2 id="mobile-filters-title" className="font-display text-[22px] font-bold leading-7">Filtros del catálogo</h2><button type="button" onClick={onClose} aria-label="Cerrar filtros" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ink-2 hover:bg-surface hover:text-ink">✕</button></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      <div className="shrink-0 border-t border-line p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}><button type="button" onClick={onClose} className="min-h-11 w-full rounded-control bg-ink py-3 text-sm font-semibold text-on-ink hover:bg-ink/90">Ver resultados</button></div>
    </div>
  </div>;
}

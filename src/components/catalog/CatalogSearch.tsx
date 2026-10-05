"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { CatalogSuggestion } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";

export type CatalogSearchProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: CatalogSuggestion[];
  onSelect: (suggestion: CatalogSuggestion) => void;
  loading?: boolean;
};

export default function CatalogSearch({ value, onChange, suggestions, onSelect, loading = false }: CatalogSearchProps) {
  const generatedId = useId().replace(/:/g, "");
  const inputId = `catalog-search-${generatedId}`;
  const listId = `${inputId}-suggestions`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const choices = loading ? [] : suggestions.slice(0, 8);
  const panelOpen = open && value.trim().length >= 2;
  const hasActiveChoice = panelOpen && activeIndex >= 0 && activeIndex < choices.length;

  useEffect(() => { setActiveIndex(-1); }, [value, suggestions, loading]);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  useEffect(() => {
    if (activeIndex >= 0) listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const select = (suggestion: CatalogSuggestion) => {
    setOpen(false);
    setActiveIndex(-1);
    onSelect(suggestion);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const key = event.key;
    if (key === "Escape") {
      if (panelOpen) { event.preventDefault(); event.stopPropagation(); }
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if ((key === "ArrowDown" || key === "ArrowUp") && value.trim().length >= 2) {
      event.preventDefault();
      setOpen(true);
      if (choices.length) setActiveIndex((current) => {
        if (!panelOpen || current < 0) return key === "ArrowDown" ? 0 : choices.length - 1;
        return (current + (key === "ArrowDown" ? 1 : -1) + choices.length) % choices.length;
      });
    } else if (key === "Enter" && panelOpen) {
      if (hasActiveChoice) { event.preventDefault(); select(choices[activeIndex]); }
      else setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <label htmlFor={inputId} className="sr-only">Buscar en el catálogo</label>
      <div className="flex h-[52px] items-center gap-2 rounded-control border border-control bg-surface px-3 transition-colors duration-150 focus-within:border-ink focus-within:ring-[1.5px] focus-within:ring-ink motion-reduce:transition-none sm:px-4">
        <svg aria-hidden="true" className="h-5 w-5 shrink-0 text-ink-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-5-5m2-6a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input ref={inputRef} id={inputId} name="q" type="text" inputMode="search" role="combobox" autoComplete="off" maxLength={120}
          value={value} placeholder="Producto, marca o referencia…" aria-autocomplete="list" aria-expanded={panelOpen}
          aria-controls={panelOpen ? listId : undefined} aria-activedescendant={hasActiveChoice ? `${listId}-${activeIndex}` : undefined}
          onChange={(event) => { onChange(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)} onKeyDown={handleKeyDown}
          onBlur={(event) => { if (!(event.relatedTarget instanceof Node) || !rootRef.current?.contains(event.relatedTarget)) setOpen(false); }}
          className="min-h-11 min-w-0 flex-1 bg-transparent py-3 text-base leading-6 text-ink outline-none placeholder:text-ink-2" />
        {value && <button type="button" aria-label="Limpiar búsqueda" onClick={() => { onChange(""); setOpen(false); setActiveIndex(-1); inputRef.current?.focus(); }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ink-2 transition-colors duration-150 hover:bg-paper hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink motion-reduce:transition-none">
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M6 18L18 6" /></svg>
        </button>}
      </div>

      {panelOpen && <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-control border border-control bg-surface">
        <p role="status" className="border-b border-line px-4 py-2.5 text-xs leading-4 text-ink-2">
          {loading ? "Buscando referencias…" : choices.length ? "Usa ↑ y ↓ para elegir; Enter para abrir." : "Sin sugerencias para esta búsqueda."}
        </p>
        <ul ref={listRef} id={listId} role="listbox" aria-label="Sugerencias de búsqueda" aria-busy={loading} className="max-h-80 overflow-y-auto overscroll-contain p-1.5">
          {choices.map((suggestion, index) => <li key={`${suggestion.type}-${suggestion.value}`} id={`${listId}-${index}`} role="option" aria-selected={index === activeIndex}
            onMouseDown={(event) => event.preventDefault()} onClick={() => select(suggestion)}
            className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 transition-colors duration-150 motion-reduce:transition-none", index === activeIndex ? "bg-paper ring-1 ring-inset ring-control" : "hover:bg-paper")}>
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center text-ink-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {suggestion.type === "category" ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5h7l2 3h9v11H3V5z" />
                  : suggestion.type === "brand" ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h8l10 10-8 8L3 11V3zm4 4h.01" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7l8-4 8 4v10l-8 4-8-4V7zm0 0l8 4 8-4m-8 4v10" />}
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{suggestion.label}</span>
              {suggestion.description && <span className="mt-0.5 block truncate font-mono text-xs leading-4 text-ink-2">{suggestion.description}</span>}
            </span>
            <span className="shrink-0 font-mono text-xs uppercase tracking-[0.025em] text-ink-2">{suggestion.type === "product" ? "Producto" : suggestion.type === "category" ? "Categoría" : "Marca"}</span>
          </li>)}
        </ul>
      </div>}
    </div>
  );
}

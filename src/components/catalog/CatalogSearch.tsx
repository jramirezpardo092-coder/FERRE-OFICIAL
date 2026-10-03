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
      <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 shadow-sm transition-colors focus-within:border-brand-red focus-within:ring-2 focus-within:ring-brand-red/15 dark:border-gray-700 dark:bg-gray-900 sm:px-4">
        <svg aria-hidden="true" className="h-5 w-5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-5-5m2-6a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input ref={inputRef} id={inputId} name="q" type="text" inputMode="search" role="combobox" autoComplete="off" maxLength={120}
          value={value} placeholder="Producto, marca o referencia…" aria-autocomplete="list" aria-expanded={panelOpen}
          aria-controls={panelOpen ? listId : undefined} aria-activedescendant={hasActiveChoice ? `${listId}-${activeIndex}` : undefined}
          onChange={(event) => { onChange(event.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)} onKeyDown={handleKeyDown}
          onBlur={(event) => { if (!(event.relatedTarget instanceof Node) || !rootRef.current?.contains(event.relatedTarget)) setOpen(false); }}
          className="min-w-0 flex-1 bg-transparent py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500 sm:text-base" />
        {value && <button type="button" aria-label="Limpiar búsqueda" onClick={() => { onChange(""); setOpen(false); setActiveIndex(-1); inputRef.current?.focus(); }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red dark:hover:bg-gray-800 dark:hover:text-gray-200">
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12M6 18L18 6" /></svg>
        </button>}
      </div>

      {panelOpen && <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <p role="status" className="border-b border-gray-100 px-4 py-2.5 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
          {loading ? "Buscando referencias…" : choices.length ? "Usa ↑ y ↓ para elegir; Enter para abrir." : "Sin sugerencias para esta búsqueda."}
        </p>
        <ul ref={listRef} id={listId} role="listbox" aria-label="Sugerencias de búsqueda" aria-busy={loading} className="max-h-80 overflow-y-auto overscroll-contain p-1.5">
          {choices.map((suggestion, index) => <li key={`${suggestion.type}-${suggestion.value}`} id={`${listId}-${index}`} role="option" aria-selected={index === activeIndex}
            onMouseDown={(event) => event.preventDefault()} onClick={() => select(suggestion)}
            className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors", index === activeIndex ? "bg-red-50 dark:bg-red-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800")}>
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {suggestion.type === "category" ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5h7l2 3h9v11H3V5z" />
                  : suggestion.type === "brand" ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h8l10 10-8 8L3 11V3zm4 4h.01" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7l8-4 8 4v10l-8 4-8-4V7zm0 0l8 4 8-4m-8 4v10" />}
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{suggestion.label}</span>
              {suggestion.description && <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">{suggestion.description}</span>}
            </span>
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">{suggestion.type === "product" ? "Producto" : suggestion.type === "category" ? "Categoría" : "Marca"}</span>
          </li>)}
        </ul>
      </div>}
    </div>
  );
}

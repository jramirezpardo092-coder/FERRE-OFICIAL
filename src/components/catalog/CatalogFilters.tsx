"use client";

import { useId, useState } from "react";
import { cn, formatCOP } from "@/lib/utils";
import { getActiveFilterCount, validateCatalogFilters, type FiltersValue } from "@/lib/catalog-filters";

export type { FiltersValue } from "@/lib/catalog-filters";

type CountedOption = { name: string; count: number };

export type CatalogFiltersProps = {
  value: FiltersValue;
  onChange: (value: FiltersValue) => void;
  onClear: () => void;
  categories: CountedOption[];
  brands: CountedOption[];
  priceBounds?: { min: number; max: number };
  idPrefix?: string;
  offersLocked?: boolean;
};

const availabilityOptions: { value: FiltersValue["availability"]; label: string; description: string }[] = [
  { value: "all", label: "Todos", description: "Incluye agotados para consultar" },
  { value: "in-stock", label: "En stock", description: "Con cantidad disponible" },
  { value: "on-request", label: "Consultar disponibilidad", description: "Confirma existencia con un asesor" },
];

const inputClass = "min-h-11 w-full min-w-0 rounded-control border border-control bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-ink-2 focus:border-ink focus:ring-[1.5px] focus:ring-ink motion-reduce:transition-none";
const numberFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const countLabel = (count: number) => numberFormatter.format(count);

export default function CatalogFilters({ value, onChange, onClear, categories, brands, priceBounds, idPrefix, offersLocked = false }: CatalogFiltersProps) {
  const generatedId = useId();
  const [brandSearch, setBrandSearch] = useState("");
  const visibleCategories = categories.filter(category => category.count > 0);
  const visibleBrands = brands.filter(brand => brand.name.toLocaleLowerCase("es-CO").includes(brandSearch.toLocaleLowerCase("es-CO")));
  const priceInput = (raw: string) => raw ? numberFormatter.format(Number(raw)) : "";
  const priceDraft = (raw: string) => raw.replace(/[^0-9]/g, "");
  const prefix = idPrefix || `catalog-filters-${generatedId.replace(/:/g, "")}`;
  const validation = validateCatalogFilters(value);
  const activeCount = getActiveFilterCount(offersLocked ? { ...value, offersOnly: false } : value);
  const update = (patch: Partial<FiltersValue>) => onChange({ ...value, ...patch });
  const priceErrorId = `${prefix}-price-range-error`;
  const minError = validation.errors.priceMin;
  const maxError = validation.errors.priceMax;
  const rangeError = validation.errors.priceRange;
  const minPlaceholder = priceBounds && Number.isFinite(priceBounds.min) && priceBounds.min > 0 ? formatCOP(priceBounds.min) : "Sin mínimo";
  const maxPlaceholder = priceBounds && Number.isFinite(priceBounds.max) && priceBounds.max > 0 ? formatCOP(priceBounds.max) : "Sin máximo";

  return (
    <section aria-labelledby={`${prefix}-title`} className="rounded-card border border-line bg-surface p-4">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-line pb-3">
        <h2 id={`${prefix}-title`} className="flex items-center gap-2 font-display text-[22px] font-bold leading-7 text-ink">
          <svg aria-hidden="true" className="h-4 w-4 text-ink-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 17h16M8 4v6m8 4v6" />
          </svg>
          Filtros
        </h2>
        {activeCount > 0 && <span className="rounded-chip bg-ink px-2.5 py-1 font-mono text-xs text-on-ink">{activeCount} {activeCount === 1 ? "activo" : "activos"}</span>}
      </div>

      <div className="space-y-4">
        <fieldset>
          <legend className="mb-2 font-mono text-xs uppercase tracking-[0.025em] text-ink-2">Categoría</legend>
          <label htmlFor={`${prefix}-category`} className="sr-only">Filtrar por categoría</label>
          <select id={`${prefix}-category`} name="category" value={value.category} onChange={(event) => update({ category: event.target.value })} className={inputClass}>
            <option value="">Todas las categorías</option>
            {value.category && !visibleCategories.some((category) => category.name === value.category) && <option value={value.category}>{value.category} (filtro activo)</option>}
            {visibleCategories.map((category) => <option key={category.name} value={category.name}>{category.name} ({countLabel(category.count)})</option>)}
          </select>
        </fieldset>

        <fieldset className="border-t border-line pt-3">
          <legend className="mb-2 font-mono text-xs uppercase tracking-[0.025em] text-ink-2">Marca</legend>
          {brands.length > 10 && <div className="mb-2"><label htmlFor={`${prefix}-brand-search`} className="sr-only">Buscar marca</label><input id={`${prefix}-brand-search`} type="search" value={brandSearch} onChange={event => setBrandSearch(event.target.value)} placeholder="Buscar marca" className={inputClass} /></div>}
          <label htmlFor={`${prefix}-brand`} className="sr-only">Filtrar por marca</label>
          <select id={`${prefix}-brand`} name="brand" value={value.brand} onChange={(event) => update({ brand: event.target.value })} className={inputClass}>
            <option value="">Todas las marcas</option>
            {value.brand && !visibleBrands.some((brand) => brand.name === value.brand) && <option value={value.brand}>{value.brand} (0)</option>}
            {visibleBrands.map((brand) => <option key={brand.name} value={brand.name}>{brand.name} ({countLabel(brand.count)})</option>)}
          </select>
        </fieldset>

        <fieldset aria-describedby={`${prefix}-price-help`} className="border-t border-line pt-3">
          <legend className="mb-2 font-mono text-xs uppercase tracking-[0.025em] text-ink-2">{value.priceMode === "net" ? "Precio antes de IVA" : "Precio con IVA"}</legend>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor={`${prefix}-price-min`} className="mb-1.5 block font-mono text-xs text-ink-2">Mínimo (COP)</label>
              <input id={`${prefix}-price-min`} name="priceMin" type="text" inputMode="numeric" value={priceInput(value.priceMin)} placeholder={minPlaceholder}
                onChange={(event) => update({ priceMin: priceDraft(event.target.value) })}
                aria-invalid={!!(minError || rangeError)} aria-describedby={minError ? `${prefix}-price-min-error` : rangeError ? priceErrorId : `${prefix}-price-help`}
                className={cn(inputClass, (minError || rangeError) && "border-brand-text")} />
              {minError && <p id={`${prefix}-price-min-error`} className="mt-1.5 text-xs text-brand-text">{minError}</p>}
            </div>
            <div>
              <label htmlFor={`${prefix}-price-max`} className="mb-1.5 block font-mono text-xs text-ink-2">Máximo (COP)</label>
              <input id={`${prefix}-price-max`} name="priceMax" type="text" inputMode="numeric" value={priceInput(value.priceMax)} placeholder={maxPlaceholder}
                onChange={(event) => update({ priceMax: priceDraft(event.target.value) })}
                aria-invalid={!!(maxError || rangeError)} aria-describedby={maxError ? `${prefix}-price-max-error` : rangeError ? priceErrorId : `${prefix}-price-help`}
                className={cn(inputClass, (maxError || rangeError) && "border-brand-text")} />
              {maxError && <p id={`${prefix}-price-max-error`} className="mt-1.5 text-xs text-brand-text">{maxError}</p>}
            </div>
          </div>
          {rangeError && <p id={priceErrorId} role="status" className="mt-2 text-xs text-brand-text">{rangeError}</p>}
          <p id={`${prefix}-price-help`} className="mt-2 text-xs leading-4 text-ink-2">Al aplicar un rango, se muestran productos con precio confirmado.</p>
          {priceBounds && Number.isFinite(priceBounds.min) && Number.isFinite(priceBounds.max) && priceBounds.min > 0 && priceBounds.max >= priceBounds.min && (
            <p className="mt-1 font-mono text-xs leading-4 text-ink-2">Desde {formatCOP(priceBounds.min)} hasta {formatCOP(priceBounds.max)}.</p>
          )}
        </fieldset>

        <fieldset className="border-t border-line pt-3">
          <legend className="mb-2 font-mono text-xs uppercase tracking-[0.025em] text-ink-2">Disponibilidad</legend>
          <div className="space-y-1">
            {availabilityOptions.map((option) => (
              <label key={option.value} className={cn("flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-2 py-1 transition-colors duration-150 motion-reduce:transition-none", value.availability === option.value ? "bg-paper" : "hover:bg-paper")}>
                <input type="radio" name={`${prefix}-availability`} value={option.value} checked={value.availability === option.value} onChange={() => update({ availability: option.value })} className="h-4 w-4 shrink-0 accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" />
                <span className="min-w-0 truncate" title={`${option.label} · ${option.description}`}>
                  <span className="text-sm font-semibold text-ink">{option.label}</span>
                  <span className="text-xs text-ink-2"> · {option.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {!offersLocked && <fieldset className="border-t border-line pt-3">
          <legend className="sr-only">Ofertas</legend>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-2 py-2.5 hover:bg-paper">
            <input type="checkbox" name="offersOnly" checked={value.offersOnly} onChange={(event) => update({ offersOnly: event.target.checked })} className="h-4 w-4 shrink-0 accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" />
            <span className="text-sm font-semibold text-ink">Solo ofertas</span>
          </label>
        </fieldset>}

        <button type="button" onClick={onClear} disabled={activeCount === 0} className="min-h-11 w-full rounded-control border border-control px-4 py-2.5 text-sm font-semibold text-ink-2 transition-colors duration-150 hover:border-ink hover:bg-paper hover:text-ink disabled:cursor-default disabled:opacity-45 motion-reduce:transition-none">
          Limpiar filtros
        </button>
      </div>
    </section>
  );
}

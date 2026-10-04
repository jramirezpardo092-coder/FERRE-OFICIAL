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

const inputClass = "min-h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-500 focus:border-brand-red focus:ring-2 focus:ring-brand-red/15 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-400";
const numberFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const countLabel = (count: number) => numberFormatter.format(count);

export default function CatalogFilters({ value, onChange, onClear, categories, brands, priceBounds, idPrefix, offersLocked = false }: CatalogFiltersProps) {
  const generatedId = useId();
  const [brandSearch, setBrandSearch] = useState("");
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
    <section aria-labelledby={`${prefix}-title`} className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 id={`${prefix}-title`} className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
          <svg aria-hidden="true" className="h-4 w-4 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 17h16M8 4v6m8 4v6" />
          </svg>
          Filtros
        </h2>
        {activeCount > 0 && <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-brand-red dark:bg-red-900/25 dark:text-red-300">{activeCount} {activeCount === 1 ? "activo" : "activos"}</span>}
      </div>

      <div className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Categoría</legend>
          <label htmlFor={`${prefix}-category`} className="sr-only">Filtrar por categoría</label>
          <select id={`${prefix}-category`} name="category" value={value.category} onChange={(event) => update({ category: event.target.value })} className={inputClass}>
            <option value="">Todas las categorías</option>
            {value.category && !categories.some((category) => category.name === value.category) && <option value={value.category}>{value.category} (0)</option>}
            {categories.map((category) => <option key={category.name} value={category.name}>{category.name} ({countLabel(category.count)})</option>)}
          </select>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Marca</legend>
          {brands.length > 10 && <div className="mb-2"><label htmlFor={`${prefix}-brand-search`} className="sr-only">Buscar marca</label><input id={`${prefix}-brand-search`} type="search" value={brandSearch} onChange={event => setBrandSearch(event.target.value)} placeholder="Buscar marca" className={inputClass} /></div>}
          <label htmlFor={`${prefix}-brand`} className="sr-only">Filtrar por marca</label>
          <select id={`${prefix}-brand`} name="brand" value={value.brand} onChange={(event) => update({ brand: event.target.value })} className={inputClass}>
            <option value="">Todas las marcas</option>
            {value.brand && !visibleBrands.some((brand) => brand.name === value.brand) && <option value={value.brand}>{value.brand} (0)</option>}
            {visibleBrands.map((brand) => <option key={brand.name} value={brand.name}>{brand.name} ({countLabel(brand.count)})</option>)}
          </select>
        </fieldset>

        <fieldset aria-describedby={`${prefix}-price-help`}>
          <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Precio antes de IVA</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${prefix}-price-min`} className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Mínimo (COP)</label>
              <input id={`${prefix}-price-min`} name="priceMin" type="text" inputMode="numeric" value={priceInput(value.priceMin)} placeholder={minPlaceholder}
                onChange={(event) => update({ priceMin: priceDraft(event.target.value) })}
                aria-invalid={!!(minError || rangeError)} aria-describedby={minError ? `${prefix}-price-min-error` : rangeError ? priceErrorId : `${prefix}-price-help`}
                className={cn(inputClass, (minError || rangeError) && "border-red-400 dark:border-red-500")} />
              {minError && <p id={`${prefix}-price-min-error`} className="mt-1.5 text-xs text-red-600 dark:text-red-400">{minError}</p>}
            </div>
            <div>
              <label htmlFor={`${prefix}-price-max`} className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">Máximo (COP)</label>
              <input id={`${prefix}-price-max`} name="priceMax" type="text" inputMode="numeric" value={priceInput(value.priceMax)} placeholder={maxPlaceholder}
                onChange={(event) => update({ priceMax: priceDraft(event.target.value) })}
                aria-invalid={!!(maxError || rangeError)} aria-describedby={maxError ? `${prefix}-price-max-error` : rangeError ? priceErrorId : `${prefix}-price-help`}
                className={cn(inputClass, (maxError || rangeError) && "border-red-400 dark:border-red-500")} />
              {maxError && <p id={`${prefix}-price-max-error`} className="mt-1.5 text-xs text-red-600 dark:text-red-400">{maxError}</p>}
            </div>
          </div>
          {rangeError && <p id={priceErrorId} role="status" className="mt-2 text-xs text-red-600 dark:text-red-400">{rangeError}</p>}
          <p id={`${prefix}-price-help`} className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">Al aplicar un rango, se muestran productos con precio confirmado.</p>
          {priceBounds && Number.isFinite(priceBounds.min) && Number.isFinite(priceBounds.max) && priceBounds.min > 0 && priceBounds.max >= priceBounds.min && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Desde {formatCOP(priceBounds.min)} hasta {formatCOP(priceBounds.max)}.</p>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">Disponibilidad</legend>
          <div className="space-y-2">
            {availabilityOptions.map((option) => (
              <label key={option.value} className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors", value.availability === option.value
                ? "border-brand-red/30 bg-red-50/60 dark:border-red-700 dark:bg-red-900/15"
                : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700")}>
                <input type="radio" name={`${prefix}-availability`} value={option.value} checked={value.availability === option.value} onChange={() => update({ availability: option.value })} className="h-4 w-4 shrink-0 accent-brand-red" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">{option.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">{option.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {!offersLocked && <fieldset>
          <legend className="sr-only">Ofertas</legend>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/60">
            <input type="checkbox" name="offersOnly" checked={value.offersOnly} onChange={(event) => update({ offersOnly: event.target.checked })} className="h-4 w-4 shrink-0 rounded accent-brand-red" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Solo ofertas</span>
          </label>
        </fieldset>}

        <button type="button" onClick={onClear} disabled={activeCount === 0} className="min-h-11 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-default disabled:opacity-45 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
          Limpiar filtros
        </button>
      </div>
    </section>
  );
}

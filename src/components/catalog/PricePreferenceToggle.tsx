"use client";

import { useId } from "react";
import { useSetPricePreference, usePricePreference } from "@/lib/price-preference";
import { cn } from "@/lib/utils";

export default function PricePreferenceToggle({ idPrefix, className }: { idPrefix?: string; className?: string }) {
  const generatedId = useId();
  const id = `${idPrefix ?? generatedId}-company-prices`;
  const mode = usePricePreference();
  const setMode = useSetPricePreference();
  return (
    <fieldset className={cn("inline-flex shrink-0 rounded-control border border-control bg-surface p-0.5", className)}>
      <legend className="sr-only">Visualización de precios: con IVA o sin IVA para empresas</legend>
      {(["gross", "net"] as const).map(option => <label key={option} className="relative cursor-pointer">
        <input id={`${id}-${option}`} type="radio" name={id} value={option} aria-label={option === "gross" ? "Precios con IVA" : "Precios sin IVA para empresas"} checked={mode === option} onChange={() => setMode(option)} className="peer sr-only" />
        <span className={cn("flex min-h-11 items-center justify-center whitespace-nowrap rounded-control px-3 text-sm font-semibold transition-colors duration-150 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink motion-reduce:transition-none", mode === option ? "bg-ink text-on-ink" : "text-ink-2 hover:bg-paper hover:text-ink")}>
          {option === "gross" ? "Con IVA" : "Sin IVA"}
        </span>
      </label>)}
    </fieldset>

  );
}

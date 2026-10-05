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
    <label htmlFor={id} className={cn("inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300", className)}>
      <input id={id} type="checkbox" checked={mode === "net"} onChange={(event) => setMode(event.target.checked ? "net" : "gross")} className="h-5 w-5 rounded border-gray-300 accent-brand-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-red" />
      Precios para empresas (sin IVA)
    </label>
  );
}

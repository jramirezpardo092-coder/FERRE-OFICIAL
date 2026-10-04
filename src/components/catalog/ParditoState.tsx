"use client";

import ParditoPortrait from "./ParditoPortrait";
import BrandStripes from "@/components/BrandStripes";

export default function ParditoState({ mode = "loading", onRetry }: { mode?: "loading" | "error"; onRetry?: () => void }) {
  return <div className="rounded-card border border-line bg-surface p-6 text-center" role="status" aria-live="polite">
    <ParditoPortrait decorative className="h-[180px] w-[180px]" sizes="180px" />
    <BrandStripes className="mx-auto mt-3 h-8 w-14" />
    <h2 className="mt-3 font-display text-[22px] font-bold leading-7 text-ink">{mode === "loading" ? "PARDITO está buscando tus productos" : "No pudimos cargar el catálogo"}</h2>
    <p className="mt-2 text-sm leading-5 text-ink-2">{mode === "loading" ? "Un momento: estamos preparando las referencias y sus precios." : "Revisa tu conexión e inténtalo de nuevo."}</p>
    {mode === "error" && onRetry && <button type="button" onClick={onRetry} className="mt-5 min-h-11 rounded-control bg-ink px-5 py-3 text-sm font-semibold text-on-ink hover:bg-ink/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">Volver a intentar</button>}
  </div>;
}

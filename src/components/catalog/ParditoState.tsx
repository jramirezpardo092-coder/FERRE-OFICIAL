"use client";

import ParditoPortrait from "./ParditoPortrait";

export default function ParditoState({ mode = "loading", onRetry }: { mode?: "loading" | "error"; onRetry?: () => void }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900" role="status" aria-live="polite">
    <ParditoPortrait decorative sizes="128px" />
    <h2 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{mode === "loading" ? "PARDITO está buscando tus productos" : "No pudimos cargar el catálogo"}</h2>
    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{mode === "loading" ? "Un momento: estamos preparando las referencias y sus precios." : "Revisa tu conexión e inténtalo de nuevo."}</p>
    {mode === "loading" ? <div aria-hidden="true" className="mx-auto mt-5 h-1 w-32 animate-pulse rounded-full bg-brand-red motion-reduce:animate-none" /> : onRetry && <button type="button" onClick={onRetry} className="mt-5 min-h-11 rounded-xl bg-brand-red px-5 py-3 text-sm font-bold text-white hover:bg-brand-red-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900">Volver a intentar</button>}
  </div>;
}

"use client";

import { useRef, useState } from "react";
import { SITE } from "@/lib/constants";
import { useDialog } from "@/lib/useDialog";
import ParditoPortrait from "./ParditoPortrait";

export default function ParditoAssist() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(open, dialogRef, () => setOpen(false));
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="Ayuda con PARDITO" aria-haspopup="dialog" aria-expanded={open} className="fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-1.5 shadow-lg transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-900">
      <ParditoPortrait decorative className="h-14 w-14" />
      <span className="text-left text-xs font-bold text-gray-900 dark:text-white">PARDITO<span className="block font-normal text-gray-600 dark:text-gray-300">¿Te ayudo?</span></span>
    </button>
    {open && <div className="fixed inset-0 z-[90] flex items-end justify-end bg-black/40 p-4 sm:items-center" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pardito-help-title" tabIndex={-1} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4"><h2 id="pardito-help-title" className="text-lg font-bold text-gray-900 dark:text-white">PARDITO te orienta</h2><button type="button" aria-label="Cerrar ayuda" onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">✕</button></div>
        <ParditoPortrait decorative className="mx-auto mt-2 h-32 w-28" />
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Busca por código o referencia de fábrica. Para un herraje, ten a mano sus medidas, acabado y tipo de puerta.</p>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">¿Está agotado? Nuestro equipo puede confirmar reposición o una alternativa compatible.</p>
        <a href={SITE.social.whatsapp} target="_blank" rel="noreferrer" className="mt-5 block rounded-xl bg-green-700 px-4 py-3 text-center text-sm font-bold text-white hover:bg-green-800">Hablar con un asesor</a>
      </div>
    </div>}
  </>;
}

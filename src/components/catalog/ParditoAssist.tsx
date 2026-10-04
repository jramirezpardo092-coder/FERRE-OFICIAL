"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/constants";
import { useDialog } from "@/lib/useDialog";
import ParditoPortrait from "./ParditoPortrait";

export default function ParditoAssist() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let previous = window.scrollY;
    const onScroll = () => { const next = window.scrollY; if (Math.abs(next - previous) > 8) { setHidden(next > previous && next > 100); previous = next; } };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(open, dialogRef, () => setOpen(false));
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="Ayuda y cotización por WhatsApp con PARDITO" aria-haspopup="dialog" aria-expanded={open} style={{ bottom: "calc(env(safe-area-inset-bottom) + 16px)" }} className={`fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-green-700 bg-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 dark:bg-gray-900 ${hidden && !open ? "invisible translate-y-20" : "visible translate-y-0"}`}>
      <ParditoPortrait decorative className="h-12 w-12" sizes="48px" />
      <span aria-hidden="true" className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-green-700 text-xs text-white">↗</span>
    </button>
    {open && <div className="fixed inset-0 z-[90] flex items-end justify-end bg-black/40 p-4 sm:items-center" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pardito-help-title" tabIndex={-1} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4"><h2 id="pardito-help-title" className="text-lg font-bold text-gray-900 dark:text-white">PARDITO te orienta</h2><button type="button" aria-label="Cerrar ayuda" onClick={() => setOpen(false)} className="min-h-11 min-w-11 rounded-lg px-2 py-1 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">✕</button></div>
        <ParditoPortrait decorative className="mx-auto mt-2 h-32 w-28" sizes="112px" />
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Busca por código o referencia de fábrica. Para un herraje, ten a mano sus medidas, acabado y tipo de puerta.</p>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">¿Está agotado? Nuestro equipo puede confirmar reposición o una alternativa compatible.</p>
        <a href={SITE.social.whatsapp} target="_blank" rel="noreferrer" className="mt-5 block rounded-xl bg-green-700 px-4 py-3 text-center text-sm font-bold text-white hover:bg-green-800">Hablar con un asesor</a>
      </div>
    </div>}
  </>;
}

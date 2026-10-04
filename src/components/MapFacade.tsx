"use client";

import { useId, useState } from "react";
import { SITE } from "@/lib/constants";

/** Google Maps no se conecta hasta que la persona solicita el mapa. */
export default function MapFacade() {
  const [open, setOpen] = useState(false);
  const mapId = `store-map-${useId().replace(/:/g, "")}`;

  return <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 shadow-xl">
    <div id={mapId} className="relative min-h-[200px]">
      {open ? <iframe
        src={SITE.mapEmbed}
        width="100%"
        height="200"
        className="block h-[200px] w-full border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Ubicación de Ferretería Pardo en Google Maps"
      /> : <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 px-4 py-5 text-center">
        <svg className="h-8 w-8 text-red-400" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1116 0zM15 10a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-sm leading-relaxed text-gray-300">{SITE.address}</p>
        <button type="button" onClick={() => setOpen(true)} aria-controls={mapId} aria-expanded={open} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900">Ver mapa interactivo</button>
      </div>}
    </div>
    <a href={SITE.mapDirections} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 border-t border-gray-800 px-3 py-3 text-center text-sm font-semibold text-gray-200 hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400">
      Cómo llegar en Google Maps
      <svg className="h-4 w-4 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14 3h7v7M21 3l-9 9M10 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5" /></svg>
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </a>
  </div>;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/constants";
import { useDialog } from "@/lib/useDialog";
import ParditoPortrait from "./ParditoPortrait";

export default function ParditoAssist() {
  const pathname = usePathname();
  const isCatalog = pathname === "/catalogo" || pathname.startsWith("/catalogo/");
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
  // La ayuda ocupa un espacio real del header móvil: al reaparecer nunca tapa una tarjeta.
  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const place = () => setHeaderSlot(isCatalog && media.matches ? document.getElementById("catalog-assist-slot") : null);
    place();
    media.addEventListener("change", place);
    return () => media.removeEventListener("change", place);
  }, [isCatalog]);
  useEffect(() => {
    let previous = window.scrollY;
    const mobile = window.matchMedia("(max-width: 639px)");
    setHidden(false);
    const onScroll = () => { const next = Math.max(0, window.scrollY); if (Math.abs(next - previous) > 8) { setHidden(next > previous && next > (isCatalog && mobile.matches ? 16 : 100)); previous = next; } };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname, isCatalog]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useDialog(open, dialogRef, () => setOpen(false));
  useEffect(() => {
    // El disparador puede cambiar de ubicación al girar el móvil con el diálogo abierto.
    if (wasOpen.current && !open) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);
  const inHeader = isCatalog && !!headerSlot;
  const trigger = <button ref={triggerRef} data-pardito-trigger data-pardito-placement={inHeader ? "header" : "floating"} type="button" onClick={() => setOpen(true)} aria-label="Ayuda y cotización por WhatsApp con PARDITO" aria-haspopup="dialog" aria-expanded={open} className={`pardito-assist-trigger ${isCatalog ? "pardito-assist-catalog" : ""} ${inHeader ? "relative h-11 w-11" : "fixed right-4 z-40 h-14 w-14 bottom-[calc(env(safe-area-inset-bottom)+16px)]"} flex items-center justify-center rounded-card border border-control bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 ${hidden && !open ? "pardito-assist-hidden" : ""}`}>
      <ParditoPortrait decorative className={inHeader ? "h-9 w-9" : "h-12 w-12"} sizes={inHeader ? "36px" : "48px"} />
      <span aria-hidden="true" className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-control border border-control bg-surface text-xs text-wa">↗</span>
    </button>;
  return <>
    {inHeader && headerSlot ? createPortal(trigger, headerSlot) : trigger}
    {open && <div className="fixed inset-0 z-[90] flex items-end justify-end bg-overlay/40 p-4 sm:items-center" onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pardito-help-title" tabIndex={-1} className="w-full max-w-sm rounded-card bg-surface p-6 shadow-card ">
        <div className="flex items-start justify-between gap-4"><h2 id="pardito-help-title" className="text-lg font-bold text-ink ">PARDITO te orienta</h2><button type="button" aria-label="Cerrar ayuda" onClick={() => setOpen(false)} className="min-h-11 min-w-11 rounded-control px-2 py-1 text-ink-2 hover:bg-paper  ">✕</button></div>
        <ParditoPortrait decorative className="mx-auto mt-2 h-[180px] w-[180px]" sizes="180px" />
        <p className="mt-3 text-sm text-ink-2 ">Busca por código o referencia de fábrica. Para un herraje, ten a mano sus medidas, acabado y tipo de puerta.</p>
        <p className="mt-3 text-sm text-ink-2 ">¿Está agotado? Nuestro equipo puede confirmar reposición o una alternativa compatible.</p>
        <a href={SITE.social.whatsapp} target="_blank" rel="noreferrer" className="btn-wa mt-5 w-full">Hablar con un asesor</a>
      </div>
    </div>}
  </>;
}

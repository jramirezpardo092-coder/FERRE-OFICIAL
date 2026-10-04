"use client";

import { useEffect, useState } from "react";
import { getCart } from "@/lib/cart-store";

export default function QuoteToast() {
  const [notice, setNotice] = useState<{ count: number; serial: number } | null>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const show = () => {
      setPaused(false);
      setNotice((previous) => ({ count: getCart().length, serial: (previous?.serial ?? 0) + 1 }));
    };
    const dismiss = () => {
      setNotice(null);
      setPaused(false);
    };
    window.addEventListener("cart-added", show);
    window.addEventListener("open-cart", dismiss);
    window.addEventListener("toggle-cart", dismiss);
    return () => {
      window.removeEventListener("cart-added", show);
      window.removeEventListener("open-cart", dismiss);
      window.removeEventListener("toggle-cart", dismiss);
    };
  }, []);
  useEffect(() => {
    if (!notice || paused) return;
    const timeout = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [notice, paused]);
  if (!notice) return null;
  return (
    <div className="fixed bottom-5 left-4 z-[120] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 pl-4 text-sm text-gray-900 shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:left-6" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}>
      <span role="status" aria-live="polite" key={notice.serial}>Agregado</span>
      <span aria-hidden="true">·</span>
      <button type="button" className="min-h-11 rounded-lg px-2 font-bold text-brand-red hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-800" onClick={() => {
        document.querySelector<HTMLButtonElement>("[data-quote-trigger]")?.focus();
        window.dispatchEvent(new Event("open-cart"));
        setNotice(null);
      }}>Ver cotización ({notice.count})</button>
      <button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Cerrar aviso de producto agregado" onClick={() => setNotice(null)}>✕</button>
    </div>
  );
}

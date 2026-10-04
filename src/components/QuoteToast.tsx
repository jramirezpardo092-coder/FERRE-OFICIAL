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
    <div className="quote-toast" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false); }}>
      <span role="status" aria-live="polite" key={notice.serial}>Agregado</span>
      <span aria-hidden="true">·</span>
      <button type="button" className="quote-toast-open" onClick={() => {
        document.querySelector<HTMLButtonElement>("[data-quote-trigger]")?.focus();
        window.dispatchEvent(new Event("open-cart"));
        setNotice(null);
      }}>Ver cotización ({notice.count})</button>
      <button type="button" className="quote-icon-button" aria-label="Cerrar aviso de producto agregado" onClick={() => setNotice(null)}><span aria-hidden="true">✕</span></button>
    </div>
  );
}

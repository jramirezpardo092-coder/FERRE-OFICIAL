"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { getAvailableQuantity, allowsFractionalQuantity, normalizeQuantity, formatQuantity, cn } from "@/lib/utils";
import { addToCart } from "@/lib/cart-store";
import { useQuoteQuantity } from "@/lib/useQuoteQuantity";
import { normalizeProductName, formatUnit } from "@/lib/catalog/normalize";
import { buildQuoteWhatsAppUrl } from "@/lib/quote-presentation";
import PriceDisplay from "@/components/catalog/PriceDisplay";

export default function ProductActions({ product }: { product: Product }) {
  const available = getAvailableQuantity(product);
  const fractional = allowsFractionalQuantity(product);
  const inStock = available > 0;
  const initialQty = inStock ? Math.min(1, available) : 1;
  const [qty, setQty] = useState(initialQty);
  const [quantityDraft, setQuantityDraft] = useState(String(initialQty));
  const [feedback, setFeedback] = useState("");
  const name = normalizeProductName(product.nombre);
  const quoteQuantity = useQuoteQuantity(product.id);
  const actionLabel = quoteQuantity > 0 ? `En cotización · ${formatQuantity(quoteQuantity)}` : inStock ? "Agregar a cotización" : "Consultar disponibilidad";
  const accessibleAction = `${actionLabel}: ${name}${quoteQuantity > 0 ? ", agregar más a cotización" : ""}${inStock ? "" : ", se agrega a cotización con disponibilidad a confirmar"}`;
  const normalizedDraft = normalizeQuantity(Number(quantityDraft));
  const validQuantity = Number.isFinite(normalizedDraft) && normalizedDraft > 0 && (fractional || Number.isInteger(normalizedDraft)) && (!inStock || normalizedDraft <= available);
  const setQuantity = (quantity: number) => {
    const next = normalizeQuantity(quantity);
    setQty(next);
    setQuantityDraft(String(next));
  };
  const handleAdd = () => {
    if (!validQuantity) return;
    setFeedback(addToCart(product, qty) ? "" : "La cantidad supera la disponibilidad. Revisa las referencias que ya agregaste a tu cotización.");
  };
  return (
    <div className="space-y-3">
      <p className="font-mono text-xs uppercase tracking-[0.025em] text-ink-2">Cantidad{formatUnit(product.unidad) ? ` · ${formatUnit(product.unidad)}` : ""}</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-11 items-center overflow-hidden rounded-control border border-control bg-surface">
          <button type="button" onClick={() => setQuantity(Math.max(initialQty, qty - 1))} className="flex h-11 w-11 items-center justify-center text-base font-semibold text-ink hover:bg-paper disabled:opacity-40" aria-label="Reducir cantidad" disabled={qty <= initialQty}>−</button>
          {fractional ? <input type="number" inputMode="decimal" min="0.000001" max={inStock ? available : undefined} step="any" value={quantityDraft} aria-label={`Cantidad${formatUnit(product.unidad) ? ` en ${formatUnit(product.unidad)}` : ""}`} aria-invalid={!validQuantity} className="h-11 w-20 border-x border-control bg-surface px-2 text-center font-mono text-sm font-medium text-ink" onChange={(event) => {
            setQuantityDraft(event.target.value);
            const quantity = normalizeQuantity(Number(event.target.value));
            if (Number.isFinite(quantity) && quantity > 0 && (!inStock || quantity <= available)) setQty(quantity);
          }} /> : <span className="min-w-[3rem] border-x border-control px-3 text-center font-mono text-sm font-medium text-ink">{formatQuantity(qty)}</span>}
          <button type="button" onClick={() => setQuantity(inStock ? Math.min(available, qty + 1) : qty + 1)} disabled={inStock && qty >= available} className="flex h-11 w-11 items-center justify-center text-base font-semibold text-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40" aria-label="Aumentar cantidad">+</button>
        </div>
        <button type="button" onClick={handleAdd} disabled={!validQuantity} aria-label={accessibleAction} className="hidden min-h-11 min-w-11 flex-1 items-center justify-center gap-2 rounded-control bg-brand px-4 py-3 text-sm font-semibold leading-5 text-on-brand hover:bg-brand-press disabled:cursor-not-allowed disabled:opacity-50 md:inline-flex">{quoteQuantity > 0 && <span aria-hidden="true">✓</span>}{actionLabel}</button>
        <a href={validQuantity ? buildQuoteWhatsAppUrl([{ ...product, qty }]) : undefined} aria-disabled={!validQuantity} onClick={(event) => { if (!validQuantity) event.preventDefault(); }} target="_blank" rel="noopener noreferrer" aria-label={`Consultar ${name} por WhatsApp`} title="Consultar por WhatsApp" className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-wa-edge bg-surface text-wa hover:border-ink", !validQuantity && "opacity-40")}><svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h8m-8 4h5m8-2a8 8 0 01-8 8H5l-3 2v-7a8 8 0 1119-3z" /></svg></a>
      </div>
      {!validQuantity && <p role="status" className="text-sm text-ink-2">{inStock ? `Ingresa una cantidad positiva y hasta ${formatUnit(product.unidad, available) || formatQuantity(available)}.` : "Ingresa una cantidad positiva para consultar."}</p>}
      <div data-mobile-quote-bar className="product-mobile-quote">
        <PriceDisplay product={product} compact />
        <button type="button" onClick={handleAdd} disabled={!validQuantity} aria-label={accessibleAction} className="product-mobile-add flex min-h-11 items-center justify-center gap-1.5 rounded-control bg-brand px-3 py-3 text-sm font-semibold leading-5 text-on-brand hover:bg-brand-press disabled:cursor-not-allowed disabled:opacity-50">{quoteQuantity > 0 && <span aria-hidden="true">✓</span>}{actionLabel}</button>
      </div>
      {!inStock && <p className="text-xs text-ink-2">Se agrega con disponibilidad a confirmar.</p>}
      {feedback && <p role="status" className="text-sm text-ink-2">{feedback}</p>}
    </div>
  );
}

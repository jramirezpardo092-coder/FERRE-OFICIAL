"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { getAvailableQuantity, allowsFractionalQuantity, normalizeQuantity, formatQuantity, cn } from "@/lib/utils";
import { addToCart } from "@/lib/cart-store";
import { normalizeProductName, formatUnit } from "@/lib/catalog/normalize";
import { buildQuoteWhatsAppUrl } from "@/lib/quote-presentation";

export default function ProductActions({ product }: { product: Product }) {
  const available = getAvailableQuantity(product);
  const fractional = allowsFractionalQuantity(product);
  const inStock = available > 0;
  const initialQty = inStock ? Math.min(1, available) : 1;
  const [qty, setQty] = useState(initialQty);
  const [quantityDraft, setQuantityDraft] = useState(String(initialQty));
  const [feedback, setFeedback] = useState("");
  const name = normalizeProductName(product.nombre);
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
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad:</span>
        <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <button type="button" onClick={() => setQuantity(Math.max(initialQty, qty - 1))} className="flex h-11 w-11 items-center justify-center font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Reducir cantidad" disabled={qty <= initialQty}>−</button>
          {fractional ? <input type="number" inputMode="decimal" min="0.000001" max={inStock ? available : undefined} step="any" value={quantityDraft} aria-label={`Cantidad${formatUnit(product.unidad) ? ` en ${formatUnit(product.unidad)}` : ""}`} aria-invalid={!validQuantity} className="h-11 w-24 border-x border-gray-200 bg-white px-2 text-center text-sm font-bold text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white" onChange={(event) => {
            setQuantityDraft(event.target.value);
            const quantity = normalizeQuantity(Number(event.target.value));
            if (Number.isFinite(quantity) && quantity > 0 && (!inStock || quantity <= available)) setQty(quantity);
          }} /> : <span className="min-w-[3rem] border-x border-gray-200 px-3 text-center text-sm font-bold text-gray-900 dark:border-gray-700 dark:text-white">{formatQuantity(qty)}</span>}
          <button type="button" onClick={() => setQuantity(inStock ? Math.min(available, qty + 1) : qty + 1)} disabled={inStock && qty >= available} className="flex h-11 w-11 items-center justify-center font-bold text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Aumentar cantidad">+</button>
        </div>
        {formatUnit(product.unidad) && <span className="text-xs text-gray-500 dark:text-gray-400">{formatUnit(product.unidad)}</span>}
      </div>
      {!validQuantity && <p role="status" className="text-sm text-amber-700 dark:text-amber-400">{inStock ? `Ingresa una cantidad positiva y hasta ${formatUnit(product.unidad, available) || formatQuantity(available)}.` : "Ingresa una cantidad positiva para consultar."}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={handleAdd} disabled={!validQuantity} aria-label={`${inStock ? "Agregar a cotización" : "Consultar disponibilidad"}: ${name}${inStock ? "" : ", se agrega a cotización con disponibilidad a confirmar"}`} className={cn("min-h-11 flex-1 rounded-xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50", inStock ? "bg-brand-red text-white hover:bg-brand-red-dark" : "border border-brand-red text-brand-red hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-gray-800")}>{inStock ? "Agregar a cotización" : "Consultar disponibilidad"}</button>
        <a href={validQuantity ? buildQuoteWhatsAppUrl([{ ...product, qty }]) : undefined} aria-disabled={!validQuantity} onClick={(event) => { if (!validQuantity) event.preventDefault(); }} target="_blank" rel="noopener noreferrer" aria-label={`Consultar ${name} por WhatsApp`} title="Consultar por WhatsApp" className={cn("flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950", !validQuantity && "opacity-40")}><svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h8m-8 4h5m8-2a8 8 0 01-8 8H5l-3 2v-7a8 8 0 1119-3z" /></svg></a>
      </div>
      {!inStock && <p className="text-xs text-gray-500 dark:text-gray-400">Se agrega con disponibilidad a confirmar.</p>}
      {feedback && <p role="status" className="text-sm text-amber-700 dark:text-amber-400">{feedback}</p>}
    </div>
  );
}

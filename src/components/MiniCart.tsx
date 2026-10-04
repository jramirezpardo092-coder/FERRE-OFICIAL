"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getCart, removeFromCart, updateQty, clearCart, subscribeCart, revalidateCart } from "@/lib/cart-store";
import { formatCOP, getQuotationTotals, getAvailableQuantity, normalizeQuantity, formatQuantity } from "@/lib/utils";
import type { CartItem } from "@/lib/types";
import { useDialog } from "@/lib/useDialog";
import { normalizeProductName, displayBrand, formatUnit } from "@/lib/catalog/normalize";
import { buildQuoteWhatsAppUrl, isQuoteAvailabilityPending, type QuoteCustomer } from "@/lib/quote-presentation";
import PriceDisplay from "./catalog/PriceDisplay";

export default function MiniCart() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);
  const [validationError, setValidationError] = useState("");
  const [preparedUrl, setPreparedUrl] = useState<string | null>(null);
  const [customer, setCustomer] = useState<QuoteCustomer>({});
  const customerRef = useRef(customer);
  customerRef.current = customer;
  const validationSequence = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const preparedLinkRef = useRef<HTMLAnchorElement>(null);
  useDialog(isOpen, dialogRef, () => setIsOpen(false));

  const refresh = useCallback(() => {
    setItems(getCart());
    setPreparedUrl(null);
    setChecked(false);
  }, []);
  const validate = useCallback(async (prepare = false) => {
    const sequence = ++validationSequence.current;
    setChecking(true);
    setValidationError("");
    setPreparedUrl(null);
    try {
      const result = await revalidateCart();
      if (sequence !== validationSequence.current) return;
      setItems(result.items);
      setChanges((previous) => [...new Set([...previous, ...result.changes])]);
      setChecked(true);
      if (prepare && result.items.length > 0) setPreparedUrl(buildQuoteWhatsAppUrl(result.items, customerRef.current));
    } catch {
      if (sequence !== validationSequence.current) return;
      setChecked(false);
      setValidationError("No pudimos comprobar los precios y la disponibilidad. Reintenta para preparar tu cotización.");
    } finally {
      if (sequence === validationSequence.current) setChecking(false);
    }
  }, []);
  useEffect(() => {
    if (!isOpen) return;
    setChanges([]);
    void validate();
    return () => { validationSequence.current += 1; };
  }, [isOpen, validate]);
  useEffect(() => {
    if (preparedUrl && isOpen) preparedLinkRef.current?.focus();
  }, [preparedUrl, isOpen]);
  useEffect(() => {
    refresh();
    const unsubscribe = subscribeCart(refresh);
    const toggle = () => setIsOpen((previous) => !previous);
    const open = () => setIsOpen(true);
    window.addEventListener("toggle-cart", toggle);
    window.addEventListener("open-cart", open);
    return () => {
      unsubscribe();
      window.removeEventListener("toggle-cart", toggle);
      window.removeEventListener("open-cart", open);
    };
  }, [refresh]);
  const changeCustomer = (field: keyof QuoteCustomer, value: string) => {
    setCustomer((previous) => ({ ...previous, [field]: value }));
    setPreparedUrl(null);
  };
  if (!isOpen) return null;
  const totals = getQuotationTotals(items);
  const pendingTotals = totals.pendingPrices > 0 || totals.pendingTaxes > 0;
  const pendingAvailability = items.some(isQuoteAvailabilityPending);

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cart-title" tabIndex={-1} className="absolute right-0 top-0 flex h-[100dvh] w-full max-w-md flex-col bg-white shadow-2xl outline-none dark:bg-gray-900">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 id="cart-title" className="text-lg font-extrabold text-gray-900 dark:text-white">Cotización <span className="ml-1 rounded-full bg-brand-red px-2 py-0.5 text-xs font-bold text-white">{items.length}</span></h2>
          <button type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar cotización" className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">✕</button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <div role="status" aria-live="polite" className="text-xs text-gray-600 dark:text-gray-300">
            {checking ? "Actualizando precios y disponibilidad…" : checked ? "Cotización comprobada con el catálogo vigente." : null}
            {changes.length > 0 && <ul className="mt-2 space-y-1 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">{changes.map((change) => <li key={change}>{change}</li>)}</ul>}
          </div>
          {validationError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300"><p>{validationError}</p><button type="button" onClick={() => void validate()} className="mt-1 min-h-11 font-bold underline">Reintentar actualización</button></div>}
          {items.length === 0 ? <div className="py-12 text-center text-gray-500 dark:text-gray-400"><p className="font-medium">Tu cotización está vacía</p><p className="mt-1 text-sm">Agrega productos del catálogo</p></div> : items.map((item) => {
            const name = normalizeProductName(item.nombre);
            const brand = displayBrand(item.brand);
            const available = getAvailableQuantity(item);
            const pending = isQuoteAvailabilityPending(item);
            return (
              <div key={item.id} className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    {brand && <p className="text-xs font-bold uppercase text-brand-red dark:text-red-400">{brand}</p>}
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{name}</h3>
                    <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">SKU {item.id} · Ref. {item.ref || item.sku || item.id}</p>
                    {pending && <p className="mt-1 text-[13px] font-medium text-amber-700 dark:text-amber-300">Disponibilidad a confirmar</p>}
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.id)} disabled={checking} aria-label={`Eliminar ${name} de la cotización`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 dark:hover:bg-gray-900"><svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16m-7-3h2a1 1 0 011 1v2h-8V5a1 1 0 011-1h2" /></svg></button>
                </div>
                <PriceDisplay product={item} compact className="mt-2" />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatUnit(item.unidad, item.qty) || `Cantidad: ${formatQuantity(item.qty)} · unidad por confirmar`}</p>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <button type="button" onClick={() => updateQty(item.id, item.qty - 1)} disabled={checking} aria-label={`Reducir cantidad de ${name}`} className="flex h-11 w-11 items-center justify-center text-lg text-gray-600 hover:text-brand-red disabled:opacity-40 dark:text-gray-300">−</button>
                    <span className="min-w-6 px-1 text-center text-sm font-bold text-gray-900 dark:text-white">{formatQuantity(item.qty)}</span>
                    <button type="button" onClick={() => updateQty(item.id, pending ? normalizeQuantity(item.qty + 1) : Math.min(available, normalizeQuantity(item.qty + 1)))} disabled={checking || (!pending && item.qty >= available)} aria-label={`Aumentar cantidad de ${name}`} className="flex h-11 w-11 items-center justify-center text-lg text-gray-600 hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300">+</button>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length > 0 && <details className="rounded-xl border border-gray-200 p-3 dark:border-gray-700"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-gray-700 dark:text-gray-200">Datos para la cotización (opcional)</summary><div className="mt-2 space-y-3">
            <label className="block text-xs text-gray-600 dark:text-gray-300" htmlFor="quote-name">Nombre<input id="quote-name" autoComplete="name" maxLength={80} value={customer.name ?? ""} onChange={(event) => changeCustomer("name", event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white" /></label>
            <label className="block text-xs text-gray-600 dark:text-gray-300" htmlFor="quote-company">Empresa<input id="quote-company" autoComplete="organization" maxLength={120} value={customer.company ?? ""} onChange={(event) => changeCustomer("company", event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white" /></label>
            <label className="block text-xs text-gray-600 dark:text-gray-300" htmlFor="quote-nit">NIT<input id="quote-nit" autoComplete="off" maxLength={30} value={customer.nit ?? ""} onChange={(event) => changeCustomer("nit", event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white" /></label>
            <p className="text-xs text-gray-500 dark:text-gray-400">Se incluirán en el mensaje que revisas antes de enviarlo.</p>
          </div></details>}
        </div>
        {items.length > 0 && <div className="shrink-0 space-y-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <dl className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
            <div className="flex justify-between gap-3"><dt>Subtotal sin IVA{totals.pendingPrices > 0 ? " (parcial)" : ""}</dt><dd className="font-semibold">{totals.pendingPrices === items.length ? "Por confirmar" : formatCOP(totals.subtotal)}</dd></div>
            <div className="flex justify-between gap-3"><dt>IVA{pendingTotals ? " (parcial)" : ""}</dt><dd className="font-semibold">{pendingTotals && totals.tax === 0 ? "Por confirmar" : formatCOP(totals.tax)}</dd></div>
            <div className="flex justify-between gap-3 text-base font-extrabold text-gray-900 dark:text-white"><dt>Total estimado</dt><dd>{pendingTotals ? "Por confirmar" : formatCOP(totals.total)}</dd></div>
          </dl>
          <p className="text-xs text-gray-500 dark:text-gray-400">{pendingTotals ? "Hay precios o impuestos pendientes. " : ""}{pendingAvailability ? "Disponibilidad pendiente en algunas referencias. " : ""}El asesor confirma envío y cotización final.</p>
          {preparedUrl ? <a ref={preparedLinkRef} href={preparedUrl} target="_blank" rel="noopener noreferrer" className="btn-wa min-h-11 w-full justify-center px-3 py-3 text-sm font-bold">Enviar cotización por WhatsApp</a> : <button type="button" onClick={() => void validate(true)} disabled={checking} className="btn-wa min-h-11 w-full justify-center px-3 py-3 text-sm font-bold disabled:cursor-wait disabled:opacity-50">{checking ? "Actualizando cotización…" : "Preparar cotización"}</button>}
          <button type="button" onClick={clearCart} disabled={checking} className="min-h-11 w-full rounded-lg text-xs text-gray-500 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-gray-800">Vaciar cotización</button>
        </div>}
      </div>
    </div>
  );
}

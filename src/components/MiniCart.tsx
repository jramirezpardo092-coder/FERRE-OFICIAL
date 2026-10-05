"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCart, removeFromCart, updateQty, clearCart, subscribeCart, revalidateCart } from "@/lib/cart-store";
import { formatCOP, getQuotationTotals, getAvailableQuantity, normalizeQuantity, formatQuantity } from "@/lib/utils";
import type { CartItem } from "@/lib/types";
import { useDialog } from "@/lib/useDialog";
import { normalizeProductName, displayBrand, formatUnit } from "@/lib/catalog/normalize";
import { buildQuoteWhatsAppUrl, isQuoteAvailabilityPending, type QuoteCustomer } from "@/lib/quote-presentation";
import PriceDisplay from "./catalog/PriceDisplay";
import ParditoPortrait from "./catalog/ParditoPortrait";

/** Miniatura de la foto aprobada; no incorpora el JSON del catálogo al cliente. */
function QuoteThumbnail({ item }: { item: CartItem }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const candidate = item.img;
  const src = typeof candidate === "string" && !candidate.startsWith("//") && !candidate.split("/").includes("..") && /^\/?[a-zA-Z0-9][a-zA-Z0-9/_. -]*\.(avif|webp|png|jpe?g)$/i.test(candidate)
    ? `/${candidate.replace(/^\//, "")}` : null;
  return <span className={src && failedSource !== src ? "quote-thumb" : "quote-thumb quote-thumb--empty"} aria-hidden="true">
    {src && failedSource !== src ? <Image src={src} alt="" width={48} height={48} quality={75} sizes="48px" loading="lazy" className="quote-thumb-image" onError={() => setFailedSource(src)} /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth={1.5} strokeLinejoin="round" d="M3 7h18v14H3zM8 7V3h8v4M3 12h18M10 10h4v4h-4z" /></svg>}
  </span>;
}

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
    <div className="quote-layer">
      <div className="quote-overlay" onClick={() => setIsOpen(false)} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cart-title" tabIndex={-1} className="quote-panel" data-design-quote>
        <div className="quote-head">
          <h2 id="cart-title" className="quote-title font-display">Cotización <span className="quote-count font-mono">{items.length}</span></h2>
          <button type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar cotización" className="quote-icon-button"><span aria-hidden="true">✕</span></button>
        </div>
        <div className="quote-body">
          <div role="status" aria-live="polite" className="quote-status">
            {checking ? "Actualizando precios y disponibilidad…" : checked ? "Cotización comprobada con el catálogo vigente." : null}
            {changes.length > 0 && <ul className="quote-notice">{changes.map((change) => <li key={change}>{change}</li>)}</ul>}
          </div>
          {validationError && <div role="alert" className="quote-notice quote-error"><p>{validationError}</p><button type="button" onClick={() => void validate()} className="quote-text-button">Reintentar actualización</button></div>}
          {items.length === 0 ? <div className="quote-empty">
            <ParditoPortrait decorative sizes="180px" className="h-[180px] w-[180px]" />
            <svg className="quote-empty-accent" aria-hidden="true" width="44" height="28" viewBox="0 0 44 28" fill="none" stroke="currentColor"><path strokeWidth={1.5} d="M2 26 16 2M15 26 29 2M28 26 42 2" /></svg>
            <p className="quote-empty-title font-display">Tu cotización está vacía</p><p>Agrega productos del catálogo</p>
            <Link href="/catalogo" onClick={() => setIsOpen(false)} className="quote-button quote-prepare">Ver catálogo</Link>
          </div> : items.map((item) => {
            const name = normalizeProductName(item.nombre);
            const brand = displayBrand(item.brand);
            const available = getAvailableQuantity(item);
            const pending = isQuoteAvailabilityPending(item);
            return (
              <div key={item.id} className="quote-line" data-quote-sku={item.id}>
                <div className="quote-line-head">
                  <QuoteThumbnail item={item} />
                  <div className="quote-line-description">
                    {brand && <p className="quote-line-brand">{brand}</p>}
                    <h3 className="quote-line-name">{name}</h3>
                    <p className="quote-line-sku font-mono">SKU {item.id} · Ref. {item.ref || item.sku || item.id}</p>
                    {pending && <p className="quote-line-pending">Disponibilidad a confirmar</p>}
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.id)} disabled={checking} aria-label={`Eliminar ${name} de la cotización`} className="quote-icon-button"><svg aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16m-7-3h2a1 1 0 011 1v2h-8V5a1 1 0 011-1h2" /></svg></button>
                </div>
                <PriceDisplay product={item} compact className="quote-line-price" principalClassName="quote-line-number font-display tabular-nums" />
                <div className="quote-line-quantity">
                  <p className="font-mono">{formatUnit(item.unidad, item.qty) || `Cantidad: ${formatQuantity(item.qty)} · unidad por confirmar`}</p>
                  <div className="quote-stepper">
                    <button type="button" onClick={() => updateQty(item.id, item.qty - 1)} disabled={checking} aria-label={`Reducir cantidad de ${name}`}>−</button>
                    <span className="font-mono tabular-nums">{formatQuantity(item.qty)}</span>
                    <button type="button" onClick={() => updateQty(item.id, pending ? normalizeQuantity(item.qty + 1) : Math.min(available, normalizeQuantity(item.qty + 1)))} disabled={checking || (!pending && item.qty >= available)} aria-label={`Aumentar cantidad de ${name}`}>+</button>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length > 0 && <details className="quote-customer"><summary>Datos para la cotización (opcional)</summary><div className="quote-customer-fields">
            <label htmlFor="quote-name">Nombre<input id="quote-name" autoComplete="name" maxLength={80} value={customer.name ?? ""} onChange={(event) => changeCustomer("name", event.target.value)} /></label>
            <label htmlFor="quote-company">Empresa<input id="quote-company" autoComplete="organization" maxLength={120} value={customer.company ?? ""} onChange={(event) => changeCustomer("company", event.target.value)} /></label>
            <label htmlFor="quote-nit">NIT<input id="quote-nit" autoComplete="off" maxLength={30} value={customer.nit ?? ""} onChange={(event) => changeCustomer("nit", event.target.value)} /></label>
            <p>Se incluirán en el mensaje que revisas antes de enviarlo.</p>
          </div></details>}
        </div>
        {items.length > 0 && <div className="quote-foot">
          <table className="quote-totals"><caption className="sr-only">Totales de la cotización</caption><tbody>
            <tr><th scope="row">Subtotal sin IVA{totals.pendingPrices > 0 ? " (parcial)" : ""}</th><td className="tabular-nums">{totals.pendingPrices === items.length ? "Por confirmar" : formatCOP(totals.subtotal)}</td></tr>
            <tr><th scope="row">IVA{pendingTotals ? " (parcial)" : ""}</th><td className="tabular-nums">{pendingTotals && totals.tax === 0 ? "Por confirmar" : formatCOP(totals.tax)}</td></tr>
            <tr className="quote-total"><th scope="row">Total estimado</th><td className="font-display tabular-nums" data-quote-total>{pendingTotals ? "Por confirmar" : formatCOP(totals.total)}</td></tr>
          </tbody></table>
          <p className="quote-foot-note">{pendingTotals ? "Hay precios o impuestos pendientes. " : ""}{pendingAvailability ? "Disponibilidad pendiente en algunas referencias. " : ""}El asesor confirma envío y cotización final.</p>
          {preparedUrl ? <a ref={preparedLinkRef} href={preparedUrl} target="_blank" rel="noopener noreferrer" className="quote-button quote-whatsapp" data-quote-final-action>Enviar cotización por WhatsApp</a> : <button type="button" onClick={() => void validate(true)} disabled={checking} className="quote-button quote-prepare">{checking ? "Actualizando cotización…" : "Preparar cotización"}</button>}
          <button type="button" onClick={clearCart} disabled={checking} className="quote-button quote-clear">Vaciar cotización</button>
        </div>}
      </div>
    </div>
  );
}

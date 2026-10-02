"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getCart,
  removeFromCart,
  updateQty,
  clearCart,
  subscribeCart,
  revalidateCart,
} from "@/lib/cart-store";
import { formatCOP, buildWhatsAppUrl, hasVerifiedPrice, formatTaxLabel, getQuotationTotals, getAvailableQuantity, normalizeQuantity, formatQuantity } from "@/lib/utils";
import { CartItem } from "@/lib/types";
import { useDialog } from "@/lib/useDialog";

export default function MiniCart() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const count = items.length;
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);
  const [validationError, setValidationError] = useState("");
  const [preparedUrl, setPreparedUrl] = useState<string | null>(null);
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
      setChanges((previous) => [...new Set([...previous, ...result.changes])]);
      setChecked(true);
      if (prepare && result.items.length > 0) setPreparedUrl(buildWhatsAppUrl(result.items));
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
    const unsub = subscribeCart(refresh);
    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleAdded = () => setIsOpen(true);
    window.addEventListener("toggle-cart", handleToggle);
    window.addEventListener("cart-added", handleAdded);
    return () => {
      unsub();
      window.removeEventListener("toggle-cart", handleToggle);
      window.removeEventListener("cart-added", handleAdded);
    };
  }, [refresh]);

  if (!isOpen) return null;
  const totals = getQuotationTotals(items);

  return (
    <div className="fixed inset-0 z-[90]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      {/* Drawer */}
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cart-title" tabIndex={-1} className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl animate-slide-in-right flex flex-col outline-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 id="cart-title" className="font-extrabold text-lg text-gray-900 dark:text-white">
            Tu pedido
            {count > 0 && (
              <span className="ml-2 text-xs font-bold bg-brand-red text-white px-2 py-0.5 rounded-full">
                {formatQuantity(count)}
              </span>
            )}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar pedido"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div role="status" aria-live="polite" className="text-xs text-gray-600 dark:text-gray-300">
            {checking ? "Actualizando precios y disponibilidad…" : checked ? "Pedido comprobado con el catálogo vigente." : null}
            {changes.length > 0 && (
              <ul className="mt-2 space-y-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-3">
                {changes.map((change) => <li key={change}>{change}</li>)}
              </ul>
            )}
          </div>
          {validationError && (
            <div role="alert" className="text-sm rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3">
              <p>{validationError}</p>
              <button onClick={() => void validate()} className="font-bold underline mt-2">Reintentar actualización</button>
            </div>
          )}
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <p className="font-medium">Tu pedido está vacío</p>
              <p className="text-sm mt-1">Agrega productos del catálogo</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-brand-red uppercase">{item.brand}</div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.nombre}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ref. {item.ref || item.sku || item.id} · {item.unidad}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold">{hasVerifiedPrice(item) ? formatCOP(item.precio) : "Precio por confirmar"}</span>
                    {hasVerifiedPrice(item) && <span className="text-[10px] text-amber-600 dark:text-amber-400">{formatTaxLabel(item)}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    disabled={checking}
                    aria-label={`Eliminar ${item.nombre} del pedido`}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      disabled={checking}
                      aria-label={`Reducir cantidad de ${item.nombre}`}
                      className="w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-brand-red"
                    >−</button>
                    <span className="min-w-6 px-1 text-center text-sm font-bold">{formatQuantity(item.qty)}</span>
                    <button
                      onClick={() => updateQty(item.id, Math.min(getAvailableQuantity(item), normalizeQuantity(item.qty + 1)))}
                      disabled={checking || item.qty >= getAvailableQuantity(item)}
                      aria-label={`Aumentar cantidad de ${item.nombre}`}
                      className="w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-brand-red disabled:opacity-40 disabled:cursor-not-allowed"
                    >+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal sin IVA ({items.length} {items.length === 1 ? "referencia" : "referencias"})</span>
              <span className="text-xl font-extrabold">{totals.pendingPrices === items.length ? "Por confirmar" : formatCOP(totals.subtotal)}</span>
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 text-center">
              {totals.pendingPrices > 0 ? `${totals.pendingPrices} ${totals.pendingPrices === 1 ? "referencia con precio por confirmar" : "referencias con precio por confirmar"}. Subtotal parcial.`
                : totals.pendingTaxes > 0 ? "Impuesto pendiente de confirmar con el asesor."
                  : `IVA: ${formatCOP(totals.tax)} · Total estimado: ${formatCOP(totals.total)}`}
              <p className="mt-1">El asesor confirma el envío y la cotización final.</p>
            </div>
            {preparedUrl ? (
            <a
              ref={preparedLinkRef}
              href={preparedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa w-full justify-center py-3.5 text-sm font-bold"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Abrir cotización en WhatsApp
            </a>
            ) : (
              <button
                onClick={() => void validate(true)}
                disabled={checking}
                className="btn-wa w-full justify-center py-3.5 text-sm font-bold disabled:opacity-50 disabled:cursor-wait"
              >
                {checking ? "Actualizando pedido…" : "Actualizar y preparar cotización"}
              </button>
            )}
            {preparedUrl && <p className="text-xs text-center text-gray-500 dark:text-gray-400">Revisa el pedido actualizado y continúa a WhatsApp.</p>}
            <button
              onClick={clearCart}
              disabled={checking}
              className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1"
            >
              Vaciar pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

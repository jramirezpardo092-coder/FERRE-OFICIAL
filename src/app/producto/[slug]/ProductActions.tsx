"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { buildWhatsAppUrl, getAvailableQuantity, allowsFractionalQuantity, normalizeQuantity, formatQuantity } from "@/lib/utils";
import { addToCart } from "@/lib/cart-store";

export default function ProductActions({ product }: { product: Product }) {
  const available = getAvailableQuantity(product);
  const fractional = allowsFractionalQuantity(product);
  const initialQty = available > 0 ? Math.min(1, available) : 1;
  const [qty, setQty] = useState(initialQty);
  const [quantityDraft, setQuantityDraft] = useState(String(initialQty));
  const [feedback, setFeedback] = useState("");
  const inStock = available > 0;
  const normalizedDraft = normalizeQuantity(Number(quantityDraft));
  const validQuantity = !fractional || (Number.isFinite(normalizedDraft) && normalizedDraft > 0 && (!inStock || normalizedDraft <= available));
  const setQuantity = (quantity: number) => {
    const next = normalizeQuantity(quantity);
    setQty(next);
    setQuantityDraft(String(next));
  };

  const handleAdd = () => {
    setFeedback(addToCart(product, qty)
      ? "Producto agregado al pedido."
      : "La cantidad supera las unidades disponibles. Revisa tu pedido o consulta por WhatsApp.");
  };

  return (
    <div className="space-y-4">
      {/* Quantity */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Cantidad:</span>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setQuantity(Math.max(initialQty, qty - 1))}
            className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors font-bold"
            aria-label="Reducir cantidad"
            disabled={qty <= initialQty}
          >
            -
          </button>
          {fractional ? (
            <input
              type="number"
              inputMode="decimal"
              min="0.000001"
              max={inStock ? available : undefined}
              step="any"
              value={quantityDraft}
              aria-label={`Cantidad en ${product.unidad}`}
              aria-invalid={!validQuantity}
              className="w-24 px-2 py-2.5 text-sm font-bold text-gray-900 dark:text-gray-100 dark:bg-gray-900 text-center border-x border-gray-200"
              onChange={(event) => {
                setQuantityDraft(event.target.value);
                const quantity = normalizeQuantity(Number(event.target.value));
                if (Number.isFinite(quantity) && quantity > 0 && (!inStock || quantity <= available)) setQty(quantity);
              }}
            />
          ) : (
            <span className="px-5 py-2.5 text-sm font-bold text-gray-900 dark:text-gray-100 min-w-[3rem] text-center border-x border-gray-200">
              {formatQuantity(qty)}
            </span>
          )}
          <button
            onClick={() => setQuantity(Math.min(Math.max(initialQty, available), qty + 1))}
            disabled={qty >= Math.max(initialQty, available)}
            className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>
      </div>
      {fractional && !validQuantity && <p role="status" className="text-sm text-amber-700 dark:text-amber-400">{inStock ? `Ingresa una cantidad mayor que cero y hasta ${formatQuantity(available)} ${product.unidad}.` : `Ingresa una cantidad positiva en ${product.unidad} para consultar.`}</p>}

      {/* WhatsApp CTA */}
      <a
        href={validQuantity ? buildWhatsAppUrl([{ ...product, qty }]) : undefined}
        aria-disabled={!validQuantity}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white font-bold py-4 rounded-2xl hover:bg-[#1da851] transition-all text-base shadow-lg hover:shadow-xl active:scale-[0.98]"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Cotizar por WhatsApp
      </a>

      {/* Add to cart */}
      <button
        onClick={handleAdd}
        disabled={!inStock || !validQuantity}
        className="w-full flex items-center justify-center gap-2 bg-brand-red text-white font-bold py-3.5 rounded-2xl hover:bg-brand-red-dark transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        {inStock ? "Agregar a lista de cotización" : "Consulta disponibilidad por WhatsApp"}
      </button>
      <p role="status" className="text-sm text-amber-700 dark:text-amber-400">{feedback}</p>
    </div>
  );
}

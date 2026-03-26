"use client";

import { useState, useEffect } from "react";
import {
  getCart,
  getCartCount,
  getCartTotal,
  removeFromCart,
  updateQty,
  clearCart,
  subscribeCart,
} from "@/lib/cart-store";
import { formatCOP, buildWhatsAppUrl } from "@/lib/utils";
import { CartItem } from "@/lib/types";

export default function MiniCart() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);

  const refresh = () => {
    setItems(getCart());
    setCount(getCartCount());
    setTotal(getCartTotal());
  };

  useEffect(() => {
    refresh();
    const unsub = subscribeCart(() => {
      refresh();
      if (getCartCount() > 0) setIsOpen(true);
    });
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggle-cart", handleToggle);
    return () => {
      unsub();
      window.removeEventListener("toggle-cart", handleToggle);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-extrabold text-lg text-gray-900">
            Tu pedido
            {count > 0 && (
              <span className="ml-2 text-xs font-bold bg-brand-green text-white px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
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
              <div key={item.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-brand-green uppercase">{item.brand}</div>
                  <h4 className="text-sm font-semibold text-gray-800 truncate">{item.nombre}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold">{formatCOP(item.precio)}</span>
                    <span className="text-[10px] text-amber-600">+ IVA</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-brand-green"
                    >−</button>
                    <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-brand-green"
                    >+</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Subtotal ({count} productos)</span>
              <span className="text-xl font-extrabold">{formatCOP(total)}</span>
            </div>
            <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 text-center">
              Precios no incluyen IVA
            </div>
            <a
              href={buildWhatsAppUrl(items)}
              target="_blank"
              rel="noreferrer"
              className="btn-wa w-full justify-center py-3.5 text-sm font-bold"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Ver pedido y cotizar todo por WhatsApp
            </a>
            <button
              onClick={clearCart}
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

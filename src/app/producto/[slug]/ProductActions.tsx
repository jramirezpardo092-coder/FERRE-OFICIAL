"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { formatCOP } from "@/lib/utils";
import { addToCart } from "@/lib/cart-store";

export default function ProductActions({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);

  const handleWhatsApp = () => {
    const msg = `Hola! Estoy interesado en:\n• ${product.nombre}\n• Ref: ${product.id}\n• Precio: ${formatCOP(product.precio)} + IVA / ${product.unidad}\n• Cantidad: ${qty}\n\n¿Podrían confirmar disponibilidad y tiempo de entrega? Gracias.`;
    window.open(`https://wa.me/573118486132?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addToCart(product);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quantity */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Cantidad:</span>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors font-bold"
            aria-label="Reducir cantidad"
          >
            -
          </button>
          <span className="px-5 py-2.5 text-sm font-bold text-gray-900 min-w-[3rem] text-center border-x border-gray-200">
            {qty}
          </span>
          <button
            onClick={() => setQty(qty + 1)}
            className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors font-bold"
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>
      </div>

      {/* WhatsApp CTA */}
      <button
        onClick={handleWhatsApp}
        className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white font-bold py-4 rounded-2xl hover:bg-[#1da851] transition-all text-base shadow-lg hover:shadow-xl active:scale-[0.98]"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Cotizar por WhatsApp
      </button>

      {/* Add to cart */}
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-2 bg-brand-red text-white font-bold py-3.5 rounded-2xl hover:bg-brand-red-dark transition-all active:scale-[0.98]"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        Agregar a lista de cotización
      </button>
    </div>
  );
}

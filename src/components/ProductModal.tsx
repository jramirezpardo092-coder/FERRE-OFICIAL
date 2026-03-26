"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Product } from "@/lib/types";
import { formatCOP, getProductImage, getDiscountPercent } from "@/lib/utils";
import { addToCart } from "@/lib/cart-store";

interface Props {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: Props) {
  useEffect(() => {
    if (product) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!product) return null;

  const discount = getDiscountPercent(product);
  const inStock = product.stock > 0;

  const handleWA = () => {
    const msg = `Hola, quiero cotizar:\n• ${product.nombre}\n• Ref: ${product.id}\n• Precio web: ${formatCOP(product.precio)} + IVA\n\n¿Está disponible?`;
    window.open(`https://wa.me/573118486132?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="md:flex">
          {/* Image */}
          <div className="md:w-1/2 bg-gray-50 p-6 flex items-center justify-center min-h-[280px]">
            {product.img ? (
              <Image
                src={getProductImage(product)}
                alt={product.nombre}
                width={400}
                height={400}
                className="object-contain max-h-[300px]"
              />
            ) : (
              <div className="text-gray-300">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="md:w-1/2 p-6">
            <div className="text-xs font-bold text-brand-green uppercase tracking-wider mb-1">
              {product.brand} · Ref {product.id}
            </div>

            <h2 className="text-xl font-extrabold text-gray-900 mb-3">{product.nombre}</h2>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                {product.cat}
              </span>
              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                {product.unidad}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${inStock ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                {inStock ? `✓ ${product.stock} disponibles` : "⏳ Consultar disponibilidad"}
              </span>
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-gray-900">
                  {formatCOP(product.precio)}
                </span>
                <span className="text-sm text-amber-600 font-medium">+ IVA</span>
              </div>
              {product.original && product.original > product.precio && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-400 line-through">{formatCOP(product.original)}</span>
                  <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                    Ahorras {discount}%
                  </span>
                </div>
              )}
              <div className="text-xs text-gray-400 mt-2">Precio sin IVA incluido</div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => { addToCart(product); onClose(); }}
                className="w-full btn-primary justify-center py-3 text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar al pedido
              </button>
              <button
                onClick={handleWA}
                className="w-full btn-wa justify-center py-3 text-sm"
              >
                Cotizar por WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

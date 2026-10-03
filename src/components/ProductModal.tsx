"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatCOP, getDiscountPercent, buildWhatsAppUrl, hasVerifiedPrice, formatTaxLabel, getUnitPriceWithTax, getAvailableQuantity, formatQuantity, cn } from "@/lib/utils";
import { addToCart } from "@/lib/cart-store";
import { useDialog } from "@/lib/useDialog";
import ProductMedia from "./catalog/ProductMedia";
import ProductSpecs from "./catalog/ProductSpecs";

interface Props {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState("");
  useDialog(!!product, dialogRef, onClose);
  useEffect(() => setFeedback(""), [product?.id]);

  if (!product) return null;

  const available = getAvailableQuantity(product);
  const inStock = available > 0;
  const verifiedPrice = hasVerifiedPrice(product);
  const rawDiscount = verifiedPrice && typeof product.original === "number" && Number.isFinite(product.original) && product.original > product.precio
    ? getDiscountPercent(product) : null;
  const discount = rawDiscount && rawDiscount > 0 ? rawDiscount : null;
  const priceWithTax = getUnitPriceWithTax(product);
  const hasUnit = !!product.unidad.trim() && product.unidad.toLowerCase().trim() !== "consultar unidad";

  const handleAdd = () => {
    if (addToCart(product)) {
      onClose();
    } else {
      setFeedback("Ya agregaste toda la cantidad disponible de este producto.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        tabIndex={-1}
        className="relative bg-white dark:bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up motion-reduce:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button type="button" onClick={onClose} aria-label="Cerrar producto" className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm border border-gray-200 dark:border-gray-700">
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="md:flex">
          {/* Image */}
          <div className="md:w-1/2 shrink-0 relative">
            {discount && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg z-10 shadow-sm">
                -{discount}%
              </span>
            )}
            {/* El padre entrega el producto enriquecido; no se carga el catálogo entero en el modal. */}
            <ProductMedia product={product} showGalleryControls sizes="(max-width: 768px) 90vw, 384px" imageClassName="p-8 pb-14" />
          </div>

          {/* Details */}
          <div className="md:w-1/2 p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-brand-red dark:text-red-400 uppercase tracking-wider">
                {product.brand}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">SKU {product.id}</span>
            </div>

            <h2 id="product-modal-title" className="text-xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight">{product.nombre}</h2>
            {product.ref && product.ref !== product.id && <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Ref. {product.ref}</p>}

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg font-medium">
                {product.cat}
              </span>
              <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg font-medium">
                {product.unidad}
              </span>
              <span className={cn(
                "text-xs px-2.5 py-1 rounded-lg font-semibold",
                inStock ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900" : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900"
              )}>
                {inStock ? `${formatQuantity(available)} ${hasUnit ? `${product.unidad} disponibles` : "disponibles · unidad por confirmar"}` : "Consultar disponibilidad"}
              </span>
            </div>
            <ProductSpecs specs={product.specs} limit={6} />

            {/* Price block */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 my-4 border border-gray-100 dark:border-gray-700">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className={cn("font-extrabold text-gray-900 dark:text-white tracking-tight", verifiedPrice ? "text-3xl" : "text-xl")}>
                  {verifiedPrice ? formatCOP(product.precio) : "Precio por confirmar"}
                </span>
                <span className="text-sm text-amber-600 dark:text-amber-400 font-semibold">{formatTaxLabel(product)}</span>
              </div>
              {discount && product.original && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm text-gray-400 line-through">{formatCOP(product.original)}</span>
                  <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-md">
                    Ahorras {discount}%
                  </span>
                </div>
              )}
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">{verifiedPrice ? "Precio base sin IVA." : "El asesor confirma el precio vigente."} {priceWithTax !== null ? `Con IVA: ${formatCOP(priceWithTax)}` : product.taxRate === 0 || product.taxRate === 5 || product.taxRate === 19 ? "" : "Impuesto por confirmar."}</p>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              {inStock && <button
                type="button"
                onClick={handleAdd}
                className="w-full btn-primary justify-center py-3.5 text-sm rounded-xl shadow-md shadow-red-900/15"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar al pedido
              </button>}
              {feedback && <p role="status" className="text-xs text-amber-700 dark:text-amber-400">{feedback}</p>}
              <a
                href={buildWhatsAppUrl([{ ...product, qty: inStock ? Math.min(1, available) : 1 }])}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn-wa justify-center py-3.5 text-sm rounded-xl"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                {inStock ? "Cotizar por WhatsApp" : "Consultar disponibilidad"}
              </a>
              <Link
                href={`/producto/${encodeURIComponent(product.id)}`}
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Ver página completa
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

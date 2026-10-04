"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { getAvailableQuantity, cn } from "@/lib/utils";
import { addToCart } from "@/lib/cart-store";
import { useDialog } from "@/lib/useDialog";
import { normalizeProductName, displayBrand, formatUnit } from "@/lib/catalog/normalize";
import { getProductPath } from "@/lib/catalog/routes";
import { buildQuoteWhatsAppUrl, getStockLabel } from "@/lib/quote-presentation";
import ProductMedia from "./catalog/ProductMedia";
import ProductSpecs from "./catalog/ProductSpecs";
import PriceDisplay from "./catalog/PriceDisplay";

export default function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState("");
  useDialog(!!product, dialogRef, onClose);
  useEffect(() => setFeedback(""), [product?.id]);
  if (!product) return null;
  const available = getAvailableQuantity(product);
  const inStock = available > 0;
  const name = normalizeProductName(product.nombre);
  const brand = displayBrand(product.brand);
  const unit = formatUnit(product.unidad);
  const handleAdd = () => {
    if (addToCart(product)) onClose();
    else setFeedback("Ya agregaste toda la cantidad disponible. Revisa tu cotización.");
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="product-modal-title" tabIndex={-1} className="relative max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Cerrar producto" className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-600 shadow-sm hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-300">✕</button>
        <div className="md:flex">
          <div className="relative shrink-0 md:w-1/2"><ProductMedia product={product} showGalleryControls sizes="(max-width: 768px) 90vw, 384px" imageClassName="p-8 pb-14" /></div>
          <div className="p-5 md:w-1/2 md:p-6">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
              {brand && <span className="font-bold uppercase tracking-wide text-brand-red dark:text-red-400">{brand}</span>}
              <span className="font-mono text-gray-500 dark:text-gray-400">SKU {product.id}</span>
            </div>
            <h2 id="product-modal-title" className="mb-3 text-xl font-extrabold leading-tight text-gray-900 dark:text-white">{name}</h2>
            {product.ref && product.ref !== product.id && <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Ref. {product.ref}</p>}
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300">{product.cat}</span>
              {unit && <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-800 dark:text-gray-300">{unit}</span>}
              <span className={cn("rounded-lg px-2.5 py-1 text-[13px] font-medium", inStock ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300")}>{getStockLabel(product)}</span>
            </div>
            <ProductSpecs specs={product.specs} limit={6} />
            <PriceDisplay product={product} className="my-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800" principalClassName="text-3xl" />
            <div className="flex gap-2">
              <button type="button" onClick={handleAdd} className={cn("min-h-11 flex-1 rounded-xl px-4 py-3 text-sm font-bold", inStock ? "bg-brand-red text-white hover:bg-brand-red-dark" : "border border-brand-red text-brand-red hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-gray-800")} aria-label={`Agregar ${name} a cotización${inStock ? "" : ", disponibilidad a confirmar"}`}>{inStock ? "Agregar a cotización" : "Consultar disponibilidad"}</button>
              <a href={buildQuoteWhatsAppUrl([{ ...product, qty: inStock ? Math.min(1, available) : 1 }])} target="_blank" rel="noopener noreferrer" aria-label={`Consultar ${name} por WhatsApp`} title="Consultar por WhatsApp" className="flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h8m-8 4h5m8-2a8 8 0 01-8 8H5l-3 2v-7a8 8 0 1119-3z" /></svg>
              </a>
            </div>
            {feedback && <p role="status" className="mt-2 text-xs text-amber-700 dark:text-amber-400">{feedback}</p>}
            {!inStock && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Puedes incluirlo en la cotización. El asesor confirma disponibilidad.</p>}
            <Link href={getProductPath(product)} prefetch={false} onClick={onClose} className="mt-3 flex min-h-11 items-center justify-center rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">Ver página completa</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

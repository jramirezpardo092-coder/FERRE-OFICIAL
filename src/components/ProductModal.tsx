"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { getAvailableQuantity, formatQuantity, cn } from "@/lib/utils";
import { addToCart } from "@/lib/cart-store";
import { useQuoteQuantity } from "@/lib/useQuoteQuantity";
import { useDialog } from "@/lib/useDialog";
import { normalizeProductName, displayBrand, formatUnit } from "@/lib/catalog/normalize";
import { getProductPath } from "@/lib/catalog/routes";
import { buildQuoteWhatsAppUrl, getStockLabel } from "@/lib/quote-presentation";
import ProductMedia from "./catalog/ProductMedia";
import ProductSpecs from "./catalog/ProductSpecs";
import PriceDisplay from "./catalog/PriceDisplay";
import PricePreferenceToggle from "./catalog/PricePreferenceToggle";

export default function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState("");
  const quoteQuantity = useQuoteQuantity(product?.id ?? "");
  useDialog(!!product, dialogRef, onClose);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const isOpen = !!product;
  useEffect(() => {
    if (!isOpen) return;
    // A quick view must never retain its focus trap over an older catalog URL.
    const closeForHistory = () => closeRef.current();
    window.addEventListener("popstate", closeForHistory);
    return () => window.removeEventListener("popstate", closeForHistory);
  }, [isOpen]);
  useEffect(() => setFeedback(""), [product?.id]);
  if (!product) return null;
  const available = getAvailableQuantity(product);
  const inStock = available > 0;
  const name = normalizeProductName(product.nombre);
  const brand = displayBrand(product.brand);
  const unit = formatUnit(product.unidad);
  const actionLabel = quoteQuantity > 0 ? `En cotización · ${formatQuantity(quoteQuantity)}` : inStock ? "Agregar a cotización" : "Consultar disponibilidad";
  const handleAdd = () => {
    if (addToCart(product)) onClose();
    else setFeedback("Ya agregaste toda la cantidad disponible. Revisa tu cotización.");
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-overlay/60" />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="product-modal-title" tabIndex={-1} className="relative max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-card border border-line bg-surface" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Cerrar producto" className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-control border border-control bg-surface text-ink-2 hover:bg-paper">✕</button>
        <div className="md:flex">
          <div className="relative shrink-0 md:w-1/2"><ProductMedia product={product} showGalleryControls sizes="(max-width: 768px) 90vw, 384px" /></div>
          <div className="p-5 md:w-1/2 md:p-6">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
              {brand && <span className="font-semibold uppercase tracking-wide text-ink">{brand}</span>}
              <span className="font-mono text-ink-2">SKU {product.id}</span>
            </div>
            <h2 id="product-modal-title" className="mb-3 font-display text-[28px] font-bold leading-8 tracking-[-0.025em] text-ink">{name}</h2>
            {product.ref && product.ref !== product.id && <p className="mb-3 font-mono text-xs text-ink-2">Ref. {product.ref}</p>}
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <span className="text-ink-2">{product.cat}</span>
              {unit && <span className="font-mono text-ink-2">{unit}</span>}
              <span className="flex items-center gap-2 text-ink-2"><span aria-hidden="true" className={cn("h-2 w-2 rounded-full", !inStock ? "bg-muted" : available <= 3 ? "bg-warn" : "bg-ok")} />{getStockLabel(product)}</span>
            </div>
            <ProductSpecs specs={product.specs} limit={6} />
            <PricePreferenceToggle idPrefix="quick-product-price" className="mt-4" />
            <PriceDisplay product={product} className="my-4 border-y border-line py-4" principalClassName="text-[28px] leading-8" />
            <div className="flex gap-2">
              <button type="button" onClick={handleAdd} className="min-h-11 flex-1 rounded-control bg-brand px-4 py-3 text-sm font-semibold text-on-brand hover:bg-brand-press" aria-label={`${actionLabel}: ${name}${quoteQuantity > 0 ? ", agregar más a cotización" : ""}${inStock ? "" : ", se agrega a cotización con disponibilidad a confirmar"}`}>{quoteQuantity > 0 && <span aria-hidden="true">✓ </span>}{actionLabel}</button>
              <a href={buildQuoteWhatsAppUrl([{ ...product, qty: inStock ? Math.min(1, available) : 1 }])} target="_blank" rel="noopener noreferrer" aria-label={`Consultar ${name} por WhatsApp`} title="Consultar por WhatsApp" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-wa-edge bg-surface text-wa hover:border-ink">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h8m-8 4h5m8-2a8 8 0 01-8 8H5l-3 2v-7a8 8 0 1119-3z" /></svg>
              </a>
            </div>
            {feedback && <p role="status" className="mt-2 text-xs text-ink-2">{feedback}</p>}
            {!inStock && <p className="mt-2 text-xs text-ink-2">Puedes incluirlo en la cotización. El asesor confirma disponibilidad.</p>}
            <Link href={getProductPath(product)} prefetch={false} onClick={onClose} className="mt-3 flex min-h-11 items-center justify-center rounded-control border border-control px-3 text-sm font-semibold text-ink-2 hover:bg-paper">Ver página completa</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

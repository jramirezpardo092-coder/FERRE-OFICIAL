"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { getDiscountPercent, getAvailableQuantity, cn } from "@/lib/utils";
import { normalizeProductName, displayBrand, formatUnit } from "@/lib/catalog/normalize";
import { getProductPath } from "@/lib/catalog/routes";
import { addToCart } from "@/lib/cart-store";
import { buildQuoteWhatsAppUrl, getStockLabel } from "@/lib/quote-presentation";
import ProductMedia from "./catalog/ProductMedia";
import ProductSpecs from "./catalog/ProductSpecs";
import PriceDisplay from "./catalog/PriceDisplay";

interface Props {
  product: Product;
  onOpenModal?: (product: Product) => void;
  viewMode?: "responsive" | "grid" | "list";
}

export default function ProductCard({ product, onOpenModal, viewMode = "responsive" }: Props) {
  const [feedback, setFeedback] = useState("");
  const [mediaActive, setMediaActive] = useState(false);
  const isList = viewMode === "list";
  const responsive = viewMode === "responsive";
  const compact = isList || responsive;
  const stock = getAvailableQuantity(product);
  const inStock = stock > 0;
  const name = normalizeProductName(product.nombre);
  const brand = displayBrand(product.brand);
  const unit = formatUnit(product.unidad);
  const href = getProductPath(product);
  const discount = getDiscountPercent(product);
  useEffect(() => { setFeedback(""); setMediaActive(false); }, [product.id]);

  const openDetails = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onOpenModal || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpenModal(product);
  };
  const handleAdd = () => {
    setFeedback(addToCart(product) ? "" : "Ya agregaste toda la cantidad disponible. Revisa tu cotización.");
  };

  return (
    <article
      className={cn("group relative flex h-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:border-gray-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 motion-reduce:transition-none", isList ? "flex-row" : responsive ? "flex-row sm:flex-col" : "flex-col")}
      onPointerEnter={(event) => { if (event.pointerType !== "touch") setMediaActive(true); }}
      onPointerLeave={() => setMediaActive(false)}
      onFocusCapture={() => setMediaActive(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMediaActive(false); }}
    >
      <Link href={href} prefetch={false} onClick={openDetails} className={cn("relative block shrink-0 self-start", isList ? "ml-3 mt-3 w-[72px]" : responsive ? "ml-3 mt-3 w-[72px] sm:ml-0 sm:mt-0 sm:w-full" : "w-full")} aria-label={`Ver detalles de ${name}`}>
        <ProductMedia product={product} active={mediaActive} compact={compact} compactDesktop={isList} sizes={isList ? "72px" : "(max-width: 640px) 72px, (max-width: 1024px) 33vw, 280px"} />
        {!!discount && discount > 0 && <span className="absolute left-1 top-1 rounded-lg bg-brand-red px-1.5 py-1 text-xs font-bold text-white sm:left-3 sm:top-3">-{discount}%</span>}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {brand && <span className="font-bold uppercase tracking-wide text-brand-red dark:text-red-400">{brand}</span>}
          <span className="font-mono text-gray-500 dark:text-gray-400">SKU {product.id}</span>
        </div>
        <h3 className="text-sm font-semibold leading-snug text-gray-900 dark:text-white sm:min-h-[2.5rem]">
          <Link href={href} prefetch={false} onClick={openDetails} className="line-clamp-2 min-h-11 hover:text-brand-red dark:hover:text-red-400">{name}</Link>
        </h3>
        {product.ref && product.ref !== product.id && <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">Ref. {product.ref}</p>}
        <ProductSpecs specs={product.specs} limit={2} />
        <p className={cn("mt-2 text-[13px]", inStock ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>{getStockLabel(product)}</p>
        <div className="mt-auto pt-3">
          <PriceDisplay product={product} compact />
          {unit && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Por {unit}</p>}
          <div className="mt-3 flex items-stretch gap-2">
            <button type="button" onClick={handleAdd} className={cn("inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold transition-colors motion-reduce:transition-none", inStock ? "bg-brand-red text-white hover:bg-brand-red-dark" : "border border-brand-red text-brand-red hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-gray-800")} aria-label={`${inStock ? "Agregar a cotización" : "Consultar disponibilidad"}: ${name}${inStock ? "" : ", agregar con disponibilidad a confirmar"}`}>
              {inStock ? "Agregar a cotización" : "Consultar disponibilidad"}
            </button>
            <a href={buildQuoteWhatsAppUrl([{ ...product, qty: inStock ? Math.min(1, stock) : 1 }])} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950" aria-label={`Consultar ${name} por WhatsApp`} title="Consultar por WhatsApp">
              <svg className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h8m-8 4h5m8-2a8 8 0 01-8 8H5l-3 2v-7a8 8 0 1119-3z" /></svg>
            </a>
          </div>
          {feedback && <p role="status" className="mt-2 text-xs text-amber-700 dark:text-amber-400">{feedback}</p>}
        </div>
      </div>
    </article>
  );
}

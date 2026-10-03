"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import {
  formatCOP, getDiscountPercent, hasVerifiedPrice, formatTaxLabel,
  getAvailableQuantity, formatQuantity, buildWhatsAppUrl, cn,
} from "@/lib/utils";
import { addToCart } from "@/lib/cart-store";
import ProductMedia from "./catalog/ProductMedia";
import ProductSpecs from "./catalog/ProductSpecs";

const PlusIcon = () => (
  <svg className="h-4 w-4 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
const MessageIcon = () => (
  <svg className="h-4 w-4 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h8m-8 4h5m8-2a8 8 0 01-8 8H5l-3 2v-7a8 8 0 1119-3z" />
  </svg>
);

interface Props {
  product: Product;
  onOpenModal?: (product: Product) => void;
  viewMode?: "grid" | "list";
}

export default function ProductCard({ product, onOpenModal, viewMode = "grid" }: Props) {
  const [feedback, setFeedback] = useState("");
  const [mediaActive, setMediaActive] = useState(false);
  const isList = viewMode === "list";
  const priceConfirmed = hasVerifiedPrice(product);
  const rawDiscount = priceConfirmed && typeof product.original === "number" && Number.isFinite(product.original) && product.original > product.precio
    ? getDiscountPercent(product) : null;
  const discount = rawDiscount && rawDiscount > 0 ? rawDiscount : null;
  const stock = getAvailableQuantity(product);
  const inStock = stock > 0;
  const hasUnit = !!product.unidad.trim() && product.unidad.toLowerCase().trim() !== "consultar unidad";
  const stockLabel = `${formatQuantity(stock)} ${hasUnit ? product.unidad : "disponibles"}`;
  const priceLabel = priceConfirmed ? formatCOP(product.precio) : "Precio por confirmar";
  const href = `/producto/${encodeURIComponent(product.id)}`;
  const brand = product.brand && product.brand !== "Sin marca" ? product.brand : null;
  const originalPrice = priceConfirmed && Number.isFinite(product.original) && product.original! > product.precio
    ? product.original : null;

  useEffect(() => { setFeedback(""); setMediaActive(false); }, [product.id]);

  const openDetails = (event: MouseEvent<HTMLAnchorElement>) => {
    // El enlace conserva la ficha para abrir otra pestaña; el clic normal permite vista rápida.
    if (!onOpenModal || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpenModal(product);
  };
  const handleAdd = () => {
    setFeedback(addToCart(product) ? "Agregado al pedido" : "Ya agregaste toda la cantidad disponible");
  };
  const handleQuote = () => {
    // El cálculo compartido conserva IVA, precio pendiente y unidades fraccionarias.
    const qty = inStock ? Math.min(1, stock) : 1;
    window.open(buildWhatsAppUrl([{ ...product, qty }]), "_blank", "noopener,noreferrer");
  };

  return (
    <article
      className={cn(
        "group relative flex h-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow duration-200 hover:border-gray-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 motion-reduce:transition-none",
        isList ? "flex-col sm:flex-row" : "flex-col",
      )}
      onPointerEnter={(event) => { if (event.pointerType !== "touch") setMediaActive(true); }}
      onPointerLeave={() => setMediaActive(false)}
      onFocusCapture={() => setMediaActive(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMediaActive(false); }}
    >
      <Link
        href={href}
        onClick={openDetails}
        className={cn("relative block shrink-0", isList ? "w-full sm:w-44 lg:w-52" : "w-full")}
        aria-label={`Ver detalles de ${product.nombre}`}
      >
        <ProductMedia
          product={product}
          active={mediaActive}
          sizes={isList ? "(max-width: 640px) 90vw, 208px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
        />
        {discount !== null && (
          <span className="absolute left-3 top-3 rounded-lg bg-brand-red px-2 py-1 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
      </Link>

      <div className={cn("flex min-w-0 flex-1 flex-col p-4", isList && "sm:p-5")}>
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
            {brand && <span className="font-bold uppercase tracking-wide text-brand-red dark:text-red-400">{brand}</span>}
            <span className="font-mono text-gray-500 dark:text-gray-400">SKU {product.id}</span>
          </div>
          <h3 className={cn("font-semibold leading-snug text-gray-900 dark:text-white", isList ? "text-base" : "min-h-[2.5rem] text-sm")}>
            <Link href={href} onClick={openDetails} className="line-clamp-2 hover:text-brand-red dark:hover:text-red-400">
              {product.nombre}
            </Link>
          </h3>
          {product.ref && product.ref !== product.id && (
            <p className="mt-1 break-words text-[11px] text-gray-500 dark:text-gray-400">Ref. {product.ref}</p>
          )}
          <ProductSpecs specs={product.specs} limit={2} />
          <p className={cn("mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed", inStock ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
            <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", inStock ? "bg-emerald-500" : "bg-amber-500")} aria-hidden="true" />
            {inStock ? stockLabel : "Consultar disponibilidad"}
          </p>
        </div>

        <div className="mt-auto pt-4">
          {originalPrice !== null && originalPrice !== undefined && (
            <p className="mb-1 text-xs text-gray-500 line-through dark:text-gray-400">{formatCOP(originalPrice)}</p>
          )}
          <p className={cn("font-extrabold tracking-tight text-gray-900 dark:text-white", priceConfirmed ? "text-xl" : "text-sm")}>
            {priceLabel}
          </p>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {formatTaxLabel(product)}{hasUnit ? ` / ${product.unidad}` : " · unidad por confirmar"}
          </p>
          {priceConfirmed && <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">Precio base sin IVA</p>}

          <div className={cn("mt-4 flex flex-col gap-2", isList && "sm:flex-row sm:flex-wrap")}>
            <button
              type="button"
              onClick={inStock ? handleAdd : handleQuote}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand-red px-3 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-red-dark motion-reduce:transition-none"
              aria-label={inStock ? `Agregar ${product.nombre} al pedido` : `Consultar disponibilidad de ${product.nombre} por WhatsApp`}
            >
              {inStock ? <PlusIcon /> : <MessageIcon />}
              {inStock ? "Agregar al pedido" : "Consultar disponibilidad"}
            </button>
            {inStock && (
              <button
                type="button"
                onClick={handleQuote}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950 motion-reduce:transition-none"
                aria-label={`Cotizar ${product.nombre} por WhatsApp`}
              >
                <MessageIcon /> Cotizar por WhatsApp
              </button>
            )}
          </div>
          {feedback && <p role="status" className="mt-2 text-xs text-gray-600 dark:text-gray-300">{feedback}</p>}
        </div>
      </div>
    </article>
  );
}

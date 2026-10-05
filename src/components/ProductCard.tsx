"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { getDiscountPercent, getAvailableQuantity, formatQuantity, cn } from "@/lib/utils";
import { normalizeProductName, displayBrand, formatUnit } from "@/lib/catalog/normalize";
import { getProductPath } from "@/lib/catalog/routes";
import { addToCart } from "@/lib/cart-store";
import { useQuoteQuantity } from "@/lib/useQuoteQuantity";
import { buildQuoteWhatsAppUrl, getStockLabel } from "@/lib/quote-presentation";
import ProductMedia from "./catalog/ProductMedia";
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
  const stock = getAvailableQuantity(product);
  const inStock = stock > 0;
  const name = normalizeProductName(product.nombre);
  const brand = displayBrand(product.brand);
  const unit = formatUnit(product.unidad);
  const href = getProductPath(product);
  const discount = getDiscountPercent(product);
  const quoteQuantity = useQuoteQuantity(product.id);
  const added = quoteQuantity > 0;
  const quantityLabel = formatQuantity(quoteQuantity);
  const actionLabel = added ? `En cotización · ${quantityLabel}` : "Agregar a cotización";
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
      data-design-card
      data-sku={product.id}
      className={cn("product-card group relative flex h-full min-w-0 overflow-hidden rounded-card border border-line bg-surface", isList ? "product-card--list" : responsive ? "product-card--responsive" : "product-card--grid")}
      onPointerEnter={(event) => { if (event.pointerType !== "touch") setMediaActive(true); }}
      onPointerLeave={() => setMediaActive(false)}
      onFocusCapture={() => setMediaActive(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMediaActive(false); }}
    >
      <Link href={href} prefetch={false} onClick={openDetails} className="product-card-media relative block shrink-0 self-start">
        <ProductMedia product={product} active={mediaActive} cardLayout={viewMode} sizes={isList ? "88px" : responsive ? "(max-width: 639px) 88px, (max-width: 1024px) 50vw, 280px" : "(max-width: 639px) 50vw, (max-width: 1024px) 50vw, 280px"} />
        {!!discount && discount > 0 && <span className="absolute left-2 top-2 rounded-control border border-line bg-surface px-2 py-1 font-mono text-xs font-medium text-ink">-{discount}%</span>}
      </Link>
      <div className="product-card-body flex min-w-0 flex-1 flex-col">
        <div className="product-card-meta truncate text-xs leading-4" title={[brand, `SKU ${product.id}`, product.ref && product.ref !== product.id ? `Ref. ${product.ref}` : ""].filter(Boolean).join(" · ")}>
          {brand && <><span className="font-semibold uppercase text-ink">{brand}</span><span aria-hidden="true" className="text-ink-2"> · </span></>}
          <span className="font-mono tracking-[0.025em] text-ink-2">SKU {product.id}{product.ref && product.ref !== product.id ? ` · Ref. ${product.ref}` : ""}</span>
        </div>
        <h3 className="product-card-name font-semibold text-ink">
          <Link href={href} prefetch={false} onClick={openDetails} className="line-clamp-2 min-h-11 hover:text-brand-text">{name}</Link>
        </h3>
        <p className="product-stock mt-2 flex items-center gap-2 text-xs leading-4 text-ink-2"><span aria-hidden="true" className={cn("h-2 w-2 shrink-0 rounded-full", !inStock ? "bg-muted" : stock <= 3 ? "bg-warn" : "bg-ok")} />{getStockLabel(product)}</p>
        <div className="product-card-footer mt-auto">
          <PriceDisplay product={product} compact unit={unit ? `por ${unit}` : undefined} />
          <div data-design-actions className="product-card-actions flex items-stretch gap-2">
            <button type="button" onClick={handleAdd} className={cn("product-card-add inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-control border text-sm font-semibold transition-colors motion-reduce:transition-none", added ? "border-ink bg-ink text-on-ink" : "border-brand-text bg-brand-tint text-brand-text hover:border-brand hover:bg-brand hover:text-on-brand active:bg-brand-press")} aria-label={`${added ? `Agregado ${quantityLabel}. ` : ""}${actionLabel}: ${name}${added ? ", agregar más a cotización" : ""}${inStock ? "" : ", agregar con disponibilidad a confirmar"}`}>
              <span aria-hidden="true" className="product-card-add-symbol">{added ? "✓" : "+"}</span>
              <span className="product-card-add-label">{actionLabel}</span><span className="product-card-add-mobile">{added ? "Agregado" : "Agregar"}</span>
              {added && <span aria-hidden="true" className="product-card-add-quantity font-mono text-xs"> {quantityLabel}</span>}
            </button>
            <a href={buildQuoteWhatsAppUrl([{ ...product, qty: inStock ? Math.min(1, stock) : 1 }])} target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-wa-edge bg-surface text-wa hover:border-ink" aria-label={`Consultar ${name} por WhatsApp`} title="Consultar por WhatsApp">
              <svg className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h8m-8 4h5m8-2a8 8 0 01-8 8H5l-3 2v-7a8 8 0 1119-3z" /></svg>
            </a>
          </div>
        </div>
        {feedback && <p role="status" className="mt-2 text-xs text-ink-2">{feedback}</p>}
      </div>
    </article>
  );
}

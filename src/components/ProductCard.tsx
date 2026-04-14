"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatCOP, getProductImage, getDiscountPercent, cn } from "@/lib/utils";
import { addToCart } from "@/lib/cart-store";

/* ── Icons ──────────────────────────── */
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
  </svg>
);
const WAIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);
const CartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
  </svg>
);
const CameraIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

interface Props {
  product: Product;
  onOpenModal?: (product: Product) => void;
  viewMode?: "grid" | "list";
}

export default function ProductCard({ product, onOpenModal, viewMode = "grid" }: Props) {
  const discount = getDiscountPercent(product);
  const hasImage = !!product.img;
  const inStock = product.stock > 0;
  const imgSrc = getProductImage(product);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleWA = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = `Hola, quiero cotizar:\n• ${product.nombre}\n• Ref: ${product.id}\n• Precio web: ${formatCOP(product.precio)} + IVA\n\n¿Está disponible?`;
    window.open(`https://wa.me/573118486132?text=${encodeURIComponent(msg)}`, "_blank");
  };

  /* ══ LIST VIEW ═══════════════════════ */
  if (viewMode === "list") {
    return (
      <div
        className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-black/5 hover:border-gray-200 cursor-pointer transition-all duration-300 flex relative"
        onClick={() => onOpenModal?.(product)}
      >
        <Link
          href={`/producto/${product.id}`}
          className="absolute inset-0 z-0"
          aria-label={`Ver ${product.nombre}`}
          onClick={(e) => { if (onOpenModal) e.preventDefault(); }}
        />
        {/* Image */}
        <div className="relative w-32 sm:w-44 shrink-0 bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden">
          {discount && discount >= 20 && (
            <span className="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase z-10 shadow-sm">Oferta</span>
          )}
          {discount && (
            <span className="absolute bottom-2.5 left-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg z-10 shadow-sm">-{discount}%</span>
          )}
          {hasImage ? (
            <Image
              src={imgSrc}
              alt={product.nombre}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              sizes="176px"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center min-h-[120px] relative">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 group-hover:bg-red-50 group-hover:text-brand-red/30 transition-all duration-300">
                <span className="text-lg font-extrabold">{product.brand?.charAt(0) || "F"}</span>
              </div>
            </div>
          )}
        </div>
        {/* Content */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-brand-red uppercase tracking-wider">{product.brand}</span>
              {hasImage && (
                <span className="inline-flex items-center gap-1 text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md font-medium">
                  <CameraIcon /> Foto
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-brand-red transition-colors duration-300">{product.nombre}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md font-medium">{product.unidad}</span>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-semibold",
                inStock ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              )}>
                {inStock ? `✓ ${product.stock} disp.` : "Consultar"}
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-3 gap-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-gray-900 tracking-tight">{formatCOP(product.precio)}</span>
                <span className="text-[10px] text-amber-600 font-semibold">+ IVA</span>
              </div>
              {product.original && product.original > product.precio && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400 line-through">{formatCOP(product.original)}</span>
                  <span className="text-[10px] font-bold text-red-500">Ahorras {discount}%</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={handleAdd} className="relative z-10 flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-red-dark transition-all duration-200 active:scale-[0.96] shadow-sm shadow-red-900/10 hover:shadow-md hover:shadow-red-900/15">
                <CartIcon /> Agregar
              </button>
              <button onClick={handleWA} className="relative z-10 flex items-center justify-center bg-[#25D366] text-white p-2.5 rounded-xl hover:bg-[#1da851] transition-all duration-200 active:scale-[0.96] shadow-sm" title="Cotizar por WhatsApp">
                <WAIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══ GRID VIEW (default) ══════════════ */
  return (
    <div
      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/8 dark:hover:shadow-black/30 hover:border-gray-200/80 dark:hover:border-gray-700 cursor-pointer relative transition-all duration-300"
      onClick={() => onOpenModal?.(product)}
    >
      {/* Link invisible para SEO */}
      <Link
        href={`/producto/${product.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Ver ${product.nombre}`}
        onClick={(e) => { if (onOpenModal) e.preventDefault(); }}
      />

      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {discount && discount >= 20 && (
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide shadow-md shadow-orange-500/20 animate-badge-pop">
            Super oferta
          </span>
        )}
        {discount && (
          <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-md shadow-red-500/20 animate-badge-pop">
            -{discount}%
          </span>
        )}
      </div>
      {hasImage && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-600 text-[9px] font-medium px-2 py-1 rounded-lg z-10 shadow-sm border border-gray-100">
          <CameraIcon /> Foto real
        </span>
      )}

      {/* Image */}
      <div className={cn(
        "relative aspect-square overflow-hidden",
        hasImage ? "bg-gradient-to-br from-white via-gray-50/30 to-gray-50" : "bg-gradient-to-br from-gray-50 to-gray-100/50"
      )}>
        {hasImage ? (
          <Image
            src={imgSrc}
            alt={product.nombre}
            fill
            className="object-contain p-5 group-hover:scale-[1.06] transition-transform duration-500 ease-out"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 relative">
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E\")"
            }} />
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300 group-hover:bg-red-50 group-hover:text-brand-red/30 transition-all duration-300">
              <span className="text-2xl font-extrabold">{product.brand?.charAt(0) || "F"}</span>
            </div>
            <span className="text-[10px] text-gray-300 font-semibold tracking-wide uppercase">{product.brand || "Producto"}</span>
          </div>
        )}
        {/* Bottom gradient fade into content area */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-3.5 md:p-4">
        {/* Brand */}
        <div className="text-[10px] font-bold text-brand-red uppercase tracking-wider mb-1">
          {product.brand}
        </div>

        {/* Name */}
        <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 leading-snug line-clamp-2 mb-2.5 min-h-[2.25rem] group-hover:text-brand-red transition-colors duration-300">
          {product.nombre}
        </h3>

        {/* Detail pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md font-medium">
            {product.unidad}
          </span>
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-md font-semibold",
            inStock
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
              : "bg-amber-50 text-amber-600 border border-amber-100"
          )}>
            {inStock ? `✓ ${product.stock} und.` : "Consultar"}
          </span>
        </div>

        {/* Price block */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {formatCOP(product.precio)}
            </span>
            <span className="text-[10px] text-amber-600 font-semibold">+ IVA</span>
          </div>
          {product.original && product.original > product.precio && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-gray-400 line-through">{formatCOP(product.original)}</span>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
                Ahorras {discount}%
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="relative z-10 flex-1 flex items-center justify-center gap-1.5 bg-brand-red text-white text-xs font-bold py-2.5 rounded-xl hover:bg-brand-red-dark transition-all duration-200 active:scale-[0.96] shadow-sm shadow-red-900/10 hover:shadow-md hover:shadow-red-900/20"
          >
            <PlusIcon /> Agregar
          </button>
          <button
            onClick={handleWA}
            className="relative z-10 flex items-center justify-center bg-[#25D366] text-white px-3.5 py-2.5 rounded-xl hover:bg-[#1da851] transition-all duration-200 active:scale-[0.96] shadow-sm hover:shadow-md"
            title="Cotizar por WhatsApp"
          >
            <WAIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

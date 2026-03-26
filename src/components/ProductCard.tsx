"use client";

import Image from "next/image";
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
        className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 cursor-pointer transition-all flex"
        onClick={() => onOpenModal?.(product)}
      >
        {/* Image */}
        <div className="relative w-32 sm:w-40 shrink-0 bg-gray-50 overflow-hidden">
          {discount && discount >= 20 && (
            <span className="absolute top-2 left-2 bg-brand-orange text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase z-10">Top</span>
          )}
          {discount && (
            <span className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md z-10">-{discount}%</span>
          )}
          {hasImage ? (
            <Image
              src={imgSrc}
              alt={product.nombre}
              fill
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
              sizes="160px"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200 min-h-[120px]">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-brand-red uppercase tracking-wider">{product.brand}</span>
              {hasImage && <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">📸 Foto</span>}
            </div>
            <h3 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 group-hover:text-brand-red transition-colors">{product.nombre}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">{product.unidad}</span>
              <span className={cn("text-[10px] px-2 py-0.5 rounded font-semibold",
                inStock ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              )}>
                {inStock ? `✓ ${product.stock} disp.` : "Consultar"}
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-3 gap-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-gray-900">{formatCOP(product.precio)}</span>
                <span className="text-[10px] text-amber-600 font-semibold">+ IVA</span>
              </div>
              {product.original && product.original > product.precio && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-gray-400 line-through">{formatCOP(product.original)}</span>
                  <span className="text-[10px] font-bold text-red-500">-{discount}%</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={handleAdd} className="flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-brand-red-dark transition-all active:scale-[0.97]">
                <CartIcon /> Agregar
              </button>
              <button onClick={handleWA} className="flex items-center justify-center bg-[#25D366] text-white p-2.5 rounded-lg hover:bg-[#1da851] transition-all active:scale-[0.97]" title="Cotizar por WhatsApp">
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
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:-translate-y-1 hover:shadow-xl hover:shadow-black/8 cursor-pointer relative transition-all duration-300"
      onClick={() => onOpenModal?.(product)}
    >
      {/* Badges — repositioned for clarity */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
        {discount && discount >= 20 && (
          <span className="bg-brand-orange text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide shadow-sm">
            Más vendido
          </span>
        )}
        {discount && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            -{discount}%
          </span>
        )}
      </div>
      {hasImage && (
        <span className="absolute top-2.5 right-2.5 bg-black/60 text-white text-[9px] font-medium px-2 py-0.5 rounded-md backdrop-blur-sm z-10">
          📸 Foto real
        </span>
      )}

      {/* Image */}
      <div className={cn(
        "relative aspect-square overflow-hidden",
        hasImage ? "bg-white" : "bg-gray-50"
      )}>
        {hasImage ? (
          <Image
            src={imgSrc}
            alt={product.nombre}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-1">
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] text-gray-300">Sin imagen</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 md:p-4">
        {/* Brand */}
        <div className="text-[10px] font-bold text-brand-red uppercase tracking-wider mb-0.5">
          {product.brand}
        </div>

        {/* Name */}
        <h3 className="text-[13px] font-semibold text-gray-800 leading-tight line-clamp-2 mb-2 min-h-[2.25rem] group-hover:text-brand-red transition-colors">
          {product.nombre}
        </h3>

        {/* Detail pills */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">
            {product.unidad}
          </span>
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded font-semibold",
            inStock
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          )}>
            {inStock ? `✓ ${product.stock} und.` : "⏳ Consultar"}
          </span>
        </div>

        {/* ── Price block (BIGGER, clearer hierarchy) ── */}
        <div className="mb-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">
              {formatCOP(product.precio)}
            </span>
            <span className="text-[10px] text-amber-600 font-semibold">+ IVA</span>
          </div>
          {product.original && product.original > product.precio && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-gray-400 line-through">{formatCOP(product.original)}</span>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                Ahorras {discount}%
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="flex-1 flex items-center justify-center gap-1.5 bg-brand-red text-white text-xs font-bold py-2.5 rounded-xl hover:bg-brand-red-dark transition-all active:scale-[0.97] shadow-sm shadow-red-900/10"
          >
            <PlusIcon /> Agregar
          </button>
          <button
            onClick={handleWA}
            className="flex items-center justify-center bg-[#25D366] text-white px-3 py-2.5 rounded-xl hover:bg-[#1da851] transition-all active:scale-[0.97] shadow-sm"
            title="Cotizar por WhatsApp"
          >
            <WAIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

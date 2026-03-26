"use client";

import Image from "next/image";
import { Product } from "@/lib/types";
import { formatCOP, getProductImage, getDiscountPercent, cn } from "@/lib/utils";
import { addToCart } from "@/lib/cart-store";
import { SITE } from "@/lib/constants";

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const WAIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);

interface Props {
  product: Product;
  onOpenModal?: (product: Product) => void;
}

export default function ProductCard({ product, onOpenModal }: Props) {
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

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover cursor-pointer relative"
      onClick={() => onOpenModal?.(product)}
    >
      {/* Badges */}
      {discount && discount >= 20 && (
        <span className="badge-bestseller">Más vendido</span>
      )}
      {hasImage && (
        <span className="badge-photo">📸 Foto real</span>
      )}
      {discount && (
        <span className={cn("badge-discount", discount >= 20 && "top-10")}>
          -{discount}%
        </span>
      )}

      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
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
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 md:p-4">
        {/* Brand */}
        <div className="text-[10px] font-bold text-brand-green uppercase tracking-wider mb-1">
          {product.brand}
        </div>

        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2 mb-2 min-h-[2.5rem] group-hover:text-brand-green transition-colors">
          {product.nombre}
        </h3>

        {/* Details pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-medium">
            {product.unidad}
          </span>
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full font-medium",
            inStock ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
          )}>
            {inStock ? `✓ ${product.stock} und.` : "⏳ Consultar"}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-extrabold text-gray-900">
            {formatCOP(product.precio)}
          </span>
          <span className="iva-tag">+ IVA</span>
        </div>
        {product.original && product.original > product.precio && (
          <div className="flex items-center gap-2 -mt-2 mb-3">
            <span className="text-xs text-gray-400 line-through">{formatCOP(product.original)}</span>
            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
              -{discount}%
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="flex-1 flex items-center justify-center gap-1.5 bg-brand-green text-white text-xs font-bold py-2.5 rounded-xl hover:bg-brand-green-dark transition-all active:scale-[0.97]"
          >
            <PlusIcon /> Agregar
          </button>
          <button
            onClick={handleWA}
            className="flex items-center justify-center gap-1 bg-[#25D366] text-white text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-[#1da851] transition-all active:scale-[0.97]"
            title="Cotizar por WhatsApp"
          >
            <WAIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

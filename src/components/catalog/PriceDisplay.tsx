"use client";

import type { Product } from "@/lib/types";
import { cn, formatCOP, getTaxRate, hasVerifiedPrice } from "@/lib/utils";
import { usePricePreference } from "@/lib/price-preference";

interface Props {
  product: Product;
  className?: string;
  compact?: boolean;
  principalClassName?: string;
  unit?: string;
}

export default function PriceDisplay({ product, className, compact = false, principalClassName, unit }: Props) {
  const mode = usePricePreference();
  const rate = getTaxRate(product);
  if (!hasVerifiedPrice(product)) return (
    <div className={cn("product-price", compact && "product-price--compact", className)}>
      <p data-design-price className="product-price-main text-sm font-semibold text-ink">Precio por confirmar</p>
      <p className="product-price-secondary text-xs leading-4 text-ink-2">El asesor confirma precio e impuesto.{unit ? ` · ${unit}` : ""}</p>
    </div>
  );
  const net = formatCOP(product.precio);
  const gross = rate === null ? null : formatCOP(Math.round(product.precio * (1 + rate / 100)));
  const netFirst = mode === "net" || gross === null;
  return (
    <div className={cn("product-price", compact && "product-price--compact", className)}>
      <p data-design-price className={cn("product-price-main font-display font-bold tabular-nums tracking-[-0.025em] text-ink", compact ? "text-[22px] leading-7" : "text-[28px] leading-8", principalClassName)}>
        <span className="product-price-amount">{netFirst ? net : gross}</span>
        <span className="product-price-tax text-xs font-normal leading-4 tracking-normal text-ink-2">{netFirst ? "sin IVA" : "IVA incluido"}</span>
      </p>
      <p className="product-price-secondary text-xs leading-4 text-ink-2">
        {gross === null ? "Impuesto por confirmar" : netFirst ? `${gross} IVA incluido` : rate === 0 ? `${net} · tarifa IVA 0%` : `${net} + IVA ${rate}%`}
        {unit ? ` · ${unit}` : ""}
      </p>
    </div>
  );
}

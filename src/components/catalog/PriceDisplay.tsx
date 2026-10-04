"use client";

import type { Product } from "@/lib/types";
import { cn, formatCOP, getTaxRate, hasVerifiedPrice } from "@/lib/utils";
import { usePricePreference } from "@/lib/price-preference";

interface Props {
  product: Product;
  className?: string;
  compact?: boolean;
  principalClassName?: string;
}

export default function PriceDisplay({ product, className, compact = false, principalClassName }: Props) {
  const mode = usePricePreference();
  const rate = getTaxRate(product);
  if (!hasVerifiedPrice(product)) return (
    <div className={className}>
      <p className="text-sm font-bold text-gray-900 dark:text-white">Precio por confirmar</p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">El asesor confirma precio e impuesto.</p>
    </div>
  );
  const net = formatCOP(product.precio);
  const gross = rate === null ? null : formatCOP(Math.round(product.precio * (1 + rate / 100)));
  const netFirst = mode === "net" || gross === null;
  return (
    <div className={className}>
      <p className={cn("font-extrabold tracking-tight text-gray-900 dark:text-white", compact ? "text-lg" : "text-2xl", principalClassName)}>
        {netFirst ? net : gross}
        <span className="ml-1.5 text-xs font-medium tracking-normal">{netFirst ? "sin IVA" : "IVA incluido"}</span>
      </p>
      <p className="mt-1 text-[13px] leading-snug text-gray-500 dark:text-gray-400">
        {gross === null ? "Impuesto por confirmar" : netFirst ? `${gross} IVA incluido` : rate === 0 ? `${net} · tarifa IVA 0%` : `${net} + IVA ${rate}%`}
      </p>
    </div>
  );
}

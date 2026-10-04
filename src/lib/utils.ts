import { Product, CartItem } from "./types";
import { SITE } from "./constants";

const copFormatter = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
const quantityFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 6 });
export function formatCOP(amount: number): string { return copFormatter.format(amount); }

export function hasVerifiedPrice(product: Product): boolean {
  return product.priceVerified === true && Number.isFinite(product.precio) && product.precio > 0;
}

export function getTaxRate(product: Product): number | null {
  return product.taxRate === 0 || product.taxRate === 5 || product.taxRate === 19 ? product.taxRate : null;
}

export function formatTaxLabel(product: Product): string {
  const rate = getTaxRate(product);
  return rate === null ? "Impuesto por confirmar" : rate === 0 ? "IVA 0%" : `+ IVA ${rate}%`;
}

export function getUnitPriceWithTax(product: Product): number | null {
  const rate = getTaxRate(product);
  return hasVerifiedPrice(product) && rate !== null ? Math.round((product.precio * (1 + rate / 100) + Number.EPSILON) * 100) / 100 : null;
}

export function allowsFractionalQuantity(product: Product): boolean {
  const unit = product.unidad.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f.]/g, "").trim();
  return /^(metros?( lineal(es)?)?|m|mt|mts|m2|m3|centimetros?|cm|milimetros?|mm|kilogramos?( netos?)?|kg|kilos?|gramos?|g|litros?|l|mililitros?|ml|libras?( brutas?)?|lb|onzas?|oz|pies?|ft|yardas?|yd|galon(es)?)$/.test(unit);
}

export function normalizeQuantity(quantity: number): number {
  return Math.round((quantity + Number.EPSILON) * 1000000) / 1000000;
}

export function getAvailableQuantity(product: Product): number {
  if (!Number.isFinite(product.stock) || product.stock <= 0) return 0;
  return allowsFractionalQuantity(product) ? normalizeQuantity(product.stock) : Math.floor(product.stock);
}

export function formatQuantity(quantity: number): string {
  return quantityFormatter.format(quantity);
}

export function getQuotationTotals(items: CartItem[]) {
  let subtotal = 0;
  let tax = 0;
  let pendingPrices = 0;
  let pendingTaxes = 0;
  for (const item of items) {
    if (!hasVerifiedPrice(item)) {
      pendingPrices += 1;
      continue;
    }
    const base = item.precio * item.qty;
    subtotal += base;
    const rate = getTaxRate(item);
    if (rate === null) pendingTaxes += 1;
    else tax += base * rate / 100;
  }
  const round = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;
  return { subtotal: round(subtotal), tax: round(tax), total: round(subtotal + tax), pendingPrices, pendingTaxes };
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getProductImage(product: Product): string {
  if (product.img) return `/${product.img}`;
  return "/placeholder-product.svg";
}

export function buildWhatsAppUrl(items: CartItem[]): string {
  const base = `https://wa.me/57${SITE.phone2}`;
  if (items.length === 0) {
    return `${base}?text=${encodeURIComponent("Hola, vi el catálogo en la página y quiero cotizar")}`;
  }

  let msg = "Hola, quiero cotizar estos productos de Ferretería Pardo:\n\n";
  items.forEach((item, i) => {
    const subtotal = item.precio * item.qty;
    const taxRate = getTaxRate(item);
    const unit = item.unidad.toLowerCase().trim() === "consultar unidad" ? "(unidad por confirmar)" : item.unidad;
    msg += `${i + 1}. ${item.nombre}\n   • Código: ${item.id}\n   • Ref: ${item.ref || item.sku || item.id}\n   • Cantidad: ${formatQuantity(item.qty)} ${unit}\n`;
    if (!hasVerifiedPrice(item)) {
      msg += "   • Precio e impuesto: por confirmar con el asesor\n";
      return;
    }
    msg += `   • Precio unitario sin IVA: ${formatCOP(item.precio)}\n   • Subtotal sin IVA: ${formatCOP(subtotal)}\n`;
    msg += taxRate === null ? "   • Impuesto: por confirmar\n" : `   • IVA: ${taxRate}% (${formatCOP(subtotal * taxRate / 100)})\n`;
  });
  const totals = getQuotationTotals(items);
  if (totals.pendingPrices > 0) {
    if (totals.subtotal > 0) msg += `\nSubtotal de productos con precio confirmado, sin IVA: ${formatCOP(totals.subtotal)}\n`;
    msg += `Hay ${totals.pendingPrices} ${totals.pendingPrices === 1 ? "referencia con precio pendiente" : "referencias con precio pendiente"}. El total se confirma con el asesor.\n`;
  } else {
    msg += `\nSubtotal sin IVA: ${formatCOP(totals.subtotal)}\n`;
    if (totals.pendingTaxes > 0) {
      msg += "Impuesto pendiente de confirmar. El total se confirma con el asesor.\n";
    } else {
      msg += `IVA: ${formatCOP(totals.tax)}\nTotal estimado con IVA: ${formatCOP(totals.total)}\n`;
    }
  }
  msg += "El envío se confirma en la cotización final.\n";
  msg += `\n¿Me pueden confirmar disponibilidad y precio final?`;

  return `${base}?text=${encodeURIComponent(msg)}`;
}

export function getDiscountPercent(product: Product): number | null {
  if (!hasVerifiedPrice(product)) return null;
  if (product.original && product.disc) return product.disc;
  if (product.original && product.original > product.precio) {
    return Math.round(((product.original - product.precio) / product.original) * 100);
  }
  return null;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

import { Product, CartItem } from "./types";

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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
  const base = "https://wa.me/573118486132";
  if (items.length === 0) {
    return `${base}?text=${encodeURIComponent("Hola, vi el catálogo en la página y quiero cotizar")}`;
  }

  let msg = "Hola, quiero cotizar estos productos de Ferretería Pardo:\n\n";
  let total = 0;
  items.forEach((item, i) => {
    const subtotal = item.precio * item.qty;
    total += subtotal;
    msg += `${i + 1}. ${item.nombre}\n   • Cant: ${item.qty} | Precio web: ${formatCOP(item.precio)} + IVA\n`;
  });
  msg += `\nTotal estimado: ${formatCOP(total)} (precios + IVA)\n`;
  msg += `\n¿Me pueden confirmar disponibilidad y precio final?`;

  return `${base}?text=${encodeURIComponent(msg)}`;
}

export function getDiscountPercent(product: Product): number | null {
  if (product.original && product.disc) return product.disc;
  if (product.original && product.original > product.precio) {
    return Math.round(((product.original - product.precio) / product.original) * 100);
  }
  return null;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

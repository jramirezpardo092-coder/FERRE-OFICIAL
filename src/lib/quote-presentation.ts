import type { CartItem, Product } from "./types";
import { SITE } from "./constants";
import { formatCOP, formatQuantity, getAvailableQuantity, getQuotationTotals, getTaxRate, hasVerifiedPrice } from "./utils";
import { formatUnit, normalizeProductName } from "./catalog/normalize";

export const SHOW_EXACT_STOCK = false;
export type QuoteCustomer = { name?: string; company?: string; nit?: string };

export function isQuoteAvailabilityPending(product: Product): boolean {
  return getAvailableQuantity(product) <= 0;
}

export function getStockLabel(product: Product): string {
  const available = getAvailableQuantity(product);
  if (available <= 0) return "Consultar disponibilidad";
  const label = available <= 3 ? "Últimas unidades" : "Disponible";
  const exact = SHOW_EXACT_STOCK ? formatUnit(product.unidad, available) : "";
  return SHOW_EXACT_STOCK && exact ? `${label} · ${exact}` : label;
}

function cleanCustomerField(value: string | undefined, maxLength: number): string {
  return (value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength);
}

export function buildQuoteWhatsAppUrl(items: CartItem[], customer: QuoteCustomer = {}): string {
  const lines = ["Hola, quiero cotizar estos productos de Ferretería Pardo:", ""];
  items.forEach((item, index) => {
    const rate = getTaxRate(item);
    const quantity = formatUnit(item.unidad, item.qty) || `${formatQuantity(item.qty)} (unidad por confirmar)`;
    lines.push(`${index + 1}. ${normalizeProductName(item.nombre)}`, `   • SKU: ${item.id}`, `   • Ref: ${item.ref || item.sku || item.id}`, `   • Cantidad: ${quantity}`);
    if (isQuoteAvailabilityPending(item)) lines.push("   • Disponibilidad: a confirmar");
    if (!hasVerifiedPrice(item)) lines.push("   • Precio e impuesto: por confirmar con el asesor");
    else {
      const subtotal = item.precio * item.qty;
      lines.push(`   • Precio unitario sin IVA: ${formatCOP(item.precio)}`, `   • Subtotal sin IVA: ${formatCOP(subtotal)}`);
      lines.push(rate === null ? "   • Impuesto: por confirmar" : `   • IVA ${rate}%: ${formatCOP(subtotal * rate / 100)}`);
    }
    lines.push("");
  });
  const totals = getQuotationTotals(items);
  if (totals.pendingPrices > 0 || totals.pendingTaxes > 0) {
    if (totals.subtotal > 0) lines.push(`Subtotal parcial sin IVA: ${formatCOP(totals.subtotal)}`);
    if (totals.tax > 0) lines.push(`IVA de productos confirmados: ${formatCOP(totals.tax)}`);
    lines.push("Hay precios o impuestos por confirmar. El asesor confirma el total.");
  } else {
    lines.push(`Subtotal sin IVA: ${formatCOP(totals.subtotal)}`, `IVA: ${formatCOP(totals.tax)}`, `Total estimado con IVA: ${formatCOP(totals.total)}`);
  }
  const name = cleanCustomerField(customer.name, 80);
  const company = cleanCustomerField(customer.company, 120);
  const nit = cleanCustomerField(customer.nit, 30);
  if (name || company || nit) lines.push("", "Datos para la cotización:");
  if (name) lines.push(`Nombre: ${name}`);
  if (company) lines.push(`Empresa: ${company}`);
  if (nit) lines.push(`NIT: ${nit}`);
  lines.push("", "¿Me pueden confirmar disponibilidad, envío y precio final?");
  return `https://wa.me/57${SITE.phone2}?text=${encodeURIComponent(lines.join("\n"))}`;
}

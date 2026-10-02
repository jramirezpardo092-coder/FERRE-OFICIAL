"use client";

import type { Product, CartItem } from "./types";
import { formatCOP, hasVerifiedPrice, getTaxRate, getQuotationTotals, getAvailableQuantity, allowsFractionalQuantity, normalizeQuantity, formatQuantity } from "./utils";

type CartListener = () => void;
const STORAGE_KEY = "fp_cart";
let cartItems: CartItem[] = [];
let listeners: CartListener[] = [];
let loaded = false;
let revalidation: Promise<CartValidation> | null = null;

export type CartValidation = { items: CartItem[]; changes: string[] };

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<Product>;
  return typeof product.id === "string" && !!product.id && typeof product.nombre === "string" &&
    typeof product.brand === "string" && typeof product.cat === "string" && typeof product.unidad === "string" &&
    typeof product.precio === "number" && Number.isFinite(product.precio) && product.precio >= 0 &&
    typeof product.stock === "number" && Number.isFinite(product.stock) && product.stock >= 0;
}

function parseCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const items = new Map<string, CartItem>();
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Partial<CartItem>;
    const quantity = item.qty;
    if (
      !isProduct(item) || getAvailableQuantity(item) <= 0 ||
      typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0
    ) continue;
    const stock = getAvailableQuantity(item);
    const qty = Math.min(allowsFractionalQuantity(item) ? normalizeQuantity(quantity) : Math.floor(quantity), stock);
    if (qty <= 0) continue;
    const existing = items.get(item.id);
    items.set(item.id, {
      ...item as CartItem,
      qty: Math.min(normalizeQuantity((existing?.qty ?? 0) + qty), stock),
    });
  }
  return [...items.values()];
}

function loadCart(force = false) {
  if (typeof window === "undefined" || (loaded && !force)) return;
  loaded = true;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    cartItems = saved ? parseCart(JSON.parse(saved)) : [];
  } catch {
    // Keep the current in-memory order when browser storage is unavailable.
  }
}

function saveCart() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  } catch {
    // The order still works for this visit if persistence is blocked or full.
  }
}

function notify() {
  listeners.forEach((fn) => fn());
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  loadCart(true);
  notify();
}

export function getCart(): CartItem[] {
  loadCart();
  return cartItems.map((item) => ({ ...item }));
}

export function getCartCount(): number {
  loadCart();
  return normalizeQuantity(cartItems.reduce((sum, item) => sum + item.qty, 0));
}

export function getCartTotal(): number {
  loadCart();
  return getQuotationTotals(cartItems).subtotal;
}

export function reconcileCart(currentProducts: Product[], requestedIds: string[]): CartValidation {
  loadCart();
  const requested = new Set(requestedIds);
  const current = new Map(currentProducts.map((product) => [product.id, product]));
  const changes: string[] = [];
  cartItems = cartItems.flatMap((item) => {
    if (!requested.has(item.id)) return [item];
    const product = current.get(item.id);
    if (!product) {
      changes.push(`${item.nombre}: se retiró del pedido porque ya no pertenece al catálogo.`);
      return [];
    }
    const stock = getAvailableQuantity(product);
    if (stock <= 0) {
      changes.push(`${product.nombre}: se retiró del pedido porque no tiene unidades disponibles.`);
      return [];
    }
    const qty = Math.min(allowsFractionalQuantity(product) ? item.qty : Math.floor(item.qty), stock);
    if (qty <= 0) {
      changes.push(`${product.nombre}: se retiró del pedido porque su unidad de venta no admite esta cantidad.`);
      return [];
    }
    if (qty !== item.qty) changes.push(`${product.nombre}: cantidad ajustada de ${formatQuantity(item.qty)} a ${formatQuantity(qty)} por disponibilidad.`);
    else if (item.stock !== product.stock) changes.push(`${product.nombre}: disponibilidad actualizada a ${formatQuantity(stock)} ${product.unidad}.`);
    if (item.precio !== product.precio || hasVerifiedPrice(item) !== hasVerifiedPrice(product)) {
      const previous = hasVerifiedPrice(item) ? `${formatCOP(item.precio)} sin IVA` : "por confirmar";
      const next = hasVerifiedPrice(product) ? `${formatCOP(product.precio)} sin IVA` : "por confirmar";
      changes.push(`${product.nombre}: precio actualizado de ${previous} a ${next}.`);
    }
    if (getTaxRate(item) !== getTaxRate(product)) {
      const rate = getTaxRate(product);
      changes.push(`${product.nombre}: ${rate === null ? "impuesto pendiente de confirmar" : `IVA actualizado a ${rate}%`}.`);
    }
    if (item.nombre !== product.nombre || item.unidad !== product.unidad) {
      changes.push(`${product.nombre}: nombre y unidad actualizados (${product.unidad}).`);
    }
    return [{ ...product, qty }];
  });
  saveCart();
  notify();
  return { items: getCart(), changes };
}

export function revalidateCart(): Promise<CartValidation> {
  if (revalidation) return revalidation;
  revalidation = (async () => {
    const changes: string[] = [];
    for (let attempt = 0; attempt < 3; attempt++) {
      const ids = getCart().map((item) => item.id);
      if (ids.length === 0) return { items: [], changes };
      const products: Product[] = [];
      for (let offset = 0; offset < ids.length; offset += 100) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
          const response = await fetch(`/api/pedido/productos?ids=${encodeURIComponent(ids.slice(offset, offset + 100).join(","))}`, {
            cache: "no-store", signal: controller.signal,
          });
          if (!response.ok) throw new Error("No fue posible actualizar el pedido. Inténtalo de nuevo.");
          const data: unknown = await response.json();
          if (!data || typeof data !== "object" || !Array.isArray((data as { products?: unknown }).products)) {
            throw new Error("No fue posible verificar los productos del pedido.");
          }
          const batch = (data as { products: unknown[] }).products;
          if (!batch.every(isProduct)) throw new Error("No fue posible verificar los productos del pedido.");
          products.push(...batch);
        } finally {
          clearTimeout(timeout);
        }
      }
      const result = reconcileCart(products, ids);
      changes.push(...result.changes);
      if (result.items.every((item) => ids.includes(item.id))) return { items: result.items, changes };
    }
    throw new Error("El pedido cambió durante la actualización. Vuelve a preparar la cotización.");
  })().finally(() => { revalidation = null; });
  return revalidation;
}

export function addToCart(product: Product, qty?: number): boolean {
  loadCart();
  const stock = getAvailableQuantity(product);
  const existing = cartItems.find((item) => item.id === product.id);
  const desired = qty ?? Math.min(1, stock - (existing?.qty ?? 0));
  const quantity = allowsFractionalQuantity(product) ? normalizeQuantity(desired) : Math.floor(desired);
  if (!Number.isFinite(quantity) || quantity <= 0 || stock <= 0) return false;
  const nextQuantity = normalizeQuantity((existing?.qty ?? 0) + quantity);
  if (nextQuantity > stock) return false;
  if (existing) {
    Object.assign(existing, product, { qty: nextQuantity });
  } else {
    cartItems.push({ ...product, qty: quantity });
  }
  saveCart();
  notify();
  if (typeof window !== "undefined") window.dispatchEvent(new Event("cart-added"));
  return true;
}

export function removeFromCart(productId: string) {
  loadCart();
  cartItems = cartItems.filter((item) => item.id !== productId);
  saveCart();
  notify();
}

export function updateQty(productId: string, qty: number): boolean {
  loadCart();
  if (!Number.isFinite(qty)) return false;
  const item = cartItems.find((entry) => entry.id === productId);
  if (!item) return false;
  const quantity = allowsFractionalQuantity(item) ? normalizeQuantity(qty) : Math.floor(qty);
  if (quantity <= 0) {
    removeFromCart(productId);
    return true;
  }
  if (quantity > getAvailableQuantity(item)) return false;
  item.qty = quantity;
  saveCart();
  notify();
  return true;
}

export function clearCart() {
  loadCart();
  cartItems = [];
  saveCart();
  notify();
}

export function subscribeCart(fn: CartListener): () => void {
  loadCart();
  if (listeners.length === 0 && typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((listener) => listener !== fn);
    if (listeners.length === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

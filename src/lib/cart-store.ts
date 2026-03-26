"use client";

import { Product, CartItem } from "./types";

type CartListener = () => void;

let cartItems: CartItem[] = [];
let listeners: CartListener[] = [];

function loadCart() {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem("fp_cart");
    if (saved) cartItems = JSON.parse(saved);
  } catch {}
}

function saveCart() {
  if (typeof window === "undefined") return;
  localStorage.setItem("fp_cart", JSON.stringify(cartItems));
}

function notify() {
  listeners.forEach((fn) => fn());
}

export function getCart(): CartItem[] {
  if (cartItems.length === 0) loadCart();
  return [...cartItems];
}

export function getCartCount(): number {
  return cartItems.reduce((sum, item) => sum + item.qty, 0);
}

export function getCartTotal(): number {
  return cartItems.reduce((sum, item) => sum + item.precio * item.qty, 0);
}

export function addToCart(product: Product, qty = 1) {
  loadCart();
  const existing = cartItems.find((i) => i.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cartItems.push({ ...product, qty });
  }
  saveCart();
  notify();
}

export function removeFromCart(productId: string) {
  loadCart();
  cartItems = cartItems.filter((i) => i.id !== productId);
  saveCart();
  notify();
}

export function updateQty(productId: string, qty: number) {
  loadCart();
  if (qty <= 0) {
    removeFromCart(productId);
    return;
  }
  const item = cartItems.find((i) => i.id === productId);
  if (item) item.qty = qty;
  saveCart();
  notify();
}

export function clearCart() {
  cartItems = [];
  saveCart();
  notify();
}

export function subscribeCart(fn: CartListener): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

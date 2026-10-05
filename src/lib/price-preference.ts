"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

export type PriceMode = "gross" | "net";
const CatalogPriceMode = createContext<{ mode: PriceMode; onModeChange: (mode: PriceMode) => void } | null>(null);
export const CatalogPriceModeProvider = CatalogPriceMode.Provider;
const STORAGE_KEY = "fp_price_mode";
let preference: PriceMode = "gross";
let loaded = false;
const listeners = new Set<() => void>();

function readPreference() {
  if (typeof window === "undefined") return;
  try { preference = window.localStorage.getItem(STORAGE_KEY) === "net" ? "net" : "gross"; }
  catch { /* Keep the visit's preference when storage is unavailable. */ }
  loaded = true;
}

export function getPricePreference(): PriceMode {
  if (!loaded) readPreference();
  return preference;
}

export function setPricePreference(mode: PriceMode) {
  if (mode !== "gross" && mode !== "net") return;
  preference = mode;
  loaded = true;
  try { window.localStorage.setItem(STORAGE_KEY, mode); }
  catch { /* The switch still works without browser persistence. */ }
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  readPreference();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

export function usePricePreference(): PriceMode {
  const catalogMode = useContext(CatalogPriceMode);
  const savedMode = useSyncExternalStore<PriceMode>(subscribe, getPricePreference, () => "gross");
  // A shared catalog URL controls cards, filters and the selector, including server HTML.
  return catalogMode?.mode ?? savedMode;
}

/** Quick-view and toolbar selectors share the catalog URL while other screens use saved preferences. */
export function useSetPricePreference(): (mode: PriceMode) => void {
  const catalog = useContext(CatalogPriceMode);
  return (mode) => { setPricePreference(mode); catalog?.onModeChange(mode); };
}

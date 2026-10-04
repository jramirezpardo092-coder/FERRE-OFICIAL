"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getCart, subscribeCart } from "./cart-store";

const getServerQuantity = () => 0;

/** A scalar snapshot keeps the presentation in sync without changing quotation data. */
export function useQuoteQuantity(productId: string): number {
  const getQuantity = useCallback(() => getCart().find((item) => item.id === productId)?.qty ?? 0, [productId]);
  return useSyncExternalStore(subscribeCart, getQuantity, getServerQuantity);
}

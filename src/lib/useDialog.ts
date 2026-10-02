"use client";

import { useEffect, useRef, type RefObject } from "react";

const dialogs: HTMLElement[] = [];
let previousOverflow = "";
const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

function focusableElements(dialog: HTMLElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(focusableSelector)]
    .filter((element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden");
}

export function useDialog<T extends HTMLElement>(isOpen: boolean, dialogRef: RefObject<T | null>, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (dialogs.length === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    dialogs.push(dialog);
    const focusFrame = requestAnimationFrame(() => {
      if (dialogs[dialogs.length - 1] === dialog) (focusableElements(dialog)[0] ?? dialog).focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (dialogs[dialogs.length - 1] !== dialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key === "Tab") {
        const elements = focusableElements(dialog);
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first) {
          event.preventDefault();
          dialog.focus();
        } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (dialogs[dialogs.length - 1] === dialog && !dialog.contains(event.target as Node)) {
        (focusableElements(dialog)[0] ?? dialog).focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    const observer = new MutationObserver(() => {
      if (dialogs[dialogs.length - 1] === dialog && dialog.isConnected && !dialog.contains(document.activeElement)) {
        (focusableElements(dialog)[0] ?? dialog).focus();
      }
    });
    observer.observe(dialog, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      observer.disconnect();
      const index = dialogs.indexOf(dialog);
      if (index >= 0) dialogs.splice(index, 1);
      if (dialogs.length === 0) document.body.style.overflow = previousOverflow;
      const activeDialog = dialogs[dialogs.length - 1];
      if (activeDialog) {
        (focusableElements(activeDialog)[0] ?? activeDialog).focus();
      } else if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [isOpen, dialogRef]);
}

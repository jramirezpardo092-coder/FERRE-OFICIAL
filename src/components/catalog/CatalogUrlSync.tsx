"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** Keep URL navigation reactive without making the server-rendered catalog client-only. */
export default function CatalogUrlSync({ onChange }: { onChange: (query: string) => void }) {
  const searchParams = useSearchParams();
  const key = searchParams.toString();
  useEffect(() => {
    // The browser URL is authoritative if a preference changed it before this island hydrated.
    onChange(new URLSearchParams(window.location.search).toString());
  }, [key, onChange]);
  useEffect(() => {
    const restore = () => onChange(new URLSearchParams(window.location.search).toString());
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [onChange]);
  return null;
}

"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Usa la mascota corporativa; mantiene el espacio reservado si falla el archivo. */
export default function ParditoPortrait({ className, decorative = false, sizes = "128px" }: { className?: string; decorative?: boolean; sizes?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className || "h-32 w-32")}>
      {failed ? <span role={decorative ? undefined : "img"} aria-label={decorative ? undefined : "PARDITO, mascota de Ferretería Pardo"} aria-hidden={decorative || undefined} className="rounded-full bg-red-100 px-5 py-4 text-2xl font-black text-brand-red">P</span> : (
        <Image src="/brand/pardito-assistant-v2.png" alt={decorative ? "" : "PARDITO, mascota de Ferretería Pardo"} fill quality={75} sizes={sizes} loading="lazy" className="object-contain" onError={() => setFailed(true)} />
      )}
    </span>
  );
}

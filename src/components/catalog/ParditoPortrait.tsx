"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Usa la mascota corporativa; mantiene el espacio reservado si falla el archivo. */
export default function ParditoPortrait({ className, decorative = false }: { className?: string; decorative?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center", className || "h-40 w-32")}>
      {failed ? <span aria-hidden="true" className="rounded-full bg-red-100 px-5 py-4 text-2xl font-black text-brand-red">P</span> : (
        <Image src="/brand/pardito-assistant-v2.png" alt={decorative ? "" : "PARDITO, mascota de Ferretería Pardo"} fill sizes="160px" className="object-contain" onError={() => setFailed(true)} />
      )}
    </span>
  );
}

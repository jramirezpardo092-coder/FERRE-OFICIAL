"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Product, ProductImage } from "@/lib/types";
import { cn } from "@/lib/utils";

// Esta validación local evita importar todo el archivo de enriquecimiento al navegador.
function getLocalProductImagePath(src: unknown): string | null {
  if (typeof src !== "string" || src.startsWith("//") || src.split("/").includes("..")) return null;
  if (!/^\/?[a-zA-Z0-9][a-zA-Z0-9/_. -]*\.(avif|webp|png|jpe?g)$/i.test(src)) return null;
  return `/${src.replace(/^\//, "")}`;
}

interface Props {
  product: Product;
  sizes?: string;
  className?: string;
  imageClassName?: string;
  active?: boolean;
  showGalleryControls?: boolean;
  priority?: boolean;
}

export default function ProductMedia({
  product,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  className,
  imageClassName,
  active = false,
  showGalleryControls = false,
  priority = false,
}: Props) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const [secondaryRequested, setSecondaryRequested] = useState(false);
  const [loadedSecondary, setLoadedSecondary] = useState<string | null>(null);
  const [alternateSelected, setAlternateSelected] = useState(false);
  const isActive = active || alternateSelected;
  const candidates = useMemo(() => {
    const images = new Map<string, ProductImage>();
    const primaryPath = getLocalProductImagePath(product.img);
    if (primaryPath) images.set(primaryPath, { src: primaryPath, alt: product.nombre, verified: true });
    (product.gallery ?? []).forEach((image) => {
      const src = getLocalProductImagePath(image.src);
      if (image.verified === true && src && !images.has(src)) images.set(src, { ...image, src });
    });
    return [...images.values()];
  }, [product.img, product.gallery, product.nombre]);
  const available = candidates.filter((image) => !failedSources.includes(image.src));
  const primary = available[0];
  const secondary = available[1];

  useEffect(() => {
    setFailedSources([]);
    setSecondaryRequested(false);
    setLoadedSecondary(null);
    setAlternateSelected(false);
  }, [product.id, product.img, product.gallery]);
  useEffect(() => {
    // La segunda foto se descarga al interactuar, no en todas las tarjetas a la vez.
    if (isActive) setSecondaryRequested(true);
  }, [isActive, product.id, product.img, product.gallery]);

  const failImage = (src: string) => setFailedSources((failed) => failed.includes(src) ? failed : [...failed, src]);
  const showSecondary = isActive && secondary && loadedSecondary === secondary.src;

  return (
    <div className={cn("relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-950", className)}>
      {primary ? (
        <>
          <Image
            src={primary.src}
            alt={primary.alt || product.nombre}
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className={cn("object-contain p-5 transition-opacity duration-200 motion-reduce:transition-none", showSecondary ? "opacity-0" : "opacity-100", imageClassName)}
            onError={() => failImage(primary.src)}
          />
          {secondaryRequested && secondary && (
            <Image
              src={secondary.src}
              alt=""
              aria-hidden="true"
              fill
              sizes={sizes}
              loading="lazy"
              className={cn("object-contain p-5 transition-opacity duration-200 motion-reduce:transition-none", showSecondary ? "opacity-100" : "opacity-0", imageClassName)}
              onLoad={() => setLoadedSecondary(secondary.src)}
              onError={() => failImage(secondary.src)}
            />
          )}
          {showGalleryControls && secondary && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              {[false, true].map((alternate, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setAlternateSelected(alternate)}
                  aria-label={`Ver foto ${index + 1} de ${product.nombre}`}
                  aria-pressed={alternateSelected === alternate}
                  className={cn("min-h-10 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm", alternateSelected === alternate ? "border-brand-red bg-brand-red text-white" : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200")}
                >
                  Foto {index + 1}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-gray-500 dark:text-gray-400">
          <svg className="h-9 w-9 text-gray-300 dark:text-gray-600" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2H6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Sin foto disponible</span>
        </div>
      )}
    </div>
  );
}

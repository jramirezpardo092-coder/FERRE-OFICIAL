"use client";

import { useEffect, useId, useMemo, useState } from "react";
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
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const imageId = `product-photo-${useId().replace(/:/g, "")}`;
  const candidates = useMemo(() => {
    const images = new Map<string, ProductImage>();
    const primaryPath = getLocalProductImagePath(product.img);
    if (primaryPath) images.set(primaryPath, { src: primaryPath, alt: product.nombre, verified: true });
    (product.gallery ?? []).forEach((image) => {
      const src = getLocalProductImagePath(image.src);
      if (image.verified !== true || !src) return;
      const existing = images.get(src);
      // The approved description also belongs to the legacy primary image.
      if (!existing || image.alt?.trim()) images.set(src, { ...existing, ...image, src });
    });
    return [...images.values()];
  }, [product.img, product.gallery, product.nombre]);
  const available = candidates.filter((image) => !failedSources.includes(image.src));
  const primary = available[0];
  const secondary = available[1];
  const selected = available.find((image) => image.src === selectedSource) || primary;
  const selectedIndex = selected ? candidates.findIndex((image) => image.src === selected.src) : -1;

  useEffect(() => {
    setFailedSources([]);
    setSecondaryRequested(false);
    setLoadedSecondary(null);
    setSelectedSource(null);
  }, [product.id, product.img, product.gallery]);
  useEffect(() => {
    // La segunda foto se descarga al interactuar, no en todas las tarjetas a la vez.
    if (active && !showGalleryControls) setSecondaryRequested(true);
  }, [active, showGalleryControls, product.id, product.img, product.gallery]);

  const failImage = (src: string) => setFailedSources((failed) => failed.includes(src) ? failed : [...failed, src]);
  const showSecondary = active && secondary && loadedSecondary === secondary.src;

  return (
    <div className={cn("overflow-hidden bg-gray-50 dark:bg-gray-950", className)}>
      <div className="relative aspect-square">
      {primary && selected ? showGalleryControls ? (
        // Only the selected photo mounts: choosing a later photo never downloads the whole gallery.
        <Image
          key={selected.src}
          id={imageId}
          src={selected.src}
          alt={selected.alt?.trim() || product.nombre}
          // Los WebP importados ya son sin pérdida: servirlos directamente conserva sus píxeles.
          unoptimized={selected.src.startsWith("/products/whatsapp/")}
          quality={100}
          fill
          sizes={sizes}
          priority={priority && selectedIndex === 0}
          loading={priority && selectedIndex === 0 ? undefined : "lazy"}
          className={cn("object-contain p-5", imageClassName)}
          onError={() => failImage(selected.src)}
        />
      ) : (
        <>
          <Image
            src={primary.src}
            alt={showSecondary ? "" : primary.alt?.trim() || product.nombre}
            unoptimized={primary.src.startsWith("/products/whatsapp/")}
            quality={100}
            aria-hidden={showSecondary ? true : undefined}
            fill
            sizes={sizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className={cn("object-contain p-5 transition-opacity duration-200 motion-reduce:transition-none", showSecondary ? "opacity-0" : "opacity-100", imageClassName)}
            onError={() => failImage(primary.src)}
          />
          {secondaryRequested && secondary && (
            <Image
              key={secondary.src}
              src={secondary.src}
              alt={showSecondary ? secondary.alt?.trim() || product.nombre : ""}
              unoptimized={secondary.src.startsWith("/products/whatsapp/")}
              quality={100}
              aria-hidden={showSecondary ? undefined : true}
              fill
              sizes={sizes}
              loading="lazy"
              className={cn("object-contain p-5 transition-opacity duration-200 motion-reduce:transition-none", showSecondary ? "opacity-100" : "opacity-0", imageClassName)}
              onLoad={() => setLoadedSecondary(secondary.src)}
              onError={() => failImage(secondary.src)}
            />
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
      {showGalleryControls && candidates.length > 0 && (
        <div className="border-t border-gray-200 bg-white px-3 py-3 dark:border-gray-800 dark:bg-gray-900">
          {candidates.length > 1 && <div role="group" aria-label={`Fotos de ${product.nombre}`} className="flex flex-wrap justify-center gap-2">
            {candidates.map((image, index) => {
              const unavailable = failedSources.includes(image.src);
              const isSelected = selected?.src === image.src;
              return <button
                key={image.src}
                type="button"
                disabled={unavailable}
                onClick={() => setSelectedSource(image.src)}
                aria-label={unavailable ? `Foto ${index + 1} no disponible` : `Ver foto ${index + 1} de ${product.nombre}`}
                aria-controls={selected ? imageId : undefined}
                aria-pressed={isSelected}
                className={cn("min-h-11 min-w-11 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red disabled:cursor-default disabled:opacity-40", isSelected ? "border-brand-red bg-brand-red text-white" : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200")}
              >Foto {index + 1}</button>;
            })}
          </div>}
          {selected && <a
            href={selected.src}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ampliar foto ${selectedIndex + 1} de ${product.nombre} (se abre en otra pestaña)`}
            className={cn("mx-auto flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red dark:text-gray-200 dark:hover:bg-gray-800", candidates.length > 1 && "mt-2")}
          >
            <svg className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-5.2-5.2M10 7v6m-3-3h6M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Ampliar imagen
          </a>}
          <p role="status" aria-live="polite" className="sr-only">{selected ? `Foto ${selectedIndex + 1} de ${candidates.length}: ${selected.alt?.trim() || product.nombre}` : "Sin fotos disponibles."}</p>
          {failedSources.length > 0 && <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">Una foto no está disponible.{selected ? " Mostramos otra imagen." : ""}</p>}
        </div>
      )}
    </div>
  );
}

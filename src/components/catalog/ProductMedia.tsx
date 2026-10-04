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
  /** Miniatura de 72 px para la lista móvil. */
  compact?: boolean;
  /** Por defecto sigue compact; false permite la grilla en escritorio. */
  compactDesktop?: boolean;
}

const CATEGORY_ICON_PATHS: Record<string, string> = {
    "Cerrajería": "M7 10V7a5 5 0 0110 0v3M5 10h14v11H5zM12 14v3",
    "Herramientas": "M14 6a5 5 0 00-6 6L3 17a3 3 0 004 4l5-5a5 5 0 006-6l-4 3-3-3 3-4z",
    "Herrajes para Muebles": "M4 4h16v16H4zM4 12h16M10 8h4M10 16h4",
    "Tornillería y Fijación": "M8 3h8v4H8zM10 7v13h4V7M9 11h6M9 15h6M10 20l2 2 2-2",
    "Adhesivos y Sellantes": "M9 3h6v3H9zM8 6h8l2 14H6L8 6zM9 12h6",
    "Eléctrico": "M9 2v5M15 2v5M7 7h10v4a5 5 0 01-10 0V7zM12 16v6",
    "Fontanería": "M3 7h10V3h8v8h-8v10H5V11H3V7zM13 7v4M5 11h8",
    "Seguridad Industrial": "M3 16v-2a9 9 0 0118 0v2M7 13V8M17 13V8M10 6V3h4v3M2 16h20v4H2z",
};

function CategoryIcon({ category }: { category: string }) {
  return <svg className="h-8 w-8 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={CATEGORY_ICON_PATHS[category] || "M3 7h18v14H3zM8 7V3h8v4M3 12h18M10 10h4v4h-4z"} />
  </svg>;
}

export default function ProductMedia({
  product,
  sizes = "(max-width: 640px) 72px, (max-width: 1024px) 33vw, 280px",
  className,
  imageClassName,
  active = false,
  showGalleryControls = false,
  priority = false,
  compact = false,
  compactDesktop = compact,
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
  const imageSizes = compact && compactDesktop ? "72px" : sizes;
  const mediaPadding = compact ? compactDesktop ? "p-1.5" : "p-1.5 sm:p-5" : "p-5";

  return (
    <div className={cn("overflow-hidden bg-gray-50 dark:bg-gray-950", compact && "w-[72px] shrink-0", compact && !compactDesktop && "sm:w-full", className)}>
      {/* Sin una foto verificada, el icono no reserva un cuadrado vacío de toda la tarjeta. */}
      <div className={cn("relative", primary ? "aspect-square" : "h-[72px] sm:h-24", !primary && compactDesktop && "sm:h-[72px]")}>
      {primary && selected ? showGalleryControls ? (
        // Only the selected photo mounts: choosing a later photo never downloads the whole gallery.
        <Image
          key={selected.src}
          id={imageId}
          src={selected.src}
          alt={selected.alt?.trim() || product.nombre}
          quality={75}
          fill
          sizes={imageSizes}
          priority={priority && selectedIndex === 0}
          loading={priority && selectedIndex === 0 ? undefined : "lazy"}
          className={cn("object-contain", mediaPadding, imageClassName)}
          onError={() => failImage(selected.src)}
        />
      ) : (
        <>
          <Image
            src={primary.src}
            alt={showSecondary ? "" : primary.alt?.trim() || product.nombre}
            quality={75}
            aria-hidden={showSecondary ? true : undefined}
            fill
            sizes={imageSizes}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            className={cn("object-contain transition-opacity duration-200 motion-reduce:transition-none", mediaPadding, showSecondary ? "opacity-0" : "opacity-100", imageClassName)}
            onError={() => failImage(primary.src)}
          />
          {secondaryRequested && secondary && (
            <Image
              key={secondary.src}
              src={secondary.src}
              alt={showSecondary ? secondary.alt?.trim() || product.nombre : ""}
              quality={75}
              aria-hidden={showSecondary ? undefined : true}
              fill
              sizes={imageSizes}
              loading="lazy"
              className={cn("object-contain transition-opacity duration-200 motion-reduce:transition-none", mediaPadding, showSecondary ? "opacity-100" : "opacity-0", imageClassName)}
              onLoad={() => setLoadedSecondary(secondary.src)}
              onError={() => failImage(secondary.src)}
            />
          )}
        </>
      ) : (
        <div role="img" aria-label={`${product.nombre}: sin foto disponible; categoría ${product.cat}`} className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 text-center text-gray-600 dark:text-gray-300">
          <CategoryIcon category={product.cat} />
          <span aria-hidden="true" className={cn("text-xs", compact && (compactDesktop ? "sr-only" : "sr-only sm:not-sr-only"))}>Sin foto disponible</span>
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
          {failedSources.length > 0 && <p className="mt-2 text-center text-xs text-gray-600 dark:text-gray-300">Una foto no está disponible.{selected ? " Mostramos otra imagen." : ""}</p>}
        </div>
      )}
    </div>
  );
}

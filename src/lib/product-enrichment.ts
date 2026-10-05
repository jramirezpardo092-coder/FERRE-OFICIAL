import enrichmentData from "@/data/product-enrichment.json";
import type { Product, ProductImage, ProductSpec } from "./types";

export type ProductEnrichment = {
  gallery?: ProductImage[];
  specs?: ProductSpec[];
};

export type ProductEnrichmentMap = Record<string, ProductEnrichment>;

/** Las fotos deben existir en public; una URL blob de WhatsApp no es un archivo durable. */
export function getLocalProductImagePath(src: unknown): string | null {
  if (typeof src !== "string" || src.startsWith("//") || src.split("/").includes("..")) return null;
  if (!/^\/?[a-zA-Z0-9][a-zA-Z0-9/_. -]*\.(avif|webp|png|jpe?g)$/i.test(src)) return null;
  return `/${src.replace(/^\//, "")}`;
}

function verifiedGallery(gallery: unknown): ProductImage[] {
  if (!Array.isArray(gallery)) return [];
  const images = new Map<string, ProductImage>();
  gallery.forEach((image: unknown) => {
    if (!image || typeof image !== "object") return;
    const candidate = image as Partial<ProductImage>;
    const src = getLocalProductImagePath(candidate.src);
    if (candidate.verified !== true || !src || images.has(src)) return;
    images.set(src, {
      src,
      verified: true,
      ...(["manufacturer-render", "supplier-render", "technical-diagram", "profile-detail", "component-detail", "pair-detail"].includes(candidate.kind || "") ? { kind: candidate.kind } : {}),
      ...(typeof candidate.alt === "string" && candidate.alt.trim() ? { alt: candidate.alt.trim() } : {}),
      ...(typeof candidate.caption === "string" && candidate.caption.trim() ? { caption: candidate.caption.trim() } : {}),
    });
  });
  return [...images.values()];
}

function verifiedSpecs(specs: unknown): ProductSpec[] {
  if (!Array.isArray(specs)) return [];
  return specs.flatMap((spec: unknown) => {
    if (!spec || typeof spec !== "object") return [];
    const candidate = spec as Partial<ProductSpec>;
    if (candidate.verified !== true || typeof candidate.label !== "string" || typeof candidate.value !== "string") return [];
    const label = candidate.label.trim();
    const value = candidate.value.trim();
    return label && value ? [{ label, value, verified: true as const }] : [];
  });
}

export function enrichProduct(
  product: Product,
  entries: ProductEnrichmentMap = enrichmentData as ProductEnrichmentMap,
): Product {
  // El SKU se cruza literalmente: "0005" y "5" son productos diferentes.
  if (!Object.prototype.hasOwnProperty.call(entries, product.id)) return product;
  const entry = entries[product.id];
  if (!entry || typeof entry !== "object") return product;
  const gallery = verifiedGallery(entry.gallery);
  const specs = verifiedSpecs(entry.specs);
  if (!gallery.length && !specs.length) return product;

  // El enriquecimiento no puede sustituir precios, impuestos, stock ni códigos de Siigo.
  return {
    ...product,
    ...(gallery.length ? { gallery, img: gallery[0].src.slice(1) } : {}),
    ...(specs.length ? { specs } : {}),
  };
}

export function enrichProducts(products: Product[], entries?: ProductEnrichmentMap): Product[] {
  return products.map((product) => enrichProduct(product, entries));
}

import type { Product, ProductImage } from "./types";

const MEDIA_LABELS: Record<NonNullable<ProductImage["kind"]>, string> = {
  "manufacturer-render": "Ilustración del fabricante",
  "supplier-render": "Ilustración del distribuidor",
  "technical-diagram": "Ficha técnica",
  "profile-detail": "Detalle del perfil; no muestra el largo completo",
  "component-detail": "Vista de un componente",
  "pair-detail": "Vista de una pieza del par",
};

/** Keep the precise source limitation visible, including shared-size and excluded-parts caveats. */
export function getProductImageCaption(image?: ProductImage): string {
  if (!image) return "";
  return image.caption?.trim() || (image.kind ? MEDIA_LABELS[image.kind] || "" : "");
}

/** The same initial caption is available during SSR, before the interactive media reports changes. */
export function getProductPrimaryImageCaption(product: Product): string {
  const primary = product.img?.replace(/^\//, "");
  const gallery = (product.gallery || []).filter(image => image.verified === true);
  const image = primary ? gallery.find(image => image.src.replace(/^\//, "") === primary) : gallery[0];
  return getProductImageCaption(image);
}

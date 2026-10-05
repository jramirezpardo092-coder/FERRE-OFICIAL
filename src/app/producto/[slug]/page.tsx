import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogProduct, getCatalogProducts, getRelatedCatalogProducts } from "@/lib/catalog-service";
import { getLocalProductImagePath } from "@/lib/product-enrichment";
import { formatCOP, getDiscountPercent, hasVerifiedPrice, getUnitPriceWithTax, getAvailableQuantity, formatQuantity } from "@/lib/utils";
import { getProductJsonLd } from "@/lib/seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import ProductMedia from "@/components/catalog/ProductMedia";
import ProductSpecs from "@/components/catalog/ProductSpecs";
import ProductActions from "./ProductActions";
import PriceDisplay from "@/components/catalog/PriceDisplay";
import PricePreferenceToggle from "@/components/catalog/PricePreferenceToggle";
import { getStockLabel } from "@/lib/quote-presentation";
import { getProductSlug, getProductPath, getCategoryPath } from "@/lib/catalog/routes";
import { displayBrand, normalizeProductName, formatUnit } from "@/lib/catalog/normalize";
import { getCatalogPrice } from "@/lib/catalog-filters";

// Generate static pages for all products
export function generateStaticParams() {
  return getCatalogProducts().map((product) => ({ slug: getProductSlug(product) }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = getCatalogProduct(params.slug);
  if (!product) return { title: "Producto no encontrado" };
  const name = normalizeProductName(product.nombre);
  const brand = displayBrand(product.brand);
  const title = [name, brand && !name.toLowerCase().includes(brand.toLowerCase()) ? brand : "", "Ferretería Pardo Bogotá"].filter(Boolean).join(" | ");
  const grossPrice = getCatalogPrice(product, "gross");
  const priceDescription = grossPrice !== null
    ? `${formatCOP(grossPrice)} IVA incluido`
    : "Precio por confirmar";

  return {
    title,
    alternates: { canonical: getProductPath(product) },
    description: `${priceDescription}. ${name}${brand && !name.toLowerCase().includes(brand.toLowerCase()) ? ` de ${brand}` : ""}. Consulta disponibilidad en Ferretería Pardo, Bogotá. Cotiza por WhatsApp.`,
    openGraph: {
      title: name,
      description: `${priceDescription} | ${product.cat}`,
      images: [getLocalProductImagePath(product.img) || "/logo-ferreteria-pardo.png"],
    },
  };
}

export default function ProductoPage({ params }: { params: { slug: string } }) {
  // El servidor une contenido verificado por SKU; el cliente recibe solo esta ficha y sus relacionados.
  const product = getCatalogProduct(params.slug);
  if (!product) notFound();

  const priceConfirmed = hasVerifiedPrice(product);
  const rawDiscount = priceConfirmed && typeof product.original === "number" && Number.isFinite(product.original) && product.original > product.precio
    ? getDiscountPercent(product) : null;
  const discount = rawDiscount && rawDiscount > 0 ? rawDiscount : null;
  const priceWithTax = getUnitPriceWithTax(product);
  const stock = getAvailableQuantity(product);
  const inStock = stock > 0;
  const hasUnit = !!product.unidad.trim() && product.unidad.toLowerCase().trim() !== "consultar unidad";
  const stockLabel = `${formatQuantity(stock)} ${hasUnit ? product.unidad : "disponibles"}`;

  const related = getRelatedCatalogProducts(product.id);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getProductJsonLd(product)).replace(/</g, "\\u003c") }}
      />
      <Breadcrumbs
        items={[
          { label: "Catálogo", href: "/catalogo" },
          { label: product.cat, href: getCategoryPath(product.cat) },
          { label: normalizeProductName(product.nombre), href: getProductPath(product) },
        ]}
      />

      <section className="product-detail-page">
        <div className="product-detail-heading mb-5">
          <p className="mb-2 text-xs text-ink-2">{displayBrand(product.brand)} · SKU {product.id}{product.ref && product.ref !== product.id ? ` · Ref. ${product.ref}` : ""}</p>
          <div role="heading" aria-level={1} className="text-[28px] font-bold leading-8 text-ink">{normalizeProductName(product.nombre)}</div>
        </div>
        {/* Product detail */}
        <div className="mb-12 grid gap-8 md:grid-cols-2 lg:gap-12">
          {/* Image */}
          <div data-has-photo={!!product.img} className="product-detail-media relative self-start overflow-hidden rounded-card border border-line">
            {discount && (
              <span className="absolute left-4 top-4 z-10 rounded-control border border-line bg-surface px-3 py-1 font-mono text-sm font-medium text-ink">
                -{discount}%
              </span>
            )}
            <ProductMedia product={product} showGalleryControls priority sizes="(max-width: 639px) calc(80vw - 27.2px), (max-width: 767px) calc(80vw - 40px), (max-width: 1023px) calc(40vw - 33.6px), (max-width: 1279px) calc(40vw - 46.4px), 465.6px" />
          </div>

          {/* Info */}
          <div className="product-detail-information min-w-0">
            <div className="product-detail-identity">
            {displayBrand(product.brand) && <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink">{displayBrand(product.brand)}</p>}
            <p className="mb-3 break-words font-mono text-xs tracking-[0.025em] text-ink-2">SKU {product.id}{product.ref && product.ref !== product.id ? ` · Ref. ${product.ref}` : ""}</p>
            <h1 className="mb-4 font-display text-[28px] font-bold leading-8 tracking-[-0.025em] text-ink md:text-[40px] md:leading-[44px]">
              {normalizeProductName(product.nombre)}
            </h1>
            </div>

            <p className="mb-6 flex items-center gap-2 text-sm text-ink-2"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${!inStock ? "bg-muted" : stock <= 3 ? "bg-warn" : "bg-ok"}`} />{getStockLabel(product)}</p>

            <div className="mb-6 border-y border-line py-5">
              <PricePreferenceToggle idPrefix="detail-price" className="mb-4" />
              <PriceDisplay product={product} principalClassName="text-[40px] leading-[44px]" />
            </div>

            {/* Actions - Client Component */}
            <ProductActions product={product} />

            <div className="mt-8">
              <h2 className="mb-2 font-display text-[22px] font-bold leading-7 text-ink">Datos del producto</h2>
              <dl className="product-detail-data text-sm leading-5">
                <div><dt className="text-ink-2">SKU</dt><dd className="break-words font-mono text-ink">{product.id}</dd></div>
                {product.ref && <div><dt className="text-ink-2">Referencia</dt><dd className="break-words font-mono text-ink">{product.ref}</dd></div>}
                {displayBrand(product.brand) && <div><dt className="text-ink-2">Marca</dt><dd className="text-ink">{displayBrand(product.brand)}</dd></div>}
                {formatUnit(product.unidad) && <div><dt className="text-ink-2">Unidad</dt><dd className="font-mono text-ink">{formatUnit(product.unidad)}</dd></div>}
                <div><dt className="text-ink-2">Categoría</dt><dd><Link href={getCategoryPath(product.cat)} className="inline-flex min-h-11 min-w-11 items-center text-ink underline decoration-control underline-offset-4">{product.cat}</Link></dd></div>
                <div><dt className="text-ink-2">Disponibilidad</dt><dd className="text-ink">{getStockLabel(product)}</dd></div>
              </dl>
            </div>
            {!!product.specs?.length && <div className="mt-6"><h2 className="font-display text-[22px] font-bold leading-7 text-ink">Especificaciones</h2><ProductSpecs specs={product.specs} limit={12} /></div>}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <h2 className="mb-6 font-display text-[28px] font-bold leading-8 tracking-[-0.025em] text-ink">Productos relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

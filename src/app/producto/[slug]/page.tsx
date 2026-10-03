import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogProduct, getCatalogProducts, getRelatedCatalogProducts } from "@/lib/catalog-service";
import { getLocalProductImagePath } from "@/lib/product-enrichment";
import { formatCOP, getDiscountPercent, hasVerifiedPrice, formatTaxLabel, getUnitPriceWithTax, getAvailableQuantity, formatQuantity } from "@/lib/utils";
import { getProductJsonLd } from "@/lib/seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import ProductMedia from "@/components/catalog/ProductMedia";
import ProductSpecs from "@/components/catalog/ProductSpecs";
import ProductActions from "./ProductActions";

// Generate static pages for all products
export function generateStaticParams() {
  return getCatalogProducts().map((product) => ({ slug: product.id }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = getCatalogProduct(params.slug);
  if (!product) return { title: "Producto no encontrado" };
  const priceDescription = hasVerifiedPrice(product)
    ? `${formatCOP(product.precio)} ${formatTaxLabel(product)}`
    : "Precio por confirmar";

  return {
    title: `${product.nombre} - ${product.brand} | Ferretería Pardo`,
    alternates: { canonical: `/producto/${encodeURIComponent(product.id)}` },
    description: `${product.nombre} de ${product.brand}. ${priceDescription}. Consulta disponibilidad en Ferretería Pardo, Bogotá. Cotiza por WhatsApp.`,
    openGraph: {
      title: `${product.nombre} - ${product.brand}`,
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
          { label: product.cat, href: `/catalogo?cat=${encodeURIComponent(product.cat)}` },
          { label: product.nombre, href: `/producto/${encodeURIComponent(product.id)}` },
        ]}
      />

      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Product detail */}
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 mb-16">
          {/* Image */}
          <div className="relative self-start rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {discount && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-xl z-10">
                -{discount}%
              </span>
            )}
            <ProductMedia product={product} showGalleryControls priority sizes="(max-width: 768px) 100vw, 50vw" imageClassName="p-8 pb-16" />
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="text-sm font-bold text-brand-red dark:text-red-400 uppercase tracking-wider mb-2">
              {product.brand}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
              {product.nombre}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg font-mono">
                SKU {product.id}
              </span>
              <span className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg font-medium">
                {product.unidad}
              </span>
              <span className={`text-xs px-3 py-1 rounded-lg font-semibold ${
                inStock
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                  : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900"
              }`}>
                {inStock ? `En stock (${stockLabel})` : "Consultar disponibilidad"}
              </span>
            </div>

            {/* Price */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 mb-8">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className={`${priceConfirmed ? "text-4xl" : "text-2xl"} font-extrabold text-gray-900 dark:text-white`}>
                  {priceConfirmed ? formatCOP(product.precio) : "Precio por confirmar"}
                </span>
                <span className="text-sm text-amber-600 dark:text-amber-400 font-semibold">{formatTaxLabel(product)}{hasUnit ? ` / ${product.unidad}` : " · unidad por confirmar"}</span>
              </div>
              {priceConfirmed && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Precio base sin IVA</p>}
              {priceWithTax !== null && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Precio con IVA: <span className="font-semibold">{formatCOP(priceWithTax)}</span>
                </p>
              )}
              {discount && product.original && (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-lg text-gray-400 line-through">
                    {formatCOP(product.original)}
                  </span>
                  <span className="text-sm font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">
                    Ahorras {discount}%
                  </span>
                </div>
              )}
            </div>

            {product.ref && product.ref !== product.id && <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">Ref. {product.ref}</p>}
            {!!product.specs?.length && (
              <div className="mb-8">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Especificaciones</h2>
                <ProductSpecs specs={product.specs} limit={12} />
              </div>
            )}

            {/* Actions - Client Component */}
            <ProductActions product={product} />

            {/* Category */}
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="text-sm text-gray-500">
                <span className="font-medium text-gray-700 dark:text-gray-300">Categoría:</span>{" "}
                <Link
                  href={`/catalogo?cat=${encodeURIComponent(product.cat)}`}
                  className="text-brand-red hover:underline"
                >
                  {product.cat}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Productos relacionados</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {related.map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

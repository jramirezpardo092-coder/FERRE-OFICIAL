import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Product } from "@/lib/types";
import { formatCOP, getProductImage, getDiscountPercent, hasVerifiedPrice, formatTaxLabel, getUnitPriceWithTax, getAvailableQuantity, formatQuantity } from "@/lib/utils";
import { getProductJsonLd } from "@/lib/seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductActions from "./ProductActions";
import productsData from "@/data/products.json";

const products = productsData as Product[];

// Generate static pages for all products
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.id }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = products.find((p) => p.id === params.slug);
  if (!product) return { title: "Producto no encontrado" };
  const priceDescription = hasVerifiedPrice(product)
    ? `${formatCOP(product.precio)} ${formatTaxLabel(product)}`
    : "Precio por confirmar";

  return {
    title: `${product.nombre} - ${product.brand} | Ferretería Pardo`,
    alternates: { canonical: `/producto/${product.id}` },
    description: `${product.nombre} de ${product.brand}. ${priceDescription}. Consulta disponibilidad en Ferretería Pardo, Bogotá. Cotiza por WhatsApp.`,
    openGraph: {
      title: `${product.nombre} - ${product.brand}`,
      description: `${priceDescription} | ${product.cat}`,
      images: product.img ? [`/${product.img}`] : ["/logo-ferreteria-pardo.png"],
    },
  };
}

export default function ProductoPage({ params }: { params: { slug: string } }) {
  const product = products.find((p) => p.id === params.slug);
  if (!product) notFound();

  const priceConfirmed = hasVerifiedPrice(product);
  const discount = priceConfirmed ? getDiscountPercent(product) : null;
  const priceWithTax = getUnitPriceWithTax(product);
  const imgSrc = getProductImage(product);
  const stock = getAvailableQuantity(product);
  const inStock = stock > 0;
  const hasUnit = product.unidad.trim() !== "" && product.unidad !== "Consultar unidad";
  const stockLabel = `${formatQuantity(stock)} ${hasUnit ? product.unidad : "disponibles"}`;

  // Related products (same category, different product)
  const related = products
    .filter((p) => p.cat === product.cat && p.id !== product.id)
    .slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getProductJsonLd(product)) }}
      />
      <Breadcrumbs
        items={[
          { label: "Catálogo", href: "/catalogo" },
          { label: product.cat, href: `/catalogo?cat=${encodeURIComponent(product.cat)}` },
          { label: product.nombre, href: `/producto/${product.id}` },
        ]}
      />

      <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Product detail */}
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 mb-16">
          {/* Image */}
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden aspect-square">
            {discount && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-xl z-10">
                -{discount}%
              </span>
            )}
            {product.img ? (
              <Image
                src={imgSrc}
                alt={product.nombre}
                fill
                className="object-contain p-8"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm mt-2">Sin imagen disponible</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="text-sm font-bold text-brand-red uppercase tracking-wider mb-2">
              {product.brand}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
              {product.nombre}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg font-medium">
                Ref: {product.id}
              </span>
              <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg font-medium">
                {product.unidad}
              </span>
              <span className={`text-xs px-3 py-1 rounded-lg font-semibold ${
                inStock
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
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
                <span className="text-sm text-amber-600 dark:text-amber-400 font-semibold">{formatTaxLabel(product)} / {product.unidad}</span>
              </div>
              {priceWithTax !== null && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Precio con IVA: <span className="font-semibold">{formatCOP(priceWithTax)}</span>
                </p>
              )}
              {priceConfirmed && product.original && product.original > product.precio && (
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
              {related.map((p) => {
                const relatedPriceConfirmed = hasVerifiedPrice(p);
                const relDiscount = relatedPriceConfirmed ? getDiscountPercent(p) : null;
                return (
                  <Link
                    key={p.id}
                    href={`/producto/${p.id}`}
                    className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative aspect-square bg-gray-50 dark:bg-gray-800">
                      {relDiscount && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md z-10">
                          -{relDiscount}%
                        </span>
                      )}
                      {p.img ? (
                        <Image
                          src={getProductImage(p)}
                          alt={p.nombre}
                          fill
                          className="object-contain p-4"
                          sizes="(max-width: 768px) 50vw, 25vw"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-[10px] font-bold text-brand-red uppercase">{p.brand}</div>
                      <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 mb-1 group-hover:text-brand-red transition-colors">
                        {p.nombre}
                      </h3>
                      <div className="text-sm font-extrabold text-gray-900 dark:text-white">
                        {relatedPriceConfirmed ? formatCOP(p.precio) : "Precio por confirmar"}{" "}
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{formatTaxLabel(p)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

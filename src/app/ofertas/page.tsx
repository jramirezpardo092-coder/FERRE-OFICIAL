import type { Metadata } from "next";
import { Suspense } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import CatalogClient from "@/components/CatalogClient";
import { Product } from "@/lib/types";
import productsData from "@/data/products.json";

export const metadata: Metadata = {
  title: "Ofertas | Hasta 50% Dto | Ferretería Pardo SAS",
  description:
    "Descubre productos en oferta en Ferretería Pardo. Herramientas, cerrajería y ferretería con descuentos. Cotiza por WhatsApp.",
};

export default function OfertasPage() {
  const allProducts = productsData as Product[];
  const offerProducts = allProducts.filter((p) => p.disc && p.disc > 0);

  return (
    <>
      <Breadcrumbs items={[{ label: "Ofertas", href: "/ofertas" }]} />

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
            Ofertas del mes
          </h1>
          <p className="text-gray-500">
            {offerProducts.length} productos con descuento. Precios + IVA.
          </p>
        </div>

        <Suspense fallback={<div className="py-20 text-center text-gray-400">Cargando productos...</div>}>
          <CatalogClient products={offerProducts} />
        </Suspense>
      </section>
    </>
  );
}

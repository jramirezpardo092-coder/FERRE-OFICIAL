import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import CatalogClient from "@/components/CatalogClient";
import ParditoState from "@/components/catalog/ParditoState";
import { Product } from "@/lib/types";
import productsData from "@/data/products.json";

export const metadata: Metadata = {
  title: "Ofertas y descuentos | Ferretería Pardo SAS",
  description:
    "Consulta las ofertas vigentes de Ferretería Pardo y cotiza por WhatsApp.",
};

export default function OfertasPage() {
  const allProducts = productsData as Product[];
  const offerProducts = allProducts.filter((p) => p.disc && p.disc > 0);

  return (
    <>
      <Breadcrumbs items={[{ label: "Ofertas", href: "/ofertas" }]} />

      <section className="site-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink  mb-2">
            Ofertas vigentes
          </h1>
          <p className="text-ink-2 ">
            {offerProducts.length > 0 ? `${offerProducts.length} productos con descuento. Precios antes de IVA.` : "Pronto encontrarás aquí nuestras promociones confirmadas."}
          </p>
        </div>

        {offerProducts.length === 0 ? (
          <div className="rounded-card border border-line  bg-surface  p-8 text-center">
            <p className="text-ink-2  mb-5">Mientras tanto, explora el catálogo y consulta la disponibilidad de lo que necesitas.</p>
            <Link href="/catalogo" className="btn-primary">Ver catálogo</Link>
          </div>
        ) : <Suspense fallback={<ParditoState />}>
          <CatalogClient offersOnly />
        </Suspense>}
      </section>
    </>
  );
}

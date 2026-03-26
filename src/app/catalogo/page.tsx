import { Suspense } from "react";
import CatalogClient from "@/components/CatalogClient";
import { Product } from "@/lib/types";
import productsData from "@/data/products.json";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo | Ferretería Pardo SAS",
  description:
    "Explora nuestro catálogo de 5.000+ productos: herrajes, cerrajería, herramientas, tornillería y más. Cotiza directo por WhatsApp.",
};

export default function CatalogoPage() {
  const products = productsData as Product[];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Catálogo completo</h1>
          <p className="text-gray-500 mt-1 text-sm">
            5.000+ productos de ferretería · Precios + IVA · Cotiza por WhatsApp
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-green border-t-transparent" />
        </div>
      }>
        <CatalogClient products={products} />
      </Suspense>
    </div>
  );
}

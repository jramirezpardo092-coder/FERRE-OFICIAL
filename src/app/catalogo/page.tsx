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
    <div className="min-h-screen bg-gray-50/30">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Catálogo completo</h1>
              <p className="text-gray-400 mt-0.5 text-sm">
                {products.length.toLocaleString("es-CO")} productos · Precios + IVA · Cotiza por WhatsApp
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {products.filter(p => p.stock > 0).length.toLocaleString("es-CO")} con stock
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {products.filter(p => !!p.img).length.toLocaleString("es-CO")} con foto
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {products.filter(p => p.disc && p.disc > 0).length.toLocaleString("es-CO")} en oferta
              </span>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-3 border-brand-red border-t-transparent" />
          <p className="text-sm text-gray-400">Cargando catálogo...</p>
        </div>
      }>
        <CatalogClient products={products} />
      </Suspense>
    </div>
  );
}

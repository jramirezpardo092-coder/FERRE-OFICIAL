import { Suspense } from "react";
import CatalogClient from "@/components/CatalogClient";
import ParditoState from "@/components/catalog/ParditoState";
import { Product } from "@/lib/types";
import productsData from "@/data/products.json";
import catalogSource from "@/data/catalog-source.json";
import { getAvailableQuantity } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo | Ferretería Pardo SAS",
  description:
    `Explora ${productsData.length.toLocaleString("es-CO")} productos: herrajes, cerrajería, herramientas, tornillería y más. Cotiza directo por WhatsApp.`,
};

export default function CatalogoPage() {
  const products = productsData as Product[];
  const withStock = products.filter(p => getAvailableQuantity(p) > 0).length;
  const onSale = products.filter(p => p.disc && p.disc > 0).length;
  const updatedDate = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" })
    .format(new Date(`${catalogSource.updatedAt}T12:00:00-05:00`));

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-950">
      {/* Branded page header */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-red/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-brand-red/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-[1400px] mx-auto px-4 py-8 md:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-[2px] bg-brand-red rounded-full" />
                <span className="text-[10px] font-bold text-brand-red uppercase tracking-[0.2em]">Catálogo</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                Encuentra tu próxima solución
              </h1>
              <p className="text-gray-400 mt-1 text-sm">
                {products.length.toLocaleString("es-CO")} productos · Precios antes de IVA · Cotiza por WhatsApp
              </p>
              <p className="mt-2 text-xs text-gray-300">Selección basada en nuestras ventas del último año. Incluye agotados para consultar reposición.</p>
              <p className="text-gray-400 mt-2 text-xs">Actualización: {updatedDate}. Confirma disponibilidad al cotizar.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs text-gray-300 font-medium">{withStock.toLocaleString("es-CO")} con stock</span>
              </div>
              {onSale > 0 && <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span className="text-xs text-gray-300 font-medium">{onSale.toLocaleString("es-CO")} en oferta</span>
              </div>}
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-8"><ParditoState /></div>}>
        <CatalogClient />
      </Suspense>
    </div>
  );
}

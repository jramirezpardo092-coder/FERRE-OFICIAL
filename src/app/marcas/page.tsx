import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Product } from "@/lib/types";
import productsData from "@/data/products.json";

export const metadata: Metadata = {
  title: "Marcas | Ferretería Pardo SAS - Bogotá",
  description:
    "Conoce las marcas que distribuimos: Yale, Stanley, DeWalt, Makita, Bosch, Truper y más. Productos originales con garantía.",
};

export default function MarcasPage() {
  const products = productsData as Product[];

  // Count products per brand
  const brandCounts: Record<string, number> = {};
  products.forEach((p) => {
    const brand = (p.brand || "Sin marca").toUpperCase();
    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
  });

  const brands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return (
    <>
      <Breadcrumbs items={[{ label: "Marcas", href: "/marcas" }]} />

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            Nuestras marcas
          </h1>
          <p className="text-gray-500 text-lg">
            Solo trabajamos con marcas que garantizan calidad y respaldo.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.name}
              href={`/catalogo?brand=${encodeURIComponent(brand.name)}`}
              className="group bg-white rounded-2xl border border-gray-200 p-6 text-center hover:shadow-xl hover:border-brand-red/30 hover:scale-105 transition-all duration-300"
            >
              <div className="text-lg font-bold text-gray-900 group-hover:text-brand-red transition-colors mb-2">
                {brand.name}
              </div>
              <div className="text-sm text-gray-400">
                {brand.count.toLocaleString("es-CO")} productos
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

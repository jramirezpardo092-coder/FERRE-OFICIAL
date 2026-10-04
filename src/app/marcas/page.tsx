import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Product } from "@/lib/types";
import productsData from "@/data/products.json";

export const metadata: Metadata = {
  title: "Marcas | Ferretería Pardo SAS - Bogotá",
  description:
    "Explora las marcas del catálogo de Ferretería Pardo. Encuentra productos y cotiza por WhatsApp.",
};

export default function MarcasPage() {
  const products = productsData as Product[];

  // Count products per brand
  const brandCounts: Record<string, number> = {};
  products.forEach((p) => {
    const brand = p.brand || "Sin marca";
    if (brand === "Sin marca") return;
    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
  });

  const brands = Object.entries(brandCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return (
    <>
      <Breadcrumbs items={[{ label: "Marcas", href: "/marcas" }]} />

      <section className="site-container py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink  mb-3">
            Nuestras marcas
          </h1>
          <p className="text-ink-2  text-lg">
            Encuentra los productos de cada marca en nuestro catálogo.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.name}
              href={`/catalogo?brand=${encodeURIComponent(brand.name)}`}
              className="group bg-surface  rounded-card border border-line  p-6 text-center hover:shadow-card hover:border-brand  transition-all duration-200"
            >
              <div className="text-lg font-bold text-ink  group-hover:text-brand-text transition-colors mb-2">
                {brand.name}
              </div>
              <div className="text-sm text-ink-2">
                {brand.count.toLocaleString("es-CO")} productos
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

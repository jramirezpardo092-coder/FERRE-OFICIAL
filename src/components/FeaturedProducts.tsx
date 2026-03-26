"use client";

import { useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";

interface Props {
  products: Product[];
}

export default function FeaturedProducts({ products }: Props) {
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  // Show products with photos and discounts first
  const featured = products
    .filter((p) => p.img && p.disc && p.disc >= 15)
    .slice(0, 8);

  if (featured.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">Lo que más buscan</h2>
            <p className="section-subtitle mt-2">Productos destacados con fotos reales</p>
          </div>
          <Link
            href="/catalogo"
            className="hidden md:inline-flex items-center gap-1 text-brand-green font-semibold text-sm hover:underline"
          >
            Ver todo el catálogo →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {featured.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenModal={setModalProduct}
            />
          ))}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link href="/catalogo" className="btn-primary text-sm">
            Ver catálogo completo →
          </Link>
        </div>
      </div>

      <ProductModal product={modalProduct} onClose={() => setModalProduct(null)} />
    </section>
  );
}

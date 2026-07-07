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

  // Los productos llegan ya filtrados/ordenados desde el servidor
  const featured = products.slice(0, 8);

  if (featured.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-gray-50 dark:bg-gray-900/50 relative">
      <div className="absolute top-0 left-0 right-0 divider-gradient" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-[2px] bg-brand-red rounded-full" />
              <span className="text-xs font-bold text-brand-red uppercase tracking-[0.2em]">Destacados</span>
            </div>
            <h2 className="section-title">Lo que mas buscan</h2>
            <p className="section-subtitle mt-2">Los mejores descuentos del catálogo</p>
          </div>
          <Link
            href="/catalogo"
            className="hidden md:inline-flex items-center gap-2 text-brand-red font-semibold text-sm hover:text-red-700 transition-colors"
          >
            Ver todo el catálogo
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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

        <div className="mt-8 text-center md:hidden">
          <Link href="/catalogo" className="btn-primary text-sm">
            Ver catálogo completo
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <ProductModal product={modalProduct} onClose={() => setModalProduct(null)} />
    </section>
  );
}

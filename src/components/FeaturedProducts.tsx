"use client";

import BrandStripes from "./BrandStripes";
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
    <section className="home-section bg-surface  relative">
      <div className="absolute top-0 left-0 right-0 border-t border-line" />

      <div className="site-container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <BrandStripes className="h-4 w-7" />
              <span className="text-xs font-bold text-brand-text uppercase tracking-[0.2em]">Destacados</span>
            </div>
            <h2 className="section-title">Productos para tu proyecto</h2>
            <p className="section-subtitle mt-2">Explora nuestras categorías y prepara tu cotización</p>
          </div>
          <Link
            href="/catalogo"
            className="hidden min-h-11 md:inline-flex min-h-11 items-center gap-2 text-ink font-semibold text-sm hover:text-ink-2 transition-colors"
          >
            Ver todo el catálogo
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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

"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export default function CategoryGrid() {
  return (
    <section id="categorias" className="py-16 md:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="section-title">Explora por categoría</h2>
          <p className="section-subtitle mx-auto mt-3">
            9 categorías con todo lo que necesitas para tu obra, hogar o negocio
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/catalogo?cat=${encodeURIComponent(cat.name)}`}
              className="group bg-white rounded-2xl p-5 text-center card-hover border border-gray-100 hover:border-brand-green/20"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>
              <h3 className="font-bold text-sm text-gray-800 group-hover:text-brand-green transition-colors leading-tight">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

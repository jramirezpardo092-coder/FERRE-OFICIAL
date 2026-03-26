"use client";

import Link from "next/link";
import { BRANDS } from "@/lib/constants";

export default function BrandCarousel() {
  return (
    <section id="marcas" className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Marcas que nos respaldan
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trabajamos con las mejores marcas del mercado ferretero
          </p>
        </div>

        {/* Premium brand grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
          {BRANDS.map((brand) => (
            <div
              key={brand}
              className="bg-gray-50 rounded-3xl px-6 py-8 flex items-center justify-center border-2 border-gray-100 hover:border-brand-green/30 hover:bg-green-50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <span className="font-black text-lg text-gray-800 group-hover:text-brand-green transition-colors duration-300 text-center">
                {brand}
              </span>
            </div>
          ))}
        </div>

        {/* See all brands link */}
        <div className="text-center mt-10">
          <Link
            href="/marcas"
            className="inline-flex items-center gap-2 text-brand-green font-bold hover:text-green-700 transition-colors"
          >
            Ver todas las marcas
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

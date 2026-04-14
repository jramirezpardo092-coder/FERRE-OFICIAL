"use client";

import Link from "next/link";
import { BRANDS } from "@/lib/constants";

export default function BrandCarousel() {
  return (
    <section id="marcas" className="py-20 md:py-28 bg-white relative">
      <div className="absolute top-0 left-0 right-0 divider-gradient" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-[2px] bg-brand-red rounded-full" />
            <span className="text-xs font-bold text-brand-red uppercase tracking-[0.2em]">Marcas</span>
            <div className="w-8 h-[2px] bg-brand-red rounded-full" />
          </div>
          <h2 className="section-title">
            Marcas que nos respaldan
          </h2>
          <p className="section-subtitle mx-auto mt-4">
            Trabajamos con las mejores marcas del mercado ferretero
          </p>
        </div>

        {/* Brand grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {BRANDS.map((brand) => (
            <div
              key={brand}
              className="bg-gray-50 rounded-2xl px-5 py-7 flex items-center justify-center border border-gray-100 hover:border-brand-red/20 hover:bg-white hover:shadow-lg hover:shadow-red-900/5 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
            >
              <span className="font-black text-base text-gray-600 group-hover:text-brand-red transition-colors duration-300 text-center">
                {brand}
              </span>
            </div>
          ))}
        </div>

        {/* See all brands */}
        <div className="text-center mt-10">
          <Link
            href="/marcas"
            className="inline-flex items-center gap-2 text-brand-red font-bold text-sm hover:text-red-700 transition-colors"
          >
            Ver todas las marcas
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

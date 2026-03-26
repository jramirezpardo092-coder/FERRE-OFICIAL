"use client";

import { BRANDS } from "@/lib/constants";

export default function BrandCarousel() {
  return (
    <section id="marcas" className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="section-title">Marcas que nos respaldan</h2>
          <p className="section-subtitle mx-auto mt-3">
            Trabajamos con las mejores marcas del mercado ferretero
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {BRANDS.map((brand) => (
            <div
              key={brand}
              className="bg-gray-50 rounded-xl px-6 py-4 flex items-center justify-center min-w-[120px] hover:bg-green-50 hover:border-brand-green/20 border border-transparent transition-all cursor-pointer group"
            >
              <span className="font-bold text-sm text-gray-600 group-hover:text-brand-green transition-colors">
                {brand}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

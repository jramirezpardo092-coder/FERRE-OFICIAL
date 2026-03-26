"use client";

import { BRANDS } from "@/lib/constants";

export default function BrandCarousel() {
  return (
    <section id="marcas" className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Marcas que nos respaldan
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trabajamos con las mejores marcas del mercado ferretero
          </p>
        </div>

        {/* Premium brand grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {BRANDS.map((brand) => (
            <div
              key={brand}
              className="bg-gray-50 rounded-2xl px-8 py-6 flex items-center justify-center border border-gray-200 hover:border-brand-green/40 hover:bg-green-50 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            >
              <span className="font-bold text-base md:text-lg text-gray-700 group-hover:text-brand-green transition-colors duration-300 text-center">
                {brand}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

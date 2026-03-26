"use client";

import React from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

// SVG Icon Components
const IconKey = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const IconWrench = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const IconHammer = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 15l6-6m-5.5-2.5l2.5-2.5a2 2 0 112.828 2.828l-10 10A2 2 0 118 22l10-10z" />
  </svg>
);

const IconCabinet = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2" />
  </svg>
);

const IconBolt = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconScrew = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={2} />
  </svg>
);

const IconDroplet = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-3" />
  </svg>
);

const IconFaucet = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v6" />
  </svg>
);

const IconShield = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622c5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

// Icon mapping for each category
const iconMap: Record<string, () => React.ReactElement> = {
  "Cerrajería": IconKey,
  "Ferretería General": IconWrench,
  "Herramientas": IconHammer,
  "Herrajes para Muebles": IconCabinet,
  "Tornillería y Fijación": IconScrew,
  "Adhesivos y Sellantes": IconDroplet,
  "Eléctrico": IconBolt,
  "Fontanería": IconFaucet,
  "Seguridad Industrial": IconShield,
};

// Product counts for each category (hardcoded)
const productCounts: Record<string, string> = {
  "Cerrajería": "1,550",
  "Ferretería General": "2,180",
  "Herramientas": "890",
  "Herrajes para Muebles": "650",
  "Tornillería y Fijación": "1,240",
  "Adhesivos y Sellantes": "420",
  "Eléctrico": "780",
  "Fontanería": "950",
  "Seguridad Industrial": "370",
};

export default function CategoryGrid() {
  return (
    <section id="categorias" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="section-title text-3xl md:text-4xl lg:text-5xl font-black text-gray-900">
            Explora por categoría
          </h2>
          <p className="section-subtitle mx-auto mt-4 text-lg md:text-xl text-gray-500">
            9 categorías con todo lo que necesitas para tu obra, hogar o negocio
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8 mb-12">
          {CATEGORIES.map((cat) => {
            const IconComponent = iconMap[cat.name] || IconWrench;
            const count = productCounts[cat.name] || "0";
            return (
              <Link
                key={cat.slug}
                href={`/catalogo?cat=${encodeURIComponent(cat.name)}`}
                className="group"
              >
                <div className="h-full bg-white rounded-3xl p-8 md:p-10 text-center border border-gray-200 hover:border-brand-green/30 hover:shadow-2xl hover:shadow-green-900/10 transition-all duration-300 hover:scale-105 flex flex-col items-center justify-center">
                  {/* Product Count Badge */}
                  <div className="absolute top-3 right-3 bg-brand-orange/10 text-brand-orange text-xs font-bold px-3 py-1.5 rounded-full">
                    {count}
                  </div>

                  {/* Icon Container */}
                  <div className="w-16 h-16 rounded-3xl bg-green-50 flex items-center justify-center text-brand-green mb-4 group-hover:bg-brand-green group-hover:text-white transition-all duration-300">
                    <IconComponent />
                  </div>

                  {/* Category Name */}
                  <h3 className="font-bold text-base md:text-lg text-gray-800 group-hover:text-brand-green transition-colors duration-300 leading-tight">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All Categories Button */}
        <div className="flex justify-center">
          <Link
            href="/catalogo"
            className="inline-flex items-center px-10 py-4 bg-brand-green text-white font-semibold rounded-2xl hover:bg-green-700 hover:shadow-lg transition-all duration-300 hover:scale-105 text-base"
          >
            Ver todas las categorías
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

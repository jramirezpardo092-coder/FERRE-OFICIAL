import BrandStripes from "./BrandStripes";
import React from "react";
import { getCategoryPath } from "@/lib/catalog/routes";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

// SVG Icon Components
const IconKey = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const IconWrench = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const IconHammer = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 15l6-6m-5.5-2.5l2.5-2.5a2 2 0 112.828 2.828l-10 10A2 2 0 118 22l10-10z" />
  </svg>
);

const IconCabinet = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4v2" />
  </svg>
);

const IconBolt = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconScrew = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={1.5} />
  </svg>
);

const IconDroplet = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-3" />
  </svg>
);

const IconFaucet = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v6" />
  </svg>
);

const IconShield = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622c5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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

interface Props {
  counts: Record<string, number>;
}

export default function CategoryGrid({ counts: productCounts }: Props) {
  return (
    <section id="categorias" className="home-section bg-surface  relative">
      {/* Subtle top divider */}
      <div className="absolute top-0 left-0 right-0 border-t border-line" />

      <div className="site-container">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <BrandStripes className="h-4 w-7" />
            <span className="text-xs font-bold text-brand-text uppercase tracking-[0.2em]">Categorías</span>
            <BrandStripes className="h-4 w-7" />
          </div>
          <h2 className="section-title">
            Explora por categoría
          </h2>
          <p className="section-subtitle mx-auto mt-4">
            9 categorías con todo lo que necesitas para tu obra, hogar o negocio
          </p>
        </div>

        {/* Category Grid — flex wrap to center the last row */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-5 mb-12">
          {CATEGORIES.filter(cat => (productCounts[cat.name] || 0) > 0).map((cat) => {
            const IconComponent = iconMap[cat.name] || IconWrench;
            const count = (productCounts[cat.name] || 0).toLocaleString("es-CO");
            return (
              <Link
                key={cat.slug}
                href={getCategoryPath(cat.name)}
                className="group w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.75rem)] lg:w-[calc(20%-1rem)]"
              >
                <div className="relative h-full bg-surface  rounded-card p-6 md:p-8 text-center border border-line  hover:border-brand  hover:shadow-card  transition-all duration-200  flex flex-col items-center justify-center">
                  {/* Product Count Badge */}
                  <div className="absolute top-3 right-3 bg-paper  text-ink-2  font-mono text-xs px-2.5 py-1 rounded-control group-hover:bg-brand-tint  group-hover:text-brand-text transition-colors duration-200">
                    {count}
                  </div>

                  {/* Icon Container */}
                  <div className="w-14 h-14 rounded-card bg-surface flex items-center justify-center text-ink-2 mb-4 group-hover:bg-brand-tint group-hover:text-ink transition-all duration-200 group-hover:shadow-card ">
                    <IconComponent />
                  </div>

                  {/* Category Name */}
                  <h3 className="font-bold text-sm md:text-base text-ink-2  group-hover:text-brand-text transition-colors duration-200 leading-tight">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="flex justify-center">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-ink text-on-ink font-semibold rounded-card hover:bg-ink hover:shadow-card transition-all duration-200  text-sm"
          >
            Ver todas las categorías
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

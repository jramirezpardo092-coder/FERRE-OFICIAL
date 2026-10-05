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
  const categories = CATEGORIES.filter(category => (productCounts[category.name] || 0) > 0);
  return <section id="categorias" className="home-section bg-surface">
    <div className="site-container">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow mb-3 text-brand-text">Encuentra lo tuyo</p><h2 className="section-title">Cada proyecto, su solución.</h2></div>
        <Link href="/catalogo" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink">Ver todo el catálogo <span aria-hidden="true">→</span></Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map(category => {
          const Icon = iconMap[category.name] || IconWrench;
          return <Link key={category.slug} href={getCategoryPath(category.name)} className="category-tile group flex min-h-[150px] flex-col rounded-card bg-paper p-5 transition-colors hover:bg-brand-tint">
            <span aria-hidden="true" className="mb-5 text-ink-2 group-hover:text-brand-text"><Icon /></span>
            <h3 className="mt-auto text-sm font-semibold text-ink">{category.name}</h3>
            <p className="mt-1 text-xs text-ink-2">{productCounts[category.name].toLocaleString("es-CO")} referencias <span aria-hidden="true" className="float-right">↗</span></p>
          </Link>;
        })}
        <Link href="/contacto" className="flex min-h-[150px] flex-col justify-between rounded-card bg-ink p-5 text-on-ink"><span className="text-xl" aria-hidden="true">↗</span><div><h3 className="text-sm font-semibold">¿Buscas algo más?</h3><p className="mt-1 text-xs">Cuéntanos tu proyecto</p></div></Link>
      </div>
    </div>
  </section>;
}

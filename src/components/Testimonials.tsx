"use client";

import BrandStripes from "./BrandStripes";

const TESTIMONIALS = [
  {
    name: "Carlos M.",
    role: "Contratista",
    text: "Llevo más de 10 años comprando en Ferretería Pardo. Siempre tienen stock y la atención es excelente.",
    rating: 5,
    initials: "CM",
  },
  {
    name: "María R.",
    role: "Diseñadora de interiores",
    text: "Los herrajes para muebles que manejan son de primera calidad. El catálogo web me ha facilitado mucho las cotizaciones.",
    rating: 5,
    initials: "MR",
  },
  {
    name: "Andrés P.",
    role: "Cerrajero",
    text: "La variedad de productos Yale que tienen es impresionante. Definitivamente mi proveedor de confianza en Bogotá.",
    rating: 5,
    initials: "AP",
  },
];

export default function Testimonials() {
  return (
    <section className="home-section bg-surface  relative">
      <div className="absolute top-0 left-0 right-0 border-t border-line" />

      <div className="site-container">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <BrandStripes className="h-4 w-7" />
            <span className="text-xs font-bold text-brand-text uppercase tracking-[0.2em]">Testimonios</span>
            <BrandStripes className="h-4 w-7" />
          </div>
          <h2 className="section-title">Lo que dicen nuestros clientes</h2>
          <p className="section-subtitle mx-auto mt-4">
            Más de 60 años construyendo confianza en Bogotá
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-surface  rounded-card p-7 md:p-8 border border-line   hover:shadow-card hover:border-ink-2  transition-all duration-200">
              {/* Stars */}
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-ink-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-ink-2  text-[15px] leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>

              <div className="flex items-center gap-3 pt-5 border-t border-line ">
                <div className="w-10 h-10 rounded-card bg-brand-tint text-brand-text  font-bold text-sm flex items-center justify-center">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-ink ">{t.name}</div>
                  <div className="text-xs text-ink-2 ">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

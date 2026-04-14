"use client";

const TESTIMONIALS = [
  {
    name: "Carlos M.",
    role: "Contratista",
    text: "Llevo mas de 10 anos comprando en Ferreteria Pardo. Siempre tienen stock y la atencion es excelente.",
    rating: 5,
    initials: "CM",
  },
  {
    name: "Maria R.",
    role: "Disenadora de interiores",
    text: "Los herrajes para muebles que manejan son de primera calidad. El catalogo web me ha facilitado mucho las cotizaciones.",
    rating: 5,
    initials: "MR",
  },
  {
    name: "Andres P.",
    role: "Cerrajero",
    text: "La variedad de productos Yale que tienen es impresionante. Definitivamente mi proveedor de confianza en Bogota.",
    rating: 5,
    initials: "AP",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 md:py-28 bg-gray-50 relative">
      <div className="absolute top-0 left-0 right-0 divider-gradient" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-[2px] bg-brand-red rounded-full" />
            <span className="text-xs font-bold text-brand-red uppercase tracking-[0.2em]">Testimonios</span>
            <div className="w-8 h-[2px] bg-brand-red rounded-full" />
          </div>
          <h2 className="section-title">Lo que dicen nuestros clientes</h2>
          <p className="section-subtitle mx-auto mt-4">
            Mas de 60 anos construyendo confianza en Bogota
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-7 md:p-8 border border-gray-100 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 hover:border-gray-200 transition-all duration-300">
              {/* Stars */}
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-gray-600 text-[15px] leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>

              <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-brand-red/10 text-brand-red font-bold text-sm flex items-center justify-center">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

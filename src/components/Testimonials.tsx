"use client";

const TESTIMONIALS = [
  {
    name: "Carlos M.",
    role: "Contratista",
    text: "Llevo más de 10 años comprando en Ferretería Pardo. Siempre tienen stock y la atención es excelente.",
    rating: 5,
  },
  {
    name: "María R.",
    role: "Diseñadora de interiores",
    text: "Los herrajes para muebles que manejan son de primera calidad. El catálogo web me ha facilitado mucho las cotizaciones.",
    rating: 5,
  },
  {
    name: "Andrés P.",
    role: "Cerrajero",
    text: "La variedad de productos Yale que tienen es impresionante. Definitivamente mi proveedor de confianza en Bogotá.",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 md:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="section-title">Lo que dicen nuestros clientes</h2>
          <p className="section-subtitle mx-auto mt-3">
            Más de 60 años construyendo confianza en Bogotá
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:scale-[1.03] hover:shadow-xl hover:border-brand-green/20 transition-all duration-300">
              {/* Decorative quote mark */}
              <div className="text-6xl text-green-100 font-serif mb-2">"</div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <svg key={i} className="w-6 h-6 text-brand-orange" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-gray-600 text-base leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>

              <div>
                <div className="text-base font-bold text-gray-900">{t.name}</div>
                <div className="text-sm text-brand-green font-medium">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

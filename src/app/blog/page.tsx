import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Guías de compra | Ferretería Pardo SAS",
  description:
    "Qué revisar antes de comprar cerraduras, herramientas y herrajes para muebles. Prepara tus medidas y cotiza con Ferretería Pardo en Bogotá.",
};

const GUIDES = [
  {
    number: "01",
    category: "Cerrajería",
    title: "Elige una cerradura compatible con tu puerta",
    description:
      "Las medidas y el tipo de puerta ayudan a identificar la referencia adecuada antes de comprar.",
    checklist: [
      "Anota el material y el espesor de la puerta, y si abre hacia la derecha o hacia la izquierda.",
      "Si vas a reemplazar una cerradura, toma una foto de la pieza y de su referencia. Mide la distancia entre el borde de la puerta y el centro del cilindro.",
      "Confirma qué incluye la referencia: cilindro, llaves, manijas y accesorios. Consulta la compatibilidad con un asesor.",
    ],
  },
  {
    number: "02",
    category: "Herramientas",
    title: "Compra la herramienta para la tarea que necesitas",
    description:
      "Una lista clara de uso y accesorios te permite comparar las opciones del catálogo.",
    checklist: [
      "Describe la tarea y el material con el que trabajarás: madera, metal u otro. Indica si el uso será ocasional o frecuente.",
      "Revisa las medidas y la compatibilidad de puntas, discos, brocas o accesorios en la ficha del fabricante.",
      "Pregunta qué incluye el producto, qué accesorios se compran por separado y cuáles son las condiciones de garantía.",
    ],
  },
  {
    number: "03",
    category: "Herrajes para Muebles",
    title: "Encuentra el herraje que encaja en tu mueble",
    description:
      "Bisagras, correderas y manijas necesitan medidas precisas para que la compra sea compatible.",
    checklist: [
      "Mide el espesor del tablero y las dimensiones de la puerta o el cajón. Para manijas, anota la distancia entre los centros de los tornillos.",
      "Lleva una foto del herraje actual y de cómo queda en el mueble. Si tiene marca o referencia, inclúyelas en tu consulta.",
      "Confirma el acabado, el tipo de apertura y las especificaciones de carga del fabricante. Revisa si se vende por unidad o por par.",
    ],
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Breadcrumbs items={[{ label: "Guías de compra", href: "/blog" }]} />

      <section className="max-w-7xl mx-auto px-4 py-10 md:py-16">
        <div className="max-w-3xl mb-10 md:mb-14">
          <span className="inline-flex items-center gap-2 text-xs font-bold text-brand-red dark:text-red-400 uppercase tracking-[0.2em] mb-4">
            <span className="w-8 h-0.5 bg-current rounded-full" aria-hidden="true" />
            Compra con confianza
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-5 text-balance">
            Antes de comprar, revisa estos detalles
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Prepara tus medidas, fotos y referencias. Estas guías te ayudan a elegir
            productos compatibles y a pedir una cotización más completa.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {GUIDES.map((guide) => (
            <article
              key={guide.category}
              className="flex flex-col rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 md:p-8"
            >
              <div className="flex items-center justify-between gap-3 mb-6">
                <span className="text-xs font-bold text-brand-red dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-full">
                  {guide.category}
                </span>
                <span className="text-3xl font-black text-gray-200 dark:text-gray-700" aria-hidden="true">
                  {guide.number}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {guide.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                {guide.description}
              </p>
              <ul className="space-y-4 mb-8">
                {guide.checklist.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    <svg className="w-5 h-5 shrink-0 text-brand-red dark:text-red-400 mt-0.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12l4 4L19 6" />
                    </svg>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/catalogo?cat=${encodeURIComponent(guide.category)}`}
                className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-brand-red dark:text-red-400 hover:underline underline-offset-4"
              >
                Ver {guide.category.toLowerCase()}
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10 md:mt-14 rounded-3xl bg-gradient-to-r from-brand-red-dark to-brand-red px-6 py-8 md:p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-extrabold mb-3">¿Tienes dudas sobre una referencia?</h2>
            <p className="text-red-100 leading-relaxed">
              Comparte la foto del producto, las medidas y la cantidad que necesitas.
              Un asesor te ayudará a revisar las opciones disponibles.
            </p>
          </div>
          <a
            href={SITE.social.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex justify-center items-center gap-2 bg-white text-brand-red font-bold px-6 py-3.5 rounded-xl hover:bg-red-50 transition-colors shrink-0"
          >
            Consultar con un asesor
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </div>
  );
}

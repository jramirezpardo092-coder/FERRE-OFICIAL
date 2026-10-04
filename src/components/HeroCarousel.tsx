"use client";

import { getCategoryPath } from "@/lib/catalog/routes";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SLIDES = [
  { title: "Todo para tu próximo proyecto.", subtitle: "Herrajes, cerrajería y herramientas. Encuentra lo que necesitas y cotiza con quienes saben de ferretería.", cta: { label: "Explorar catálogo", href: "/catalogo" }, badge: "Ferretería Pardo · Desde 1966", bg: "from-[#7F1D1D] via-[#B9212B] to-[#D02731]" },
  { title: "De la referencia a tu pedido.", subtitle: "Busca por nombre, marca o código y arma tu lista. Te confirmamos disponibilidad y precio final por WhatsApp.", cta: { label: "Armar mi pedido", href: "/catalogo" }, badge: "Tu proyecto empieza aquí", bg: "from-gray-950 via-gray-900 to-[#7F1D1D]" },
  { title: "Elige con confianza. Te ayudamos.", subtitle: "¿Tienes una referencia, una medida o una lista para tu obra? Habla con un asesor y encuentra la opción adecuada.", cta: { label: "Hablar con un asesor", href: SITE.social.whatsapp }, badge: "Asesoría ferretera en Bogotá", bg: "from-[#7F1D1D] via-[#A81F27] to-[#D02731]" },
];
const QUICK_CATEGORIES = ["Cerrajería", "Herramientas", "Herrajes para Muebles"];

export default function HeroCarousel({ productCount, brandCount, categoryCount }: {
  productCount: number; brandCount: number; categoryCount: number;
}) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const next = useCallback(() => setCurrent((value) => (value + 1) % SLIDES.length), []);
  const prev = () => setCurrent((value) => (value - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (isPaused || rotationPaused || reducedMotion) return;
    const timer = window.setInterval(next, 8000);
    return () => window.clearInterval(timer);
  }, [next, isPaused, rotationPaused, reducedMotion]);

  const slide = SLIDES[current];
  const stats = [
    { value: productCount.toLocaleString("es-CO"), label: "Productos en catálogo" },
    { value: "Desde 1966", label: "En Bogotá" },
    { value: brandCount, label: "Marcas en catálogo" },
    { value: categoryCount, label: "Categorías" },
  ];
  return (
    <section aria-label="Bienvenido a Ferretería Pardo" aria-roledescription="carrusel"
      className="relative overflow-hidden text-white"
      onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false); }}>
      <div className={cn("absolute inset-0 bg-gradient-to-br transition-colors duration-700", slide.bg)} />
      <div aria-hidden="true" className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full border-[80px] border-white/[0.04]" />
      <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-14 lg:py-16">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-16 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] uppercase text-red-100 mb-5">{slide.badge}</p>
            <div aria-live={isPaused || rotationPaused ? "polite" : "off"} aria-atomic="true">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.08] text-balance max-w-xl">{slide.title}</h1>
              <p className="text-base md:text-lg text-white/85 leading-relaxed max-w-lg mt-5 mb-7">{slide.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {slide.cta.href.startsWith("https://") ? (
                <a href={slide.cta.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-6 py-3.5 rounded-xl hover:bg-red-50 transition-colors">{slide.cta.label} <span aria-hidden="true">→</span></a>
              ) : (
                <Link href={slide.cta.href} className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-6 py-3.5 rounded-xl hover:bg-red-50 transition-colors">{slide.cta.label} <span aria-hidden="true">→</span></Link>
              )}
              <Link href="/contacto" className="inline-flex items-center gap-2 border border-white/40 px-6 py-3.5 rounded-xl font-semibold hover:bg-white/10 transition-colors">Visítanos en Bogotá</Link>
            </div>
            <div className="flex items-center gap-3 mt-7">
              <button type="button" onClick={prev} aria-label="Diapositiva anterior" className="w-9 h-9 rounded-lg border border-white/30 hover:bg-white/10">←</button>
              {SLIDES.map((item, index) => (
                <button type="button" key={item.badge} onClick={() => setCurrent(index)} aria-label={"Ver diapositiva " + (index + 1)} aria-current={current === index ? "true" : undefined} className="flex items-center justify-center w-8 h-9">
                  <span className={cn("h-2 rounded-full transition-all", current === index ? "w-7 bg-white" : "w-2 bg-white/45")} />
                </button>
              ))}
              <button type="button" onClick={next} aria-label="Siguiente diapositiva" className="w-9 h-9 rounded-lg border border-white/30 hover:bg-white/10">→</button>
              <button type="button" onClick={() => setRotationPaused((value) => !value)} aria-pressed={rotationPaused} className="text-xs text-white/90 underline underline-offset-4 px-2 py-2">{rotationPaused ? "Reanudar" : "Pausar"}</button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-3xl p-6 md:p-8 shadow-2xl shadow-red-950/20 border border-white/20">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-red mb-2">Empieza por aquí</p>
            <h2 className="text-2xl font-extrabold mb-2">¿Qué necesitas hoy?</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">Busca por producto, marca o referencia.</p>
            <form action="/catalogo" method="get" role="search">
              <label htmlFor="home-search" className="sr-only">Buscar productos en el catálogo</label>
              <div className="flex gap-2">
                <input id="home-search" name="q" type="search" placeholder="Ej. cerradura Yale" maxLength={120} className="w-full min-w-0 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 px-3 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-500" />
                <button type="submit" className="rounded-xl bg-brand-red hover:bg-brand-red-dark px-4 py-3 text-white text-sm font-bold transition-colors">Buscar</button>
              </div>
            </form>
            <div className="mt-5 mb-6">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">O explora una categoría</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_CATEGORIES.map((category) => (
                  <Link key={category} href={getCategoryPath(category)} className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-brand-red hover:text-brand-red transition-colors">{category}</Link>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 pt-5 flex gap-3 items-start">
              <span aria-hidden="true" className="rounded-xl bg-green-50 dark:bg-green-950 px-3 py-2 text-green-700 dark:text-green-300 text-lg">↗</span>
              <div>
                <p className="text-sm font-bold">¿No encuentras la referencia?</p>
                <a href={SITE.social.whatsapp} target="_blank" rel="noreferrer" className="text-sm text-green-700 dark:text-green-400 underline underline-offset-4">Te ayudamos por WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/20 mt-9 pt-6">
          {stats.map((stat) => <div key={stat.label}><p className="text-xl md:text-2xl font-extrabold">{stat.value}</p><p className="text-xs text-white/80 mt-1">{stat.label}</p></div>)}
        </div>
      </div>
    </section>
  );
}

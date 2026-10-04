"use client";

import { getCategoryPath } from "@/lib/catalog/routes";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import BrandStripes from "./BrandStripes";

const SLIDES = [
  { title: "Todo para tu próximo proyecto.", subtitle: "Herrajes, cerrajería y herramientas. Encuentra lo que necesitas y cotiza con quienes saben de ferretería.", cta: { label: "Explorar catálogo", href: "/catalogo" }, badge: "Ferretería Pardo · Desde 1966" },
  { title: "De la referencia a tu pedido.", subtitle: "Busca por nombre, marca o código y arma tu lista. Te confirmamos disponibilidad y precio final por WhatsApp.", cta: { label: "Armar mi pedido", href: "/catalogo" }, badge: "Tu proyecto empieza aquí" },
  { title: "Elige con confianza. Te ayudamos.", subtitle: "¿Tienes una referencia, una medida o una lista para tu obra? Habla con un asesor y encuentra la opción adecuada.", cta: { label: "Hablar con un asesor", href: SITE.social.whatsapp }, badge: "Asesoría ferretera en Bogotá" },
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
      className="home-hero"
      onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false); }}>
      <BrandStripes className="pointer-events-none absolute right-4 top-1 h-6 w-11 opacity-70 lg:-right-4 lg:top-8 lg:h-40 lg:w-64" />
      <div className="site-container relative py-8 md:py-12">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-12 items-center">
          <div>
            <p className="mb-4 font-mono text-xs uppercase tracking-wider text-hero-muted">{slide.badge}</p>
            <div aria-live={isPaused || rotationPaused ? "polite" : "off"} aria-atomic="true">
              <h1 data-home-title className="max-w-xl text-balance font-display text-3xl font-extrabold leading-[1.04] md:text-5xl">{slide.title}</h1>
              <p data-home-intro className="text-base md:text-lg text-hero-muted leading-relaxed max-w-lg mt-5 mb-7">{slide.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {slide.cta.href.startsWith("https://") ? (
                <a href={slide.cta.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 min-h-11 rounded-control border border-hero-muted px-4 py-3 text-sm font-semibold text-hero-ink hover:bg-hero-ink/10 transition-colors">{slide.cta.label} <span aria-hidden="true">→</span></a>
              ) : (
                <Link href={slide.cta.href} className="inline-flex items-center gap-2 min-h-11 rounded-control border border-hero-muted px-4 py-3 text-sm font-semibold text-hero-ink hover:bg-hero-ink/10 transition-colors">{slide.cta.label} <span aria-hidden="true">→</span></Link>
              )}
              <Link href="/contacto" className="inline-flex items-center gap-2 min-h-11 rounded-control border border-hero-muted px-4 py-3 text-sm font-semibold hover:bg-hero-ink/10 transition-colors">Visítanos en Bogotá</Link>
            </div>
            <div className="flex items-center gap-3 mt-7">
              <button type="button" onClick={prev} aria-label="Diapositiva anterior" className="h-11 w-11 rounded-control border border-hero-muted transition-colors hover:bg-hero-ink/10">←</button>
              {SLIDES.map((item, index) => (
                <button type="button" key={item.badge} onClick={() => setCurrent(index)} aria-label={"Ver diapositiva " + (index + 1)} aria-current={current === index ? "true" : undefined} className="flex items-center justify-center w-11 h-11">
                  <span className={cn("h-1.5 rounded-control transition-all", current === index ? "w-7 bg-hero-ink" : "w-2 bg-hero-muted")} />
                </button>
              ))}
              <button type="button" onClick={next} aria-label="Siguiente diapositiva" className="h-11 w-11 rounded-control border border-hero-muted transition-colors hover:bg-hero-ink/10">→</button>
              <button type="button" onClick={() => setRotationPaused((value) => !value)} aria-pressed={rotationPaused} className="min-h-11 text-sm text-hero-ink underline underline-offset-4 px-2 py-2">{rotationPaused ? "Reanudar" : "Pausar"}</button>
            </div>
          </div>
          <div className="rounded-card border border-line bg-surface p-5 text-ink md:p-8">
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-2">Empieza por aquí</p>
            <h2 className="mb-2 text-2xl font-extrabold">¿Qué necesitas hoy?</h2>
            <p className="text-sm text-ink-2 mb-5">Busca por producto, marca o referencia.</p>
            <form action="/catalogo" method="get" role="search">
              <label htmlFor="home-search" className="sr-only">Buscar productos en el catálogo</label>
              <div className="flex gap-2">
                <input id="home-search" name="q" type="search" placeholder="Ej. cerradura Yale" maxLength={120} className="h-[52px] w-full min-w-0 rounded-control border border-control bg-surface px-3 text-base text-ink placeholder:text-ink-2 focus:border-ink" />
                <button type="submit" className="btn-primary h-[52px] px-4">Buscar</button>
              </div>
            </form>
            <div className="mt-5 mb-6">
              <p className="text-xs text-ink-2 mb-3">O explora una categoría</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_CATEGORIES.map((category) => (
                  <Link key={category} href={getCategoryPath(category)} className="inline-flex min-h-11 items-center rounded-chip border border-control px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-paper">{category}</Link>
                ))}
              </div>
            </div>
            <div className="border-t border-line pt-5 flex gap-3 items-start">
              <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control border border-control bg-surface text-lg text-wa">↗</span>
              <div>
                <p className="text-sm font-bold">¿No encuentras la referencia?</p>
                <a href={SITE.social.whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4">Te ayudamos por WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-hero-muted/40 mt-8 pt-6">
          {stats.map((stat) => <div key={stat.label}><p className="font-display text-xl md:text-2xl font-extrabold tabular-nums">{stat.value}</p><p className="text-xs text-hero-muted mt-1">{stat.label}</p></div>)}
        </div>
      </div>
    </section>
  );
}

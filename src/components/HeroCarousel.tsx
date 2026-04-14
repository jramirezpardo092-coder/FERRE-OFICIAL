"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    title: "Tu ferreteria de confianza desde 1966",
    subtitle: "5.000+ productos · Despacho 24h en Bogota",
    cta: { label: "Ver catalogo completo", href: "/catalogo" },
    ctaSecondary: { label: "Cotizar por WhatsApp", href: SITE.social.whatsapp },
    bg: "from-[#7F1D1D] via-[#D02731] to-[#A81F27]",
    accent: "from-orange-500/20 to-transparent",
    badge: "Desde 1966",
  },
  {
    title: "Ofertas del mes",
    subtitle: "Hasta 30% de descuento en herramientas y cerrajeria seleccionada",
    cta: { label: "Ver ofertas", href: "/ofertas" },
    ctaSecondary: null,
    bg: "from-gray-950 via-gray-900 to-gray-800",
    accent: "from-brand-red/10 to-transparent",
    badge: "Ofertas",
  },
  {
    title: "Siguenos en Instagram y gana 5% en tu primera compra",
    subtitle: "Enterate de novedades, tips ferreteros y promociones exclusivas",
    cta: { label: "Seguir @ferreteriapardo", href: SITE.social.instagram },
    ctaSecondary: { label: "Ver Facebook", href: SITE.social.facebook },
    bg: "from-[#7F1D1D] via-[#A81F27] to-[#D02731]",
    accent: "from-pink-500/10 to-transparent",
    badge: "Redes",
  },
];

const STATS = [
  { value: "5.000+", label: "Productos" },
  { value: "60+", label: "Anos de experiencia" },
  { value: "11", label: "Marcas reconocidas" },
  { value: "9", label: "Categorias" },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5500);
    return () => clearInterval(timer);
  }, [next, isPaused]);

  const slide = SLIDES[current];

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br transition-all duration-1000 opacity-100",
        slide.bg
      )} />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-white/[0.03] rounded-full blur-3xl" />
        <div className={cn("absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l", slide.accent)} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16 lg:py-20">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-white/70 tracking-[0.2em] uppercase bg-white/10 backdrop-blur-md border border-white/10 px-3.5 py-1 rounded-full">{slide.badge}</span>
          </div>

          {/* Content */}
          <h1 key={`title-${current}`} className="text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold text-white leading-[1.15] mb-4 animate-fade-in text-balance">
            {slide.title}
          </h1>
          <p key={`sub-${current}`} className="text-base md:text-lg text-white/60 mb-8 max-w-lg animate-fade-in leading-relaxed">
            {slide.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-10">
            {slide.cta.href.startsWith('http') ? (
              <a href={slide.cta.href} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-7 py-3.5 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-xl shadow-black/20 hover:shadow-2xl hover:-translate-y-0.5 text-sm">
                {slide.cta.label}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </a>
            ) : (
              <Link href={slide.cta.href}
                    className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-7 py-3.5 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-xl shadow-black/20 hover:shadow-2xl hover:-translate-y-0.5 text-sm">
                {slide.cta.label}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            )}
            {slide.ctaSecondary && (
              slide.ctaSecondary.href.startsWith('http') ? (
                <a href={slide.ctaSecondary.href} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-2 border border-white/25 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-all duration-200 text-sm backdrop-blur-sm">
                  {slide.ctaSecondary.label}
                </a>
              ) : (
                <Link href={slide.ctaSecondary.href}
                      className="inline-flex items-center gap-2 border border-white/25 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-all duration-200 text-sm backdrop-blur-sm">
                  {slide.ctaSecondary.label}
                </Link>
              )
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-white/[0.07] backdrop-blur-md rounded-2xl px-5 py-4 text-center border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300">
              <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{stat.value}</div>
              <div className="text-[11px] md:text-xs text-white/50 font-medium mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button
            onClick={prev}
            className="p-2.5 rounded-xl w-11 h-11 bg-white/[0.07] hover:bg-white/15 border border-white/10 hover:border-white/25 transition-all duration-200 text-white flex items-center justify-center"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "transition-all duration-300 rounded-full",
                  i === current
                    ? "w-10 h-3 bg-white"
                    : "w-3 h-3 bg-white/25 hover:bg-white/40"
                )}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="p-2.5 rounded-xl w-11 h-11 bg-white/[0.07] hover:bg-white/15 border border-white/10 hover:border-white/25 transition-all duration-200 text-white flex items-center justify-center"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    title: "Tu ferretería de confianza desde 1966",
    subtitle: "5.000+ productos · Despacho 24h en Bogotá",
    cta: { label: "Ver catálogo completo", href: "/catalogo" },
    ctaSecondary: { label: "Cotizar por WhatsApp", href: SITE.social.whatsapp },
    bg: "from-[#7F1D1D] via-[#D02731] to-[#A81F27]",
    badge: "Desde 1966",
  },
  {
    title: "Ofertas del mes",
    subtitle: "Hasta 30% de descuento en herramientas y cerrajería seleccionada",
    cta: { label: "Ver ofertas", href: "/ofertas" },
    ctaSecondary: null,
    bg: "from-gray-950 via-gray-900 to-gray-950",
    badge: "Ofertas",
  },
  {
    title: "Síguenos en Instagram y gana 5% en tu primera compra",
    subtitle: "Entérate de novedades, tips ferreteros y promociones exclusivas",
    cta: { label: "Seguir @ferreteriapardo", href: SITE.social.instagram },
    ctaSecondary: { label: "Ver Facebook", href: SITE.social.facebook },
    bg: "from-[#7F1D1D] via-[#A81F27] to-[#D02731]",
    badge: "Redes",
  },
];

const STATS = [
  { value: "5.000+", label: "Productos" },
  { value: "60+", label: "Años de experiencia" },
  { value: "11", label: "Marcas reconocidas" },
  { value: "9", label: "Categorías" },
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
        "absolute inset-0 bg-gradient-to-br transition-all duration-700 opacity-100",
        slide.bg
      )} />

      {/* Animated gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-40 animate-pulse" />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6 opacity-0 animate-fade-in">
            <div className="w-3 h-3 bg-[#f97316] rounded-full" />
            <span className="text-sm font-semibold text-white/90 tracking-widest uppercase bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full">{slide.badge}</span>
          </div>

          {/* Content */}
          <h1 key={`title-${current}`} className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-4 animate-fade-in text-balance">
            {slide.title}
          </h1>
          <p key={`sub-${current}`} className="text-xl md:text-2xl text-white/80 mb-8 max-w-xl animate-fade-in">
            {slide.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mb-12">
            {slide.cta.href.startsWith('http') ? (
              <a href={slide.cta.href} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-2 bg-white text-brand-red font-bold px-8 py-4 rounded-2xl hover:bg-red-50 transition-all shadow-lg hover:shadow-xl text-base">
                {slide.cta.label}
              </a>
            ) : (
              <Link href={slide.cta.href}
                    className="inline-flex items-center gap-2 bg-white text-brand-red font-bold px-8 py-4 rounded-2xl hover:bg-red-50 transition-all shadow-lg hover:shadow-xl text-base">
                {slide.cta.label}
              </Link>
            )}
            {slide.ctaSecondary && (
              slide.ctaSecondary.href.startsWith('http') ? (
                <a href={slide.ctaSecondary.href} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all text-base">
                  {slide.ctaSecondary.label}
                </a>
              ) : (
                <Link href={slide.ctaSecondary.href}
                      className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/10 transition-all text-base">
                  {slide.ctaSecondary.label}
                </Link>
              )
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-md rounded-3xl px-4 py-3 text-center border border-white/20 hover:border-white/40 transition-all">
              <div className="text-3xl md:text-4xl font-extrabold text-white">{stat.value}</div>
              <div className="text-xs md:text-sm text-white/70 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Navigation and dots container */}
        <div className="flex items-center justify-between mt-12">
          {/* Left arrow */}
          <button
            onClick={prev}
            className="p-2 rounded-2xl w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all text-white flex items-center justify-center"
            aria-label="Previous slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Carousel dots */}
          <div className="flex items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "transition-all duration-300",
                  i === current
                    ? "w-12 h-3.5 bg-brand-orange rounded-full"
                    : "w-3 h-3 bg-white/30 hover:bg-white/50 rounded-full"
                )}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Right arrow */}
          <button
            onClick={next}
            className="p-2 rounded-2xl w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 transition-all text-white flex items-center justify-center"
            aria-label="Next slide"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

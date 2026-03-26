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
    ctaSecondary: { label: "Cotizar por WhatsApp", href: SITE.social.whatsapp, external: true },
    bg: "from-brand-green-dark via-brand-green to-emerald-700",
    accent: "🏗️",
  },
  {
    title: "Ofertas del mes",
    subtitle: "Hasta 30% de descuento en herramientas y cerrajería seleccionada",
    cta: { label: "Ver ofertas", href: "/catalogo?ofertas=true" },
    ctaSecondary: null,
    bg: "from-gray-900 via-gray-800 to-gray-900",
    accent: "🔥",
  },
  {
    title: "Síguenos en Instagram y gana 5% en tu primera compra",
    subtitle: "Entérate de novedades, tips ferreteros y promociones exclusivas",
    cta: { label: "Seguir @ferreteriapardo", href: SITE.social.instagram, external: true },
    ctaSecondary: { label: "Ver Facebook", href: SITE.social.facebook, external: true },
    bg: "from-purple-900 via-pink-900 to-orange-900",
    accent: "📱",
  },
];

const STATS = [
  { value: "5.000+", label: "Productos" },
  { value: "9", label: "Categorías" },
  { value: "11", label: "Marcas" },
  { value: "1.145", label: "Con foto real" },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
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
        "absolute inset-0 bg-gradient-to-br transition-all duration-700",
        slide.bg
      )} />

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
          {/* Accent */}
          <div className="text-5xl mb-4 animate-bounce-subtle">{slide.accent}</div>

          {/* Content */}
          <h1 key={`title-${current}`} className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4 animate-fade-in text-balance">
            {slide.title}
          </h1>
          <p key={`sub-${current}`} className="text-lg md:text-xl text-white/80 mb-8 max-w-xl animate-fade-in">
            {slide.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-12">
            {slide.cta.external ? (
              <a href={slide.cta.href} target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-2 bg-white text-brand-green font-bold px-6 py-3 rounded-xl hover:bg-green-50 transition-all shadow-lg hover:shadow-xl text-sm md:text-base">
                {slide.cta.label}
              </a>
            ) : (
              <Link href={slide.cta.href}
                    className="inline-flex items-center gap-2 bg-white text-brand-green font-bold px-6 py-3 rounded-xl hover:bg-green-50 transition-all shadow-lg hover:shadow-xl text-sm md:text-base">
                {slide.cta.label}
              </Link>
            )}
            {slide.ctaSecondary && (
              slide.ctaSecondary.external ? (
                <a href={slide.ctaSecondary.href} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-all text-sm md:text-base">
                  {slide.ctaSecondary.label}
                </a>
              ) : (
                <Link href={slide.ctaSecondary.href}
                      className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition-all text-sm md:text-base">
                  {slide.ctaSecondary.label}
                </Link>
              )
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 text-center border border-white/10">
              <div className="text-2xl md:text-3xl font-extrabold text-white">{stat.value}</div>
              <div className="text-xs md:text-sm text-white/70 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Carousel dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn("carousel-dot", i === current && "active")}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

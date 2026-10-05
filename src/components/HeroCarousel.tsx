import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/constants";
import { getCategoryPath, getProductPath } from "@/lib/catalog/routes";
import { normalizeProductName } from "@/lib/catalog/normalize";
import type { Product } from "@/lib/types";
import { getLocalProductImagePath } from "@/lib/product-enrichment";

const QUICK_CATEGORIES = ["Cerrajería", "Herramientas", "Herrajes para Muebles"];

/** A calm, server-rendered entry point: search never moves or waits for a carousel. */
export default function HeroCarousel({ productCount, brandCount, categoryCount, spotlight }: {
  productCount: number; brandCount: number; categoryCount: number; spotlight?: Product;
}) {
  const spotlightImage = getLocalProductImagePath(spotlight?.img);
  return <section aria-label="Bienvenido a Ferretería Pardo" className="home-hero">
    <div className="site-container">
      <div className="hero-layout">
        <div className="hero-copy">
          <p className="eyebrow mb-5">Ferretería Pardo · Bogotá · Desde 1966</p>
          <h1 data-home-title className="hero-title">Grandes proyectos.<br /><span className="text-ink-2">Buenos comienzos.</span></h1>
          <p data-home-intro className="hero-intro">La herramienta indicada. El herraje preciso. Encuentra lo que necesitas con la experiencia de Pardo.</p>
          <form action="/catalogo" method="get" role="search" className="hero-search">
            <label htmlFor="home-search" className="sr-only">Buscar productos en el catálogo</label>
            <svg aria-hidden="true" className="h-5 w-5 shrink-0 text-ink-2" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="10.5" cy="10.5" r="6.5" strokeWidth="1.7" /><path d="m16 16 5 5" strokeWidth="1.7" strokeLinecap="round" /></svg>
            <input id="home-search" name="q" type="search" placeholder="Producto, marca o referencia" maxLength={120} className="min-w-0 flex-1 bg-transparent py-4 text-base text-ink placeholder:text-ink-2" />
            <button type="submit" className="btn-primary shrink-0 px-4">Buscar</button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
            {QUICK_CATEGORIES.map(category => <Link key={category} href={getCategoryPath(category)} className="inline-flex min-h-11 items-center gap-1 hover:text-brand-text">{category}<span aria-hidden="true">↗</span></Link>)}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/catalogo" className="inline-flex min-h-11 items-center gap-2 font-semibold text-ink">Explorar el catálogo <span aria-hidden="true">→</span></Link>
            <a href={SITE.social.whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm text-ink-2 hover:text-ink">Hablar con un asesor ↗</a>
          </div>
        </div>
        {spotlight && spotlightImage && <Link href={getProductPath(spotlight)} className="hero-spotlight group">
          <div className="flex items-center justify-between gap-3 px-7 pt-6">
            <span className="eyebrow text-ink-2">En el catálogo</span><span aria-hidden="true" className="hero-spotlight-arrow">↗</span>
          </div>
          <div className="hero-product-image"><Image src={spotlightImage} alt={normalizeProductName(spotlight.nombre)} fill sizes="(max-width: 767px) 320px, (max-width: 1023px) 44vw, 510px" priority className="object-contain" /></div>
          <div className="px-7 pb-6"><p className="text-sm font-semibold text-ink">{normalizeProductName(spotlight.nombre)}</p><p className="mt-1 text-xs text-ink-2">Ref. {spotlight.ref || spotlight.id} · Ver producto</p></div>
        </Link>}
      </div>
      <div className="hero-trust" aria-label="Sobre Ferretería Pardo">
        <p><strong>{productCount.toLocaleString("es-CO")}</strong><span>referencias para elegir</span></p>
        <p><strong>{categoryCount} categorías</strong><span>para tu obra y tu hogar</span></p>
        <p><strong>{brandCount} marcas</strong><span>en nuestro catálogo</span></p>
        <Link href="/contacto"><strong>Estamos en Bogotá ↗</strong><span>Calle 72 No. 50-23</span></Link>
      </div>
    </div>
  </section>;
}

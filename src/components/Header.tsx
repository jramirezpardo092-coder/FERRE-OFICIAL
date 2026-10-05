"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SITE, NAV_LINKS, CATEGORIES } from "@/lib/constants";
import { getCart, subscribeCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import QuoteToast from "./QuoteToast";
import { getCategoryPath } from "@/lib/catalog/routes";

/* ── Icons ─── */
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronDown = () => (
  <svg className="w-3.5 h-3.5 ml-1 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const CartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/></svg>
);

const WhatsAppMini = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
);

/* Category SVG Icons (from CategoryGrid) */
const IconKey = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const IconWrench = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const IconHammer = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 15l6-6m-5.5-2.5l2.5-2.5a2 2 0 112.828 2.828l-10 10A2 2 0 118 22l10-10z" />
  </svg>
);

const IconCabinet = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2" />
  </svg>
);

const IconBolt = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconScrew = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={2} />
  </svg>
);

const IconDroplet = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-3" />
  </svg>
);

const IconFaucet = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v6" />
  </svg>
);

const IconShield = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622c5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

/* Category icon mapping */
const categoryIconMap: Record<string, React.ComponentType> = {
  "Cerrajería": IconKey,
  "Ferretería General": IconWrench,
  "Herramientas": IconHammer,
  "Herrajes para Muebles": IconCabinet,
  "Tornillería y Fijación": IconScrew,
  "Adhesivos y Sellantes": IconDroplet,
  "Eléctrico": IconBolt,
  "Fontanería": IconFaucet,
  "Seguridad Industrial": IconShield,
};

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [quotePulse, setQuotePulse] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const categoryToggleRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setCatOpen(false);
    setMobileCatOpen(false);
  }, [pathname]);

  useEffect(() => {
    setCartCount(getCart().length);
    const unsubscribe = subscribeCart(() => setCartCount(getCart().length));
    const animate = () => setQuotePulse((previous) => previous + 1);
    window.addEventListener("cart-added", animate);
    return () => {
      unsubscribe();
      window.removeEventListener("cart-added", animate);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || (!mobileOpen && !catOpen)) return;
      if (mobileOpen) {
        setMobileOpen(false);
        setMobileCatOpen(false);
        mobileToggleRef.current?.focus();
      } else {
        setCatOpen(false);
        categoryToggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen, catOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const navClass = "flex min-h-11 items-center rounded-control px-3 py-2 text-sm font-semibold text-ink-2 transition-colors hover:bg-paper hover:text-ink";
  return <>
    <header className="site-header">
      <div className="site-container flex h-16 items-center justify-between gap-3 lg:h-20">
        <Link href="/" className="brand-logo-plate min-h-11 items-center px-1" aria-label="Ferretería Pardo SAS — Inicio">
          <Image src="/logo-ferreteria-pardo.svg" alt="Ferretería Pardo SAS" width={140} height={40} sizes="(min-width: 1024px) 140px, 112px" className="h-8 w-28 lg:h-10 lg:w-[140px]" priority />
        </Link>
        <nav aria-label="Navegación principal" className="hidden items-center lg:flex">
          {NAV_LINKS.map(link => link.hasDropdown ? <div key={link.label} className="relative" ref={dropdownRef}>
            <button type="button" ref={categoryToggleRef} onClick={() => setCatOpen(!catOpen)} aria-expanded={catOpen} aria-controls="desktop-categories" className={navClass}>{link.label}<ChevronDown /></button>
            {catOpen && <div id="desktop-categories" className="absolute left-1/2 top-full z-50 mt-2 grid w-[360px] -translate-x-1/2 grid-cols-2 gap-1 rounded-card border border-line bg-surface p-3 shadow-card">
              {CATEGORIES.map(cat => {const Icon=categoryIconMap[cat.name]; return <Link key={cat.slug} href={getCategoryPath(cat.name)} onClick={() => setCatOpen(false)} className="flex min-h-11 items-center gap-2 rounded-control p-2 text-sm text-ink transition-colors hover:bg-paper">{Icon && <span className="shrink-0 text-ink-2"><Icon /></span>}{cat.name}</Link>;})}
            </div>}
          </div> : <Link key={link.label} href={link.href} aria-current={pathname===link.href ? "page" : undefined} className={cn(navClass,pathname===link.href && "bg-paper text-ink underline decoration-brand decoration-2 underline-offset-8")}>{link.label}</Link>)}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {(pathname === "/catalogo" || pathname.startsWith("/catalogo/")) && <span id="catalog-assist-slot" className="inline-flex h-11 w-11 shrink-0 sm:hidden" />}
          <a href={SITE.social.whatsapp} target="_blank" rel="noreferrer" className="btn-wa hidden whitespace-nowrap px-3 xl:inline-flex"><WhatsAppMini />Hablar con asesor</a>
          <button type="button" className="relative flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-chip border border-control bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:bg-paper" data-quote-trigger
            onClick={() => {setMobileOpen(false); window.dispatchEvent(new CustomEvent("toggle-cart"));}}>
            <CartIcon /><span className="sr-only sm:not-sr-only">Cotización</span>
            {cartCount > 0 && <span key={quotePulse} className={cn("flex h-5 min-w-5 items-center justify-center rounded-chip bg-brand px-1 font-mono text-xs text-on-brand", quotePulse>0 && "animate-count-pulse")}><span className="sr-only">, </span>{cartCount}<span className="sr-only"> {cartCount === 1 ? "referencia" : "referencias"}</span></span>}
          </button>
          <button type="button" ref={mobileToggleRef} className="flex h-11 w-11 items-center justify-center rounded-control text-ink transition-colors hover:bg-paper lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={mobileOpen} aria-controls="mobile-navigation">{mobileOpen ? <CloseIcon /> : <MenuIcon />}</button>
        </div>
      </div>
      {mobileOpen && <div id="mobile-navigation" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-surface lg:hidden">
        <nav aria-label="Navegación móvil" className="site-container space-y-1 py-4">
          {NAV_LINKS.map(link => link.hasDropdown ? <div key={link.label}>
            <button type="button" onClick={() => setMobileCatOpen(!mobileCatOpen)} aria-expanded={mobileCatOpen} aria-controls="mobile-categories" className={cn(navClass,"w-full justify-between")}>{link.label}<ChevronDown /></button>
            {mobileCatOpen && <div id="mobile-categories" className="ml-3 border-l border-line pl-2">{CATEGORIES.map(cat => {const Icon=categoryIconMap[cat.name];return <Link key={cat.slug} href={getCategoryPath(cat.name)} className={cn(navClass,"gap-3")} onClick={() => {setMobileCatOpen(false);setMobileOpen(false);}}>{Icon && <Icon />}{cat.name}</Link>;})}</div>}
          </div> : <Link key={link.label} href={link.href} aria-current={pathname===link.href ? "page" : undefined} className={cn(navClass,pathname===link.href && "bg-paper text-ink")} onClick={() => setMobileOpen(false)}>{link.label}</Link>)}
          <div className="grid gap-2 border-t border-line pt-4"><a href={SITE.social.whatsapp} target="_blank" rel="noreferrer" className="btn-wa"><WhatsAppMini />Cotizar por WhatsApp</a><Link href="/catalogo" onClick={() => setMobileOpen(false)} className="btn-outline">Explorar catálogo completo</Link></div>
        </nav>
      </div>}
    </header>
    <QuoteToast />
  </>;
}

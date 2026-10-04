import Link from "next/link";
import { SITE } from "@/lib/constants";

const LINKS = [
  { name: "Instagram", handle: "@ferreteriapardo", text: "Conoce nuestras novedades y encuentra ideas para tu próximo proyecto.", href: SITE.social.instagram, letter: "◎", action: "Ver Instagram" },
  { name: "Facebook", handle: "Ferretería Pardo SAS", text: "Mantente cerca de Pardo y consulta nuestras publicaciones.", href: SITE.social.facebook, letter: "f", action: "Ver Facebook" },
];

export default function InstagramSection() {
  return (
    <section className="home-section bg-surface  relative">
      <div className="absolute top-0 left-0 right-0 border-t border-line" />
      <div className="site-container">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-brand-text uppercase tracking-[0.2em] mb-4">Conecta con Pardo</p>
          <h2 className="section-title">Ideas, novedades y asesoría</h2>
          <p className="section-subtitle mx-auto mt-4">Síguenos o consulta nuestras guías para elegir lo que necesitas.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {LINKS.map((social) => (
            <a key={social.name} href={social.href} target="_blank" rel="noreferrer" className="group rounded-card bg-surface  border border-line  p-7 hover:border-brand hover:shadow-card transition-all">
              <div aria-hidden="true" className="mb-5 flex h-12 w-12 items-center justify-center rounded-control border border-line text-2xl font-semibold text-ink">{social.letter}</div>
              <h3 className="text-xl font-bold text-ink ">{social.name}</h3>
              <p className="text-xs text-ink-2  mt-1">{social.handle}</p>
              <p className="text-sm text-ink-2  leading-relaxed mt-4 mb-5">{social.text}</p>
              <span className="text-sm font-bold text-brand-text">{social.action} <span aria-hidden="true">↗</span></span>
            </a>
          ))}
          <Link href="/blog" className="group rounded-card bg-surface  border border-line  p-7 hover:border-brand hover:shadow-card transition-all">
            <div aria-hidden="true" className="w-12 h-12 rounded-card bg-brand-tint  flex items-center justify-center text-brand-text text-2xl mb-5">→</div>
            <h3 className="text-xl font-bold text-ink ">Guías de compra</h3>
            <p className="text-xs text-ink-2  mt-1">Elige con confianza</p>
            <p className="text-sm text-ink-2  leading-relaxed mt-4 mb-5">Qué revisar antes de comprar cerraduras, herramientas y herrajes para muebles.</p>
            <span className="text-sm font-bold text-brand-text">Explorar las guías <span aria-hidden="true">→</span></span>
          </Link>
        </div>
      </div>
    </section>
  );
}

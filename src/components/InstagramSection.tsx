import Link from "next/link";
import { SITE } from "@/lib/constants";

const LINKS = [
  { name: "Instagram", handle: "@ferreteriapardo", text: "Conoce nuestras novedades y encuentra ideas para tu próximo proyecto.", href: SITE.social.instagram, color: "from-purple-600 via-pink-600 to-orange-500", letter: "◎", action: "Ver Instagram" },
  { name: "Facebook", handle: "Ferretería Pardo SAS", text: "Mantente cerca de Pardo y consulta nuestras publicaciones.", href: SITE.social.facebook, color: "from-blue-700 to-blue-500", letter: "f", action: "Ver Facebook" },
];

export default function InstagramSection() {
  return (
    <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50 relative">
      <div className="absolute top-0 left-0 right-0 divider-gradient" />
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-brand-red uppercase tracking-[0.2em] mb-4">Conecta con Pardo</p>
          <h2 className="section-title">Ideas, novedades y asesoría</h2>
          <p className="section-subtitle mx-auto mt-4">Síguenos o consulta nuestras guías para elegir lo que necesitas.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {LINKS.map((social) => (
            <a key={social.name} href={social.href} target="_blank" rel="noreferrer" className="group rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-7 hover:border-brand-red/40 hover:shadow-lg transition-all">
              <div aria-hidden="true" className={"w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-3xl font-bold mb-5 " + social.color}>{social.letter}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{social.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{social.handle}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-4 mb-5">{social.text}</p>
              <span className="text-sm font-bold text-brand-red">{social.action} <span aria-hidden="true">↗</span></span>
            </a>
          ))}
          <Link href="/blog" className="group rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-7 hover:border-brand-red/40 hover:shadow-lg transition-all">
            <div aria-hidden="true" className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950 flex items-center justify-center text-brand-red text-2xl mb-5">→</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Guías de compra</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Elige con confianza</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-4 mb-5">Qué revisar antes de comprar cerraduras, herramientas y herrajes para muebles.</p>
            <span className="text-sm font-bold text-brand-red">Explorar las guías <span aria-hidden="true">→</span></span>
          </Link>
        </div>
      </div>
    </section>
  );
}

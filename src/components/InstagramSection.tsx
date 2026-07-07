"use client";

import { SITE } from "@/lib/constants";

const PLACEHOLDER_POSTS = [
  { id: 1, caption: "Herramientas", color: "from-amber-500 to-orange-600", label: "Herramientas" },
  { id: 2, caption: "Cerrajería Yale en stock", color: "from-blue-500 to-indigo-600", label: "Seguridad" },
  { id: 3, caption: "Tips y consejos", color: "from-emerald-500 to-teal-600", label: "Tips" },
  { id: 4, caption: "Ofertas de la semana", color: "from-rose-500 to-red-600", label: "Ofertas" },
  { id: 5, caption: "Tornillería especializada", color: "from-violet-500 to-purple-600", label: "Productos" },
  { id: 6, caption: "Nuestro equipo FerrePardo", color: "from-cyan-500 to-blue-600", label: "Comunidad" },
];

export default function InstagramSection() {
  return (
    <section className="py-20 md:py-28 bg-gray-50 relative">
      <div className="absolute top-0 left-0 right-0 divider-gradient" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
            <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 uppercase tracking-[0.2em]">Instagram</span>
            <div className="w-8 h-[2px] bg-gradient-to-r from-pink-500 to-orange-400 rounded-full" />
          </div>
          <h2 className="section-title">
            Síguenos en redes
          </h2>
          <p className="section-subtitle mx-auto mt-4">
            Descubre las últimas novedades, tips ferreteros y promociones exclusivas
          </p>
        </div>

        {/* Instagram grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {PLACEHOLDER_POSTS.map((post) => (
            <a
              key={post.id}
              href={SITE.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square rounded-2xl overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${post.color}`} />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300" />

              {/* Hover content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105">
                <svg className="w-7 h-7 mb-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                <p className="text-white text-xs font-semibold text-center px-3">{post.caption}</p>
              </div>

              {/* Label */}
              <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <span className="text-[10px] font-bold text-gray-700">{post.label}</span>
              </div>
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href={SITE.social.instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-bold px-8 py-3.5 rounded-xl hover:shadow-xl hover:shadow-pink-500/25 transition-all duration-300 hover:-translate-y-0.5 text-sm"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            Ver más en Instagram
          </a>
        </div>
      </div>
    </section>
  );
}

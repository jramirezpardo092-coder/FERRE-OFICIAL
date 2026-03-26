"use client";

import { SITE } from "@/lib/constants";

const PLACEHOLDER_POSTS = [
  { id: 1, caption: "Nuevas herramientas DEWALT", color: "from-yellow-400 to-orange-500" },
  { id: 2, caption: "Cerrajería Yale en stock", color: "from-blue-400 to-blue-600" },
  { id: 3, caption: "Tips: cómo elegir brocas", color: "from-green-400 to-green-600" },
  { id: 4, caption: "Ofertas de la semana", color: "from-red-400 to-pink-500" },
  { id: 5, caption: "Tornillería especializada", color: "from-purple-400 to-purple-600" },
  { id: 6, caption: "Nuestro equipo FerrePardo", color: "from-emerald-400 to-teal-600" },
];

export default function InstagramSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="section-title">
            Síguenos en redes y sé parte de la comunidad{" "}
            <span className="text-brand-green">FerrePardo</span>
          </h2>
          <p className="section-subtitle mx-auto mt-3">
            Novedades, tips ferreteros y promociones exclusivas en nuestras redes sociales
          </p>
        </div>

        {/* Instagram grid placeholder */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {PLACEHOLDER_POSTS.map((post) => (
            <a
              key={post.id}
              href={SITE.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square rounded-2xl overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${post.color}`} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center px-3">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  <p className="text-xs font-medium">{post.caption}</p>
                </div>
              </div>
              {/* Placeholder icon */}
              <div className="absolute inset-0 flex items-center justify-center text-white/20 group-hover:text-white/0 transition-colors">
                <span className="text-4xl">📸</span>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center">
          <a
            href={SITE.social.instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-bold px-8 py-3.5 rounded-full hover:shadow-lg hover:shadow-pink-500/25 transition-all hover:scale-105"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            Ver más en Instagram @ferreteriapardo
          </a>
        </div>
      </div>
    </section>
  );
}

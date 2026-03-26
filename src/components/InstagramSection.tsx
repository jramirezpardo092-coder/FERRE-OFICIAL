"use client";

import { SITE } from "@/lib/constants";

const PLACEHOLDER_POSTS = [
  { id: 1, caption: "Herramientas", color: "from-yellow-400 to-orange-500", label: "Herramientas" },
  { id: 2, caption: "Cerrajería Yale en stock", color: "from-blue-400 to-blue-600", label: "Seguridad" },
  { id: 3, caption: "Tips y consejos", color: "from-green-400 to-green-600", label: "Tips" },
  { id: 4, caption: "Ofertas de la semana", color: "from-red-400 to-pink-500", label: "Ofertas" },
  { id: 5, caption: "Tornillería especializada", color: "from-purple-400 to-purple-600", label: "Productos" },
  { id: 6, caption: "Nuestro equipo FerrePardo", color: "from-emerald-400 to-teal-600", label: "Comunidad" },
];

export default function InstagramSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Síguenos en redes
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre las últimas novedades, tips ferreteros y promociones exclusivas de FerrePardo. Más de 10,000 seguidores en nuestra comunidad
          </p>
        </div>

        {/* Instagram grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {PLACEHOLDER_POSTS.map((post) => (
            <a
              key={post.id}
              href={SITE.social.instagram}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square rounded-3xl overflow-hidden"
            >
              {/* Premium gradient background with subtle pattern */}
              <div className={`absolute inset-0 bg-gradient-to-br ${post.color}`} />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />

              {/* Subtle dot pattern overlay */}
              <div className="absolute inset-0 opacity-10 group-hover:opacity-5 transition-opacity"
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />

              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-105">
                <svg className="w-8 h-8 mb-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                <p className="text-white text-sm font-semibold text-center px-3">{post.caption}</p>
              </div>

              {/* Card label */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl">
                <span className="text-xs font-semibold text-gray-800">{post.label}</span>
              </div>
            </a>
          ))}
        </div>

        {/* Call to action button */}
        <div className="text-center">
          <a
            href={SITE.social.instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-bold px-12 py-5 rounded-2xl hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-300 hover:scale-105 active:scale-95 text-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            Ver más en Instagram
          </a>
        </div>
      </div>
    </section>
  );
}

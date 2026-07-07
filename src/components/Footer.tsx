"use client";

import Link from "next/link";
import Image from "next/image";
import { SITE, NAV_LINKS, CATEGORIES } from "@/lib/constants";

export default function Footer() {
  return (
    <footer id="contacto" className="bg-gray-950 text-white">
      {/* CTA Band */}
      <div className="relative bg-gradient-to-r from-brand-red-dark via-brand-red to-brand-red-dark overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white">¿Necesitas cotizar?</h3>
            <p className="text-red-200 text-sm mt-1.5">Respuesta inmediata por WhatsApp. Precios especiales por volumen.</p>
          </div>
          <a
            href={SITE.social.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2.5 bg-white text-gray-900 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 hover:shadow-xl transition-all duration-200 shadow-lg hover:-translate-y-0.5 text-sm shrink-0"
          >
            <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Hablar con un asesor ahora
          </a>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* Col 1: Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Image
                src="/logo-ferreteria-pardo.png"
                alt="Ferretería Pardo"
                width={44}
                height={44}
                className="rounded-xl"
              />
              <div>
                <div className="font-black text-white text-lg">Ferretería Pardo</div>
                <div className="text-[11px] text-gray-500">Desde 1966 · Bogotá</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Más de 60 años ofreciendo herrajes, cerrajería, herramientas y soluciones ferreteras de calidad en Bogotá.
            </p>
            {/* Payments */}
            <div className="flex flex-wrap gap-2">
              {SITE.payments.map((p) => (
                <span key={p} className="text-[10px] bg-gray-900 text-gray-400 px-2.5 py-1.5 rounded-lg font-medium border border-gray-800">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Col 2: Quick links */}
          <div>
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">Enlaces rápidos</h4>
            <nav className="space-y-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-gray-400 hover:text-white hover:translate-x-1 transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Col 3: Contact */}
          <div>
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">Contáctanos</h4>
            <div className="space-y-3.5 text-sm text-gray-400">
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-brand-red shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{SITE.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-brand-red shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:+57${SITE.phone1}`} className="hover:text-white transition-colors">{SITE.phone1Display}</a>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-brand-red shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:+57${SITE.phone2}`} className="hover:text-white transition-colors">{SITE.phone2Display}</a>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-brand-red shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${SITE.email}`} className="hover:text-white transition-colors">{SITE.email}</a>
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-gray-800/50">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{SITE.hours.weekdays}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{SITE.hours.saturday}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>{SITE.hours.sunday}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 4: Social + Map */}
          <div>
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-wider">Redes sociales</h4>
            <div className="flex gap-3 mb-8">
              <a
                href={SITE.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-200"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a
                href={SITE.social.facebook}
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href={SITE.social.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="w-11 h-11 bg-[#25D366] rounded-xl flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-200"
              >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>

            {/* Map */}
            <div className="rounded-2xl overflow-hidden border border-gray-800 aspect-video shadow-xl">
              <iframe
                src={SITE.mapEmbed}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Ferretería Pardo"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>&copy; 2026 Ferretería Pardo SAS. Todos los derechos reservados.</p>
          <p>Hecho con cuidado en Bogotá</p>
        </div>
      </div>
    </footer>
  );
}

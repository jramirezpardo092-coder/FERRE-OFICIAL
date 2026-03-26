import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getLocalBusinessJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contacto | Ferretería Pardo SAS - Bogotá",
  description:
    "Contáctanos: Calle 72 No. 50-23, Bogotá. Teléfonos 320 834 5756 / 311 848 6132. WhatsApp, correo y mapa. Lunes a Sábado.",
};

export default function ContactoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getLocalBusinessJsonLd()) }}
      />
      <Breadcrumbs items={[{ label: "Contacto", href: "/contacto" }]} />

      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Estamos para ayudarte
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            60+ años atendiendo profesionales y hogares en Bogotá. Cotiza sin compromiso.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Address */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Dirección</h3>
            <p className="text-gray-500">{SITE.address}</p>
          </div>

          {/* Phone / WhatsApp */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Teléfono y WhatsApp</h3>
            <p className="text-gray-500 space-y-1">
              <a href={`tel:+57${SITE.phone1}`} className="block hover:text-brand-red transition-colors">{SITE.phone1Display}</a>
              <a href={`tel:+57${SITE.phone2}`} className="block hover:text-brand-red transition-colors">{SITE.phone2Display}</a>
            </p>
          </div>

          {/* Hours */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Horario</h3>
            <div className="text-gray-500 space-y-1 text-sm">
              <p>{SITE.hours.weekdays}</p>
              <p>{SITE.hours.saturday}</p>
              <p className="text-red-500 font-medium">{SITE.hours.sunday}</p>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-lg mb-12 aspect-[21/9]">
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

        {/* WhatsApp CTA */}
        <div className="bg-gradient-to-r from-brand-red to-brand-red-dark rounded-3xl p-10 md:p-14 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            ¿Necesitas una cotización?
          </h2>
          <p className="text-red-100 text-lg mb-8 max-w-xl mx-auto">
            Envíanos tu lista por WhatsApp y recibe precios al instante. Sin compromiso.
          </p>
          <a
            href={SITE.social.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 bg-white text-brand-red font-bold px-10 py-4 rounded-2xl hover:bg-red-50 hover:shadow-xl transition-all text-lg"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Cotizar ahora por WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}

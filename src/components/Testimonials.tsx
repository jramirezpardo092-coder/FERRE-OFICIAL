import Link from "next/link";
import { SITE } from "@/lib/constants";

/** Service steps are factual; do not present unsourced quotes as customer reviews. */
export default function Testimonials() {
  return <section className="home-section bg-paper">
    <div className="site-container">
      <div className="rounded-card bg-surface p-6 md:p-10 lg:flex lg:items-center lg:gap-14">
        <div className="mb-8 lg:mb-0 lg:w-1/3"><p className="eyebrow mb-3 text-brand-text">De tu idea al pedido</p><h2 className="section-title">Cotizar, así de fácil.</h2><p className="mt-4 text-base leading-relaxed text-ink-2">Arma tu lista a tu ritmo. Nuestro equipo te ayuda con el siguiente paso.</p><Link href="/catalogo" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink">Comenzar mi cotización <span aria-hidden="true">→</span></Link></div>
        <ol className="grid flex-1 gap-7 sm:grid-cols-3">
          {[{number:"01",title:"Encuentra",text:"Busca el producto y revisa su referencia, precio y disponibilidad."},{number:"02",title:"Reúne",text:"Agrega los productos a tu cotización y ajusta las cantidades."},{number:"03",title:"Conversemos",text:"Envía tu lista por WhatsApp. Confirmamos disponibilidad, total y entrega."}].map(step => <li key={step.number}><span className="mb-4 flex h-11 w-11 items-center justify-center rounded-chip bg-paper text-sm font-semibold text-ink-2">{step.number}</span><h3 className="text-base font-semibold text-ink">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-ink-2">{step.text}</p></li>)}
        </ol>
      </div>
      <p className="mt-6 text-center text-sm text-ink-2">¿Tienes una medida o referencia por confirmar? <a href={SITE.social.whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-4">Habla con un asesor</a></p>
    </div>
  </section>;
}

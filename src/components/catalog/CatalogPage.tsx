import type { Metadata } from "next";
import CatalogClient from "../CatalogClient";
import Breadcrumbs from "../Breadcrumbs";
import { queryCatalog } from "@/lib/catalog-service";
import { CATALOG_CATEGORIES } from "@/lib/catalog/categories";
import { toSearchParams } from "@/lib/catalog/routes";
import { getItemListJsonLd } from "@/lib/seo";
import catalogSource from "@/data/catalog-source.json";

export type CatalogPageProps = { category?: typeof CATALOG_CATEGORIES[number]; searchParams?: Record<string, string | string[] | undefined> };
export function catalogMetadata({ category, searchParams }: CatalogPageProps): Metadata {
  const params = toSearchParams(searchParams);
  const path = category ? `/catalogo/${category.slug}` : "/catalogo";
  const filtered = [...params.keys()].some(key => key !== "page");
  const requestedPage = /^\d+$/.test(params.get("page") || "") ? Number(params.get("page")) : 1;
  const pageParams = new URLSearchParams(params);
  if (category) pageParams.set("cat", category.name);
  const page = requestedPage > 1 ? queryCatalog(pageParams).page : 1;
  return {
    title: `${category?.name || "Catálogo de productos"} | Ferretería Pardo Bogotá`,
    description: category?.introduction || "Consulta herrajes, cerraduras, herramientas y tornillería en Ferretería Pardo Bogotá. Precios con IVA y cotización por WhatsApp. Visítanos en el Barrio 12 de Octubre.",
    alternates: { canonical: path + (!filtered && page > 1 ? `?page=${page}` : "") },
    robots: { index: !filtered && requestedPage === page, follow: true },
  };
}
export default function CatalogPage({ category, searchParams }: CatalogPageProps) {
  const params = toSearchParams(searchParams);
  if (category) params.set("cat", category.name);
  const initialData = queryCatalog(params);
  if (category) params.delete("cat");
  const initialParamsKey = params.toString();
  const date = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Bogota" }).format(new Date(`${catalogSource.updatedAt}T12:00:00-05:00`)).replace(/\//g, "·");
  return <div className="min-h-screen bg-paper text-ink">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(getItemListJsonLd(initialData.products, (initialData.page - 1) * 24)).replace(/</g, "\\u003c") }} />
    {category && <Breadcrumbs items={[{ label: "Catálogo", href: "/catalogo" }, { label: category.name, href: `/catalogo/${category.slug}` }]} />}
    <header data-design-hero className="bg-paper">
      <div className="mx-auto max-w-site px-4 py-2 md:px-6 md:py-6 lg:px-8">
        <h1 className="font-display text-[28px] font-extrabold leading-8 tracking-[-0.025em] md:text-[40px] md:leading-[44px]">{category?.name || "Catálogo Ferretería Pardo"}</h1>
        <p className="mt-2 font-mono text-xs leading-4 tracking-[0.025em] text-ink-2">ACTUALIZADO <time dateTime={catalogSource.updatedAt}>{date}</time></p>
      </div>
    </header>
    <div className="mx-auto max-w-site px-4 md:px-6 lg:px-8">
      <p className="max-w-3xl text-sm leading-5 text-ink-2">{category?.introduction || "Encuentra referencias para tu proyecto y reúne tu cotización. Incluimos productos agotados para consultar su reposición."}</p>
      <p className="mt-2 text-xs leading-4 text-ink-2">Disponibilidad a confirmar al cotizar.</p>
    </div>
    <CatalogClient initialData={initialData} initialParamsKey={initialParamsKey} category={category?.name} />
  </div>;
}

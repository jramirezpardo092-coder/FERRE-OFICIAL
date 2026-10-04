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
  const page = /^\d+$/.test(params.get("page") || "") ? Number(params.get("page")) : 1;
  return {
    title: `${category?.name || "Catálogo de productos"} | Ferretería Pardo Bogotá`,
    description: category?.introduction || "Consulta herrajes, cerraduras, herramientas y tornillería en Ferretería Pardo Bogotá. Precios con IVA y cotización por WhatsApp. Visítanos en el Barrio 12 de Octubre.",
    alternates: { canonical: path + (!filtered && page > 1 ? `?page=${page}` : "") },
    robots: { index: !filtered, follow: true },
  };
}
export default function CatalogPage({ category, searchParams }: CatalogPageProps) {
  const params = toSearchParams(searchParams);
  if (category) params.set("cat", category.name);
  const initialData = queryCatalog(params);
  if (category) params.delete("cat");
  const initialParamsKey = params.toString();
  const date = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" }).format(new Date(`${catalogSource.updatedAt}T12:00:00-05:00`));
  return <div className="min-h-screen bg-gray-50/30 dark:bg-gray-950">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(getItemListJsonLd(initialData.products, (initialData.page - 1) * 24)).replace(/</g, "\\u003c") }} />
    {category && <Breadcrumbs items={[{ label: "Catálogo", href: "/catalogo" }, { label: category.name, href: `/catalogo/${category.slug}` }]} />}
    <header className="bg-gray-900 text-white">
      <div className="mx-auto max-w-[1400px] px-4 py-4 md:py-7">
        <h1 className="text-2xl font-extrabold md:text-3xl">{category?.name || "Catálogo Ferretería Pardo"}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-200">{category?.introduction || "Encuentra referencias para tu proyecto y reúne tu cotización. Incluimos productos agotados para consultar su reposición."}</p>
        <p className="mt-2 text-xs text-gray-300">Actualización: {date}. Disponibilidad a confirmar al cotizar.</p>
      </div>
    </header>
    <CatalogClient initialData={initialData} initialParamsKey={initialParamsKey} category={category?.name} />
  </div>;
}

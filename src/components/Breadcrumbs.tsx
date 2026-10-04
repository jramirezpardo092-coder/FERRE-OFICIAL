import Link from "next/link";
import { SITE } from "@/lib/constants";
import { getBreadcrumbJsonLd } from "@/lib/seo";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const allItems = [{ label: "Inicio", href: "/" }, ...items];
  const jsonLdItems = allItems.map((item) => ({
    name: item.label,
    url: `${SITE.url}${item.href}`,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getBreadcrumbJsonLd(jsonLdItems)) }}
      />
      <nav aria-label="Ruta de navegación" className="site-container py-3">
        <ol className="flex items-center gap-1.5 text-sm text-ink-2  flex-wrap">
          {allItems.map((item, i) => (
            <li key={item.href} className="flex items-center gap-1.5">
              {i > 0 && (
                <svg aria-hidden="true" focusable="false" className="w-3.5 h-3.5 text-ink-2 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              {i === allItems.length - 1 ? (
                <span aria-current="page" className="text-ink  font-medium">{item.label}</span>
              ) : (
                <Link href={item.href} className="inline-flex min-h-11 min-w-11 items-center hover:text-brand-text transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

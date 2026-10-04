import { notFound } from "next/navigation";
import CatalogPage, { catalogMetadata } from "@/components/catalog/CatalogPage";
import { CATALOG_CATEGORIES } from "@/lib/catalog/categories";
type Props = { params: { category: string }; searchParams: Record<string, string | string[] | undefined> };
export function generateStaticParams() { return CATALOG_CATEGORIES.map(category => ({ category: category.slug })); }
export function generateMetadata({ params, searchParams }: Props) { return catalogMetadata({ category: CATALOG_CATEGORIES.find(item => item.slug === params.category), searchParams }); }
export default function CategoryPage({ params, searchParams }: Props) {
  const category = CATALOG_CATEGORIES.find(item => item.slug === params.category);
  if (!category) notFound();
  return <CatalogPage category={category} searchParams={searchParams} />;
}

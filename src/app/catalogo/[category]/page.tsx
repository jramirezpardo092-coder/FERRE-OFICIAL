import { notFound } from "next/navigation";
import CatalogPage, { catalogMetadata } from "@/components/catalog/CatalogPage";
import { CATALOG_CATEGORIES } from "@/lib/catalog/categories";
type Props = { params: { category: string } };

export const dynamic = "error";
export const dynamicParams = false;
export const revalidate = 300;
export const runtime = "nodejs";

export function generateStaticParams() { return CATALOG_CATEGORIES.map(category => ({ category: category.slug })); }
function getCategory(params: Props["params"]) {
  const category = CATALOG_CATEGORIES.find(item => item.slug === params.category);
  if (!category) notFound();
  return category;
}
export function generateMetadata({ params }: Props) { return catalogMetadata({ category: getCategory(params) }); }
export default function CategoryPage({ params }: Props) {
  return <CatalogPage category={getCategory(params)} />;
}

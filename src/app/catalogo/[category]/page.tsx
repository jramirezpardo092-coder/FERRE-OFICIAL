import { notFound } from "next/navigation";
import CatalogPage, { catalogMetadata } from "@/components/catalog/CatalogPage";
import { CATALOG_CATEGORIES } from "@/lib/catalog/categories";
type Props = { params: Promise<{ category: string }> };

export const dynamic = "error";
export const dynamicParams = false;
export const revalidate = 300;
export const runtime = "nodejs";

export function generateStaticParams() { return CATALOG_CATEGORIES.map(category => ({ category: category.slug })); }
function getCategory(params: Awaited<Props["params"]>) {
  const category = CATALOG_CATEGORIES.find(item => item.slug === params.category);
  if (!category) notFound();
  return category;
}
export async function generateMetadata(props: Props) {
  const params = await props.params;
  return catalogMetadata({ category: getCategory(params) });
}
export default async function CategoryPage(props: Props) {
  const params = await props.params;
  return <CatalogPage category={getCategory(params)} />;
}

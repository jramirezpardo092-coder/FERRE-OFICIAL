import { notFound } from "next/navigation";
import CatalogPage, { catalogMetadata, type CatalogPageProps } from "@/components/catalog/CatalogPage";
import { CATALOG_CATEGORIES } from "@/lib/catalog/categories";

type Props = { searchParams: Promise<NonNullable<CatalogPageProps["searchParams"]>>; params: Promise<{ category: string }> };

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function getCategory(params: Awaited<Props["params"]>) {
  const category = CATALOG_CATEGORIES.find(item => item.slug === params.category);
  if (!category) notFound();
  return category;
}
export async function generateMetadata(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return catalogMetadata({ category: getCategory(params), searchParams });
}
export default async function CategoryQueryPage(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  return <CatalogPage category={getCategory(params)} searchParams={searchParams} />;
}

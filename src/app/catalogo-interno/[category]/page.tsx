import { notFound } from "next/navigation";
import CatalogPage, { catalogMetadata, type CatalogPageProps } from "@/components/catalog/CatalogPage";
import { CATALOG_CATEGORIES } from "@/lib/catalog/categories";

type Props = Pick<CatalogPageProps, "searchParams"> & { params: { category: string } };

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function getCategory(params: Props["params"]) {
  const category = CATALOG_CATEGORIES.find(item => item.slug === params.category);
  if (!category) notFound();
  return category;
}
export function generateMetadata({ params, searchParams }: Props) {
  return catalogMetadata({ category: getCategory(params), searchParams });
}
export default function CategoryQueryPage({ params, searchParams }: Props) {
  return <CatalogPage category={getCategory(params)} searchParams={searchParams} />;
}

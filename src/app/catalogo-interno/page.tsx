import CatalogPage, { catalogMetadata, type CatalogPageProps } from "@/components/catalog/CatalogPage";

type Props = { searchParams: Promise<NonNullable<CatalogPageProps["searchParams"]>> };

// Rewrites preserve the public URL; query-specific HTML must never enter ISR.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function generateMetadata({ searchParams }: Props) {
  return catalogMetadata({ searchParams: await searchParams });
}
export default async function CatalogQueryPage({ searchParams }: Props) {
  return <CatalogPage searchParams={await searchParams} />;
}

import CatalogPage, { catalogMetadata, type CatalogPageProps } from "@/components/catalog/CatalogPage";

type Props = Pick<CatalogPageProps, "searchParams">;

// Rewrites preserve the public URL; query-specific HTML must never enter ISR.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export function generateMetadata(props: Props) { return catalogMetadata(props); }
export default function CatalogQueryPage(props: Props) { return <CatalogPage {...props} />; }

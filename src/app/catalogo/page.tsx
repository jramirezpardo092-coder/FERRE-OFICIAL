import CatalogPage, { catalogMetadata } from "@/components/catalog/CatalogPage";

// Middleware sends URLs with query parameters to the dynamic catalog route.
// This page never reads request data, so HTML, metadata and ItemList share ISR.
export const dynamic = "error";
export const revalidate = 300;
export const runtime = "nodejs";

export function generateMetadata() { return catalogMetadata({}); }
export default function CatalogoPage() { return <CatalogPage />; }

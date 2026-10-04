import { NextRequest, NextResponse } from "next/server";
import { queryCatalog } from "@/lib/catalog-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const cacheHeaders = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" };

export function GET(request: NextRequest) {
  if (request.nextUrl.search.length > 4096) {
    return NextResponse.json({ error: "La consulta del catálogo es demasiado larga." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json(queryCatalog(request.nextUrl.searchParams), { headers: cacheHeaders });
}

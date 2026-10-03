import { NextRequest, NextResponse } from "next/server";
import { queryCatalog } from "@/lib/catalog-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const cacheHeaders = { "Cache-Control": "no-store, max-age=0" };

export function GET(request: NextRequest) {
  if (request.nextUrl.search.length > 4096) {
    return NextResponse.json({ error: "La consulta del catálogo es demasiado larga." }, { status: 400, headers: cacheHeaders });
  }
  return NextResponse.json(queryCatalog(request.nextUrl.searchParams), { headers: cacheHeaders });
}

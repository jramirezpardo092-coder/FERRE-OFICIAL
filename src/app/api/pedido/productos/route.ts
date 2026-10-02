import { NextRequest, NextResponse } from "next/server";
import productsData from "@/data/products.json";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const products = productsData as Product[];
const cacheHeaders = { "Cache-Control": "no-store, max-age=0" };
const MAX_IDS = 100;

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("ids");
  if (!query || query.length > 14000) {
    return NextResponse.json({ error: "Indica los productos del pedido." }, { status: 400, headers: cacheHeaders });
  }
  const ids = [...new Set(query.split(",").map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0 || ids.length > MAX_IDS || ids.some((id) => !/^[a-zA-Z0-9._-]{1,120}$/.test(id))) {
    return NextResponse.json({ error: "El pedido admite hasta 100 referencias por consulta." }, { status: 400, headers: cacheHeaders });
  }

  const requested = new Set(ids);
  const currentProducts = products.filter((product) => requested.has(product.id)).map((product) => ({
    id: product.id,
    nombre: product.nombre,
    precio: product.precio,
    unidad: product.unidad,
    stock: product.stock,
    cat: product.cat,
    brand: product.brand,
    ref: product.ref,
    sku: product.sku,
    img: product.img,
    original: product.original,
    disc: product.disc,
    taxRate: product.taxRate,
    priceVerified: product.priceVerified,
  }));
  return NextResponse.json({ products: currentProducts }, { headers: cacheHeaders });
}

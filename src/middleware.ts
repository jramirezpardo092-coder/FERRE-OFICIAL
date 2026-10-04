import { NextRequest, NextResponse } from "next/server";
import products from "./data/products.json";
import { getCategoryPath, getProductPath } from "./lib/catalog/routes";
import { CATEGORIES } from "./lib/constants";

// Only public identity is used. Query strings and SKU leading zeros survive the migration.
const productPaths = new Map(products.map((product) => [product.id, getProductPath(product)]));
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  if (url.pathname === "/catalogo" || url.pathname.startsWith("/catalogo/")) {
    const category = url.searchParams.get("cat") || url.searchParams.get("category");
    if (category && CATEGORIES.some((item) => item.name === category || item.slug === category)) {
      url.pathname = getCategoryPath(category);
      url.searchParams.delete("cat");
      url.searchParams.delete("category");
      return NextResponse.redirect(url, 301);
    }
  }
  if (url.pathname.startsWith("/producto/")) {
    const sku = decodeURIComponent(url.pathname.slice("/producto/".length));
    const path = productPaths.get(sku);
    if (path) { url.pathname = path; return NextResponse.redirect(url, 301); }
  }
  return NextResponse.next();
}
export const config = { matcher: ["/catalogo/:path*", "/producto/:path*"] };

import { NextRequest, NextResponse } from "next/server";
import products from "./data/products.json";
import { getCategoryPath, getProductPath } from "./lib/catalog/routes";
import { CATEGORIES } from "./lib/constants";

// Only public identity is used. Query strings and SKU leading zeros survive the migration.
const productPaths = new Map(products.map((product) => [product.id, getProductPath(product)]));
export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  // Internal render destinations are never an alternative public catalog URL.
  // Rewrites do not run Proxy a second time, so only direct visits redirect.
  if (url.pathname === "/catalogo-interno" || url.pathname.startsWith("/catalogo-interno/")) {
    url.pathname = "/catalogo" + url.pathname.slice("/catalogo-interno".length);
    return NextResponse.redirect(url, 301);
  }
  if (url.pathname === "/catalogo" || url.pathname.startsWith("/catalogo/")) {
    const category = url.searchParams.get("cat") || url.searchParams.get("category");
    if (category && CATEGORIES.some((item) => item.name === category || item.slug === category)) {
      url.pathname = getCategoryPath(category);
      url.searchParams.delete("cat");
      url.searchParams.delete("category");
      return NextResponse.redirect(url, 301);
    }
    // Even pagination, empty values and unknown parameters stay dynamic. The
    // Next's request adapter strips framework-only _rsc before exposing this request.
    if (url.searchParams.size > 0) {
      url.pathname = "/catalogo-interno" + url.pathname.slice("/catalogo".length);
      return NextResponse.rewrite(url);
    }
  }
  if (url.pathname.startsWith("/producto/")) {
    const sku = decodeURIComponent(url.pathname.slice("/producto/".length));
    const path = productPaths.get(sku);
    if (path) { url.pathname = path; return NextResponse.redirect(url, 301); }
  }
  return NextResponse.next();
}
export const config = { matcher: ["/catalogo/:path*", "/catalogo-interno/:path*", "/producto/:path*"] };

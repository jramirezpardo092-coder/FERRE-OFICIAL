const test = require("node:test");
const assert = require("node:assert/strict");
const createLoader = require("./load-ts.cjs");
const load = createLoader({ "../CatalogClient": { default() { return null; } }, "../Breadcrumbs": { default() { return null; } } });
const routes = load("src/lib/catalog/routes.ts");
const seo = load("src/lib/seo.ts");
const { catalogMetadata } = load("src/components/catalog/CatalogPage.tsx");
const { CATALOG_CATEGORIES } = load("src/lib/catalog/categories.ts");
const { middleware } = load("src/middleware.ts");
const { NextRequest } = require("next/server");
const catalog = load("src/lib/catalog-service.ts");
test("legacy links redirect with 301, preserving SKU zeros and other filters", () => {
  const product = catalog.getCatalogProduct("0435");
  const response = middleware(new NextRequest("https://example.com/producto/0435?from=legacy"));
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://example.com" + routes.getProductPath(product) + "?from=legacy");
  const category = middleware(new NextRequest("https://example.com/catalogo?cat=Cerrajer%C3%ADa&page=2&brand=YALE"));
  assert.equal(category.status, 301);
  assert.equal(category.headers.get("location"), "https://example.com/catalogo/cerrajeria?page=2&brand=YALE");
  assert.equal(middleware(new NextRequest("https://example.com" + routes.getProductPath(product))).status, 200);
});
test("each category has unique metadata; pagination self canonical and filters noindex follow", () => {
  assert.equal(new Set(CATALOG_CATEGORIES.map(category => catalogMetadata({ category }).title)).size, 9);
  assert.equal(new Set(CATALOG_CATEGORIES.map(category => category.introduction)).size, 9);
  assert.equal(catalogMetadata({ searchParams: { page: "2" } }).alternates.canonical, "/catalogo?page=2");
  assert.equal(catalogMetadata({ category: CATALOG_CATEGORIES[0], searchParams: { page: "2" } }).alternates.canonical, "/catalogo/cerrajeria?page=2");
  const excessive = catalogMetadata({ searchParams: { page: "999" } });
  assert.equal(excessive.alternates.canonical, "/catalogo?page=55");
  assert.equal(excessive.robots.index, false);
  for (const key of ["q", "sort", "brand", "min", "availability"]) {
    const metadata = catalogMetadata({ searchParams: { [key]: "test" } });
    assert.equal(metadata.robots.index, false); assert.equal(metadata.robots.follow, true);
  }
});
test("schemas use genuine product content, integer gross COP, no invented image or unknown brand", () => {
  const business = seo.getLocalBusinessJsonLd();
  assert.equal(business["@type"], "HardwareStore"); assert.equal(business.telephone.length, 2);
  assert.equal(business.openingHoursSpecification[0].closes, "16:55");
  assert.ok(business.address.streetAddress.includes("12 de Octubre"));
  assert.ok(business.paymentAccepted.includes("Nequi"));
  const product = { id: "0099", nombre: "BISAGRA BO-90 PVC", brand: "Sin marca", precio: 5200, taxRate: 19, priceVerified: true, stock: 0, unidad: "unidad", cat: "Cerrajería" };
  const json = seo.getProductJsonLd(product);
  assert.equal(json.name, "Bisagra BO-90 PVC"); assert.equal(json.offers.price, 6188);
  assert.equal(json.offers.availability, "https://schema.org/OutOfStock");
  assert.equal(json.brand, undefined); assert.equal(json.image, undefined); assert.equal(json.description, undefined);
  assert.equal(seo.getProductJsonLd({ ...product, precio: 10.5 }).offers.price, 12);
  const itemList = seo.getItemListJsonLd([product], 24);
  assert.equal(itemList.itemListElement[0].position, 25);
  assert.ok(itemList.itemListElement[0].url.includes("0099-bisagra-bo-90-pvc"));
});
test("canonical slugs resolve exact references and every catalog product has a unique route", () => {
  const products = catalog.getCatalogProducts();
  assert.equal(new Set(products.map(routes.getProductPath)).size, products.length);
  for (const product of products) assert.equal(catalog.getCatalogProduct(routes.getProductSlug(product)).id, product.id);
});

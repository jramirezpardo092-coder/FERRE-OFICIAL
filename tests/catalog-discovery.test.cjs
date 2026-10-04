const test = require("node:test");
const assert = require("node:assert/strict");
const createLoader = require("./load-ts.cjs");
const load = createLoader();
const catalog = load("src/lib/catalog-service.ts");
const routes = load("src/lib/catalog/routes.ts");
const { formatCOP, getUnitPriceWithTax } = load("src/lib/utils.ts");
const { normalizeProductName } = load("src/lib/catalog/normalize.ts");
test("copying the visible normalized product name finds its exact SKU without fuzzy fallback", () => {
  const product = catalog.getCatalogProduct("1863");
  const result = catalog.queryCatalog(new URLSearchParams({ q: normalizeProductName(product.nombre) }));
  assert.equal(result.isFuzzy, false);
  assert.equal(result.products[0].id, "1863");
});
for (const query of ["chapa", "visagra", "tornillo drywall", "candado yale", "lija 120", "broca 1/4"]) {
  test(`Colombian search: ${query} finds actual source references`, () => {
    const result = catalog.queryCatalog(new URLSearchParams({ q: query }));
    assert.ok(result.total > 0, query);
    for (const product of result.products) assert.equal(catalog.getCatalogProduct(routes.getProductSlug(product)).id, product.id);
  });
}
test("default catalog uses available > approved photo > name and keeps stock zero", () => {
  const products = catalog.getCatalogProducts();
  const pages = Array.from({ length: Math.ceil(products.length / 24) }, (_, index) => catalog.queryCatalog(new URLSearchParams({ page: String(index + 1) })).products).flat();
  assert.equal(pages.length, products.length);
  const firstExhausted = pages.findIndex(product => product.stock <= 0);
  assert.ok(firstExhausted > 0);
  assert.ok(pages.slice(firstExhausted).every(product => product.stock <= 0 || Math.floor(product.stock) === 0));
  assert.equal(pages[0].priceVerified, true);
  assert.ok(pages[0].img);
});
test("COP presentation has no cents while source price and tax calculations retain precision", () => {
  assert.equal(formatCOP(12500.5).replace(/\s/g, ""), "$12.501");
  const product = { precio: 12500.5, taxRate: 19, priceVerified: true };
  assert.equal(getUnitPriceWithTax(product), 14875.6);
  assert.equal(product.precio, 12500.5);
});

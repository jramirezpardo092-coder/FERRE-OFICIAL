const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { parseArgs, attributes, parseHtml, selectFixtures, inspectCatalog, inspectProduct, redirectDestination } = require("../scripts/verify-catalog-http.cjs");

test("HTTP arguments require an origin, isolate report output and make production ISR explicit", () => {
  const options = parseArgs(["--url", "http://localhost:3010/", "--require-isr", "--output", "../outputs/catalog-http/unit.json"]);
  assert.equal(options.url, "http://localhost:3010");
  assert.equal(options.requireIsr, true);
  assert.equal(options.canonicalOrigin, "https://ferre-oficial.vercel.app");
  for (const value of ["/catalogo", "https://user:password@example.com", "https://example.com/catalogo", "https://example.com?q=1", "file:///tmp"]) assert.throws(() => parseArgs(["--url", value]));
  assert.throws(() => parseArgs([]), /--url is required/);
  assert.throws(() => parseArgs(["--url", "https://example.com", "--output", path.resolve(__dirname, "bad.json")]), /outside the repository/);
  assert.throws(() => parseArgs(["--url", "https://example.com", "--retry"]), /Unknown argument/);
});

test("HTML parser reads reordered escaped metadata and counts tags rather than Flight payload", () => {
  const html = `<html><head><meta content='Precio &quot;por confirmar&quot;. SKU &#48;035' name='description'><link href="https://ferre-oficial.vercel.app/catalogo" rel="canonical"><meta content="noindex, follow" name="robots"></head><body><h1>Catálogo <span>Ferretería Pardo</span></h1><script>self.__next_f.push(['<article><a href="/producto/fake">fake</a></article>'])</script><!-- <article>fake</article> --><template><article>fake</article></template><article><a href="/producto/0035-real">Real</a><a href="/producto/0035-real">Detalle</a></article><script type="application/ld+json">{"@context":"https://schema.org","@type":"ItemList","itemListElement":[]}</script></body></html>`;
  const parsed = parseHtml(html);
  assert.equal(parsed.description, 'Precio "por confirmar". SKU 0035');
  assert.equal(parsed.canonical, "https://ferre-oficial.vercel.app/catalogo");
  assert.deepEqual(parsed.h1, ["Catálogo Ferretería Pardo"]);
  assert.deepEqual(parsed.cards, ["/producto/0035-real"]);
  assert.equal(parsed.schemas.length, 1);
  assert.deepEqual(attributes('<meta NAME="description" content="A &amp; B" />'), { name: "description", content: "A & B" });
});

test("parser retains malformed JSON-LD and initial loader failures as audit evidence", () => {
  const parsed = parseHtml('<section aria-busy="true"><h2>PARDITO está buscando tus productos</h2></section><script type="application/ld+json">{broken}</script>');
  assert.equal(parsed.loading, true);
  assert.equal(parsed.schemaErrors.length, 1);
  const fake = parseHtml('<script>const phrase="PARDITO está buscando tus productos";</script>');
  assert.equal(fake.loading, false);
});

test("fixture selection uses exact real SKU and never fabricates a missing product", () => {
  const products = [{ id: "435", img: "/other.webp", price: 2 }, { id: "0435", img: "/verified.webp", price: 3 }, { id: "00050", price: 4 }, { id: "0242-1", price: null }];
  const chosen = selectFixtures(products, product => product.price, image => image || null);
  assert.deepEqual(chosen.map(item => item.product.id), ["0435", "00050", "0242-1"]);
  assert.throws(() => selectFixtures(products.filter(product => product.price !== null), product => product.price, image => image || null), /real catalog/);
});

test("redirect destinations accept valid relative Location without accepting another origin", () => {
  const request = "http://localhost:3010/catalogo-interno?q=0435";
  assert.equal(redirectDestination("/catalogo?q=0435", request), "http://localhost:3010/catalogo?q=0435");
  assert.equal(redirectDestination("http://localhost:3010/catalogo?q=0435", request), "http://localhost:3010/catalogo?q=0435");
  assert.notEqual(redirectDestination("https://other.example/catalogo?q=0435", request), "http://localhost:3010/catalogo?q=0435");
  assert.equal(redirectDestination(null, request), null);
});

test("catalog HTTP checks reject CSR-only cards, cached wrong results and wrong list positions", () => {
  const expected = { products: [{ id: "0435" }], page: 2, pageSize: 24, getProductPath: product => "/producto/" + product.id + "-real" };
  const metadata = { alternates: { canonical: "/catalogo?page=2" }, robots: { index: true, follow: true } };
  const parsed = { h1: ["Catálogo Ferretería Pardo"], title: "Catálogo", description: "Descripción", canonical: "https://ferre-oficial.vercel.app/catalogo?page=2", robots: "index, follow", loading: false, schemaErrors: [], cards: ["/producto/0435-real"], schemas: [{ "@type": "ItemList", itemListElement: [{ position: 25, url: "https://ferre-oficial.vercel.app/producto/0435-real" }] }] };
  const inspect = value => inspectCatalog(value, expected, metadata, "Catálogo Ferretería Pardo", "https://ferre-oficial.vercel.app");
  assert.ok(inspect(parsed).every(check => check.passed));
  assert.equal(inspect({ ...parsed, cards: [] }).find(check => check.name === "server-cards").passed, false);
  assert.equal(inspect({ ...parsed, schemas: [{ "@type": "ItemList", itemListElement: [{ position: 1, url: "/producto/other" }] }] }).find(check => check.name === "filtered-itemlist").passed, false);
  assert.equal(inspect({ ...parsed, schemas: [{ "@type": "ItemList", itemListElement: [{ position: 1, url: "/producto/0435-real" }] }] }).find(check => check.name === "itemlist-positions").passed, false);
});

test("product HTTP checks require the shared price prefix, literal SKU and consistent Offer", () => {
  const product = { id: "0435", gross: 119, stock: 1 };
  const source = { getCatalogPrice: item => item.gross, formatCOP: number => "$ " + number, getProductPath: item => "/producto/" + item.id + "-real", getAvailableQuantity: item => item.stock };
  const parsed = { h1: ["Bisagra"], canonical: "https://ferre-oficial.vercel.app/producto/0435-real", description: "$ 119 IVA incluido. Bisagra", ogDescription: "$ 119 IVA incluido | Cerrajería", schemaErrors: [], schemas: [{ "@type": "Product", sku: "0435", offers: { price: 119, priceCurrency: "COP", url: "https://ferre-oficial.vercel.app/producto/0435-real", priceSpecification: { valueAddedTaxIncluded: true }, availability: "https://schema.org/InStock" } }] };
  const inspect = (value, item = product) => inspectProduct(value, item, source, "https://ferre-oficial.vercel.app");
  assert.ok(inspect(parsed).every(check => check.passed));
  assert.equal(inspect({ ...parsed, description: "$ 100 sin IVA. Bisagra" }).find(check => check.name === "price-description-prefix").passed, false);
  assert.equal(inspect({ ...parsed, schemas: [{ "@type": "Product", sku: "435" }] }).find(check => check.name === "literal-sku").passed, false);
  const pending = { ...parsed, description: "Precio por confirmar. Bisagra", ogDescription: "Precio por confirmar | Cerrajería", schemas: [{ "@type": "Product", sku: "0435" }] };
  assert.ok(inspect(pending, { ...product, gross: null }).every(check => check.passed));
  assert.equal(inspect({ ...pending, schemas: parsed.schemas }, { ...product, gross: null }).find(check => check.name === "offer-price").passed, false);
});

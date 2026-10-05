const test = require("node:test");
const assert = require("node:assert/strict");
const { renderToStaticMarkup } = require("react-dom/server");
const { NextRequest } = require("next/server");
const createLoader = require("./load-ts.cjs");

const load = createLoader({
  "../CatalogClient": { __esModule: true, default() { return null; } },
  "../Breadcrumbs": { __esModule: true, default() { return null; } },
});
const { proxy, config } = load("src/proxy.ts");
const catalog = load("src/lib/catalog-service.ts");
const { getProductPath } = load("src/lib/catalog/routes.ts");
const { CATALOG_CATEGORIES } = load("src/lib/catalog/categories.ts");
const clean = load("src/app/catalogo/page.tsx");
const cleanCategory = load("src/app/catalogo/[category]/page.tsx");
const query = load("src/app/catalogo-interno/page.tsx");
const queryCategory = load("src/app/catalogo-interno/[category]/page.tsx");

function response(path) { return proxy(new NextRequest("https://example.com" + path)); }
function itemList(element) {
  const html = renderToStaticMarkup(element);
  const match = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  assert.ok(match, "Initial HTML must contain catalog JSON-LD");
  return { html, schema: JSON.parse(match[1]) };
}

test("clean public catalog routes use Node ISR300 without reading request searchParams", async () => {
  const props = { params: Promise.resolve({ category: "cerrajeria" }) };
  Object.defineProperty(props, "searchParams", { get() { throw new Error("Clean ISR read request data"); } });
  for (const route of [clean, cleanCategory]) {
    assert.equal(route.dynamic, "error");
    assert.equal(route.runtime, "nodejs");
    assert.equal(route.revalidate, 300);
    assert.equal((await route.generateMetadata(props)).robots.index, true);
    assert.ok(itemList(await route.default(props)).html.includes("<h1"));
  }
  assert.equal(cleanCategory.dynamicParams, false);
  assert.deepEqual(Array.from(cleanCategory.generateStaticParams(), item => item.category), Array.from(CATALOG_CATEGORIES, item => item.slug));
  for (const path of ["/catalogo", "/catalogo/cerrajeria"]) {
    const result = response(path);
    assert.equal(result.headers.get("x-middleware-next"), "1");
    assert.equal(result.headers.get("x-middleware-rewrite"), null);
  }
});

test("every user query bypasses clean ISR, including pagination and unknown or empty keys", async () => {
  for (const path of ["/catalogo", "/catalogo/cerrajeria"]) {
    for (const search of ["q=0435", "brand=YALE", "sort=price-asc", "min=10&max=20", "availability=in-stock", "page=2", "q=", "tracking=campaign", "q=uno&q=dos"]) {
      const result = response(path + "?" + search);
      assert.equal(result.status, 200);
      assert.equal(result.headers.get("x-middleware-rewrite"), "https://example.com/catalogo-interno" + path.slice("/catalogo".length) + "?" + search);
      assert.equal(result.headers.get("location"), null);
    }
  }
});

test("legacy category redirect happens before query rewrite and preserves remaining filters", async () => {
  const first = response("/catalogo?cat=Cerrajer%C3%ADa&page=2&brand=YALE");
  assert.equal(first.status, 301);
  assert.equal(first.headers.get("location"), "https://example.com/catalogo/cerrajeria?page=2&brand=YALE");
  const second = proxy(new NextRequest(first.headers.get("location")));
  assert.equal(second.headers.get("x-middleware-rewrite"), "https://example.com/catalogo-interno/cerrajeria?page=2&brand=YALE");
});

test("direct internal URLs redirect once to public URLs without losing query or category", async () => {
  assert.ok(config.matcher.includes("/catalogo-interno/:path*"));
  for (const path of ["/catalogo-interno", "/catalogo-interno/cerrajeria", "/catalogo-interno/invalid-category"]) {
    for (const search of ["", "?q=0435&sort=name"]) {
      const result = response(path + search);
      assert.equal(result.status, 301);
      assert.equal(result.headers.get("location"), "https://example.com/catalogo" + path.slice("/catalogo-interno".length) + search);
      assert.equal(result.headers.get("x-middleware-rewrite"), null);
    }
  }
});

test("query routes preserve dynamic SSR, public metadata and the actual filtered ItemList", async () => {
  for (const [route, category] of [[query, undefined], [queryCategory, CATALOG_CATEGORIES[0]]]) {
    assert.equal(route.dynamic, "force-dynamic");
    assert.equal(route.runtime, "nodejs");
    assert.equal(route.revalidate, 0);
    const searchParams = { q: "0435" };
    const props = { params: Promise.resolve({ category: category?.slug }), searchParams: Promise.resolve(searchParams) };
    const metadata = await route.generateMetadata(props);
    assert.equal(metadata.alternates.canonical, category ? "/catalogo/" + category.slug : "/catalogo");
    assert.equal(metadata.robots.index, false);
    assert.equal(metadata.robots.follow, true);
    const params = new URLSearchParams(searchParams);
    if (category) params.set("cat", category.name);
    const expected = catalog.queryCatalog(params);
    const result = itemList(await route.default(props));
    assert.ok(result.html.includes("<h1"));
    assert.deepEqual(result.schema.itemListElement.map(item => new URL(item.url).pathname), Array.from(expected.products, getProductPath));
    assert.ok(!JSON.stringify(result.schema).includes("catalogo-interno"));
  }
});

test("pagination stays dynamic but retains its public canonical and absolute list positions", async () => {
  const props = { searchParams: Promise.resolve({ page: "2" }) };
  const metadata = await query.generateMetadata(props);
  assert.equal(metadata.alternates.canonical, "/catalogo?page=2");
  assert.equal(metadata.robots.index, true);
  const result = itemList(await query.default(props));
  assert.equal(result.schema.itemListElement[0].position, 25);
  const first = itemList(clean.default()).schema.itemListElement.map(item => item.url);
  assert.ok(result.schema.itemListElement.every(item => !first.includes(item.url)));
});

test("unknown categories remain 404 in clean and query routes", async () => {
  for (const route of [cleanCategory, queryCategory]) {
    const props = { params: Promise.resolve({ category: "not-a-category" }), searchParams: Promise.resolve({ q: "0435" }) };
    await assert.rejects(() => route.default(props), /NEXT_HTTP_ERROR_FALLBACK;404/);
    await assert.rejects(() => route.generateMetadata(props), /NEXT_HTTP_ERROR_FALLBACK;404/);
  }
});

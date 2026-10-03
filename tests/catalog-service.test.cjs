const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const test = require("node:test");
const ts = require("typescript");

function loadModule(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const exports = {};
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(compiled, { exports, Intl, URLSearchParams, require: (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

const constants = loadModule("src/lib/constants.ts");
const utils = loadModule("src/lib/utils.ts", { "./constants": constants });
const filters = loadModule("src/lib/catalog-filters.ts", { "./utils": utils });
const search = loadModule("src/lib/search.ts", { "fuse.js": require("fuse.js") });
const enrichment = loadModule("src/lib/product-enrichment.ts", { "@/data/product-enrichment.json": {} });
const base = { id: "0001", nombre: "Taladro", precio: 100, stock: 3, unidad: "unidad", cat: "Herramientas", brand: "TRUPER", taxRate: 19, priceVerified: true };
const fixture = Array.from({ length: 55 }, (_, index) => ({
  ...base, id: `P${String(index).padStart(3, "0")}`, nombre: `Taladro ${index}`, precio: 100 + index,
  stock: index === 0 ? 0 : 3, cat: index % 3 ? "Herramientas" : "Construcción", brand: index % 2 ? "BOSCH" : "TRUPER",
}));
const plain = (value) => JSON.parse(JSON.stringify(value));
const ids = (items) => Array.from(items, (item) => item.id);

function service(products = fixture) {
  return loadModule("src/lib/catalog-service.ts", {
    "server-only": {}, "@/data/products.json": products,
    "./catalog-filters": filters, "./product-enrichment": enrichment,
    "./search": search, "./utils": utils,
  });
}
const query = (catalog, parameters = "", offersOnly = false) => catalog.queryCatalog(new URLSearchParams(parameters), offersOnly);

test("server catalog pages at 24, keeps published order and exhausted references by default", () => {
  const catalog = service();
  const first = query(catalog);
  const second = query(catalog, "page=2");
  const final = query(catalog, "page=3");
  assert.equal(first.total, 55);
  assert.equal(first.pageSize, 24);
  assert.equal(first.totalPages, 3);
  assert.equal(first.products.length, 24);
  assert.equal(first.products[0].id, "P000");
  assert.equal(first.products[0].stock, 0);
  assert.deepEqual(ids([...first.products, ...second.products, ...final.products]), fixture.map((product) => product.id));
});

test("invalid pages fall back safely, excessive pages clamp and empty results stay page1", () => {
  const catalog = service();
  for (const page of ["0", "-1", "1.5", "NaN", "Infinity", "1e3", "9007199254740992"]) {
    assert.equal(query(catalog, `page=${page}`).page, 1, page);
  }
  assert.equal(query(catalog, "page=99999").page, 3);
  const empty = query(catalog, "cat=Unknown&page=99999");
  assert.equal(empty.total, 0);
  assert.equal(empty.page, 1);
  assert.equal(empty.totalPages, 1);
  assert.deepEqual(ids(empty.products), []);
});

test("exact SKU/ref matching preserves leading zeros instead of matching another textual code", () => {
  const catalog = service([
    { ...base, id: "0044", sku: "0044", stock: 0 },
    { ...base, id: "44", sku: "44" },
    { ...base, id: "other", nombre: "Accesorio compatible0044", ref: "AB-002" },
  ]);
  assert.deepEqual(ids(query(catalog, "q=0044").products), ["0044"]);
  assert.deepEqual(ids(query(catalog, "q=44").products), ["44"]);
  assert.deepEqual(ids(query(catalog, "q=ab-002").products), ["other"]);
  assert.equal(catalog.getCatalogProduct("0044").id, "0044");
  assert.equal(catalog.getCatalogProduct("4"), undefined);
  assert.equal(query(catalog, "q=0044").isFuzzy, false);
  assert.equal(query(catalog, "q=0044").suggestions[0].value, "0044");
});

test("search normalizes accents and uses fuzzy fallback without silently requiring stock", () => {
  const catalog = service([{ ...base, id: "002", nombre: "Candado metálico", stock: 0 }]);
  assert.deepEqual(ids(query(catalog, "q=candado+metalico").products), ["002"]);
  const fuzzy = query(catalog, "q=canddao");
  assert.deepEqual(ids(fuzzy.products), ["002"]);
  assert.equal(fuzzy.isFuzzy, true);
});

test("server detail helpers return only exact/public related references and preserve exhausted ones", () => {
  const catalog = service([
    { ...base, id: "0044" },
    { ...base, id: "first", stock: 0 },
    { ...base, id: "other-category", cat: "Pintura" },
    { ...base, id: "second" },
    { ...base, id: "third", ingresos: 2000 },
  ]);
  const related = catalog.getRelatedCatalogProducts("0044", 2);
  assert.deepEqual(ids(related), ["first", "second"]);
  assert.equal(related[0].stock, 0);
  assert.equal("ingresos" in catalog.getRelatedCatalogProducts("0044").at(-1), false);
  assert.deepEqual(ids(catalog.getRelatedCatalogProducts("44")), []);
  assert.deepEqual(ids(catalog.getRelatedCatalogProducts("0044", 0)), []);
  related[0].nombre = "Mutated";
  assert.equal(catalog.getCatalogProduct("first").nombre, "Taladro");
});

test("facets omit their own filter but retain the query and other selected filters", () => {
  const catalog = service([
    { ...base, id: "A", cat: "Herramientas", brand: "TRUPER", precio: 100 },
    { ...base, id: "B", cat: "Construcción", brand: "TRUPER", precio: 100 },
    { ...base, id: "C", cat: "Herramientas", brand: "BOSCH", precio: 100 },
    { ...base, id: "D", cat: "Construcción", brand: "BOSCH", precio: 100 },
    { ...base, id: "E", cat: "Construcción", brand: "TRUPER", precio: 200 },
    { ...base, id: "F", nombre: "Candado", cat: "Construcción", brand: "TRUPER", precio: 100 },
  ]);
  const result = query(catalog, "q=taladro&cat=Herramientas&brand=TRUPER&max=100");
  assert.deepEqual(ids(result.products), ["A"]);
  assert.deepEqual(plain(result.categories), [{ name: "Construcción", count: 1 }, { name: "Herramientas", count: 1 }]);
  assert.deepEqual(plain(result.brands), [{ name: "BOSCH", count: 1 }, { name: "TRUPER", count: 1 }]);
});

test("missing prices remain consultable; ranges and bounds use verified prices before IVA", () => {
  const catalog = service([
    { ...base, id: "pending", precio: 0, priceVerified: false },
    { ...base, id: "known", precio: 100, stock: 0 },
    { ...base, id: "expensive", precio: 150 },
  ]);
  assert.equal(query(catalog).total, 3);
  assert.deepEqual(plain(query(catalog).priceBounds), { min: 100, max: 150 });
  assert.deepEqual(ids(query(catalog, "min=0&max=100").products), ["known"]);
  for (const sort of ["price-asc", "price-desc"]) assert.equal(query(catalog, `sort=${sort}`).products.at(-1).id, "pending");
  const invalid = query(catalog, "min=200&max=100&availability=on-request");
  assert.equal(invalid.filtersValid, false);
  assert.deepEqual(ids(invalid.products), ["known"]);
  assert.equal(query(service([{ ...base, precio: 0, priceVerified: false }])).priceBounds, undefined);
});

test("availability stays voluntary and the offers-only server option cannot be switched off", () => {
  const catalog = service([
    { ...base, id: "available" },
    { ...base, id: "exhausted", stock: 0, precio: 80, original: 100, disc: 20 },
    { ...base, id: "measured", stock: 0.5, unidad: "metro" },
    { ...base, id: "fractional-pair", stock: 0.5, unidad: "numero de pares" },
  ]);
  assert.deepEqual(ids(query(catalog, "availability=on-request").products), ["exhausted", "fractional-pair"]);
  assert.deepEqual(ids(query(catalog, "availability=in-stock").products), ["available", "measured"]);
  assert.deepEqual(ids(query(catalog, "ofertas=false", true).products), ["exhausted"]);
  assert.deepEqual(ids(query(catalog, "sort=untrusted-sort").products), ["available", "exhausted", "measured", "fractional-pair"]);
});

test("suggestions are bounded, structured and never contain the complete catalog", () => {
  const catalog = service(fixture.map((product) => ({ ...product, cat: "Taladro accesorios", brand: "Taladro marca" })));
  const result = query(catalog, "q=taladro");
  assert.equal(result.products.length, 24);
  assert.equal(result.suggestions.length, 8);
  assert.equal(result.suggestions.some((item) => item.type === "category"), true);
  assert.equal(result.suggestions.some((item) => item.type === "brand"), true);
  assert.deepEqual(ids(query(catalog).suggestions), []);
  for (const item of result.suggestions) {
    assert.equal(typeof item.label, "string");
    assert.equal(typeof item.value, "string");
    assert.equal("precio" in item, false);
  }
});

test("query text and facet names are bounded and unsupported availability remains voluntary", () => {
  const catalog = service([{ ...base, nombre: "a".repeat(120), cat: "c".repeat(80), brand: "b".repeat(80), stock: 0 }]);
  assert.equal(query(catalog, `q=${"a".repeat(120)}overflow`).total, 1);
  assert.equal(query(catalog, `cat=${"c".repeat(80)}&brand=${"b".repeat(80)}`).filtersValid, true);
  assert.equal(query(catalog, `cat=${"c".repeat(81)}`).filtersValid, false);
  assert.equal(query(catalog, `brand=${"b".repeat(81)}`).filtersValid, false);
  const unsupported = query(catalog, "availability=unknown");
  assert.equal(unsupported.filtersValid, false);
  assert.equal(unsupported.products[0].stock, 0);
});

test("public shipment is a whitelist even for nested verified media/specs; responses are isolated", () => {
  const catalog = service([{ ...base, quantitySold: 500, ingresos: 30000, audit: { private: true }, sales: { client: "Private" },
    tags: ["taladro"],
    gallery: [{ src: "/productos/taladro.webp", alt: "Taladro", verified: true, quantitySold: 10 }, { src: "/unverified.webp", verified: false }],
    specs: [{ label: "Voltaje", value: "120V", verified: true, revenue: 100 }, { label: "Inventado", value: "No", verified: false }],
  }]);
  const result = query(catalog);
  assert.deepEqual(plain(result.products[0].gallery), [{ src: "/productos/taladro.webp", alt: "Taladro", verified: true }]);
  assert.deepEqual(plain(result.products[0].specs), [{ label: "Voltaje", value: "120V", verified: true }]);
  const serialized = JSON.stringify(result);
  for (const privateName of ["quantitySold", "ingresos", "audit", "sales", "revenue", "Private"]) assert.equal(serialized.includes(privateName), false, privateName);
  result.products[0].nombre = "Mutated";
  result.products[0].tags.push("Mutated");
  result.products[0].gallery[0].alt = "Mutated";
  const entire = catalog.getCatalogProducts();
  entire[0].precio = 999999;
  entire[0].specs[0].value = "Mutated";
  const untouched = query(catalog).products[0];
  assert.equal(untouched.nombre, "Taladro");
  assert.equal(untouched.precio, 100);
  assert.deepEqual(plain(untouched.tags), ["taladro"]);
  assert.equal(untouched.gallery[0].alt, "Taladro");
  assert.equal(untouched.specs[0].value, "120V");
});

test("GET emits only a limited public page with no-store and rejects oversized queries", () => {
  const catalog = service();
  const route = loadModule("src/app/api/catalogo/route.ts", {
    "@/lib/catalog-service": catalog,
    "next/server": { NextResponse: { json: (body, options) => ({ body, status: options.status || 200, headers: options.headers }) } },
  });
  const response = route.GET({ nextUrl: new URL("https://example.test/api/catalogo?page=2") });
  assert.equal(response.status, 200);
  assert.equal(response.body.products.length, 24);
  assert.equal(response.body.page, 2);
  assert.match(response.headers["Cache-Control"], /no-store/);
  assert.equal(route.dynamic, "force-dynamic");
  const invalid = route.GET({ nextUrl: new URL(`https://example.test/api/catalogo?q=${"x".repeat(4097)}`) });
  assert.equal(invalid.status, 400);
  assert.match(invalid.headers["Cache-Control"], /no-store/);
});

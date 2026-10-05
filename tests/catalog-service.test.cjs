const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const test = require("node:test");
const ts = require("typescript");

function loadModule(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const exports = {};
  const compiled = ts.transpileModule(source, { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(compiled, { exports, Intl, URLSearchParams, require: (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

const constants = loadModule("src/lib/constants.ts");
const dictionaries = loadModule("src/lib/catalog/dictionaries.ts");
const normalization = loadModule("src/lib/catalog/normalize.ts", { "./dictionaries": dictionaries });
const routes = loadModule("src/lib/catalog/routes.ts", { "../constants": constants, "./normalize": normalization });
const utils = loadModule("src/lib/utils.ts", { "./constants": constants });
const filters = loadModule("src/lib/catalog-filters.ts", { "./utils": utils });
const synonyms = loadModule("src/lib/catalog/synonyms.ts");
const search = loadModule("src/lib/search.ts", { "fuse.js": require("fuse.js"), "./catalog/synonyms": synonyms, "./catalog/normalize": normalization });
const base = { id: "0001", nombre: "Taladro", precio: 100, stock: 3, unidad: "unidad", cat: "Herramientas", brand: "TRUPER", taxRate: 19, priceVerified: true };
const fixture = Array.from({ length: 55 }, (_, index) => ({
  ...base, id: `P${String(index).padStart(3, "0")}`, nombre: `Taladro ${index}`, precio: 100 + index,
  stock: index === 0 ? 0 : 3, cat: index % 3 ? "Herramientas" : "Construcción", brand: index % 2 ? "BOSCH" : "TRUPER",
}));
const plain = (value) => JSON.parse(JSON.stringify(value));
const ids = (items) => Array.from(items, (item) => item.id);

function service(products = fixture, enrichmentEntries = {}) {
  const enrichment = loadModule("src/lib/product-enrichment.ts", { "@/data/product-enrichment.json": enrichmentEntries });
  return loadModule("src/lib/catalog-service.ts", {
    "server-only": {}, "@/data/products.json": products,
    "./catalog-filters": filters, "./product-enrichment": enrichment,
    "./search": search, "./utils": utils, "./catalog/routes": routes, "./catalog/normalize": normalization,
  });
}
const query = (catalog, parameters = "", offersOnly = false) => catalog.queryCatalog(new URLSearchParams(parameters), offersOnly);
const approvedPhotos = (products) => Object.fromEntries(products.map((product) => [product.id, {
  gallery: [{ src: `/products/${product.id}.webp`, alt: product.nombre, verified: true }],
}]));

test("home highlights choose an enriched photograph after an unphotographed category leader and return isolated public data", () => {
  const products = [
    { ...base, id: "0005", nombre: "Primera referencia sin foto" },
    { ...base, id: "0044", nombre: "Referencia fotografiada", ref: "REF-044", tags: ["herramienta"], quantitySold: 90, ingresos: 3000, audit: { private: true } },
  ];
  const entries = { "0044": {
    gallery: [{ src: "/products/0044.webp", alt: "Foto aprobada", verified: true, quantitySold: 90 }],
    specs: [{ label: "Medida", value: "1/4 pulgadas", verified: true, revenue: 3000 }],
  } };
  const before = JSON.stringify({ products, entries });
  const catalog = service(products, entries);
  const featured = catalog.getFeaturedCatalogProducts();
  assert.deepEqual(ids(featured), ["0044"]);
  assert.equal(featured[0].img, "products/0044.webp");
  assert.deepEqual(plain(featured[0].gallery), [{ src: "/products/0044.webp", alt: "Foto aprobada", verified: true }]);
  assert.equal(featured[0].ref, "REF-044");
  for (const key of ["quantitySold", "ingresos", "audit", "private", "revenue"]) assert.equal(JSON.stringify(featured).includes(key), false, key);

  featured[0].precio = 999999;
  featured[0].stock = 999;
  featured[0].tags.push("Mutated");
  featured[0].gallery[0].alt = "Mutated";
  featured[0].specs[0].value = "Mutated";
  const again = catalog.getFeaturedCatalogProducts()[0];
  assert.equal(again.precio, base.precio);
  assert.equal(again.stock, base.stock);
  assert.deepEqual(plain(again.tags), ["herramienta"]);
  assert.equal(again.gallery[0].alt, "Foto aprobada");
  assert.equal(again.specs[0].value, "1/4 pulgadas");
  assert.equal(JSON.stringify({ products, entries }), before);
});

test("home highlights give photographed categories a place before filling eight distinct references in published order", () => {
  const products = [
    ["A1", "A"], ["A2", "A"], ["B1", "B"], ["B2", "B"], ["C1", "C"],
    ["D1", "D"], ["E1", "E"], ["F1", "F"], ["A3", "A"], ["A1", "A"],
  ].map(([id, cat]) => ({ ...base, id, cat }));
  const catalog = service(products, approvedPhotos(products));
  const featured = catalog.getFeaturedCatalogProducts();
  assert.deepEqual(ids(featured), ["A1", "B1", "C1", "D1", "E1", "F1", "A2", "B2"]);
  assert.equal(new Set(ids(featured)).size, 8);
  assert.equal(new Set(featured.map((product) => product.cat)).size, 6);
  assert.deepEqual(ids(catalog.getFeaturedCatalogProducts()), ids(featured));

  const manyCategories = Array.from({ length: 10 }, (_, index) => ({ ...base, id: `SKU${index}`, cat: `Categoría${index}` }));
  assert.deepEqual(ids(service(manyCategories, approvedPhotos(manyCategories)).getFeaturedCatalogProducts()), manyCategories.slice(0, 8).map((product) => product.id));
  assert.deepEqual(ids(service([]).getFeaturedCatalogProducts()), []);
});

test("home eligibility keeps sold-out, pending-price and unphotographed references searchable without changing source values", () => {
  const products = [
    { ...base, id: "sold-out", stock: 0 },
    { ...base, id: "pending-price", precio: 0, priceVerified: false },
    { ...base, id: "zero-price", precio: 0 },
    { ...base, id: "unverified-price", priceVerified: false },
    { ...base, id: "fractional-pair", stock: 0.5, unidad: "numero de pares" },
    { ...base, id: "measured", stock: 0.5, unidad: "metro", precio: 12500.5 },
    { ...base, id: "no-photo", stock: 7 },
  ];
  const entries = approvedPhotos(products.filter((product) => product.id !== "no-photo"));
  const before = JSON.stringify(products);
  const catalog = service(products, entries);
  const entire = plain(catalog.getCatalogProducts());
  assert.deepEqual(ids(catalog.getFeaturedCatalogProducts()), ["measured"]);
  assert.equal(query(catalog).total, products.length);
  assert.deepEqual(ids(query(catalog).products).sort(), products.map((product) => product.id).sort());
  for (const product of products) {
    const match = query(catalog, `q=${encodeURIComponent(product.id)}`).products;
    assert.deepEqual(ids(match), [product.id]);
    for (const field of ["precio", "stock", "unidad", "priceVerified", "id"]) assert.equal(match[0][field], product[field], `${product.id}: ${field}`);
  }
  assert.deepEqual(plain(catalog.getCatalogProducts()), entire);
  assert.equal(JSON.stringify(products), before);
});

test("home highlights require a verified local gallery matching the primary image, rather than any image-like value", () => {
  const photographed = (id, img, gallery) => ({ ...base, id, img, gallery });
  const products = [
    photographed("img-only", "products/img-only.webp", undefined),
    photographed("unverified", "products/unverified.webp", [{ src: "/products/unverified.webp", verified: false }]),
    photographed("mismatch", "products/primary.webp", [{ src: "/products/other.webp", verified: true }]),
    photographed("external", "https://example.test/photo.webp", [{ src: "https://example.test/photo.webp", verified: true }]),
    photographed("temporary", "blob:https://example.test/photo", [{ src: "blob:https://example.test/photo", verified: true }]),
    photographed("traversal", "/products/../photo.webp", [{ src: "/products/../photo.webp", verified: true }]),
    photographed("approved", "/products/approved.webp", [{ src: "products/approved.webp", verified: true }]),
  ];
  const catalog = service(products);
  assert.deepEqual(ids(catalog.getFeaturedCatalogProducts()), ["approved"]);
  assert.deepEqual(ids(catalog.getCatalogProducts()), products.map((product) => product.id));
});

test("HomePage server rendering passes enriched highlights while counting the whole catalog", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const products = [
    { ...base, id: "first", nombre: "Primera referencia sin foto" },
    { ...base, id: "0044", nombre: "Producto con foto verificada" },
    { ...base, id: "sold-out", stock: 0, cat: "Cerrajería", brand: "Otra marca" },
  ];
  const catalog = service(products, { "0044": { gallery: [{ src: "/products/0044.webp", alt: "Foto verificada", verified: true }] } });
  const captured = {};
  const noop = () => null;
  const home = loadModule("src/app/page.tsx", {
    "react/jsx-runtime": require("react/jsx-runtime"),
    "@/data/products.json": products,
    "@/lib/catalog-service": catalog,
    "@/lib/seo": { getLocalBusinessJsonLd: () => ({ "@type": "LocalBusiness" }) },
    "@/components/HeroCarousel": (props) => { captured.hero = props; return null; },
    "@/components/CategoryGrid": (props) => { captured.categories = props.counts; return null; },
    "@/components/FeaturedProducts": ({ products: featured }) => {
      captured.featured = featured;
      return React.createElement("section", { id: "home-highlights" }, featured.map((product) => React.createElement("img", {
        key: product.id, "data-sku": product.id,
        src: product.img ? `/${product.img}` : "/placeholder-product.svg",
        alt: product.gallery?.[0]?.alt || product.nombre,
      })));
    },
    "@/components/ScrollReveal": ({ children }) => React.createElement(React.Fragment, null, children),
    "@/components/InstagramSection": noop,
    "@/components/BrandCarousel": noop,
    "@/components/Testimonials": noop,
  });
  const html = renderToStaticMarkup(React.createElement(home.default));
  assert.match(html, /data-sku="0044"/);
  assert.match(html, /src="\/products\/0044\.webp"/);
  assert.deepEqual(ids(captured.featured), ["0044"]);
  assert.equal(captured.hero.productCount, 3);
  assert.equal(captured.hero.brandCount, 2);
  assert.equal(captured.hero.categoryCount, 2);
  assert.deepEqual(plain(captured.categories), { Herramientas: 2, Cerrajería: 1 });
});

test("server catalog pages at 24, available first without excluding exhausted references", () => {
  const catalog = service();
  const first = query(catalog);
  const second = query(catalog, "page=2");
  const final = query(catalog, "page=3");
  assert.equal(first.total, 55);
  assert.equal(first.pageSize, 24);
  assert.equal(first.totalPages, 3);
  assert.equal(first.products.length, 24);
  assert.equal(first.products[0].id, "P001");
  assert.equal(first.products[0].stock, 3);
  const all = [...first.products, ...second.products, ...final.products];
  assert.equal(all.at(-1).id, "P000");
  assert.deepEqual(ids(all).sort(), fixture.map((product) => product.id).sort());
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

test("an exact public SKU outranks another product reference with the same code1104", () => {
  const published = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "src/data/products.json"), "utf8"));
  const matches = published.filter((product) => [product.id, product.sku, product.ref].includes("1104"));
  assert.deepEqual(matches.map((product) => product.id), ["0548", "1104"], "published order reproduces the reference collision");
  const result = query(service(matches), "q=1104");
  assert.deepEqual(ids(result.products), ["1104", "0548"]);
  assert.equal(result.suggestions[0].value, "1104");
  assert.equal(result.isFuzzy, false);

  const stable = query(service([
    { ...base, id: "first-ref", ref: "0044" },
    { ...base, id: "44", ref: "0044" },
    { ...base, id: "0044", stock: 0 },
    { ...base, id: "own-sku", sku: "0044" },
    { ...base, id: "last-ref", ref: "0044" },
  ]), "q=0044");
  assert.deepEqual(ids(stable.products), ["0044", "own-sku", "first-ref", "44", "last-ref"]);
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
  const result = query(catalog, "q=taladro&cat=Herramientas&brand=TRUPER&max=100&priceMode=net");
  assert.deepEqual(ids(result.products), ["A"]);
  assert.deepEqual(plain(result.categories), [{ name: "Construcción", count: 1 }, { name: "Herramientas", count: 1 }]);
  assert.deepEqual(plain(result.brands), [{ name: "BOSCH", count: 1 }, { name: "TRUPER", count: 1 }]);
});

test("missing prices remain consultable; gross bounds default and net ranges use confirmed amounts", () => {
  const catalog = service([
    { ...base, id: "pending", precio: 0, priceVerified: false },
    { ...base, id: "known", precio: 100, stock: 0 },
    { ...base, id: "expensive", precio: 150 },
  ]);
  assert.equal(query(catalog).total, 3);
  assert.deepEqual(plain(query(catalog).priceBounds), { min: 119, max: 179 });
  assert.deepEqual(plain(query(catalog, "priceMode=net").priceBounds), { min: 100, max: 150 });
  assert.deepEqual(ids(query(catalog, "min=0&max=100&priceMode=net").products), ["known"]);
  assert.deepEqual(ids(query(catalog, "min=0&max=100").products), []);
  for (const sort of ["price-asc", "price-desc"]) assert.equal(query(catalog, `sort=${sort}`).products.at(-1).id, "pending");
  const invalid = query(catalog, "min=200&max=100&availability=on-request");
  assert.equal(invalid.filtersValid, false);
  assert.deepEqual(ids(invalid.products), ["known"]);
  assert.equal(query(service([{ ...base, precio: 0, priceVerified: false }])).priceBounds, undefined);
});

test("price mode controls range, bounds and ordering with mixed IVA and fractional base prices", () => {
  const products = [
    { ...base, id: "vat19", precio: 100, taxRate: 19, stock: 0 },
    { ...base, id: "exempt", precio: 110, taxRate: 0 },
    { ...base, id: "vat5", precio: 107, taxRate: 5 },
    { ...base, id: "fractional", precio: 100.49, taxRate: 5 },
    { ...base, id: "pending", precio: 1, priceVerified: false },
    { ...base, id: "pending-second", precio: 2, priceVerified: false },
  ];
  const before = JSON.stringify(products);
  const catalog = service(products);
  const gross = query(catalog, "sort=price-asc");
  const net = query(catalog, "sort=price-asc&priceMode=net");
  assert.equal(gross.priceMode, "gross");
  assert.equal(net.priceMode, "net");
  assert.deepEqual(plain(gross.priceBounds), { min: 106, max: 119 });
  assert.deepEqual(plain(net.priceBounds), { min: 100, max: 110 });
  assert.deepEqual(ids(gross.products), ["fractional", "exempt", "vat5", "vat19", "pending", "pending-second"]);
  assert.deepEqual(ids(net.products), ["vat19", "fractional", "vat5", "exempt", "pending", "pending-second"]);
  assert.deepEqual(ids(query(catalog, "sort=price-desc").products), ["vat19", "vat5", "exempt", "fractional", "pending", "pending-second"]);
  assert.deepEqual(ids(query(catalog, "sort=price-desc&priceMode=net").products), ["exempt", "vat5", "vat19", "fractional", "pending", "pending-second"]);
  assert.deepEqual(ids(query(catalog, "min=105&max=112&sort=price-asc").products), ["fractional", "exempt", "vat5"]);
  assert.deepEqual(ids(query(catalog, "min=105&max=112&sort=price-asc&priceMode=net").products), ["vat5", "exempt"]);
  const exhausted = query(catalog, "min=119&max=119");
  assert.deepEqual(ids(exhausted.products), ["vat19"]);
  assert.equal(exhausted.products[0].stock, 0);
  assert.equal(gross.products[0].precio, 100.49, "public DTO keeps the actual base price");
  assert.equal(JSON.stringify(products), before);
});

test("a confirmed base with unknown tax participates in net ranges but never invents a gross amount", () => {
  const catalog = service([
    { ...base, id: "unknown-tax", precio: 100.49, taxRate: undefined },
    { ...base, id: "known", precio: 200, taxRate: 0 },
    { ...base, id: "pending", precio: 1, priceVerified: false },
  ]);
  const gross = query(catalog, "sort=price-asc");
  const net = query(catalog, "sort=price-asc&priceMode=net");
  assert.equal(gross.total, 3);
  assert.deepEqual(ids(gross.products), ["known", "unknown-tax", "pending"]);
  assert.deepEqual(plain(gross.priceBounds), { min: 200, max: 200 });
  assert.deepEqual(ids(net.products), ["unknown-tax", "known", "pending"]);
  assert.deepEqual(plain(net.priceBounds), { min: 100, max: 200 });
  assert.deepEqual(ids(query(catalog, "max=100").products), []);
  const baseOnly = query(catalog, "max=100&priceMode=net");
  assert.deepEqual(ids(baseOnly.products), ["unknown-tax"]);
  assert.equal(baseOnly.products[0].precio, 100.49);
  assert.equal(baseOnly.products[0].taxRate, undefined);
});

test("mode-aware bounds omit the range itself while facets keep the requested mode and other filters", () => {
  const catalog = service([
    { ...base, id: "A", precio: 100, taxRate: 19, cat: "Herramientas", brand: "TRUPER" },
    { ...base, id: "B", precio: 100, taxRate: 5, cat: "Construcción", brand: "TRUPER" },
    { ...base, id: "C", precio: 100, taxRate: 0, cat: "Herramientas", brand: "BOSCH" },
    { ...base, id: "D", precio: 200, taxRate: 0, cat: "Herramientas", brand: "TRUPER" },
    { ...base, id: "pending", precio: 1, priceVerified: false, cat: "Herramientas", brand: "TRUPER" },
  ]);
  const gross = query(catalog, "q=taladro&cat=Herramientas&brand=TRUPER&max=105");
  assert.equal(gross.total, 0);
  assert.deepEqual(plain(gross.categories), [{ name: "Construcción", count: 1 }]);
  assert.deepEqual(plain(gross.brands), [{ name: "BOSCH", count: 1 }]);
  assert.deepEqual(plain(gross.priceBounds), { min: 119, max: 200 });
  const net = query(catalog, "q=taladro&cat=Herramientas&brand=TRUPER&max=105&priceMode=net");
  assert.deepEqual(ids(net.products), ["A"]);
  assert.deepEqual(plain(net.priceBounds), { min: 100, max: 200 });
  assert.deepEqual(plain(net.categories), [{ name: "Construcción", count: 1 }, { name: "Herramientas", count: 1 }]);
});

test("API priceMode defaults gross and reports unsupported modes without fabricating prices", () => {
  const catalog = service([
    { ...base, id: "known", precio: 100, taxRate: 5 },
    { ...base, id: "pending", precio: 0, priceVerified: false },
  ]);
  for (const parameters of ["", "priceMode=gross", "priceMode=net"]) assert.equal(query(catalog, parameters).filtersValid, true);
  for (const mode of ["", "GROSS", "19", "unknown"]) {
    const invalid = query(catalog, `priceMode=${mode}&max=104`);
    assert.equal(invalid.filtersValid, false);
    assert.equal(invalid.priceMode, "gross");
    assert.deepEqual(ids(invalid.products), []);
    assert.deepEqual(plain(invalid.priceBounds), { min: 105, max: 105 });
  }
  assert.equal(query(catalog, "priceMode=net&max=104").products[0].id, "known");
});

test("service bounds and exact ranges preserve the displayed COP at rounding boundaries", () => {
  const catalog = service([
    { ...base, id: "half", precio: 10.5, taxRate: 19 },
    { ...base, id: "fractional", precio: 550.425, taxRate: 19 },
  ]);
  assert.deepEqual(plain(query(catalog).priceBounds), { min: 12, max: 655 });
  assert.deepEqual(plain(query(catalog, "priceMode=net").priceBounds), { min: 11, max: 550 });
  assert.deepEqual(ids(query(catalog, "min=12&max=12").products), ["half"]);
  assert.deepEqual(ids(query(catalog, "min=13&max=13").products), []);
  assert.equal(query(catalog, "min=12&max=12").products[0].precio, 10.5);
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
  assert.deepEqual(ids(query(catalog, "sort=untrusted-sort").products), ["available", "measured", "exhausted", "fractional-pair"]);
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
    gallery: [{ src: "/productos/taladro.webp", alt: "Taladro", verified: true, kind: "supplier-render", caption: " Vista exterior; mecanismo no visible. ", sourcePath: "/private/original", quantitySold: 10 }, { src: "/unverified.webp", verified: false }],
    specs: [{ label: "Voltaje", value: "120V", verified: true, revenue: 100 }, { label: "Inventado", value: "No", verified: false }],
  }]);
  const result = query(catalog);
  assert.deepEqual(plain(result.products[0].gallery), [{ src: "/productos/taladro.webp", alt: "Taladro", verified: true, kind: "supplier-render", caption: "Vista exterior; mecanismo no visible." }]);
  assert.deepEqual(plain(result.products[0].specs), [{ label: "Voltaje", value: "120V", verified: true }]);
  const serialized = JSON.stringify(result);
  for (const privateName of ["quantitySold", "ingresos", "audit", "sales", "revenue", "Private", "sourcePath", "/private/original"]) assert.equal(serialized.includes(privateName), false, privateName);
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

test("GET emits only a limited public page with CDN cache and rejects oversized queries", () => {
  const catalog = service();
  const route = loadModule("src/app/api/catalogo/route.ts", {
    "@/lib/catalog-service": catalog,
    "next/server": { NextResponse: { json: (body, options) => ({ body, status: options.status || 200, headers: options.headers }) } },
  });
  const response = route.GET({ nextUrl: new URL("https://example.test/api/catalogo?page=2") });
  assert.equal(response.status, 200);
  assert.equal(response.body.products.length, 24);
  assert.equal(response.body.page, 2);
  assert.equal(response.body.priceMode, "gross");
  assert.equal(response.headers["Cache-Control"], "public, s-maxage=300, stale-while-revalidate=86400");
  assert.equal(route.dynamic, "force-dynamic");
  const gross = route.GET({ nextUrl: new URL("https://example.test/api/catalogo?max=100&priceMode=gross") });
  const net = route.GET({ nextUrl: new URL("https://example.test/api/catalogo?max=100&priceMode=net") });
  assert.equal(gross.body.total, 0);
  assert.deepEqual(ids(net.body.products), ["P000"]);
  assert.equal(net.body.priceMode, "net");
  assert.equal(net.body.products[0].precio, 100);
  assert.equal(net.body.products[0].stock, 0);
  assert.equal(net.headers["Cache-Control"], response.headers["Cache-Control"]);
  const invalid = route.GET({ nextUrl: new URL(`https://example.test/api/catalogo?q=${"x".repeat(4097)}`) });
  assert.equal(invalid.status, 400);
  assert.match(invalid.headers["Cache-Control"], /no-store/);
});

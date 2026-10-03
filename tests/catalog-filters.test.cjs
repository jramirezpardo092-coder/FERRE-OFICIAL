const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const test = require("node:test");
const ts = require("typescript");

function loadModule(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const exports = {};
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, { exports, Intl, require: (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

const constants = loadModule("src/lib/constants.ts");
const utils = loadModule("src/lib/utils.ts", { "./constants": constants });
const filters = loadModule("src/lib/catalog-filters.ts", { "./utils": utils });
const base = { id: "available", nombre: "Taladro", cat: "Herramientas", brand: "TRUPER", unidad: "unidad", stock: 3, precio: 100, taxRate: 19, priceVerified: true };
const products = [base, { ...base, id: "sold-out", stock: 0 }, { ...base, id: "pending-price", precio: 0, priceVerified: false },
  { ...base, id: "measured", unidad: "metro", stock: 0.5 }, { ...base, id: "fractional-pair", unidad: "numero de pares", stock: 0.5 }];
const ids = (items) => Array.from(items, (item) => item.id);
const withFilters = (patch) => ({ ...filters.DEFAULT_FILTERS, ...patch });

test("default filters preserve eligible sold-out and price-pending products", () => {
  assert.deepEqual(ids(filters.applyCatalogFilters(products, withFilters({}))), products.map((product) => product.id));
  assert.equal(filters.getActiveFilterCount(withFilters({})), 0);
});

test("availability is voluntary and follows sellable quantities for the source unit", () => {
  assert.deepEqual(ids(filters.applyCatalogFilters(products, withFilters({ availability: "in-stock" }))), ["available", "pending-price", "measured"]);
  assert.deepEqual(ids(filters.applyCatalogFilters(products, withFilters({ availability: "on-request" }))), ["sold-out", "fractional-pair"]);
});

test("price ranges use confirmed base prices before IVA and exclude invented zero placeholders", () => {
  const selected = filters.applyCatalogFilters(products, withFilters({ priceMin: "0", priceMax: "100" }));
  assert.equal(selected.some((product) => product.id === "pending-price"), false);
  assert.equal(selected.some((product) => product.id === "available"), true, "100 base belongs to the range even though the price with IVA is119");
  assert.equal(selected.some((product) => product.id === "sold-out"), true, "price selection must not add a stock requirement");
  assert.deepEqual(ids(filters.applyCatalogFilters(products, withFilters({ priceMin: "100.01" }))), []);
});

test("empty bounds stay optional, decimal bounds are accepted and invalid/inverted bounds are reported", () => {
  assert.equal(filters.validateCatalogFilters(withFilters({})).min, undefined);
  assert.equal(filters.validateCatalogFilters(withFilters({ priceMin: "12.34", priceMax: "56.78" })).valid, true);
  for (const priceMin of ["-1", "NaN", "Infinity", "0x10", "12.345"]) {
    assert.equal(filters.validateCatalogFilters(withFilters({ priceMin })).valid, false, priceMin);
  }
  const range = filters.validateCatalogFilters(withFilters({ priceMin: "100", priceMax: "20" }));
  assert.equal(range.valid, false);
  assert.match(range.errors.priceRange, /mínimo/);
  assert.deepEqual(ids(filters.applyCatalogFilters(products, withFilters({ priceMin: "100", priceMax: "20", availability: "on-request" }))), ["sold-out", "fractional-pair"], "invalid price edits do not empty unrelated availability results");
});

test("category, brand, price and genuine offers combine without mutating source order/data", () => {
  const source = [
    { ...base, id: "offer", precio: 80, original: 100, disc: 20 },
    { ...base, id: "badge-only", disc: 20 },
    { ...base, id: "other-brand", brand: "BOSCH", precio: 80, original: 100 },
    { ...base, id: "pending-offer", precio: 0, original: 100, disc: 99, priceVerified: false },
  ];
  const before = JSON.stringify(source);
  assert.deepEqual(ids(filters.applyCatalogFilters(source, withFilters({ category: "Herramientas", brand: "TRUPER", priceMax: "90", offersOnly: true }))), ["offer"]);
  assert.equal(JSON.stringify(source), before);
  assert.equal(filters.getActiveFilterCount(withFilters({ category: "Herramientas", brand: "TRUPER", priceMin: "10", priceMax: "90", availability: "on-request", offersOnly: true })), 5);
});

test("filter normalization retains textual identifiers and rejects implicit truthy flags", () => {
  const value = filters.normalizeCatalogFilters({ category: " Cerrajería ", brand: " YALE ", availability: "bad-value", offersOnly: "false", priceMin: " 0 " });
  assert.equal(value.category, "Cerrajería");
  assert.equal(value.brand, "YALE");
  assert.equal(value.availability, "all");
  assert.equal(value.offersOnly, false);
  assert.equal(value.priceMin, "0");
});

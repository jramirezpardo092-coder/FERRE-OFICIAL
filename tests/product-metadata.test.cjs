const test = require("node:test");
const assert = require("node:assert/strict");
const createLoader = require("./load-ts.cjs");

let fixture;
const empty = { default() { return null; } };
const load = createLoader({
  "@/lib/catalog-service": { getCatalogProduct: () => fixture },
  "@/components/Breadcrumbs": empty,
  "@/components/ProductCard": empty,
  "@/components/catalog/ProductMedia": empty,
  "@/components/catalog/ProductSpecs": empty,
  "@/components/catalog/PriceDisplay": empty,
  "@/components/catalog/PricePreferenceToggle": empty,
  "./ProductActions": empty,
});
const { generateMetadata } = load("src/app/producto/[slug]/page.tsx");
const base = { id: "0099", nombre: "Bisagra de prueba", brand: "Sin marca", precio: 48050.42, priceVerified: true, taxRate: 19, cat: "Cerrajería", unidad: "par", stock: 2 };

test("product descriptions start with confirmed gross COP, including 0%, 5% and 19% VAT", async () => {
  for (const [taxRate, precio, expected] of [[19, 48050.42, "57.180"], [5, 1000, "1.050"], [0, 1000, "1.000"], [19, 10.5, "12"]]) {
    fixture = { ...base, taxRate, precio };
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: fixture.id }) });
    const prefix = new RegExp(`^\\$\\s*${expected.replaceAll(".", "\\.")} IVA incluido`);
    assert.match(metadata.description, prefix);
    assert.match(metadata.openGraph.description, prefix);
    assert.doesNotMatch(metadata.description, /IVA 19%/);
    assert.match(metadata.description, /Bisagra de prueba/);
  }
});

test("unverified price or tax never produces a guessed gross price in metadata", async () => {
  for (const patch of [{ priceVerified: false }, { priceVerified: undefined }, { precio: 0 }, { precio: NaN }, { taxRate: undefined }, { taxRate: 16 }]) {
    fixture = { ...base, ...patch };
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: fixture.id }) });
    assert.match(metadata.description, /^Precio por confirmar\./);
    assert.match(metadata.openGraph.description, /^Precio por confirmar/);
    assert.doesNotMatch(metadata.description, /\$/);
  }
});

test("missing product retains the not-found metadata", async () => {
  fixture = undefined;
  assert.equal((await generateMetadata({ params: Promise.resolve({ slug: "missing" }) })).title, "Producto no encontrado");
});

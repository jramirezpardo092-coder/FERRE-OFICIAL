const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const test = require("node:test");
const ts = require("typescript");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "src/lib/product-enrichment.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
const exportsUnderTest = {};
vm.runInNewContext(compiled, {
  exports: exportsUnderTest,
  require(name) {
    // Fixtures supply their own enrichment; tests never assign photos to the real catalog.
    if (name === "@/data/product-enrichment.json") return {};
    throw new Error(`Unexpected dependency: ${name}`);
  },
});
const { enrichProduct, enrichProducts, getLocalProductImagePath } = exportsUnderTest;
const plain = (value) => JSON.parse(JSON.stringify(value));
const product = Object.freeze({
  id: "0005", sku: "0005", ref: "REF-05", nombre: "Producto de prueba", brand: "Marca",
  cat: "Herramientas", unidad: "metro", precio: 12500.5, priceVerified: true, taxRate: 19, stock: 0.5,
});
const photo = { src: "productos/0005-frontal.png", verified: true };

test("joins only an own, exact SKU and preserves leading zeros", () => {
  assert.equal(enrichProduct(product, { "5": { gallery: [photo] } }), product);
  assert.equal(enrichProduct(product, { " 0005 ": { gallery: [photo] } }), product);
  const inherited = Object.create({ "0005": { gallery: [photo] } });
  assert.equal(enrichProduct(product, inherited), product);

  const other = { ...product, id: "5", sku: "5" };
  const result = enrichProducts([product, other], { "0005": { gallery: [photo] } });
  assert.equal(result[0].id, "0005");
  assert.equal(result[0].gallery[0].src, "/productos/0005-frontal.png");
  assert.equal(result[1], other);
});

test("unverified images and specs cannot become published content", () => {
  for (const verified of [undefined, false, "true", 1]) {
    const entry = {
      gallery: [{ src: photo.src, verified }],
      specs: [{ label: "Material", value: "Acero", verified }],
    };
    assert.equal(enrichProduct(product, { "0005": entry }), product);
  }
  const result = enrichProduct(product, {
    "0005": {
      gallery: [null, "foto.png", { ...photo, verified: false }, photo],
      specs: [null, { label: "Medida", value: "Inferida", verified: false }, { label: " Material ", value: " Acero ", verified: true }],
    },
  });
  assert.deepEqual(plain(result.specs), [{ label: "Material", value: "Acero", verified: true }]);
  assert.equal(result.gallery.length, 1);
});

test("temporary, external and traversal paths are rejected even when marked verified", () => {
  const invalidPaths = [
    "blob:https://web.whatsapp.com/foto", "https://example.com/foto.png", "http://example.com/foto.png",
    "//example.com/foto.png", "data:image/png;base64,AAAA", "../foto.png", "/productos/../foto.png",
    "productos\\..\\foto.png", "/productos/%2e%2e/foto.png", "productos/foto.png?url=externa", "productos/foto.svg",
  ];
  for (const src of invalidPaths) {
    assert.equal(getLocalProductImagePath(src), null, src);
    assert.equal(enrichProduct(product, { "0005": { gallery: [{ src, verified: true }] } }), product, src);
  }
  for (const src of [null, undefined, 123, {}]) assert.equal(getLocalProductImagePath(src), null);
  assert.equal(getLocalProductImagePath("productos/0005 frontal.webp"), "/productos/0005 frontal.webp");
});

test("enrichment cannot replace codes, price verification, taxes, stock or unit", () => {
  const attack = {
    id: "5", sku: "5", ref: "OTRO", nombre: "Otro producto", brand: "Otra marca", cat: "Otra categoría",
    precio: 1, priceVerified: true, taxRate: 0, stock: 99, unidad: "unidad", original: 50000, disc: 90,
    gallery: [photo], specs: [{ label: "Material", value: "Acero", verified: true }],
  };
  const pending = Object.freeze({ ...product, precio: 0, priceVerified: false, taxRate: undefined });
  for (const base of [product, pending]) {
    const result = enrichProduct(base, { "0005": attack });
    for (const [key, value] of Object.entries(base)) assert.equal(result[key], value, key);
    assert.equal(result.original, undefined);
    assert.equal(result.disc, undefined);
    assert.equal(result.gallery.length, 1);
  }
});

test("normalizes and deduplicates photos without discarding other verified views", () => {
  const result = enrichProduct(product, {
    "0005": {
      gallery: [
        { src: "productos/0005-frontal.png", alt: " Frente ", verified: true },
        { src: "/productos/0005-frontal.png", alt: "Duplicada", verified: true },
        { src: "productos/0005-dorso.jpg", verified: true },
        { src: "/productos/0005-lateral.avif", verified: true },
      ],
    },
  });
  assert.deepEqual(plain(result.gallery), [
    { src: "/productos/0005-frontal.png", alt: "Frente", verified: true },
    { src: "/productos/0005-dorso.jpg", verified: true },
    { src: "/productos/0005-lateral.avif", verified: true },
  ]);
  assert.equal(result.img, "productos/0005-frontal.png");
});

test("blank or malformed specifications are omitted without inferring replacements", () => {
  const result = enrichProduct(product, {
    "0005": {
      specs: [
        { label: "", value: "Acero", verified: true }, { label: "Material", value: " ", verified: true },
        { label: 123, value: "Acero", verified: true }, { label: "Material", value: 123, verified: true },
      ],
    },
  });
  assert.equal(result, product);
  for (const entry of [null, [], {}, { gallery: "foto.png", specs: "Acero" }]) {
    assert.equal(enrichProduct(product, { "0005": entry }), product);
  }
});

test("does not mutate source products or approved enrichment records", () => {
  const approvedPhoto = Object.freeze({ ...photo, alt: " Frente " });
  const approvedSpec = Object.freeze({ label: " Material ", value: " Acero ", verified: true });
  const entry = Object.freeze({ gallery: Object.freeze([approvedPhoto]), specs: Object.freeze([approvedSpec]) });
  const entries = Object.freeze({ "0005": entry });
  const result = enrichProduct(product, entries);
  assert.notEqual(result, product);
  assert.notEqual(result.gallery, entry.gallery);
  assert.notEqual(result.specs, entry.specs);
  assert.equal(product.img, undefined);
  assert.equal(product.gallery, undefined);
  assert.equal(approvedPhoto.alt, " Frente ");
  assert.equal(approvedSpec.value, " Acero ");
  assert.equal(result.gallery[0].alt, "Frente");
  assert.equal(result.specs[0].value, "Acero");
});

test("non-photographic official assets retain only recognized media classifications", () => {
  for (const kind of ["manufacturer-render", "supplier-render", "technical-diagram"]) {
    const result = enrichProduct(product, { [product.id]: { gallery: [{ src: "/products/example.webp", alt: "Imagen técnica exacta", verified: true, kind }] } });
    assert.equal(result.gallery[0].kind, kind);
    assert.equal(result.precio, product.precio);
  }
  const result = enrichProduct(product, { [product.id]: { gallery: [{ src: "/products/example.webp", verified: true, kind: "unverified-artwork" }] } });
  assert.equal(result.gallery[0].kind, undefined);
});


test("verified visible captions are trimmed and whitelisted without exposing source metadata", () => {
  const result = enrichProduct(product, { [product.id]: { gallery: [{ ...photo, kind: "supplier-render", caption: " No incluye cama ni colchón. ", sourcePath: "/private/original.png", evidence: "private audit" }] } });
  assert.equal(result.gallery[0].caption, "No incluye cama ni colchón.");
  assert.equal(result.gallery[0].kind, "supplier-render");
  assert.equal(result.gallery[0].sourcePath, undefined);
  assert.equal(result.gallery[0].evidence, undefined);
  for (const caption of [false, 17, {}, " "]) {
    assert.equal(enrichProduct(product, { [product.id]: { gallery: [{ ...photo, caption }] } }).gallery[0].caption, undefined);
  }
});

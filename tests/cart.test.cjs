const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const test = require("node:test");
const ts = require("typescript");

const root = path.join(__dirname, "..");
function loadModule(file, dependencies = {}, globals = {}) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    Intl, URL, Event, AbortController, setTimeout, clearTimeout, ...globals,
  });
  return exports;
}

const constants = loadModule("src/lib/constants.ts");
const utils = loadModule("src/lib/utils.ts", { "./constants": constants });
const product = {
  id: "P1", nombre: "Cerradura", brand: "YALE", cat: "Cerrajería", unidad: "unidad",
  precio: 200, stock: 5, ref: "REF-01", priceVerified: true, taxRate: 19,
};

function loadStore(saved, { blocked = false, fetch: fetcher } = {}) {
  const events = new Map();
  const storage = new Map(saved === undefined ? [] : [["fp_cart", saved]]);
  let writes = 0;
  let additions = 0;
  const window = {
    localStorage: {
      getItem(key) { if (blocked) throw new Error("Storage blocked"); return storage.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error("Storage blocked"); writes++; storage.set(key, value); },
    },
    addEventListener(name, callback) { events.set(name, callback); },
    removeEventListener(name) { events.delete(name); },
    dispatchEvent(event) { if (event.type === "cart-added") additions++; },
  };
  return {
    store: loadModule("src/lib/cart-store.ts", { "./utils": utils }, { window, fetch: fetcher }),
    storage, events, writes: () => writes, additions: () => additions,
  };
}

test("restores count before rendering the header and batches quantity writes", () => {
  const { store, writes, additions } = loadStore(JSON.stringify([{ ...product, qty: 2 }]));
  assert.equal(store.getCartCount(), 2);
  assert.equal(store.getCartTotal(), 400);
  assert.equal(store.addToCart(product, 4), false);
  assert.equal(additions(), 0);
  assert.equal(store.addToCart(product, 3), true);
  assert.equal(writes(), 1);
  assert.equal(additions(), 1);
  assert.equal(store.getCartCount(), 5);
  assert.equal(store.updateQty("P1", 6), false);
  const snapshot = store.getCart();
  snapshot[0].qty = 99;
  assert.equal(store.getCartCount(), 5);
});

test("handles malformed/blocked storage and synchronizes changes from another tab", () => {
  assert.equal(loadStore("{").store.getCartCount(), 0);
  assert.equal(loadStore(JSON.stringify({ qty: 2 })).store.getCartCount(), 0);
  const blocked = loadStore(undefined, { blocked: true });
  assert.equal(blocked.store.addToCart(product, 2), true);
  assert.equal(blocked.store.getCartCount(), 2);
  blocked.store.clearCart();
  assert.equal(blocked.store.getCartCount(), 0);

  const synced = loadStore(JSON.stringify([{ ...product, qty: 2 }]));
  const unsubscribe = synced.store.subscribeCart(() => {});
  synced.storage.set("fp_cart", JSON.stringify([{ ...product, qty: 1 }]));
  synced.events.get("storage")({ key: "fp_cart" });
  assert.equal(synced.store.getCartCount(), 1);
  synced.storage.delete("fp_cart");
  synced.events.get("storage")({ key: null });
  assert.equal(synced.store.getCartCount(), 0);
  unsubscribe();
  assert.equal(synced.events.has("storage"), false);
});

test("reconciles stale prices, taxes, names, units, stock and removed references", () => {
  const saved = [
    { ...product, qty: 5 },
    { ...product, id: "REMOVED", nombre: "Fuera del catálogo", qty: 1 },
    { ...product, id: "NO-STOCK", nombre: "Sin stock", qty: 1 },
  ];
  const { store } = loadStore(JSON.stringify(saved));
  const result = store.reconcileCart([
    { ...product, nombre: "Cerradura nueva", precio: 250, taxRate: 5, unidad: "caja", stock: 2 },
    { ...product, id: "NO-STOCK", stock: 0 },
  ], saved.map((item) => item.id));
  assert.equal(result.items.length, 2);
  assert.equal(result.items[0].qty, 2);
  assert.equal(result.items[0].precio, 250);
  assert.equal(result.items[0].unidad, "caja");
  assert.match(result.changes.join("\n"), /cantidad ajustada de 5 a 2/);
  assert.match(result.changes.join("\n"), /precio actualizado/);
  assert.match(result.changes.join("\n"), /IVA actualizado a 5%/);
  assert.match(result.changes.join("\n"), /ya no pertenece al catálogo/);
  assert.equal(result.items[1].id, "NO-STOCK");
  assert.equal(result.items[1].stock, 0);
  assert.equal(result.items[1].qty, 1);
  assert.match(result.changes.join("\n"), /disponibilidad a confirmar; se conserva en la cotización/);
});

test("restores and adds sold-out quotations without claiming stock or changing source products", () => {
  const exhausted = { ...product, id: "0044", stock: 0, priceVerified: false };
  const snapshot = JSON.stringify(exhausted);
  const restored = loadStore(JSON.stringify([{ ...exhausted, qty: 2 }]));
  assert.equal(restored.store.getCart()[0].id, "0044");
  assert.equal(restored.store.getCart()[0].qty, 2);
  assert.equal(restored.store.addToCart(exhausted), true);
  assert.equal(restored.store.getCart()[0].qty, 3);
  assert.equal(restored.additions(), 1);
  assert.equal(restored.store.updateQty("0044", 8), true);
  assert.equal(restored.store.getCart()[0].qty, 8);
  assert.equal(restored.store.addToCart(exhausted, Infinity), false);
  assert.equal(restored.store.addToCart(exhausted, 0), false);
  assert.equal(JSON.stringify(exhausted), snapshot);
  assert.equal(restored.store.getCartTotal(), 0);
  assert.equal("availabilityPending" in restored.store.getCart()[0], false);
});

test("reconciles a sold-out quote when stock returns, caps quantity and removes retired exact SKUs", () => {
  const exhausted = { ...product, id: "0044", stock: 0 };
  const { store } = loadStore(JSON.stringify([{ ...exhausted, qty: 8 }, { ...exhausted, id: "44", qty: 1 }]));
  const result = store.reconcileCart([{ ...exhausted, stock: 3, precio: 500 }], ["0044", "44"]);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, "0044");
  assert.equal(result.items[0].qty, 3);
  assert.equal(result.items[0].precio, 500);
  assert.match(result.changes.join("\n"), /cantidad ajustada de 8 a 3/);
  assert.match(result.changes.join("\n"), /ya no pertenece al catálogo/);
  assert.equal(store.updateQty("0044", 4), false);
  assert.equal(store.addToCart({ ...exhausted, stock: 3 }), false);
});

test("accepts measurable sold-out quantities and keeps indivisible requests whole", () => {
  const { store } = loadStore();
  assert.equal(store.addToCart({ ...product, stock: 0, unidad: "metro" }, 0.25), true);
  assert.equal(store.updateQty("P1", 2.75), true);
  assert.equal(store.getCart()[0].qty, 2.75);
  assert.equal(store.addToCart({ ...product, id: "PAIR", stock: 0.5, unidad: "numero de pares" }), true);
  assert.equal(store.getCart()[1].qty, 1);
  assert.equal(store.updateQty("PAIR", 2.5), true);
  assert.equal(store.getCart()[1].qty, 2);
  assert.equal(store.addToCart({ ...product, id: "TINY", stock: 0, unidad: "metro" }, 0.00000001), false);
});

test("permits measured fractional stock and keeps indivisible units whole", () => {
  const measured = { ...product, unidad: "metro", stock: 0.5 };
  const { store } = loadStore();
  assert.equal(utils.getAvailableQuantity(measured), 0.5);
  assert.equal(store.addToCart(measured), true);
  assert.equal(store.getCart()[0].qty, 0.5);
  assert.equal(store.addToCart(measured), false);
  assert.equal(utils.getAvailableQuantity({ ...measured, unidad: "numero de pares" }), 0);
  assert.equal(utils.getAvailableQuantity({ ...measured, unidad: "Consultar unidad" }), 0);
  assert.equal(utils.getAvailableQuantity({ ...measured, unidad: "kilogramo neto" }), 0.5);
  assert.equal(utils.getAvailableQuantity({ ...measured, unidad: "libra bruta" }), 0.5);
  const result = store.reconcileCart([{ ...measured, stock: 0.25 }], ["P1"]);
  assert.equal(result.items[0].qty, 0.25);
  assert.equal(store.updateQty("P1", 0.3), false);
});

test("queries current catalog before quotation, shares requests and preserves orders on failure", async () => {
  let requests = 0;
  let complete;
  const request = new Promise((resolve) => { complete = resolve; });
  const { store } = loadStore(JSON.stringify([{ ...product, qty: 1 }]), {
    fetch: async (url, options) => {
      requests++;
      assert.equal(new URL(url, "http://localhost").searchParams.get("ids"), "P1");
      assert.equal(options.cache, "no-store");
      await request;
      return { ok: true, json: async () => ({ products: [{ ...product, precio: 300 }] }) };
    },
  });
  const first = store.revalidateCart();
  assert.equal(first, store.revalidateCart());
  complete();
  assert.equal((await first).items[0].precio, 300);
  assert.equal(requests, 1);

  const failing = loadStore(JSON.stringify([{ ...product, qty: 1 }]), { fetch: async () => ({ ok: false }) });
  await assert.rejects(failing.store.revalidateCart(), /No fue posible actualizar/);
  assert.equal(failing.store.getCartCount(), 1);
  assert.equal(failing.store.getCart()[0].precio, 200);
});

test("revalidates a reference added while the first catalog response was in flight", async () => {
  let requests = 0;
  let store;
  const second = { ...product, id: "P2", nombre: "Candado", precio: 500 };
  ({ store } = loadStore(JSON.stringify([{ ...product, qty: 1 }]), {
    fetch: async (url) => {
      requests++;
      if (requests === 1) store.addToCart(second);
      const ids = new URL(url, "http://localhost").searchParams.get("ids").split(",");
      return { ok: true, json: async () => ({ products: [product, second].filter((item) => ids.includes(item.id)) }) };
    },
  }));
  const result = await store.revalidateCart();
  assert.equal(requests, 2);
  assert.equal(result.items.length, 2);
});

test("calculates explicit 0/5/19 percent IVA and never invents an unknown price or total", () => {
  const totals = utils.getQuotationTotals([
    { ...product, precio: 100, taxRate: 0, qty: 1 },
    { ...product, precio: 100, taxRate: 5, qty: 1 },
    { ...product, precio: 100, taxRate: 19, qty: 1 },
  ]);
  assert.equal(totals.subtotal, 300);
  assert.equal(totals.tax, 24);
  assert.equal(totals.total, 324);
  assert.equal(utils.getUnitPriceWithTax({ ...product, precio: 10.5 }), 12.5);
  assert.equal(utils.getUnitPriceWithTax({ ...product, priceVerified: false }), null);
  const items = [{ ...product, qty: 2 }, { ...product, id: "PENDING", nombre: "Precio pendiente", precio: 999999, priceVerified: false, qty: 1, unidad: "Consultar unidad" }];
  const message = new URL(utils.buildWhatsAppUrl(items)).searchParams.get("text");
  assert.match(message, /Ref: REF-01/);
  assert.match(message, /Cantidad: 1 \(unidad por confirmar\)/);
  assert.match(message, /Precio e impuesto: por confirmar/);
  assert.doesNotMatch(message, /999/);
  assert.doesNotMatch(message, /Total estimado con IVA/);
  const pendingTax = new URL(utils.buildWhatsAppUrl([{ ...product, taxRate: undefined, qty: 1 }])).searchParams.get("text");
  assert.match(pendingTax, /Impuesto pendiente de confirmar/);
  assert.doesNotMatch(pendingTax, /Total estimado con IVA/);
});

test("catalog endpoint returns requested references only with no-store and bounded input", () => {
  const responses = { NextResponse: { json: (data, options = {}) => ({ data, status: options.status ?? 200, headers: options.headers }) } };
  const route = loadModule("src/app/api/pedido/productos/route.ts", {
    "next/server": responses,
    "@/data/products.json": [{ ...product, privateField: "must not leave server" }, { ...product, id: "P2" }],
  });
  const request = (query) => ({ nextUrl: new URL(`http://localhost/api/pedido/productos${query}`) });
  const result = route.GET(request("?ids=P1,MISSING"));
  assert.equal(result.status, 200);
  assert.equal(result.data.products.length, 1);
  assert.equal(result.data.products[0].id, "P1");
  assert.equal(result.data.products[0].privateField, undefined);
  assert.match(result.headers["Cache-Control"], /no-store/);
  assert.equal(route.GET(request("")).status, 400);
  assert.equal(route.GET(request("?ids=../private")).status, 400);
  assert.equal(route.GET(request(`?ids=${Array.from({ length: 101 }, (_, index) => `P${index}`).join(",")}`)).status, 400);
});

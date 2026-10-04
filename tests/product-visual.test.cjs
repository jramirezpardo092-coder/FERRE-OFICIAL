const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const test = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const root = path.join(__dirname, "..");
function load(file, dependencies = {}, globals = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, Intl, URL, Event, Set, Map, ...globals,
    require(name) { if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`); return dependencies[name]; },
  });
  return exports;
}
const constants = load("src/lib/constants.ts");
const utils = load("src/lib/utils.ts", { "./constants": constants });
const dictionaries = load("src/lib/catalog/dictionaries.ts");
const normalizer = load("src/lib/catalog/normalize.ts", { "./dictionaries": dictionaries });
const routes = load("src/lib/catalog/routes.ts", { "../constants": constants, "./normalize": normalizer });
const presentation = load("src/lib/quote-presentation.ts", { "./constants": constants, "./utils": utils, "./catalog/normalize": normalizer });
const jsx = require("react/jsx-runtime");
const product = Object.freeze({ id: "0044", nombre: "CERRADURA P/ PUERTA YALE", brand: "YALE", cat: "Cerrajería", unidad: "unidad", precio: 6200, stock: 26, ref: "REF-0044", priceVerified: true, taxRate: 19 });
const plain = (value) => JSON.parse(JSON.stringify(value));

function elements(value, result = []) {
  if (Array.isArray(value)) value.forEach((child) => elements(child, result));
  else if (React.isValidElement(value)) { result.push(value); elements(value.props.children, result); }
  return result;
}

function stateHooks() {
  const states = [];
  let index = 0;
  return {
    react: {
      useState(initial) { const current = index++; if (current >= states.length) states.push(initial); return [states[current], (next) => { states[current] = typeof next === "function" ? next(states[current]) : next; }]; },
      useEffect() {}, useMemo: (fn) => fn(), useRef: (value) => ({ current: value }), useId: () => "photo-test",
    },
    render: (Component, props) => { index = 0; return Component(props); },
  };
}

test("per-SKU quotation snapshot is scalar, preserves leading zeros, and follows reconciliation/storage/removal", () => {
  const saved = new Map();
  const events = new Map();
  const window = {
    localStorage: { getItem: (key) => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) },
    addEventListener: (event, fn) => events.set(event, fn), removeEventListener: (event) => events.delete(event),
    dispatchEvent: (event) => events.get(event.type)?.(event),
  };
  const cart = load("src/lib/cart-store.ts", { "./utils": utils }, { window });
  const updates = [];
  let snapshot, cleanup;
  const hook = load("src/lib/useQuoteQuantity.ts", {
    "./cart-store": cart,
    react: { useCallback: (fn) => fn, useSyncExternalStore(subscribe, current, server) {
      assert.equal(server(), 0, "the server does not read browser quotation contents");
      snapshot = current;
      cleanup = subscribe(() => updates.push(current()));
      return current();
    } },
  });
  assert.equal(hook.useQuoteQuantity("0044"), 0);
  cart.addToCart(product, 2);
  cart.addToCart({ ...product, id: "44" }, 3);
  assert.equal(snapshot(), 2, "0044 remains distinct from 44");
  assert.equal(snapshot(), snapshot(), "repeated reads return the same primitive");
  cart.updateQty("0044", 3);
  cart.reconcileCart([{ ...product, stock: 1 }], ["0044"]);
  assert.equal(snapshot(), 1);
  saved.set("fp_cart", JSON.stringify([{ ...product, qty: 4 }]));
  window.dispatchEvent({ type: "storage", key: "fp_cart" });
  assert.equal(snapshot(), 4);
  cart.removeFromCart("0044");
  assert.equal(snapshot(), 0);
  assert.deepEqual(updates, [2, 2, 3, 1, 4, 0]);
  assert.ok(updates.every((value) => typeof value === "number"));
  cleanup();
  assert.equal(events.size, 0);
});

test("card exposes persistent quotation quantity while adding keeps the original operation and exact product", () => {
  const hooks = stateHooks();
  const additions = [];
  const Card = load("src/components/ProductCard.tsx", {
    react: hooks.react, "react/jsx-runtime": jsx, "next/link": ({ children, prefetch, ...props }) => React.createElement("a", props, children),
    "@/lib/utils": utils, "@/lib/catalog/normalize": normalizer, "@/lib/catalog/routes": routes,
    "@/lib/cart-store": { addToCart: (item) => { additions.push(item); return true; } },
    "@/lib/useQuoteQuantity": { useQuoteQuantity: (id) => id === "0044" ? 2 : 0 },
    "@/lib/quote-presentation": presentation, "./catalog/ProductMedia": () => null,
    "./catalog/PriceDisplay": () => null,
  }).default;
  const tree = hooks.render(Card, { product });
  assert.equal(tree.props["data-sku"], "0044");
  const add = elements(tree).find((node) => node.type === "button");
  assert.match(add.props["aria-label"], /^En cotización · 2:/);
  assert.match(renderToStaticMarkup(tree), /En cotización · 2/);
  add.props.onClick();
  assert.equal(additions.length, 1);
  assert.equal(additions[0], product);
  const unavailable = Object.freeze({ ...product, id: "00050", stock: 0 });
  const pendingTree = hooks.render(Card, { product: unavailable });
  const pendingAdd = elements(pendingTree).find((node) => node.type === "button");
  assert.match(pendingAdd.props["aria-label"], /^Agregar a cotización:/);
  assert.match(pendingAdd.props["aria-label"], /disponibilidad a confirmar/);
  assert.equal(pendingAdd.props.disabled, undefined, "sold-out references remain quotable");
});

test("mobile and desktop product actions share fractional quantity, sold-out consultation and validation", () => {
  const hooks = stateHooks();
  const additions = [];
  const Actions = load("src/app/producto/[slug]/ProductActions.tsx", {
    react: hooks.react, "react/jsx-runtime": jsx, "@/lib/utils": utils,
    "@/lib/cart-store": { addToCart: (item, qty) => { additions.push({ item, qty }); return true; } },
    "@/lib/useQuoteQuantity": { useQuoteQuantity: () => 0 }, "@/lib/catalog/normalize": normalizer,
    "@/lib/quote-presentation": presentation, "@/components/catalog/PriceDisplay": () => null,
  }).default;
  const measurable = Object.freeze({ ...product, stock: 0, unidad: "metro" });
  let tree = hooks.render(Actions, { product: measurable });
  assert.ok(elements(tree).some((node) => "data-mobile-quote-bar" in node.props));
  let input = elements(tree).find((node) => node.type === "input");
  assert.equal(input.props.max, undefined, "sold-out consultation does not invent a maximum of zero");
  input.props.onChange({ target: { value: "0.5" } });
  tree = hooks.render(Actions, { product: measurable });
  const addButtons = elements(tree).filter((node) => node.type === "button" && node.props["aria-label"]?.startsWith("Consultar disponibilidad:"));
  assert.equal(addButtons.length, 2, "CSS exposes one shared operation per viewport");
  addButtons.forEach((button) => { assert.equal(button.props.disabled, false); button.props.onClick(); });
  assert.deepEqual(additions.map(({ qty }) => qty), [0.5, 0.5]);
  assert.ok(additions.every(({ item }) => item === measurable));
  input = elements(tree).find((node) => node.type === "input");
  input.props.onChange({ target: { value: "0.00000001" } });
  tree = hooks.render(Actions, { product: measurable });
  const invalidButtons = elements(tree).filter((node) => node.type === "button" && node.props["aria-label"]?.startsWith("Consultar disponibilidad:"));
  invalidButtons.forEach((button) => { assert.equal(button.props.disabled, true); button.props.onClick(); });
  assert.equal(additions.length, 2, "a quantity rounded to zero cannot be added from either CTA");
});

test("gallery thumbnails keep originals and every selected full image retains its approved alt and fallback", () => {
  const hooks = stateHooks();
  const Image = () => null;
  const Media = load("src/components/catalog/ProductMedia.tsx", {
    react: hooks.react, "react/jsx-runtime": jsx, "next/image": Image, "@/lib/utils": utils,
  }).default;
  const source = Object.freeze({ ...product, img: "products/front.webp", gallery: Object.freeze([
    Object.freeze({ src: "/products/front.webp", alt: "Frente exacto", verified: true }),
    Object.freeze({ src: "/products/back.webp", alt: "Reverso exacto", verified: true }),
    Object.freeze({ src: "/products/side.webp", alt: "Costado exacto", verified: true }),
  ]) });
  const before = plain(source);
  const render = () => hooks.render(Media, { product: source, showGalleryControls: true, priority: true });
  let tree = render();
  const pictures = elements(tree).filter((node) => node.type === Image);
  assert.equal(pictures.filter((node) => node.props.fill).length, 1, "only one full-size photo is mounted");
  assert.deepEqual(pictures.filter((node) => node.props.width === 44).map((node) => node.props.src), source.gallery.map((image) => image.src));
  const controls = elements(tree).filter((node) => node.type === "button");
  assert.equal(controls.length, 3);
  controls[2].props.onClick();
  tree = render();
  let selected = elements(tree).find((node) => node.type === Image && node.props.fill);
  assert.equal(selected.props.src, "/products/side.webp");
  assert.equal(selected.props.alt, "Costado exacto");
  assert.equal(selected.props.loading, "lazy");
  assert.equal(selected.props.priority, false);
  assert.equal(elements(tree).filter((node) => node.type === "button")[2].props["aria-pressed"], true);
  selected.props.onError();
  tree = render();
  selected = elements(tree).find((node) => node.type === Image && node.props.fill);
  assert.equal(selected.props.src, "/products/front.webp");
  assert.equal(selected.props.alt, "Frente exacto");
  assert.equal(elements(tree).filter((node) => node.type === "button")[2].props.disabled, true);
  assert.deepEqual(plain(source), before);
});

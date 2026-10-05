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

test("product modal has accessible price radios and prices from its catalog URL provider", () => {
  const preferences = load("src/lib/price-preference.ts", { react: React });
  const PriceDisplay = load("src/components/catalog/PriceDisplay.tsx", {
    "react/jsx-runtime": jsx, "@/lib/utils": utils, "@/lib/price-preference": preferences,
  }).default;
  const PricePreferenceToggle = load("src/components/catalog/PricePreferenceToggle.tsx", {
    react: React, "react/jsx-runtime": jsx, "@/lib/utils": utils, "@/lib/price-preference": preferences,
  }).default;
  const Modal = load("src/components/ProductModal.tsx", {
    react: React, "react/jsx-runtime": jsx, "next/link": ({ children, prefetch, ...props }) => React.createElement("a", props, children),
    "@/lib/utils": utils, "@/lib/cart-store": { addToCart: () => true }, "@/lib/useQuoteQuantity": { useQuoteQuantity: () => 0 },
    "@/lib/useDialog": { useDialog() {} }, "@/lib/catalog/normalize": normalizer, "@/lib/catalog/routes": routes,
    "@/lib/quote-presentation": presentation, "./catalog/ProductMedia": () => null, "./catalog/ProductSpecs": () => null,
    "./catalog/PriceDisplay": PriceDisplay, "./catalog/PricePreferenceToggle": PricePreferenceToggle,
  }).default;
  for (const mode of ["gross", "net"]) {
    const html = renderToStaticMarkup(React.createElement(preferences.CatalogPriceModeProvider, { value: { mode, onModeChange() {} } }, React.createElement(Modal, { product, onClose() {} })));
    const radios = [...html.matchAll(/<input\b[^>]*type="radio"[^>]*>/g)].map(match => match[0]);
    assert.equal(radios.length, 2);
    assert.equal(radios.filter(radio => radio.includes('checked=""')).length, 1);
    assert.match(radios.find(radio => radio.includes('checked=""')), new RegExp(`value="${mode}"`));
    assert.match(radios[0], /aria-label="Precios con IVA"/);
    assert.match(radios[1], /aria-label="Precios sin IVA para empresas"/);
    assert.equal(html.indexOf("7.378") < html.indexOf("6.200"), mode === "gross");
  }
});

test("history dismisses quick view, releases the real focus trap, restores scrolling, and removes listeners", () => {
  const refs = [], effects = [], states = [], frames = new Map();
  let refIndex = 0, effectIndex = 0, stateIndex = 0, frameId = 0;
  const pending = [];
  const events = () => {
    const listeners = new Map();
    return { listeners, addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); },
      removeEventListener(name, fn) { listeners.get(name)?.delete(fn); if (!listeners.get(name)?.size) listeners.delete(name); },
      emit(name, event = {}) { [...(listeners.get(name) || [])].forEach(fn => fn(event)); } };
  };
  const window = events();
  const document = { ...events(), body: { style: { overflow: "auto" } }, activeElement: null };
  class Element {
    constructor(name) { this.name = name; this.isConnected = true; }
    focus() { document.activeElement = this; document.emit("focusin", { target: this }); }
    getClientRects() { return [{}]; }
  }
  const trigger = new Element("catalog card"), control = new Element("modal close");
  const outside = new Element("catalog search"), dialog = new Element("dialog");
  dialog.querySelectorAll = () => [control];
  dialog.contains = node => node === control || node === dialog;
  document.activeElement = trigger;
  let disconnected = 0;
  const globals = { window, document, HTMLElement: Element, getComputedStyle: () => ({ visibility: "visible" }),
    requestAnimationFrame: fn => { const id = ++frameId; frames.set(id, fn); return id; }, cancelAnimationFrame: id => frames.delete(id),
    MutationObserver: class { observe() {} disconnect() { disconnected++; } },
  };
  const react = {
    useRef(initial) { const index = refIndex++; return refs[index] || (refs[index] = { current: initial }); },
    useState(initial) { const index = stateIndex++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = value; }]; },
    useEffect(effect, deps) { const index = effectIndex++, previous = effects[index]; if (!previous || deps.some((value, i) => value !== previous.deps[i])) pending.push(() => { previous?.cleanup?.(); effects[index] = { deps, cleanup: effect() }; }); },
  };
  const dialogHook = load("src/lib/useDialog.ts", { react }, globals);
  const Modal = load("src/components/ProductModal.tsx", {
    react, "react/jsx-runtime": jsx, "next/link": () => null, "@/lib/utils": utils,
    "@/lib/cart-store": { addToCart: () => true }, "@/lib/useQuoteQuantity": { useQuoteQuantity: () => 0 },
    "@/lib/useDialog": dialogHook, "@/lib/catalog/normalize": normalizer, "@/lib/catalog/routes": routes,
    "@/lib/quote-presentation": presentation, "./catalog/ProductMedia": () => null, "./catalog/ProductSpecs": () => null,
    "./catalog/PriceDisplay": () => null, "./catalog/PricePreferenceToggle": () => null,
  }, globals).default;
  let closes = 0;
  const render = (item, onClose) => {
    refIndex = effectIndex = stateIndex = 0;
    const tree = Modal({ product: item, onClose });
    refs[0].current = item ? dialog : null;
    pending.splice(0).forEach(effect => effect());
    [...frames.values()].forEach(fn => fn()); frames.clear();
    return tree;
  };
  render(product, () => { closes += 100; });
  assert.equal(document.body.style.overflow, "hidden");
  assert.equal(document.activeElement, control);
  outside.focus();
  assert.equal(document.activeElement, control, "the live dialog genuinely traps focus");
  render(product, () => { closes++; });
  window.emit("popstate");
  assert.equal(closes, 1, "history must use the latest onClose callback");
  assert.equal(render(null, () => { closes++; }), null);
  assert.equal(document.body.style.overflow, "auto", "the previous body overflow value is restored");
  assert.equal(document.activeElement, trigger, "focus returns to the opening control");
  outside.focus();
  assert.equal(document.activeElement, outside, "dismissed dialog cannot recapture focus");
  assert.equal(window.listeners.size, 0);
  assert.equal(document.listeners.size, 0);
  assert.equal(disconnected, 1);
  window.emit("popstate");
  assert.equal(closes, 1, "Forward must not reopen or invoke a stale closed modal");
});

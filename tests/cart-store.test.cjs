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
const presentation = load("src/lib/quote-presentation.ts", { "./constants": constants, "./utils": utils, "./catalog/normalize": normalizer });
const product = { id: "0044", nombre: "CERRADURA P/ PUERTA YALE", brand: "YALE", cat: "Cerrajería", unidad: "unidad", precio: 6200, stock: 26, ref: "REF-0044", priceVerified: true, taxRate: 19 };

test("company price preference persists, synchronizes tabs and works when storage is blocked", () => {
  const storage = new Map([["fp_price_mode", "net"]]);
  const events = new Map();
  let notifications = 0;
  let cleanup;
  const window = {
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    addEventListener: (key, listener) => events.set(key, listener),
    removeEventListener: (key) => events.delete(key),
  };
  const preferences = load("src/lib/price-preference.ts", { react: { createContext: React.createContext, useContext: () => null, useSyncExternalStore(subscribe, snapshot, serverSnapshot) {
    assert.equal(serverSnapshot(), "gross");
    cleanup = subscribe(() => { notifications++; });
    return snapshot();
  } } }, { window });
  assert.equal(preferences.usePricePreference(), "net");
  preferences.setPricePreference("gross");
  assert.equal(storage.get("fp_price_mode"), "gross");
  assert.equal(preferences.getPricePreference(), "gross");
  storage.set("fp_price_mode", "net");
  events.get("storage")({ key: "fp_price_mode" });
  assert.equal(preferences.getPricePreference(), "net");
  assert.equal(notifications, 2);
  cleanup();
  assert.equal(events.size, 0);
  const blocked = load("src/lib/price-preference.ts", { react: { createContext: React.createContext } }, { window: { localStorage: { getItem() { throw new Error("Blocked"); }, setItem() { throw new Error("Blocked"); } } } });
  assert.equal(blocked.getPricePreference(), "gross");
  blocked.setPricePreference("net");
  assert.equal(blocked.getPricePreference(), "net");
});

test("quotation message preserves exact SKU/ref, formats units, marks sold-out and includes only supplied customer data", () => {
  const input = [{ ...product, stock: 0, unidad: "numero de pares", qty: 2 }];
  const before = JSON.stringify(input);
  const message = new URL(presentation.buildQuoteWhatsAppUrl(input, { name: "Ana\nPardo", company: "Taller & Hijos", nit: "900123-4" })).searchParams.get("text");
  assert.match(message, /Cerradura para puerta Yale/);
  assert.match(message, /SKU: 0044/);
  assert.match(message, /Ref: REF-0044/);
  assert.match(message, /Cantidad: 2 pares/);
  assert.match(message, /Disponibilidad: a confirmar/);
  assert.match(message, /Subtotal sin IVA:/);
  assert.match(message, /IVA:.*2\.356/);
  assert.match(message, /Total estimado con IVA:.*14\.756/);
  assert.match(message, /Nombre: Ana Pardo/);
  assert.match(message, /Empresa: Taller & Hijos/);
  assert.match(message, /NIT: 900123-4/);
  assert.equal(JSON.stringify(input), before);
  const anonymous = new URL(presentation.buildQuoteWhatsAppUrl(input)).searchParams.get("text");
  assert.doesNotMatch(anonymous, /Datos para la cotización|Nombre:|Empresa:|NIT:/);
  const pending = new URL(presentation.buildQuoteWhatsAppUrl([{ ...product, priceVerified: false, precio: 999999, unidad: "Consultar unidad", qty: 1 }])).searchParams.get("text");
  assert.match(pending, /Cantidad: 1 \(unidad por confirmar\)/);
  assert.match(pending, /Precio e impuesto: por confirmar/);
  assert.doesNotMatch(pending, /999|Total estimado con IVA/);
});

test("catalog URL price mode governs server-rendered cards while other screens keep the default", () => {
  const preferences = load("src/lib/price-preference.ts", { react: React });
  function Value() { return React.createElement("span", null, preferences.usePricePreference()); }
  assert.equal(renderToStaticMarkup(React.createElement(Value)), "<span>gross</span>");
  for (const mode of ["net", "gross"]) {
    const html = renderToStaticMarkup(React.createElement(preferences.CatalogPriceModeProvider, { value: { mode, onModeChange() {} } }, React.createElement(Value)));
    assert.equal(html, `<span>${mode}</span>`);
  }
});

test("price display gives gross priority, flips company hierarchy and does not invent unknown price/tax", () => {
  const display = (mode, value) => {
    const PriceDisplay = load("src/components/catalog/PriceDisplay.tsx", {
      "react/jsx-runtime": require("react/jsx-runtime"), "@/lib/utils": utils,
      "@/lib/price-preference": { usePricePreference: () => mode },
    }).default;
    return renderToStaticMarkup(React.createElement(PriceDisplay, { product: value }));
  };
  const gross = display("gross", product);
  const net = display("net", product);
  assert.ok(gross.indexOf("7.378") < gross.indexOf("6.200"));
  assert.ok(net.indexOf("6.200") < net.indexOf("7.378"));
  assert.match(gross, /IVA incluido/);
  assert.match(gross, /\+ IVA 19%/);
  const unknown = display("gross", { ...product, taxRate: undefined });
  assert.match(unknown, /Impuesto por confirmar/);
  assert.doesNotMatch(unknown, /IVA incluido/);
  const pending = display("gross", { ...product, precio: 999999, priceVerified: false });
  assert.match(pending, /Precio por confirmar/);
  assert.doesNotMatch(pending, /999/);
});

test("adding a product leaves the quotation panel closed; explicit open/toggle events open it", () => {
  const effects = [];
  const updates = [];
  const events = new Map();
  let stateIndex = 0;
  const react = {
    useState(value) { const index = stateIndex++; return [value, (next) => updates.push({ index, value: typeof next === "function" ? next(value) : next })]; },
    useRef: (value) => ({ current: value }), useCallback: (callback) => callback,
    useEffect: (effect) => effects.push(effect),
  };
  const window = {
    addEventListener: (event, listener) => events.set(event, listener), removeEventListener: (event) => events.delete(event),
    dispatchEvent: (event) => events.get(event.type)?.(event),
  };
  const MiniCart = load("src/components/MiniCart.tsx", {
    react, "react/jsx-runtime": require("react/jsx-runtime"), "@/lib/utils": utils,
    "@/lib/cart-store": { getCart: () => [], subscribeCart: () => () => {} },
    "@/lib/useDialog": { useDialog: () => {} }, "@/lib/catalog/normalize": normalizer,
    "@/lib/quote-presentation": presentation, "./catalog/PriceDisplay": () => null,
  }, { window }).default;
  assert.equal(MiniCart(), null);
  const cleanup = effects.map((effect) => effect()).filter(Boolean);
  updates.length = 0;
  window.dispatchEvent(new Event("cart-added"));
  assert.equal(updates.some((update) => update.index === 0), false);
  window.dispatchEvent(new Event("open-cart"));
  assert.equal(updates.at(-1).value, true);
  window.dispatchEvent(new Event("toggle-cart"));
  assert.equal(updates.at(-1).value, true);
  cleanup.forEach((fn) => fn());
  assert.equal(events.size, 0);
});

test("quotation toast shows the reference count without opening the panel and dismisses on open/toggle", () => {
  const states = [];
  const effects = [];
  const events = new Map();
  const dispatched = [];
  let stateIndex = 0;
  const react = {
    useState(initial) {
      const index = stateIndex++;
      if (index >= states.length) states.push(initial);
      return [states[index], (next) => { states[index] = typeof next === "function" ? next(states[index]) : next; }];
    },
    useEffect: (effect) => effects.push(effect),
  };
  const window = {
    addEventListener(event, listener) {
      if (!events.has(event)) events.set(event, new Set());
      events.get(event).add(listener);
    },
    removeEventListener(event, listener) {
      events.get(event)?.delete(listener);
      if (events.get(event)?.size === 0) events.delete(event);
    },
    dispatchEvent(event) {
      dispatched.push(event.type);
      events.get(event.type)?.forEach((listener) => listener(event));
    },
  };
  const QuoteToast = load("src/components/QuoteToast.tsx", {
    react, "react/jsx-runtime": require("react/jsx-runtime"),
    "@/lib/cart-store": { getCart: () => [{ ...product, qty: 3 }, { ...product, id: "9212", qty: 5 }] },
  }, { window }).default;
  const render = () => { stateIndex = 0; return QuoteToast(); };
  assert.equal(render(), null);
  const cleanup = effects[0]();

  window.dispatchEvent(new Event("cart-added"));
  const visible = render();
  assert.match(renderToStaticMarkup(visible), /Ver cotización \(2\)/);
  assert.deepEqual(dispatched, ["cart-added"], "adding only shows the toast; it dispatches no panel event");
  visible.props.onPointerEnter();
  assert.equal(states[1], true);
  window.dispatchEvent(new Event("open-cart"));
  assert.equal(render(), null, "opening from the header removes the mobile overlay");
  assert.equal(states[1], false, "opening also resets the hover pause");

  window.dispatchEvent(new Event("cart-added"));
  render().props.onFocusCapture();
  assert.equal(states[1], true);
  window.dispatchEvent(new Event("toggle-cart"));
  assert.equal(render(), null, "toggling from the header also removes the overlay");
  assert.equal(states[1], false, "toggling resets the focus pause");

  cleanup();
  assert.equal(events.size, 0, "all three listeners are removed on unmount");
  window.dispatchEvent(new Event("cart-added"));
  assert.equal(render(), null);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs, parseCOP, expectedDisplay, compareCatalogState, readCatalogState } = require('../scripts/verify-catalog-functional-browser.cjs');

const product = { id: '0044', precio: 6200, taxRate: 19, priceVerified: true, stock: 0, unidad: 'unidad' };
const api = { priceMode: 'net', priceBounds: { min: 6200, max: 6200 }, products: [product] };
const state = { sectionFound: true, busy: false, mode: 'net', priceLegend: 'Precio antes de IVA', bounds: [6200, 6200], cards: [{ sku: '0044', price: '$ 6.200 sin IVA', text: '$ 6.200 sin IVA' }] };

test('browser comparison rejects wrong labels, prices, SKU order and untruthful source values', () => {
  const source = new Map([[product.id, product]]);
  assert.deepEqual(compareCatalogState(state, api, 'net', source), []);
  assert.match(compareCatalogState({ ...state, cards: [{ ...state.cards[0], price: '$ 7.378 IVA incluido' }] }, api, 'net', source).join(' '), /principal amount/);
  assert.match(compareCatalogState({ ...state, priceLegend: 'Precio con IVA' }, api, 'net', source).join(' '), /range label/);
  assert.match(compareCatalogState({ ...state, cards: [{ ...state.cards[0], sku: '44' }] }, api, 'net', source).join(' '), /SKU order/);
  assert.match(compareCatalogState(state, { ...api, products: [{ ...product, stock: 1 }] }, 'net', source).join(' '), /source value/);
  assert.match(compareCatalogState({ ...state, bounds: [7378, 7378] }, api, 'net', source).join(' '), /bounds/);
});

test('browser expectations keep confirmed unknown-tax bases explicit and do not confirm invented prices', () => {
  assert.deepEqual(expectedDisplay({ ...product, taxRate: undefined }, 'gross'), { amount: 6200, tax: 'sin IVA', taxPending: true });
  assert.deepEqual(expectedDisplay({ ...product, precio: 999999, priceVerified: false }, 'net'), { amount: null, pending: true });
  assert.equal(expectedDisplay({ ...product, precio: 10.5 }, 'gross').amount, 12);
  assert.equal(parseCOP('$\u00a07.378IVA incluido'), 7378);
  assert.equal(parseCOP('Precio por confirmar'), null);
  const unknown = { ...product, taxRate: undefined };
  const response = { ...api, priceMode: 'gross', priceBounds: undefined, products: [unknown] };
  const missingLabel = { ...state, mode: 'gross', priceLegend: 'Precio con IVA', bounds: [] };
  assert.match(compareCatalogState(missingLabel, response, 'gross').join(' '), /unknown tax/);
});

test('browser CLI requires a private output and browser executable without URL credentials', () => {
  assert.throws(() => parseArgs(['--base-url', 'http://user:secret@localhost:3010', '--output', 'reports', '--chrome-path', 'chrome']), /without credentials/);
  assert.throws(() => parseArgs(['--output']), /Invalid argument/);
  const args = parseArgs(['--base-url', 'http://localhost:3010/catalogo', '--output', 'reports', '--chrome-path', 'chrome']);
  assert.equal(args.baseUrl, 'http://localhost:3010');
});

test('legacy card extraction preserves an isolated SKU when adjacent brand/name text is concatenated', () => {
  const saved = { document: global.document, location: global.location, localStorage: global.localStorage };
  const price = { textContent: '$ 6.200sin IVA' };
  const card = {
    textContent: 'TruperSKU 0044Candado de acero$ 6.200sin IVA',
    getAttribute: () => null,
    querySelectorAll: selector => selector === 'span' ? [{ textContent: 'Truper' }, { textContent: 'SKU 0044' }] : selector === 'p' ? [price] : [],
    querySelector: selector => selector === 'h3' ? { textContent: 'Candado de acero' } : selector === 'h3 a' ? { getAttribute: () => '/producto/0044-candado' } : null,
  };
  global.document = {
    querySelector: selector => selector === 'section[aria-label="Productos del catálogo"]' ? { querySelectorAll: () => [card], getAttribute: () => 'false' } : null,
    querySelectorAll: selector => selector === 'input[id^="catalog-price-"]' ? [{ type: 'checkbox', checked: true }] : [],
  };
  global.location = { pathname: '/catalogo', search: '?priceMode=net' };
  global.localStorage = { getItem: () => 'net' };
  try {
    const actual = readCatalogState();
    assert.equal(actual.cards[0].sku, '0044');
    assert.equal(actual.cards[0].name, 'Candado de acero');
    assert.equal(actual.cards[0].price, '$ 6.200sin IVA');
    assert.equal(actual.mode, 'net');
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete global[name]; else global[name] = value;
    }
  }
});

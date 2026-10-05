const test = require('node:test');
const assert = require('node:assert/strict');
const { REQUIRED_CASES, parseArgs, parseCOP, expectedDisplay, compareCatalogState, compareDismissedOverlayState, readCatalogState, selectMode } = require('../scripts/verify-catalog-functional-browser.cjs');

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

test('accessible radio controls report the checked price mode without a legacy checkbox', () => {
  const saved = { document: global.document, location: global.location, localStorage: global.localStorage };
  const radios = [{ type: 'radio', value: 'gross', checked: true }, { type: 'radio', value: 'net', checked: false }];
  global.document = { querySelector: () => null, querySelectorAll: selector => selector === 'input[id^="catalog-price-"]' ? radios : [] };
  global.location = { pathname: '/catalogo', search: '' };
  global.localStorage = { getItem: () => 'gross' };
  try {
    assert.equal(readCatalogState().mode, 'gross');
    radios[0].checked = false;
    radios[1].checked = true;
    assert.equal(readCatalogState().mode, 'net');
    radios[1].checked = false;
    assert.equal(readCatalogState().mode, null, 'missing selection must fail mode comparison');
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete global[name]; else global[name] = value;
    }
  }
});

test('browser mode selection clicks radio labels, is idempotent, and rejects missing controls', async () => {
  const saved = { document: global.document, location: global.location };
  let clicks = 0;
  const radios = ['gross', 'net'].map(value => ({ type: 'radio', value, checked: value === 'gross', closest: () => ({
    scrollIntoView: async () => {},
    click: async () => { clicks++; radios.forEach(radio => { radio.checked = radio.value === value; }); global.location.search = `?priceMode=${value}`; },
  }) }));
  const scope = { querySelectorAll: selector => selector.startsWith('input') ? radios : [] };
  global.document = {
    ...scope,
    querySelector: selector => selector === '[role="dialog"]' ? scope : selector.startsWith('section') ? { getAttribute: () => 'false', textContent: 'Productos' } : null,
  };
  global.location = { search: '' };
  const page = {
    evaluateHandle: async (callback, ...args) => { const value = callback(...args); return { asElement: () => value, dispose: async () => {} }; },
    waitForFunction: async (callback, _options, ...args) => assert.ok(callback(...args)),
  };
  try {
    await selectMode(page, 'net');
    assert.equal(clicks, 1);
    assert.equal(radios[1].checked, true);
    await selectMode(page, 'net');
    assert.equal(clicks, 1, 'selecting the current radio must not toggle or add history');
    await selectMode(page, 'gross', '[role="dialog"]');
    assert.equal(clicks, 2);
    assert.equal(radios[0].checked, true);
    await assert.rejects(selectMode(page, 'net', '[missing]'), /Missing price control scope/);
    radios.splice(0);
    await assert.rejects(selectMode(page, 'gross'), /Missing accessible price control/);
    assert.ok(REQUIRED_CASES.includes('modal-toggle-gross'));
    assert.ok(REQUIRED_CASES.includes('modal-toggle-net'));
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete global[name]; else global[name] = value;
    }
  }
});

test('history dismissal audit rejects a leftover dialog, scroll lock, or surviving focus trap', () => {
  const dismissed = { dialogCount: 0, bodyOverflowY: 'auto', htmlOverflowY: 'visible', focusConnected: true, focusInDialog: false, focusOnCatalogSearch: true };
  assert.deepEqual(compareDismissedOverlayState(dismissed), []);
  assert.match(compareDismissedOverlayState({ ...dismissed, dialogCount: 1 }).join(' '), /modal remains/);
  assert.match(compareDismissedOverlayState({ ...dismissed, bodyOverflowY: 'hidden' }).join(' '), /scrolling remains locked/);
  assert.match(compareDismissedOverlayState({ ...dismissed, htmlOverflowY: 'clip' }).join(' '), /scrolling remains locked/);
  for (const state of [{ focusInDialog: true }, { focusConnected: false }, { focusOnCatalogSearch: false }]) {
    assert.match(compareDismissedOverlayState({ ...dismissed, ...state }).join(' '), /Focus remains trapped/);
  }
  for (const name of ['modal-history-back-gross', 'modal-history-forward-net', 'modal-open-forward-net']) assert.ok(REQUIRED_CASES.includes(name), name);
});

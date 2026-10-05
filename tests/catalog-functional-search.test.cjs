const test = require('node:test');
const assert = require('node:assert/strict');
const products = require('../src/data/products.json');
const load = require('./load-ts.cjs')();
const { searchProducts } = load('src/lib/search.ts');
const { normalizeProductName } = load('src/lib/catalog/normalize.ts');
const product = (id, nombre, extra = {}) => ({ id, nombre, precio: 1000, unidad: 'unidad', stock: 0, cat: 'Ferretería General', brand: 'Sin marca', ...extra });
const prefixCases = [
  ['visagra', 'BISAGRA PARCHE MOB MINI (PAR)', 'JUEGO BISAGRA PARCHE MOB MINI (PAR)'],
  ['chapa', 'CERRADURA SOBREPONER NEGRA', 'KIT CERRADURA SOBREPONER NEGRA'],
  ['tornillo drywall', 'AUTOPERFORANTE 3/16 X 1 ZINCADO', 'JUEGO AUTOPERFORANTE 3/16 X 1 ZINCADO'],
  ['candado yale', 'CANDADO YALE 40MM', 'YALE CANDADO 40MM'],
  ['broca 1/4', 'BROCA METAL 1/4', 'JUEGO BROCA METAL 1/4'],
  ['mecha', 'BROCA PARA METAL 3/8', 'JUEGO BROCA PARA METAL 3/8'],
  ['chazo', 'TACO EXPANSION 1/4', 'JUEGO TACO EXPANSION 1/4'],
  ['lija 120', 'LIJA MADERA 120', 'NORTON LIJA MADERA 120'],
];
for (const [query, prefix, infix] of prefixCases) {
  test(`${query}: beginning of name, including synonym, outranks an in-stock promoted infix`, () => {
    const input = [product('infix', infix, { stock: 100, disc: 50 }), product('prefix', prefix)];
    const result = searchProducts(input, query);
    assert.equal(result.isFuzzy, false);
    assert.equal(result.results.map(item => item.id).join('|'), 'prefix|infix');
    assert.equal(input[0].id, 'infix');
  });
  test(`${query}: actual catalog returns source products without fuzzy fallback`, () => {
    const result = searchProducts(products, query);
    assert.equal(result.isFuzzy, false);
    assert.ok(result.results.length > 0);
    assert.ok(result.results.every(item => products.includes(item)));
  });
}

test('exact ID, then SKU, then reference outrank a full product name and stock/promotion', () => {
  const input = [
    product('name', '1104', { stock: 100, disc: 50 }),
    product('reference', 'CERRADURA', { ref: '1104', stock: 100, disc: 50 }),
    product('sku', 'BISAGRA', { sku: '1104' }),
    product('1104', 'TACO'),
  ];
  const result = searchProducts(input, '1104');
  assert.equal(result.isFuzzy, false);
  assert.equal(result.results.map(item => item.id).join('|'), '1104|sku|reference|name');
});

test('real identifier collision: 1104 comes before 0548 whose reference is 1104', () => {
  const result = searchProducts(products, '1104');
  assert.equal(result.results[0].id, '1104');
  assert.ok(result.results.some(item => item.id === '0548' && item.ref === '1104'));
});

test('leading zero identifiers are compared as literal strings', () => {
  const result = searchProducts([product('0050', 'BROCA'), product('50', '0050', { stock: 10 })], '0050');
  assert.equal(result.results[0].id, '0050');
  assert.equal(result.results.map(item => item.id).join('|'), '0050|50');
});

test('semantic prefix uses a word boundary rather than treating TACOMETRO as TACO', () => {
  const result = searchProducts([product('partial', 'TACOMETRO', { stock: 100 }), product('taco', 'TACO EXPANSION')], 'chazo');
  assert.equal(result.results.map(item => item.id).join('|'), 'taco|partial');
});

test('ties preserve input order and the input products are never sorted or modified', () => {
  const input = [product('a', 'BISAGRA'), product('b', 'BISAGRA')];
  input.forEach(Object.freeze); Object.freeze(input);
  const result = searchProducts(input, 'visagra');
  assert.equal(result.results.map(item => item.id).join('|'), 'a|b');
  assert.equal(input.map(item => item.id).join('|'), 'a|b');
  assert.equal(searchProducts(input, ' ').results, input);
});

test('approved raw and visible names both find the original SKU without changing its fields', () => {
  const original = products.find(item => item.id === '13358');
  const before = JSON.stringify(original);
  for (const query of [original.nombre, normalizeProductName(original.nombre)]) {
    const result = searchProducts(products, query);
    assert.equal(result.isFuzzy, false);
    assert.equal(result.results[0].id, '13358');
    assert.equal(result.results[0], original);
  }
  assert.equal(JSON.stringify(original), before);
});

test('literal model/reference tokens remain searchable', () => {
  const input = [product('model', 'CERRADURA BO-90 3X21X60', { ref: 'MOB-100' }), product('other', 'CERRADURA MOB')];
  for (const query of ['BO-90', '3X21X60', 'MOB-100']) {
    const result = searchProducts(input, query);
    assert.equal(result.isFuzzy, false);
    assert.equal(result.results.map(item => item.id).join('|'), 'model');
  }
});

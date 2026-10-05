const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const load = require('./load-ts.cjs')();
const { getProductSlug } = load('src/lib/catalog/routes.ts');
const { normalizeProductName, normalizeProductNameForRoute } = load('src/lib/catalog/normalize.ts');
const source = fs.readFileSync(path.join(__dirname, '../src/data/products.json'));
const products = JSON.parse(source);
// Generated independently with git show of baseline route/normalizer/dictionary code.
const fixture = require('./fixtures/catalog-slugs-6909394.json');

test('all 1,319 published canonical slugs remain identical to baseline 6909394', () => {
  assert.equal(fixture.baseline, '6909394e0f59a585caeaece768ffec4eee6f83d8');
  // The independently generated fixture used a Windows checkout. Ignore only
  // checkout line endings; every other source byte and every route stay pinned.
  const baselineLineEndings = source.toString('utf8').replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
  assert.equal(createHash('sha256').update(baselineLineEndings).digest('hex'), fixture.sourceSha256);
  assert.equal(products.length, 1319);
  assert.equal(Object.keys(fixture.slugs).length, products.length);
  for (const product of products) assert.equal(getProductSlug(product), fixture.slugs[product.id], product.id);
  assert.equal(new Set(products.map(getProductSlug)).size, products.length);
});

const approvedCases = [
  ['0435', 'Bisagra parche mueble mini (par)', '0435-bisagra-parche-mob-mini-par'],
  ['2758', 'Zapatero mueble plástico 2 capas negro', '2758-zapatero-mob-plastico-2-capas-negro'],
  ['8164', 'Cerradura trampa mueble negra', '8164-cerradura-trampa-mob-negra'],
  ['11275', 'Soporte mueble 880-105MM880-105MM', '11275-soporte-mob-880-105mm880-105mm'],
  ['11724', 'Bisagra interior mueble gas (par)', '11724-bisagra-interior-mob-gas-par'],
  ['12531', 'Manija mueble alum cazuela 12.8', '12531-manija-mob-alum-cazuela-12-8'],
  ['12747', 'Soporte mueble vidrio 10MM (par)', '12747-soporte-mob-vidrio-10mm-par'],
  ['12962', 'Bisagra semi parche mueble gas acero (par)', '12962-bisagra-semi-parche-mob-gas-acero-par'],
  ['13160', 'Boton mueble alum ranurado 32MM', '13160-boton-mob-alum-ranurado-32mm'],
  ['13357', 'Bisagra parche mueble economica (par)', '13357-bisagra-parche-mob-economica-par'],
  ['13358', 'Bisagra semi parche mueble (par) económica', '13358-bisagra-semi-parche-mob-par-econ'],
  ['13469', 'Soporte mueble vidrio', '13469-soporte-mob-vidrio'],
  ['13762', 'Corredera ext mueble 50 invisible 75 libras', '13762-corredera-ext-mob-50-invisible-75-libras'],
  ['13992', 'Bisagra parche mueble gas acero (par)', '13992-bisagra-parche-mob-gas-acero-par'],
  ['14189', 'Soporte mueble vidrio 8MM cromado (par)', '14189-soporte-mob-vidrio-8mm-cromado-par'],
  ['15329', 'Zapatero mueble plástico 3 capas negro', '15329-zapatero-mob-plastico-3-capas-negro'],
];
for (const [id, display, slug] of approvedCases) {
  test(`${id}: approved presentation expands while its published slug stays literal`, () => {
    const product = products.find(item => item.id === id);
    assert.ok(product);
    assert.equal(normalizeProductName(product.nombre), display);
    assert.equal(normalizeProductName(display), display);
    assert.equal(getProductSlug(product), slug);
  });
}

test('only approved isolated tokens expand; technical codes and unapproved forms remain', () => {
  const input = 'SOPORTE MOB ECON PVC USB LED 1/4 BO-90 3X21X60 MOB-100 ECON400 MOBIL ECO';
  assert.equal(normalizeProductName(input), 'Soporte mueble económica PVC USB LED 1/4 BO-90 3X21X60 MOB-100 ECON400 mobil eco');
  assert.equal(normalizeProductNameForRoute(input), 'Soporte mob econ PVC USB LED 1/4 BO-90 3X21X60 MOB-100 ECON400 mobil eco');
  assert.equal(normalizeProductName('MODELO BO-MOB ECON.MODEL'), 'Modelo bo-mob econ.model');
  assert.equal(normalizeProductName('MANIJA ALUM CAZ ESP LAT PROF REF'), 'Manija alum caz esp LAT prof REF');
});

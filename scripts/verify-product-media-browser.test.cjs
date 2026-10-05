const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { PROVENANCE_SOURCES, EXPECTED_COUNTS, FIXTURES, SURFACES, parseArgs, compareSourceImage, compareApiProduct, loadSource, readMediaState, compareMediaState, compareAvailabilityState, auditApi } = require('./verify-product-media-browser.cjs');

const plain = value => JSON.parse(JSON.stringify(value));
const source = loadSource();
const fixture = source.fixtures.find(item => item.sku === '15389');
function readableState() {
  return { scopeFound: true, theme: 'light', viewport: { width: 360, height: 844 }, documentWidth: 360, bodyWidth: 360, scopeWidth: 300, scopeScrollWidth: 300, errorOverlay: false,
    captions: [{ text: fixture.caption, renderedText: fixture.caption, rect: { width: 260, height: 48 }, opacity: 1, hidden: [], clamps: [], clipping: [], lines: [{ inViewport: true, unobscured: true }], textOverflow: 'clip', scrollWidth: 260, clientWidth: 260, scrollHeight: 48, clientHeight: 48 }],
    images: [{ source: '/' + fixture.product.img, alt: fixture.product.gallery[0].alt, complete: true, naturalWidth: 768, naturalHeight: 768, visiblyRendered: true }] };
}

test('phase-2/3 source audit uses all 264 public records and canonical routes, with 197 exact captions and 194 kinds', () => {
  assert.deepEqual(PROVENANCE_SOURCES.map(item => item.path), ['docs/product-image-provenance-phase2-20261005.json', 'docs/product-image-provenance-phase3-20261005.json']);
  assert.deepEqual(source.documents.map(item => item.counts), PROVENANCE_SOURCES.map(item => item.counts));
  assert.deepEqual(source.counts, EXPECTED_COUNTS);
  assert.deepEqual(source.issues, []);
  assert.equal(source.passed, true);
  assert.equal(source.entries.length, 264);
  assert.equal(source.fixtures.length, 9);
  assert.equal(source.fixtures.length * SURFACES.length * 2 * 2, 108);
  assert.ok(source.fixtures.every(item => item.route.startsWith(`/producto/${item.sku}-`) && item.product.gallery[0].caption === item.caption));
  assert.equal(fixture.criticalText, 'No incluye cama ni colchón');
  assert.deepEqual(source.fixtures.filter(item => item.zeroStock).map(item => [item.sku, item.product.stock]), [['14288', 0], ['1860', 0]]);
  assert.deepEqual(new Set(FIXTURES.map(item => item.kind)), new Set(['component-detail', 'supplier-render', 'manufacturer-render', 'pair-detail', 'profile-detail', 'technical-diagram']));
});

test('CLI defaults require both mobile/desktop and light/dark; unsafe origins and invalid options fail', () => {
  const options = parseArgs(['--output', '/tmp/media-test', '--chrome-path', '/tmp/chrome']);
  assert.deepEqual(options.widths, [360, 1440]);
  assert.deepEqual(options.themes, ['light', 'dark']);
  for (const args of [['--base-url', 'http://example.com'], ['--base-url', 'https://user:pass@example.com'], ['--base-url', 'https://example.com/path'], ['--widths', '0'], ['--widths', '360,360'], ['--themes', 'light,unknown'], ['--themes', 'light,light'], ['--unknown', 'true'], ['--themes']]) {
    assert.throws(() => parseArgs(['--output', '/tmp/media-test', '--chrome-path', '/tmp/chrome', ...args]), JSON.stringify(args));
  }
});

test('canonical DTO cannot silently remove or replace approved kind, alt, caption, source, verification or SKU', () => {
  const record = { sku: fixture.sku, ...fixture.product.gallery[0] };
  assert.deepEqual(compareSourceImage(record, fixture.product), []);
  for (const field of ['caption', 'kind', 'alt', 'verified']) {
    const product = plain(fixture.product);
    delete product.gallery[0][field];
    assert.ok(compareSourceImage(record, product).length, field);
  }
  const leaked = plain(fixture.product);
  leaked.gallery[0].sourcePath = '/private/original.webp';
  assert.match(compareSourceImage(record, leaked).join(' '), /non-public/);
  const wrongSource = plain(fixture.product);
  wrongSource.img = 'products/wrong.webp';
  assert.ok(compareSourceImage(record, wrongSource).length);
  assert.ok(compareSourceImage(record, { ...fixture.product, id: '1538' }).length);
  assert.ok(compareSourceImage(record, undefined).length);
});

test('API comparison fails for dropped captions/kinds and for a stale or different image gallery', () => {
  assert.deepEqual(compareApiProduct(fixture.product, plain(fixture.product)), []);
  for (const field of ['caption', 'kind', 'src', 'alt', 'verified']) {
    const actual = plain(fixture.product);
    delete actual.gallery[0][field];
    assert.ok(compareApiProduct(fixture.product, actual).length, field);
  }
  const actual = plain(fixture.product);
  actual.stock += 1;
  assert.match(compareApiProduct(fixture.product, actual).join(' '), /stock/);
  actual.img = 'products/other.webp';
  assert.ok(compareApiProduct(fixture.product, actual).length);
  assert.ok(compareApiProduct(fixture.product, null).length);
});

test('visible installed-bed caption and loaded image pass, while alt-only, truncated or hidden text fail', () => {
  assert.deepEqual(compareMediaState(readableState(), fixture, 'light'), []);
  for (const change of [
    state => { state.captions = []; },
    state => { state.captions[0].renderedText = 'Ilustración del mecanismo instalado.'; },
    state => { state.captions[0].text = 'Ilustración del mecanismo instalado.'; },
    state => { state.captions[0].hidden = ['p']; },
    state => { state.captions[0].opacity = 0; },
    state => { state.captions[0].rect.height = 0; },
    state => { state.captions[0].clamps = ['p']; },
    state => { state.captions[0].textOverflow = 'ellipsis'; },
    state => { state.captions[0].clipping = [{ ancestor: 'article' }]; },
    state => { state.captions[0].scrollHeight += 16; },
    state => { state.captions[0].scrollWidth += 16; },
    state => { state.captions[0].lines[0].inViewport = false; },
    state => { state.captions[0].lines[0].unobscured = false; },
    state => { state.captions[0].lines = []; },
  ]) {
    const state = readableState(); change(state);
    assert.ok(compareMediaState(state, fixture, 'light').length);
  }
  const missingCritical = readableState(); missingCritical.captions[0].renderedText = 'Ilustración del mecanismo instalado.';
  assert.match(compareMediaState(missingCritical, fixture, 'light').join(' '), /Critical exclusion is not visible: No incluye cama ni colchón/);
});

test('a caption cannot pass while the image is unloaded, swapped, missing alt, or the page overflows', () => {
  for (const change of [
    state => { state.images = []; },
    state => { state.images[0].source = '/products/other.webp'; },
    state => { state.images[0].complete = false; },
    state => { state.images[0].visiblyRendered = false; },
    state => { state.images[0].naturalWidth = 0; },
    state => { state.images[0].naturalHeight = 0; },
    state => { state.images[0].alt = ''; },
    state => { state.documentWidth = 390; },
    state => { state.scopeScrollWidth = 320; },
    state => { state.errorOverlay = true; },
    state => { state.theme = 'dark'; },
  ]) {
    const state = readableState(); change(state);
    assert.ok(compareMediaState(state, fixture, 'light').length);
  }
});

// Exercise the serialized geometry probe without a browser dependency. The fake DOM
// distinguishes harmless overflow:hidden from text actually cut by an ancestor.
function measuredCaption({ clipHeight = 80, clamp = 'none', occluded = false } = {}) {
  const box = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
  const baseStyle = { opacity: '1', display: 'block', visibility: 'visible', contentVisibility: 'visible', overflowX: 'visible', overflowY: 'visible', textOverflow: 'clip', getPropertyValue: () => 'none' };
  const html = { tagName: 'HTML', parentElement: null, className: '', clientLeft: 0, clientTop: 0, clientWidth: 360, clientHeight: 844, scrollWidth: 360, getBoundingClientRect: () => box(0, 0, 360, 844), classList: { contains: () => false }, style: baseStyle };
  const body = { ...html, tagName: 'BODY', parentElement: html };
  const scope = { ...body, tagName: 'ARTICLE', parentElement: body, clientWidth: 300, scrollWidth: 300, clientHeight: clipHeight, getBoundingClientRect: () => box(20, 100, 300, clipHeight), style: { ...baseStyle, overflowY: 'hidden' } };
  const caption = { tagName: 'P', parentElement: scope, className: '', clientLeft: 0, clientTop: 0, clientWidth: 260, clientHeight: 48, scrollWidth: 260, scrollHeight: 48,
    textContent: fixture.caption, innerText: fixture.caption, getBoundingClientRect: () => box(30, 110, 260, 48), contains: node => node === caption,
    style: { ...baseStyle, getPropertyValue: property => property === '-webkit-line-clamp' ? clamp : 'none' } };
  scope.querySelectorAll = selector => selector.includes('caption') ? [caption] : [];
  const document = { documentElement: html, body, querySelector: selector => selector === 'article' ? scope : null,
    createRange: () => ({ selectNodeContents() {}, getClientRects: () => [box(30, 110, 250, 14), box(30, 126, 230, 14), box(30, 142, 150, 14)] }),
    elementFromPoint: () => occluded ? body : caption };
  return plain(vm.runInNewContext(`(${readMediaState.toString()})('article')`, { document, getComputedStyle: node => node.style, innerWidth: 360, innerHeight: 844, location: { href: 'http://localhost:3010/catalogo' }, URL })).captions[0];
}

test('DOM geometry detects ancestor clipping, line clamps and occlusion without rejecting a harmless clipping container', () => {
  const normal = measuredCaption();
  assert.deepEqual(normal.clipping, []);
  assert.ok(normal.lines.every(line => line.inViewport && line.unobscured));
  assert.equal(measuredCaption({ clipHeight: 30 }).clipping.length, 1);
  assert.deepEqual(measuredCaption({ clamp: '2' }).clamps, ['caption']);
  assert.ok(measuredCaption({ occluded: true }).lines.every(line => !line.unobscured));
});

test('zero-stock cards, quick views and details require readable availability and an enabled quote action', () => {
  const valid = { stockLabel: 'Consultar disponibilidad', stockVisible: true, actions: [{ label: 'Consultar disponibilidad: Producto, se agrega a cotización con disponibilidad a confirmar', disabled: false }] };
  assert.deepEqual(compareAvailabilityState(valid), []);
  for (const change of [
    state => { state.stockLabel = 'Disponible'; },
    state => { state.stockVisible = false; },
    state => { state.actions = []; },
    state => { state.actions[0].disabled = true; },
    state => { state.actions[0].label = 'Comprar ahora'; },
  ]) {
    const state = plain(valid); change(state);
    assert.ok(compareAvailabilityState(state).length);
  }
});

test('all 264 API records are checked with bounded concurrency and no private input or request', async () => {
  const originalFetch = global.fetch;
  const bySku = new Map(source.entries.map(entry => [entry.sku, entry.product]));
  let active = 0, maximum = 0;
  const requested = [];
  global.fetch = async input => {
    const url = new URL(input), sku = url.searchParams.get('q');
    requested.push(sku);
    assert.equal(url.pathname, '/api/catalogo');
    maximum = Math.max(maximum, ++active);
    await new Promise(resolve => setTimeout(resolve, 1));
    --active;
    return { ok: true, status: 200, json: async () => ({ products: [plain(bySku.get(sku))] }) };
  };
  try {
    const result = await auditApi('http://localhost:3010', source);
    assert.equal(result.passed, true);
    assert.equal(result.checked, 264);
    assert.equal(new Set(requested).size, 264);
    assert.equal(maximum, 4);
  } finally { global.fetch = originalFetch; }
});

test('workflow collects phase-2/3 evidence and fails the aggregate gate if the audit fails or is skipped', () => {
  const workflow = fs.readFileSync(path.join(__dirname, '..', '.github/workflows/visual-quality.yml'), 'utf8');
  assert.match(workflow, /id: product_media[\s\S]*?verify-product-media-browser\.cjs[^\n]*--output "\$AUDIT_REPORTS\/product-media"[^\n]*--widths 360,1440 --themes light,dark/);
  assert.match(workflow, /PRODUCT_MEDIA_OUTCOME: \$\{\{ steps\.product_media\.outcome \}\}/);
  assert.match(workflow, /const gates = \[[^\n]*'PRODUCT_MEDIA_OUTCOME'/);
  assert.match(workflow, /gates\.every\(gate => gate\.outcome === 'success'\)/);
  assert.match(workflow, /Upload complete evidence even when an audit fails\s+if: always\(\)/);
  const script = fs.readFileSync(path.join(__dirname, 'verify-product-media-browser.cjs'), 'utf8');
  assert.doesNotMatch(script, /integration-manifest\.json|product-image-research/);
});

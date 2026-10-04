const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { groupRows } = require('./verify-visual-browser.cjs');
const { scanSource, scanCss, scanRepository } = require('./verify-visual-tokens.cjs');

function card(sku, top, left, priceTop, actionsTop, height = 300) {
  return { sku, card: { top, left, width: 200, height, right: left + 200, bottom: top + height }, price: { top: priceTop }, actions: { top: actionsTop } };
}

test('a displaced card cannot escape its grid row and pass misaligned prices/actions', () => {
  const rows = groupRows([card('a', 0, 0, 100, 150), card('b', 0, 220, 100, 150), card('c', 3, 440, 110, 160)]);
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].skus, ['a', 'b', 'c']);
  assert.equal(rows[0].priceDeltaPx, 10);
  assert.equal(rows[0].actionsDeltaPx, 10);
  assert.equal(rows[0].passed, false);
});

test('hover movement remains comparable while separate grid rows and list items stay separate', () => {
  const rows = groupRows([card('a', 0, 0, 100, 150), card('b', -1, 220, 99, 149), card('c', 330, 0, 430, 480), card('d', 330, 220, 432, 482)]);
  assert.equal(rows.length, 2);
  assert.ok(rows.every(row => row.comparable && row.passed));
  const list = groupRows([card('a', 0, 0, 100, 150), card('b', 290, 0, 400, 450)]);
  assert.equal(list.length, 2);
  assert.ok(list.every(row => !row.comparable && row.passed));
});

test('inline named colors fail while structural values, semantic tokens and noncolor content pass', () => {
  assert.ok(scanSource('const x = <div style={{ backgroundColor: "red", border: "1px solid rebeccapurple" }} />;').some(item => item.value === 'red'));
  assert.ok(scanSource('const x = <div style={{ color: "var(--unapproved)" }} />;').some(item => item.rule === 'unknown-color-variable'));
  assert.deepEqual(scanSource('const x = <div style={{ color: "rgb(var(--ink))", backgroundColor: "transparent", border: "1px solid rgb(var(--line))", boxShadow: "0 2px 6px rgb(var(--overlay) / .06)" }}>red</div>;'), []);
});

test('component CSS catches literal color/gradient but accepts the current semantic declarations', () => {
  const bad = scanCss('/* color: red; */ .a { color: red; background: linear-gradient(var(--paper), var(--surface)); border: 1px solid rgb(255 0 0); }');
  assert.equal(bad.length, 3);
  assert.ok(bad.some(item => item.rule === 'gradient'));
  assert.deepEqual(scanCss('.a { background: rgb(var(--paper)); color: var(--ink); box-shadow: 0 2px 6px rgb(var(--overlay) / .06); border: 1px solid transparent; --product-action-offset: 104px; }'), []);
});

test('repository scope scans presentation CSS and excludes only global token definitions', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ferre-token-gate-'));
  try {
    fs.mkdirSync(path.join(root, 'src/components'), { recursive: true });
    fs.mkdirSync(path.join(root, 'src/app'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src/app/globals.css'), ':root { --brand: 208 39 49; } .legacy { color: red; }');
    fs.writeFileSync(path.join(root, 'src/app/quote-visual.css'), '.quote { background: red; }');
    fs.writeFileSync(path.join(root, 'src/components/product-visual.css'), '.photo { background: rgb(var(--photo)); }');
    const result = scanRepository(root);
    assert.equal(result.filesScanned, 2);
    assert.equal(result.passed, false);
    assert.equal(result.findings[0].file, 'src/app/quote-visual.css');
  } finally {
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(root).startsWith('ferre-token-gate-'));
    fs.rmSync(root, { recursive: true, force: true });
  }
});

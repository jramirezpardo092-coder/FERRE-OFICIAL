const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyUtility, scanSource } = require('./verify-visual-tokens.cjs');
const { groupRows, sessionCLS, countPaintRegions, summarizeMeasurement, parseArgs } = require('./verify-visual-browser.cjs');

test('semantic tokens and geometry are accepted while palette variants and literal colors are rejected', () => {
  for (const value of ['hover:bg-brand', 'dark:text-ink-2', 'border-wa-edge', 'bg-overlay/40', 'text-[28px]', 'ring-2', 'w-[72px]', 'fill-current', 'bg-[rgb(var(--paper)/0.5)]']) assert.equal(classifyUtility(value), null, value);
  for (const value of ['md:hover:bg-red-600/90', 'dark:border-white', 'focus:ring-blue-500', 'text-[#123456]', 'fill-[rebeccapurple]', 'bg-[linear-gradient(red,blue)]', 'bg-[rgb(1,2,3)]', 'bg-[var(--unknown)]']) assert.ok(classifyUtility(value), value);
});

test('AST ignores comments but catches concatenated and dynamic color utilities', () => {
  const source = '// bg-red-500 #abcdef\nconst size = "text-[28px]"; const good = "bg-paper text-ink"; const bad = "bg-" + "red-500"; const dynamic = `hover:bg-${tone}`; const hex = <svg fill="#123456"/>;';
  const findings = scanSource(source);
  assert.ok(findings.some(finding => finding.value === 'bg-red-500'));
  assert.ok(findings.some(finding => finding.rule === 'dynamic-color-utility'));
  assert.ok(findings.some(finding => finding.value === '#123456'));
  assert.ok(!findings.some(finding => finding.value === '#abcdef'));
  assert.ok(!findings.some(finding => finding.value === 'text-[28px]'));
});

function card(sku, top, priceTop, actionsTop, left = 0) {
  return { sku, card: { top, left }, price: priceTop === null ? null : { top: priceTop }, actions: actionsTop === null ? null : { top: actionsTop } };
}
test('alignment keeps fractional precision at the 2px boundary and requires markers', () => {
  const passing = groupRows([card('0435', 0, 100, 150), card('00050', 0, 102, 152, 300)]);
  assert.equal(passing[0].passed, true);
  assert.deepEqual(passing[0].skus, ['0435', '00050']);
  assert.equal(groupRows([card('a', 0, 100, 150), card('b', 0, 102.01, 150, 300)])[0].passed, false);
  assert.equal(groupRows([card('a', 0, null, 150)])[0].passed, false);
  assert.equal(groupRows([card('a', 0, 100, 150)])[0].comparable, false);
  assert.equal(groupRows([card('a', 0, 100, 150), card('b', 400, 500, 550)])[0].comparable, false);
});

test('CLS uses session windows, ignores recent input and retains the largest window', () => {
  assert.equal(sessionCLS([{ startTime: 50, value: .04 }, { startTime: 500, value: .03 }, { startTime: 700, value: .9, hadRecentInput: true }, { startTime: 1700, value: .06 }]), .07);
  assert.ok(Math.abs(sessionCLS([{ startTime: 0, value: .04 }, { startTime: 900, value: .04 }, { startTime: 1800, value: .04 }, { startTime: 2700, value: .04 }, { startTime: 3600, value: .04 }, { startTime: 4500, value: .04 }, { startTime: 5100, value: .01 }]) - .24) < Number.EPSILON);
});

test('paint regions deduplicate nested surfaces but preserve distinct visible red controls', () => {
  const paint = (selector, left, top, right, bottom) => ({ selector, rect: { left, top, right, bottom } });
  const regions = countPaintRegions([paint('parent', 0, 0, 20, 20), paint('child', 5, 5, 10, 10), paint('separate', 30, 0, 50, 20)]);
  assert.equal(regions.length, 2);
  assert.equal(regions[0].length, 2);
  assert.equal(countPaintRegions([paint('left', 0, 0, 10, 10), paint('right', 20, 0, 30, 10), paint('bridge', 10, 0, 20, 10)]).length, 1);
});

test('report mode preserves the actual missing preload failure while required mode rejects it', () => {
  const dom = { paints: [], cards: [], runtimeClasses: [], targets: [], unresolvedPseudos: [], gradients: [], clsSupported: true, layoutShifts: [], fonts: { passed: false, archivoFamily: 'Archivo', archivoUrls: ['/archivo.woff2'], preloads: [] } };
  const options = { alignmentRequired: false, redBudgetRequired: false };
  const reported = summarizeMeasurement(dom, { ...options, fontGate: 'report' });
  assert.equal(reported.checks.fonts.passed, false);
  assert.equal(reported.checks.fonts.required, false);
  assert.equal(reported.passed, true);
  assert.equal(summarizeMeasurement(dom, { ...options, fontGate: 'required' }).passed, false);
});

test('unknown options and invalid font gate cannot silently reduce coverage', () => {
  assert.throws(() => parseArgs(['--output', 'diagnostic-output', '--font-preload-gate', 'optional']), /font-preload-gate/);
  assert.throws(() => parseArgs(['--view', 'catalogo']), /Unknown argument/);
});

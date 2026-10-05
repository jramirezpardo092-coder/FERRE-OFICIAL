const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const load = require('./load-ts.cjs')();
const { shouldShowCategoryShortcuts } = load('src/lib/catalog-navigation.ts');

test('category shortcuts stay on the main catalog while the selected category uses its existing chooser', () => {
  assert.equal(shouldShowCategoryShortcuts([], ''), false);
  assert.equal(shouldShowCategoryShortcuts([{ name: 'Cerrajería' }], ''), true);
  assert.equal(shouldShowCategoryShortcuts([{ name: 'Cerrajería' }], 'Herramientas'), false);
  assert.equal(shouldShowCategoryShortcuts([{ name: 'Cerrajería' }], 'Cerrajería'), false);
  assert.equal(shouldShowCategoryShortcuts([{ name: 'Cerrajería' }, { name: 'Herramientas' }], 'Cerrajería'), false);
});

test('the category chip, clear actions and chooser remain available when the redundant rail is omitted', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/CatalogClient.tsx'), 'utf8');
  assert.match(source, /filters\.category && \{ key: "cat", label: filters\.category \}/);
  assert.match(source, /aria-label="Filtros activos"/);
  assert.match(source, /onClick=\{clearAll\}/);
  assert.match(source, /<CatalogFilters \{\.\.\.filterProps\}/);
  assert.match(source, /showCategoryNavigation && <nav data-design-categories/);
  assert.match(source, /shouldShowCategoryShortcuts\(visibleCategoryChips, filters\.category\)/);
});

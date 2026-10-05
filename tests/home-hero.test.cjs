const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const Image = ({ src, alt }) => React.createElement('img', { src, alt });
const Link = ({ children, ...props }) => React.createElement('a', props, children);
const load = require('./load-ts.cjs')({ 'next/image': Image, 'next/link': Link });
const Hero = load('src/components/HeroCarousel.tsx').default;
const { enrichProduct } = load('src/lib/product-enrichment.ts');
const { getProductPath } = load('src/lib/catalog/routes.ts');
const source = require('../src/data/products.json').find(product => product.id === '13751');
const spotlight = enrichProduct(source);
const counts = { productCount: 1319, brandCount: 10, categoryCount: 8 };

function elements(node, result = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, result));
  else if (React.isValidElement(node)) { result.push(node); elements(node.props.children, result); }
  return result;
}

test('home hero renders the real SKU 13751 photograph with a root-relative Next Image source', () => {
  assert.ok(source, 'real catalog fixture must exist');
  assert.equal(spotlight.img, 'products/official/13751-1.webp', 'enrichment intentionally keeps the established relative product img format');
  const before = JSON.stringify(spotlight);
  const tree = Hero({ ...counts, spotlight });
  const photos = elements(tree).filter(node => node.type === Image);
  assert.equal(photos.length, 1);
  assert.equal(photos[0].props.src, '/products/official/13751-1.webp');
  assert.ok(fs.statSync(path.join(__dirname, '../public', photos[0].props.src)).isFile());
  assert.equal(photos[0].props.priority, true);
  assert.match(photos[0].props.alt, /Einhell|EINHELL/);
  const card = elements(tree).find(node => node.type === Link && node.props.className?.includes('hero-spotlight'));
  assert.equal(card.props.href, getProductPath(spotlight));
  assert.equal(JSON.stringify(spotlight), before, 'presentation cannot rewrite source records');
  assert.match(renderToStaticMarkup(tree), /src="\/products\/official\/13751-1\.webp"/);
});

test('home hero accepts an already rooted image without introducing a protocol-relative URL', () => {
  const tree = Hero({ ...counts, spotlight: { ...spotlight, img: '/products/official/13751-1.webp' } });
  assert.equal(elements(tree).find(node => node.type === Image).props.src, '/products/official/13751-1.webp');
});

test('missing or unsafe hero images render neither a broken photograph nor an empty spotlight link', () => {
  for (const img of [undefined, '', 'https://example.com/photo.webp', '//example.com/photo.webp', 'blob:temporary', '../photo.webp', '/products/../photo.webp']) {
    const tree = Hero({ ...counts, spotlight: { ...spotlight, img } });
    assert.equal(elements(tree).some(node => node.type === Image), false, String(img));
    assert.equal(elements(tree).some(node => node.type === Link && node.props.className?.includes('hero-spotlight')), false, String(img));
    const search = elements(tree).find(node => node.type === 'form');
    assert.equal(search.props.action, '/catalogo');
    assert.equal(search.props.method, 'get');
    assert.equal(elements(tree).filter(node => node.type === 'h1').length, 1);
  }
  assert.equal(elements(Hero(counts)).some(node => node.type === Image), false);
});

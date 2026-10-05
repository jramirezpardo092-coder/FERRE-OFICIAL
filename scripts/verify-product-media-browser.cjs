#!/usr/bin/env node
/* Isolated phase-2/3 media audit. Only public provenance and canonical catalog DTOs are inputs.
 * Uses the workflow's pinned Puppeteer/Chrome/axe; never connects to a user's browser or sends WhatsApp. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');

const PROVENANCE_SOURCES = [
  { path: 'docs/product-image-provenance-phase2-20261005.json', counts: { images: 139, captions: 104, classified: 101 }, manifestSha256: '41518b035bc792966156f70ea3a7ed70051a0aa30bf91ab1510c17386d74c29e' },
  { path: 'docs/product-image-provenance-phase3-20261005.json', counts: { images: 125, captions: 93, classified: 93 }, manifestSha256: '17bbd5aad3c504558f8eee263c4aec0b7e7dd9f5912a89a1cefa4168c3c530b2' },
];
const EXPECTED_COUNTS = { images: 264, captions: 197, classified: 194 };
const FIXTURES = [
  { sku: '14862', label: 'component', kind: 'component-detail', caption: 'Detalle del taladro del conjunto TOTAL UTDLI1222. La imagen no muestra la segunda batería, el cargador ni el maletín incluidos en la descripción.' },
  { sku: '8584', label: 'shared-size-supplier', kind: 'supplier-render', caption: 'Ilustración de referencia del sistema Mobile HRE126; vista compartida entre medidas, sin escala dimensional' },
  { sku: '15585', label: 'shared-size-manufacturer', kind: 'manufacturer-render', caption: 'Manija Qualita QF3060 gris; imagen de referencia compartida para las medidas de 150 y 200 mm' },
  { sku: '9097', label: 'pair', kind: 'pair-detail', caption: 'Vista de una bisagra del par.' },
  { sku: '13424', label: 'profile', kind: 'profile-detail', caption: 'Detalle del perfil de zócalo PVC aluminizado PERPVC59; no representa la longitud completa de 4 m' },
  { sku: '15389', label: 'installed-bed', kind: 'supplier-render', caption: 'Ilustración del mecanismo instalado. No incluye cama ni colchón.', criticalText: 'No incluye cama ni colchón' },
  { sku: '2913', label: 'unit-not-pack', kind: 'supplier-render', caption: 'Se vende por unidad. La imagen de referencia del fabricante muestra la punta TACIM16PH223 y su presentación de 10 piezas; el estuche y el juego no están incluidos en la unidad.' },
  { sku: '14288', label: 'zero-stock-diagram', kind: 'technical-diagram', zeroStock: true, caption: 'Diagrama de referencia del fabricante para la familia Welldone 12757/12758. Ref. 12757: corte de 3/8 y espigo de 1/4. No está a escala; consultar las medidas de la referencia.' },
  { sku: '1860', label: 'zero-stock-shared-render', kind: 'manufacturer-render', zeroStock: true, caption: 'Imagen de referencia del fabricante compartida entre medidas de esta familia Welldone. La referencia 12744 se verifica en su tabla técnica. No está a escala ni acredita las dimensiones de la pieza.' },
];
const SURFACES = ['catalog-card', 'quick-view', 'product-detail'];

function parseArgs(args) {
  const options = { baseUrl: 'http://localhost:3010', output: null, chromePath: process.env.CHROME_PATH, widths: '360,1440', themes: 'light,dark' };
  const flags = { '--base-url': 'baseUrl', '--output': 'output', '--chrome-path': 'chromePath', '--widths': 'widths', '--themes': 'themes' };
  for (let i = 0; i < args.length; i += 2) {
    if (!flags[args[i]] || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Invalid argument: ${args[i]}`);
    options[flags[args[i]]] = args[i + 1];
  }
  const base = new URL(options.baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || (base.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(base.hostname))
    || base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw new Error('Use a plain localhost HTTP or HTTPS origin without credentials.');
  if (!options.output || !options.chromePath) throw new Error('Use --output <reports directory> and --chrome-path <browser executable> (or CHROME_PATH).');
  const widths = options.widths.split(',').map(Number), themes = options.themes.split(',');
  if (!widths.length || widths.some(value => !Number.isInteger(value) || value < 320 || value > 2560) || new Set(widths).size !== widths.length) throw new Error('Invalid or duplicate widths.');
  if (!themes.length || themes.some(value => !['light', 'dark'].includes(value)) || new Set(themes).size !== themes.length) throw new Error('Invalid or duplicate themes.');
  return { ...options, baseUrl: base.origin, output: path.resolve(options.output), widths, themes };
}

function compareSourceImage(record, product) {
  const issues = [];
  if (!product || product.id !== record.sku) return [`${record.sku}: canonical product is missing or has a different SKU.`];
  const src = typeof product.img === 'string' ? '/' + product.img.replace(/^\//, '') : '';
  const image = product.gallery?.find(item => item.src === src);
  if (!image || image.verified !== true) return [`${record.sku}: the approved image is not the verified primary gallery image.`];
  if (!/^\/products\/official\/[\w.-]+\.(webp|avif|png|jpe?g)$/i.test(src)) issues.push(`${record.sku}: image does not use a safe local official asset path.`);
  for (const field of ['alt', 'kind', 'caption']) {
    if ((image[field] || '') !== (record[field] || '')) issues.push(`${record.sku}: canonical ${field} differs from the approved public provenance.`);
  }
  if (product.gallery.some(item => Object.keys(item).some(key => !['src', 'verified', 'kind', 'alt', 'caption'].includes(key)))) issues.push(`${record.sku}: non-public image provenance leaked into the catalog DTO.`);
  return issues;
}

function compareApiProduct(expected, actual) {
  if (!actual || actual.id !== expected.id) return [`${expected.id}: API product is missing or has a different SKU.`];
  const issues = [];
  if (actual.stock !== expected.stock) issues.push(`${expected.id}: API changes canonical stock or zero-stock availability.`);
  if (actual.img !== expected.img) issues.push(`${expected.id}: API primary image differs from the canonical catalog.`);
  if (JSON.stringify(actual.gallery) !== JSON.stringify(expected.gallery)) issues.push(`${expected.id}: API gallery loses or changes approved source, kind, alt, caption, or verification.`);
  return issues;
}

function loadSource(repository = path.join(__dirname, '..')) {
  const issues = [], documents = [], images = [];
  for (const expected of PROVENANCE_SOURCES) {
    const bytes = fs.readFileSync(path.join(repository, expected.path));
    const provenance = JSON.parse(bytes);
    if (!Array.isArray(provenance.images)) throw new Error(`${expected.path} must contain a public images array.`);
    const counts = { images: provenance.images.length, captions: provenance.images.filter(row => row.caption).length, classified: provenance.images.filter(row => row.kind).length };
    for (const [field, value] of Object.entries(expected.counts)) if (counts[field] !== value) issues.push(`${expected.path}: expected ${value} ${field}; found ${counts[field]}.`);
    if (provenance.manifestSha256 !== expected.manifestSha256) issues.push(`${expected.path}: the approved manifest identity changed.`);
    documents.push({ path: expected.path, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), manifestSha256: provenance.manifestSha256, counts });
    images.push(...provenance.images);
  }
  const loader = require('../tests/load-ts.cjs')();
  const { getCatalogProduct } = loader('src/lib/catalog-service.ts');
  const { getProductPath } = loader('src/lib/catalog/routes.ts');
  const counts = { images: images.length, captions: images.filter(row => row.caption).length, classified: images.filter(row => row.kind).length };
  for (const [field, value] of Object.entries(EXPECTED_COUNTS)) if (counts[field] !== value) issues.push(`Expected ${value} phase-2/3 ${field}; found ${counts[field]}.`);
  if (new Set(images.map(row => row.sku)).size !== counts.images) issues.push('Public phase-2/3 provenance contains duplicate SKUs across batches.');
  const entries = images.map(record => {
    const product = getCatalogProduct(record.sku);
    const entryIssues = compareSourceImage(record, product);
    if (product?.img && /^products\/official\/[\w.-]+\.(webp|avif|png|jpe?g)$/i.test(product.img) && !fs.existsSync(path.join(repository, 'public', product.img))) entryIssues.push(`${record.sku}: local approved image file is missing.`);
    issues.push(...entryIssues);
    return { sku: record.sku, product, route: product && getProductPath(product), issues: entryIssues };
  });
  const bySku = new Map(entries.map(entry => [entry.sku, entry]));
  const fixtures = FIXTURES.map(fixture => {
    const record = images.find(row => row.sku === fixture.sku);
    if (!record || record.kind !== fixture.kind || record.caption !== fixture.caption) issues.push(`${fixture.sku}: the representative fixture's exact approved kind/caption changed or disappeared.`);
    if (fixture.zeroStock && bySku.get(fixture.sku)?.product?.stock !== 0) issues.push(`${fixture.sku}: required zero-stock fixture is no longer zero stock.`);
    return { ...fixture, ...bySku.get(fixture.sku) };
  });
  return { documents, counts, entries, fixtures, issues, passed: issues.length === 0 };
}

// Serialized into Chrome. Inspect actual text ranges, ancestor clipping, and hit visibility,
// rather than treating DOM text, a tooltip, alt text, or a line-clamped paragraph as visible proof.
function readMediaState(selector) {
  const scope = document.querySelector(selector);
  const text = value => (value || '').replace(/\s+/g, ' ').trim();
  const rect = box => ({ left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height });
  const captions = [...(scope?.querySelectorAll('[data-product-media-caption]') || [])];
  const details = captions.map(caption => {
    const box = caption.getBoundingClientRect();
    const style = getComputedStyle(caption);
    const range = document.createRange();
    range.selectNodeContents(caption);
    const lines = [...range.getClientRects()].filter(line => line.width > 0 && line.height > 0).map(rect);
    const clipping = [], clamps = [], hidden = [];
    let opacity = 1;
    for (let ancestor = caption; ancestor; ancestor = ancestor.parentElement) {
      const css = getComputedStyle(ancestor), bounds = ancestor.getBoundingClientRect();
      opacity *= Number(css.opacity);
      const name = ancestor === caption ? 'caption' : ancestor.tagName.toLowerCase() + (ancestor.className ? '.' + String(ancestor.className).trim().replace(/\s+/g, '.') : '');
      if (css.display === 'none' || css.visibility !== 'visible' || css.contentVisibility === 'hidden') hidden.push(name);
      if (parseFloat(css.getPropertyValue('-webkit-line-clamp')) > 0 || parseFloat(css.getPropertyValue('line-clamp')) > 0) clamps.push(name);
      const edges = { left: bounds.left + ancestor.clientLeft, top: bounds.top + ancestor.clientTop, right: bounds.left + ancestor.clientLeft + ancestor.clientWidth, bottom: bounds.top + ancestor.clientTop + ancestor.clientHeight };
      // The root viewport is checked separately. Overflow clipping is illegal only when it cuts text.
      if (ancestor === document.documentElement || ancestor === document.body) continue;
      const clipsX = /^(hidden|clip|auto|scroll)$/.test(css.overflowX), clipsY = /^(hidden|clip|auto|scroll)$/.test(css.overflowY);
      if (lines.some(line => (clipsX && (line.left < edges.left - 1 || line.right > edges.right + 1)) || (clipsY && (line.top < edges.top - 1 || line.bottom > edges.bottom + 1)))) clipping.push({ ancestor: name, overflowX: css.overflowX, overflowY: css.overflowY, edges });
    }
    const lineVisibility = lines.map(line => {
      const inViewport = line.left >= -1 && line.right <= innerWidth + 1 && line.top >= -1 && line.bottom <= innerHeight + 1;
      const hits = [0.1, 0.5, 0.9].map(fraction => {
        const hit = document.elementFromPoint(line.left + line.width * fraction, line.top + line.height / 2);
        return !!hit && (hit === caption || caption.contains(hit));
      });
      return { ...line, inViewport, unobscured: hits.every(Boolean) };
    });
    return { text: text(caption.textContent), renderedText: text(caption.innerText), rect: rect(box), opacity, hidden, clamps, clipping, lines: lineVisibility,
      textOverflow: style.textOverflow, scrollWidth: caption.scrollWidth, clientWidth: caption.clientWidth, scrollHeight: caption.scrollHeight, clientHeight: caption.clientHeight };
  });
  const images = [...(scope?.querySelectorAll('img.product-media-photo') || [])].filter(img => {
    const box = img.getBoundingClientRect(), style = getComputedStyle(img);
    return box.width > 0 && box.height > 0 && style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) > .99 && img.getAttribute('aria-hidden') !== 'true';
  }).map(img => {
    const url = new URL(img.currentSrc || img.src, location.href);
    const source = url.pathname === '/_next/image' ? url.searchParams.get('url') : url.pathname;
    const box = img.getBoundingClientRect();
    const visible = { left: Math.max(0, box.left), top: Math.max(0, box.top), right: Math.min(innerWidth, box.right), bottom: Math.min(innerHeight, box.bottom) };
    let opacity = 1, hidden = false;
    for (let ancestor = img; ancestor; ancestor = ancestor.parentElement) {
      const css = getComputedStyle(ancestor), bounds = ancestor.getBoundingClientRect();
      opacity *= Number(css.opacity);
      hidden ||= css.display === 'none' || css.visibility !== 'visible' || css.contentVisibility === 'hidden';
      if (ancestor !== img && /^(hidden|clip|auto|scroll)$/.test(css.overflowX)) { visible.left = Math.max(visible.left, bounds.left); visible.right = Math.min(visible.right, bounds.right); }
      if (ancestor !== img && /^(hidden|clip|auto|scroll)$/.test(css.overflowY)) { visible.top = Math.max(visible.top, bounds.top); visible.bottom = Math.min(visible.bottom, bounds.bottom); }
    }
    const hit = document.elementFromPoint((visible.left + visible.right) / 2, (visible.top + visible.bottom) / 2);
    const visiblyRendered = !hidden && opacity >= .99 && visible.right - visible.left >= 24 && visible.bottom - visible.top >= 24 && hit === img;
    return { src: img.currentSrc || img.src, source, alt: img.alt, complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, rect: rect(box), visiblyRendered };
  });
  return { url: location.href, scopeFound: !!scope, theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    viewport: { width: innerWidth, height: innerHeight }, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth,
    scopeWidth: scope?.clientWidth, scopeScrollWidth: scope?.scrollWidth, captions: details, images,
    errorOverlay: !!document.querySelector('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay'),
  };
}

function compareMediaState(state, fixture, theme) {
  const issues = [];
  if (!state.scopeFound) issues.push('The expected product surface is missing.');
  if (state.theme !== theme) issues.push('The requested color theme was not applied.');
  if (state.documentWidth > state.viewport.width + 1 || state.bodyWidth > state.viewport.width + 1 || state.scopeScrollWidth > state.scopeWidth + 1) issues.push('Horizontal overflow is present.');
  if (state.errorOverlay) issues.push('A framework error overlay is visible.');
  if (state.captions.length !== 1) issues.push(`Expected one visible source caption; found ${state.captions.length}.`);
  const caption = state.captions[0];
  if (caption) {
    if (caption.text !== fixture.caption || caption.renderedText !== fixture.caption) issues.push('The exact approved caption is missing or differs from the rendered text.');
    if (caption.rect.width <= 0 || caption.rect.height <= 0 || caption.opacity < .99 || caption.hidden.length) issues.push('The caption is hidden or transparent.');
    if (caption.clamps.length || caption.textOverflow === 'ellipsis') issues.push('The caption is line-clamped or ellipsized.');
    if (caption.clipping.length || caption.scrollHeight > caption.clientHeight + 1 || caption.scrollWidth > caption.clientWidth + 1) issues.push('The caption text is clipped by its own box or an ancestor.');
    if (!caption.lines.length || caption.lines.some(line => !line.inViewport || !line.unobscured)) issues.push('Not every caption line is visibly readable in the screenshot viewport.');
    if (fixture.criticalText && !caption.renderedText.includes(fixture.criticalText)) issues.push(`Critical exclusion is not visible: ${fixture.criticalText}.`);
  }
  const expectedSrc = '/' + fixture.product.img.replace(/^\//, '');
  const image = state.images.find(candidate => candidate.source === expectedSrc);
  if (state.images.length !== 1 || !image) issues.push('The visible product image differs from the approved primary asset.');
  if (image && !image.visiblyRendered) issues.push('The approved image is hidden, clipped away or covered in the evidence viewport.');
  if (image && (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0)) issues.push('The approved image did not load with real intrinsic dimensions.');
  const expectedAlt = fixture.product.gallery.find(item => item.src === expectedSrc)?.alt;
  if (image && image.alt !== expectedAlt) issues.push('The displayed image lost its approved alternative text.');
  return issues;
}

// A zero-stock reference remains discoverable and can be quoted without claiming availability.
function readAvailabilityState(selector) {
  const scope = document.querySelector(selector);
  const text = node => (node?.textContent || '').replace(/\s+/g, ' ').trim();
  const stock = [...(scope?.querySelectorAll('p, span') || [])].find(node => text(node) === 'Consultar disponibilidad');
  const box = stock?.getBoundingClientRect();
  let visible = !!box && box.width > 0 && box.height > 0 && box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth;
  for (let node = stock; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    visible &&= style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) >= .99;
  }
  const hit = box && document.elementFromPoint((box.left + box.right) / 2, (box.top + box.bottom) / 2);
  visible &&= !!hit && (hit === stock || stock.contains(hit));
  const actions = [...(scope?.querySelectorAll('button[aria-label]') || [])].filter(button => {
    const name = button.getAttribute('aria-label') || '', rect = button.getBoundingClientRect();
    return /^(Agregar a cotización|Consultar disponibilidad|En cotización)/.test(name) && rect.width > 0 && rect.height > 0 && getComputedStyle(button).visibility === 'visible';
  }).map(button => ({ label: button.getAttribute('aria-label'), disabled: button.disabled || button.getAttribute('aria-disabled') === 'true' }));
  return { stockLabel: text(stock), stockVisible: visible, actions };
}

function compareAvailabilityState(state) {
  const issues = [];
  if (state.stockLabel !== 'Consultar disponibilidad' || !state.stockVisible) issues.push('The zero-stock availability label is not visibly readable.');
  if (!state.actions.length || state.actions.some(action => action.disabled || !action.label.includes('disponibilidad a confirmar'))) issues.push('A zero-stock item cannot be quoted with its availability caveat.');
  return issues;
}

async function auditApi(baseUrl, source) {
  const results = [];
  let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < source.entries.length) {
      const entry = source.entries[cursor++];
      const result = { sku: entry.sku, issues: [] };
      try {
        if (!entry.product) throw new Error('Canonical product is missing.');
        const response = await fetch(`${baseUrl}/api/catalogo?${new URLSearchParams({ q: entry.sku })}`, { signal: AbortSignal.timeout(20000) });
        result.status = response.status;
        if (!response.ok) throw new Error(`Public API returned HTTP ${response.status}.`);
        const data = await response.json();
        const matches = data.products?.filter(product => product.id === entry.sku) || [];
        if (matches.length !== 1) throw new Error(`Expected exactly one matching SKU; found ${matches.length}.`);
        result.issues = compareApiProduct(entry.product, matches[0]);
        result.media = { img: matches[0].img, gallery: matches[0].gallery };
      } catch (error) { result.issues.push(error.message); }
      result.passed = result.issues.length === 0;
      results.push(result);
    }
  }));
  results.sort((a, b) => a.sku.localeCompare(b.sku));
  return { expected: EXPECTED_COUNTS.images, checked: results.length, passed: results.length === EXPECTED_COUNTS.images && results.every(result => result.passed), results };
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().filter(animation => animation.playState === 'running' && animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  fs.mkdirSync(options.output, { recursive: true });
  const report = { utc: new Date().toISOString(), baseUrl: options.baseUrl, widths: options.widths, themes: options.themes,
    expectedCases: FIXTURES.length * SURFACES.length * options.widths.length * options.themes.length, expectedZeroStockAdds: FIXTURES.filter(item => item.zeroStock).length * options.widths.length * options.themes.length, zeroStockAdds: [], results: [], errors: [], forbiddenRequests: [], runtimeErrors: [], httpErrors: [] };
  const writeJson = (file, value) => fs.writeFileSync(path.join(options.output, file), JSON.stringify(value, null, 2) + '\n');
  const persist = () => writeJson('summary.json', report);
  let browser, profile;
  try {
    const source = loadSource();
    report.source = { documents: source.documents, counts: source.counts, passed: source.passed, issues: source.issues };
    writeJson('source-dto.json', { ...report.source, images: source.entries.map(entry => ({ sku: entry.sku, route: entry.route, img: entry.product?.img, gallery: entry.product?.gallery, issues: entry.issues })) });
    try {
      report.commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim();
      report.dirty = !!execFileSync('git', ['status', '--porcelain'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim();
      const buildFile = path.join(__dirname, '..', '.next', 'BUILD_ID');
      if (fs.existsSync(buildFile)) report.localBuildId = fs.readFileSync(buildFile, 'utf8').trim();
    } catch {}
    const api = await auditApi(options.baseUrl, source);
    report.api = { expected: api.expected, checked: api.checked, passed: api.passed, failures: api.results.filter(result => !result.passed) };
    writeJson('api-gallery.json', api);
    console.log(`${source.passed && api.passed ? 'PASS' : 'FAIL'} phase-2/3 source / API: ${source.counts.images} images, ${source.counts.captions} captions, ${api.checked} API products`);
    persist();
    const puppeteerModule = await import(pathToFileURL(require.resolve('puppeteer-core')).href);
    const puppeteer = puppeteerModule.default || puppeteerModule;
    const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
    profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ferre-product-media-'));
    browser = await puppeteer.launch({ executablePath: options.chromePath, userDataDir: profile, headless: true,
      args: ['--no-first-run', '--no-default-browser-check'] });
    report.browser = await browser.version();
    for (const width of options.widths) for (const theme of options.themes) for (const fixture of source.fixtures) {
      const prefix = `${fixture.label}-${fixture.sku}-${width}-${theme}`;
      const context = await browser.createBrowserContext();
      let page;
      const pageErrors = [], httpErrors = [];
      async function auditSurface(surface, selector) {
        const key = `${prefix}-${surface}`;
        try {
          await page.waitForSelector(`${selector} [data-product-media-caption]`, { timeout: 15000, visible: true });
          await settle(page); // Let dialog focus restoration finish before positioning the evidence.
          await page.$eval(`${selector} [data-product-media-caption]`, node => node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
          await settle(page);
          await page.waitForFunction(scopeSelector => [...document.querySelectorAll(`${scopeSelector} img.product-media-photo`)].some(img => img.complete && img.naturalWidth > 0), { timeout: 15000 }, selector).catch(() => {});
          const state = await page.evaluate(readMediaState, selector);
          const issues = compareMediaState(state, fixture, theme);
          await page.addScriptTag({ content: axeSource });
          const axe = await page.evaluate(async () => window.axe.run(document, { resultTypes: ['violations', 'incomplete', 'passes', 'inapplicable'] }));
          if (axe.violations.length) issues.push(`${axe.violations.length} axe accessibility violations.`);
          if (pageErrors.length) issues.push('Browser runtime or console errors occurred.');
          if (httpErrors.length) issues.push('An HTTP resource failed.');
          const result = { key, surface, sku: fixture.sku, kind: fixture.kind, expectedCaption: fixture.caption, criticalText: fixture.criticalText,
            state, issues, runtimeErrors: [...pageErrors], httpErrors: [...httpErrors], axe: { violations: axe.violations.map(rule => ({ id: rule.id, impact: rule.impact, nodes: rule.nodes.map(node => ({ target: node.target, html: node.html, failureSummary: node.failureSummary })) })), incomplete: axe.incomplete.map(rule => ({ id: rule.id, nodes: rule.nodes.length })) },
            passed: issues.length === 0, evidence: [`${key}.json`, `${key}.axe.json`, `${key}.png`] };
          await page.screenshot({ path: path.join(options.output, `${key}.png`), fullPage: false });
          if (fixture.zeroStock) {
            const availabilityScope = surface === 'product-detail' ? '.product-detail-information' : selector;
            await page.evaluate(scopeSelector => {
              const stock = [...(document.querySelector(scopeSelector)?.querySelectorAll('p, span') || [])].find(node => (node.textContent || '').trim() === 'Consultar disponibilidad');
              stock?.scrollIntoView({ block: 'center', behavior: 'instant' });
            }, availabilityScope);
            await settle(page);
            result.availability = await page.evaluate(readAvailabilityState, availabilityScope);
            issues.push(...compareAvailabilityState(result.availability));
            result.passed = issues.length === 0;
            await page.screenshot({ path: path.join(options.output, `${key}.stock.png`), fullPage: false });
            result.evidence.push(`${key}.stock.png`);
          }
          writeJson(`${key}.axe.json`, axe);
          writeJson(`${key}.json`, result);
          report.results.push(result);
          console.log(`${result.passed ? 'PASS' : 'FAIL'} ${key}${issues.length ? ': ' + issues.join(' ') : ''}`);
        } catch (error) {
          const entry = { key, message: error.message };
          report.errors.push(entry);
          writeJson(`${key}.error.json`, entry);
          if (page && !page.isClosed()) await page.screenshot({ path: path.join(options.output, `${key}.error.png`), fullPage: false }).catch(() => {});
          console.error(`FAIL ${key}: ${error.message}`);
        }
        persist();
      }
      try {
        if (!fixture.product || !fixture.route) throw new Error('Representative product is missing from the canonical source.');
        page = await context.newPage();
        page.setDefaultTimeout(20000);
        page.on('pageerror', error => pageErrors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') pageErrors.push(message.text()); });
        page.on('response', response => { if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status() }); });
        await page.setRequestInterception(true);
        page.on('request', request => {
          const url = new URL(request.url());
          if (/(^|\.)(wa\.me|whatsapp\.com)$/.test(url.hostname)) { report.forbiddenRequests.push(request.url()); void request.abort(); }
          else void request.continue();
        });
        await page.setViewport({ width, height: width < 768 ? 844 : 900, deviceScaleFactor: 1, isMobile: width < 768, hasTouch: width < 768 });
        await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
        await page.evaluateOnNewDocument(value => localStorage.setItem('theme', value), theme);
        const cardSelector = `section[aria-label="Productos del catálogo"] [data-sku="${fixture.sku}"]`;
        const catalogUrl = `${options.baseUrl}/catalogo?${new URLSearchParams({ q: fixture.sku })}`;
        await page.goto(catalogUrl, { waitUntil: 'networkidle0', timeout: 45000 });
        if (new URL(page.url()).origin !== options.baseUrl) throw new Error('Unexpected origin redirect.');
        await page.waitForFunction(() => document.querySelector('section[aria-label="Productos del catálogo"]')?.getAttribute('aria-busy') !== 'true');
        await page.waitForFunction(value => document.documentElement.classList.contains('dark') === (value === 'dark'), {}, theme);
        await auditSurface('catalog-card', cardSelector);
        try {
          const link = await page.$(`${cardSelector} h3 a`);
          if (!link) throw new Error('Catalog quick-view link is missing.');
          await link.scrollIntoView();
          if (width < 768) await link.tap();
          else await link.click();
          await link.dispose();
          await page.waitForSelector('[role="dialog"][aria-labelledby="product-modal-title"]', { visible: true });
          if (page.url() !== catalogUrl) throw new Error('Quick view unexpectedly navigated away from the catalog.');
          await auditSurface('quick-view', '[role="dialog"][aria-labelledby="product-modal-title"]');
          await page.keyboard.press('Escape');
          await page.waitForFunction(() => document.querySelectorAll('[role="dialog"]').length === 0);
          const dismissal = await page.evaluate(() => ({ url: location.href, bodyOverflowY: getComputedStyle(document.body).overflowY, htmlOverflowY: getComputedStyle(document.documentElement).overflowY }));
          if (dismissal.url !== catalogUrl || [dismissal.bodyOverflowY, dismissal.htmlOverflowY].some(value => ['hidden', 'clip'].includes(value))) throw new Error('Dismissed quick view did not restore the catalog route and scrolling.');
          writeJson(`${prefix}-quick-view-dismissal.json`, { passed: true, ...dismissal });
        } catch (error) {
          const entry = { key: `${prefix}-quick-view-flow`, message: error.message };
          report.errors.push(entry);
          writeJson(`${entry.key}.error.json`, entry);
          await page.screenshot({ path: path.join(options.output, `${entry.key}.error.png`), fullPage: false }).catch(() => {});
        }
        await page.goto(options.baseUrl + fixture.route, { waitUntil: 'networkidle0', timeout: 45000 });
        if (new URL(page.url()).origin !== options.baseUrl || new URL(page.url()).pathname !== fixture.route) throw new Error('Product detail did not use its canonical route.');
        await auditSurface('product-detail', '.product-detail-media');
        if (fixture.zeroStock) {
          let add;
          for (const button of await page.$$('.product-detail-information button[aria-label^="Consultar disponibilidad:"]')) {
            if (await button.isVisible()) { add = button; break; }
          }
          if (!add) throw new Error('Missing enabled zero-stock quote action.');
          await add.scrollIntoView();
          if (width < 768) await add.tap(); else await add.click();
          await add.dispose();
          await page.waitForFunction(sku => {
            const item = JSON.parse(localStorage.getItem('fp_cart') || '[]').find(row => row.id === sku);
            return item?.qty === 1 && item.stock === 0 && [...document.querySelectorAll('.product-detail-information button')].some(button => button.getAttribute('aria-label')?.startsWith('En cotización'));
          }, {}, fixture.sku);
          const item = await page.evaluate(sku => {
            const product = JSON.parse(localStorage.getItem('fp_cart') || '[]').find(row => row.id === sku);
            return { sku: product.id, qty: product.qty, stock: product.stock };
          }, fixture.sku);
          const evidence = `${prefix}-zero-stock-added.png`;
          await settle(page);
          await page.screenshot({ path: path.join(options.output, evidence), fullPage: false });
          const result = { key: prefix, passed: item.sku === fixture.sku && item.qty === 1 && item.stock === 0, ...item, evidence };
          report.zeroStockAdds.push(result);
          writeJson(`${prefix}-zero-stock-added.json`, result);
        }
      } catch (error) {
        report.errors.push({ key: prefix, message: error.message });
        console.error(`FAIL ${prefix}: ${error.message}`);
      } finally {
        report.runtimeErrors.push(...pageErrors.map(message => ({ key: prefix, message })));
        report.httpErrors.push(...httpErrors.map(error => ({ key: prefix, ...error })));
        await context.close();
        persist();
      }
    }
  } catch (error) {
    report.errors.push({ key: 'configuration-or-runtime', message: error.stack || error.message });
    console.error(error.stack);
  } finally {
    if (browser) await browser.close();
    if (profile && path.resolve(profile).startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(profile).startsWith('ferre-product-media-')) fs.rmSync(profile, { recursive: true, force: true });
    report.passed = report.source?.passed === true && report.api?.passed === true && report.results.length === report.expectedCases
      && report.results.every(result => result.passed) && report.zeroStockAdds.length === report.expectedZeroStockAdds && report.zeroStockAdds.every(result => result.passed) && !report.errors.length && !report.runtimeErrors.length && !report.httpErrors.length && !report.forbiddenRequests.length;
    persist();
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const quoteEvidence = report.zeroStockAdds.map(result => `<li>${escape(result.key)}: ${result.passed ? 'PASS' : 'FAIL'} · <a href="${escape(result.evidence)}">captura</a> · <a href="${escape(result.key)}-zero-stock-added.json">resultado</a></li>`).join('');
    const rows = report.results.map(result => `<tr><td>${escape(result.key)}</td><td>${result.passed ? 'PASS' : 'FAIL'}</td><td>${escape(result.expectedCaption)}</td><td>${result.evidence.map(file => `<a href="${escape(file)}">${escape(file.split('.').slice(-2).join('.'))}</a>`).join(' · ')}</td></tr>`).join('');
    fs.writeFileSync(path.join(options.output, 'index.html'), `<!doctype html><html lang="es"><meta charset="utf-8"><title>Auditoría de imágenes, fases 2 y 3</title><style>body{font:16px system-ui;max-width:1400px;margin:32px auto;padding:0 16px}table{border-collapse:collapse;width:100%}td,th{padding:8px;border:1px solid #bbb;text-align:left;overflow-wrap:anywhere}</style><h1>Auditoría de imágenes, fases 2 y 3: ${report.passed ? 'PASS' : 'FAIL'}</h1><p>Commit ${escape(report.commit)}. ${report.results.length}/${report.expectedCases} estados. Evidencia de laboratorio; no se envía WhatsApp. Los resultados incompletos de axe requieren revisión humana.</p><p><a href="source-dto.json">Fuente pública y DTO</a> · <a href="api-gallery.json">264 productos de API</a> · <a href="summary.json">Resumen completo</a></p><table><thead><tr><th>Estado</th><th>Resultado</th><th>Leyenda exacta</th><th>Evidencia</th></tr></thead><tbody>${rows}</tbody></table><h2>Cotización sin existencias: ${report.zeroStockAdds.length}/${report.expectedZeroStockAdds}</h2><ul>${quoteEvidence}</ul><pre>${escape(JSON.stringify(report.errors, null, 2))}</pre></html>`);
  }
  process.exitCode = report.passed ? 0 : report.errors.length ? 2 : 1;
}

if (require.main === module) main().catch(error => { console.error(error.stack); process.exitCode = 2; });
module.exports = { PROVENANCE_SOURCES, EXPECTED_COUNTS, FIXTURES, SURFACES, parseArgs, compareSourceImage, compareApiProduct, loadSource, readMediaState, compareMediaState, readAvailabilityState, compareAvailabilityState, auditApi };

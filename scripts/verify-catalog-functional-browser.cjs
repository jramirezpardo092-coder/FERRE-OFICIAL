#!/usr/bin/env node
/* Isolated functional browser audit; it never connects to a user's browser or clicks WhatsApp. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');

const REQUIRED_CASES = ['ssr-gross', 'ssr-shared-net', 'ssr-category-page2-net', 'clean-gross', 'toggle-net', 'toggle-gross',
  'back-net', 'back-clean-gross', 'forward-net', 'forward-gross', 'range-net', 'range-retained-gross',
  'range-followed-availability', 'range-followed-brand', 'saved-net-on-clean-first-visit', 'back-clean-overrides-saved-net',
  'shared-net-overrides-saved-gross', 'modal-closed-range-net', 'suggestion-mob-display', 'suggestion-stable-product-route'];

function parseArgs(args) {
  const options = { baseUrl: 'http://localhost:3010', output: null, chromePath: process.env.CHROME_PATH };
  const flags = { '--base-url': 'baseUrl', '--output': 'output', '--chrome-path': 'chromePath' };
  for (let index = 0; index < args.length; index += 2) {
    if (!flags[args[index]] || !args[index + 1] || args[index + 1].startsWith('--')) throw new Error(`Invalid argument: ${args[index]}`);
    options[flags[args[index]]] = args[index + 1];
  }
  const base = new URL(options.baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('An HTTP base URL without credentials is required.');
  if (!options.output || !options.chromePath) throw new Error('Use --output <private reports directory> and --chrome-path <browser executable> (or CHROME_PATH).');
  return { ...options, baseUrl: base.origin, output: path.resolve(options.output) };
}

const tidy = (text) => String(text || '').replace(/\s+/g, ' ').trim();
function parseCOP(text) {
  const amount = String(text).match(/\$\s*([\d.]+)(?:,\d+)?/);
  return amount ? Number(amount[1].replace(/\./g, '')) : null;
}

function expectedDisplay(product, mode) {
  if (product.priceVerified !== true || !Number.isFinite(product.precio) || product.precio <= 0) return { amount: null, pending: true };
  const taxKnown = [0, 5, 19].includes(product.taxRate);
  const net = mode === 'net' || !taxKnown;
  return { amount: Math.round(net ? product.precio : product.precio * (1 + product.taxRate / 100)), tax: net ? 'sin IVA' : 'IVA incluido', taxPending: !taxKnown };
}

function compareCatalogState(state, response, mode, sourceById) {
  const issues = [];
  if (!state.sectionFound || state.busy) issues.push('The catalog is missing or still busy.');
  const expectedIds = response.products.map(product => product.id);
  if (JSON.stringify(state.cards.map(card => card.sku)) !== JSON.stringify(expectedIds)) issues.push('Rendered SKU order/count differs from the public API page.');
  if (new Set(state.cards.map(card => card.sku)).size !== state.cards.length) issues.push('A rendered SKU is duplicated.');
  if (state.mode !== mode || response.priceMode !== mode) issues.push('Price selector, URL and API mode disagree.');
  if (!new RegExp(mode === 'net' ? 'sin IVA|antes de IVA' : 'con IVA', 'i').test(state.priceLegend)) issues.push('The range label does not describe its active price mode.');
  const expectedBounds = response.priceBounds ? [response.priceBounds.min, response.priceBounds.max] : [];
  if (JSON.stringify(state.bounds) !== JSON.stringify(expectedBounds)) issues.push('Visible price bounds differ from mode-aware API bounds.');
  for (const product of response.products) {
    const card = state.cards.find(item => item.sku === product.id);
    if (!card) continue;
    const expected = expectedDisplay(product, mode);
    if (expected.pending) {
      if (!/Precio por confirmar/i.test(card.price)) issues.push(`${product.id}: pending price is presented as a confirmed amount.`);
    } else {
      if (parseCOP(card.price) !== expected.amount || !card.price.includes(expected.tax)) issues.push(`${product.id}: principal amount or tax label differs from the displayed mode.`);
      if (expected.taxPending && !/Impuesto por confirmar/i.test(card.text)) issues.push(`${product.id}: unknown tax is not identified.`);
    }
    const source = sourceById?.get(product.id);
    if (source && ['precio', 'stock', 'priceVerified', 'taxRate', 'unidad', 'ref'].some(field => product[field] !== source[field])) issues.push(`${product.id}: API changes a published source value.`);
  }
  return issues;
}

// Serialized into the browser, so helpers deliberately remain inside this function.
function readCatalogState() {
  const text = node => (node?.textContent || '').replace(/\s+/g, ' ').trim();
  const section = document.querySelector('section[aria-label="Productos del catálogo"]');
  const cards = [...(section?.querySelectorAll('article') || [])].map(card => {
    const code = [...card.querySelectorAll('span')].map(text).find(value => /^SKU\s+[\w-]+$/.test(value));
    const sku = card.getAttribute('data-sku') || code?.match(/^SKU\s+([\w-]+)$/)?.[1] || null;
    const price = card.querySelector('[data-design-price]') || [...card.querySelectorAll('p')].find(node => /^\$|^Precio por confirmar/.test(text(node)));
    return { sku, name: text(card.querySelector('h3')), href: card.querySelector('h3 a')?.getAttribute('href'), price: text(price), text: text(card) };
  });
  const filters = document.querySelector('aside input[name="priceMin"]')?.closest('fieldset');
  const boundsText = [...(filters?.querySelectorAll('p') || [])].map(text).find(value => /^Desde\s+\$/.test(value)) || '';
  const bounds = [...boundsText.matchAll(/\$\s*([\d.]+)(?:,\d+)?/g)].map(match => Number(match[1].replace(/\./g, '')));
  const priceInputs = [...document.querySelectorAll('input[id^="catalog-price-"]')];
  const checkbox = priceInputs.find(input => input.type === 'checkbox');
  const radio = priceInputs.find(input => input.type === 'radio' && input.checked);
  const selectedButton = [...document.querySelectorAll('button[aria-pressed="true"], [role="button"][aria-pressed="true"]')].find(node => /IVA/.test(text(node)));
  const mode = checkbox ? (checkbox.checked ? 'net' : 'gross') : radio?.value || (selectedButton ? /sin IVA/i.test(text(selectedButton)) ? 'net' : 'gross' : null);
  return { url: location.pathname + location.search, sectionFound: !!section, busy: section?.getAttribute('aria-busy') === 'true', cards, mode,
    priceLegend: text(filters?.querySelector('legend')), bounds,
    min: document.querySelector('aside input[name="priceMin"]')?.value,
    max: document.querySelector('aside input[name="priceMax"]')?.value,
    chips: text(document.querySelector('[aria-label="Filtros activos"]')),
    storage: localStorage.getItem('fp_price_mode'),
    errorOverlay: !!document.querySelector('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay'),
  };
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitReady(page) {
  await page.waitForFunction(() => {
    const section = document.querySelector('section[aria-label="Productos del catálogo"]');
    return section && section.getAttribute('aria-busy') !== 'true' && !/Buscando productos/.test(section.textContent);
  }, { timeout: 20000 });
  await sleep(120);
}
async function selectMode(page, mode, scopeSelector = '') {
  const handle = await page.evaluateHandle((requested, selector) => {
    const scope = selector ? document.querySelector(selector) : document;
    if (!scope) return null;
    const inputs = [...scope.querySelectorAll(selector ? 'input[type="checkbox"], input[type="radio"]' : 'input[id^="catalog-price-"]')];
    const checkbox = inputs.find(input => input.type === 'checkbox');
    if (checkbox) return checkbox.checked === (requested === 'net') ? null : checkbox.closest('label');
    const radio = inputs.find(input => input.type === 'radio' && input.value === requested);
    if (radio) return radio.checked ? null : radio.closest('label');
    return [...scope.querySelectorAll('button, [role="button"]')].find(node => new RegExp(requested === 'net' ? '^Sin IVA$|^Precios sin IVA' : '^Con IVA$|^Precios con IVA', 'i').test((node.textContent || node.getAttribute('aria-label') || '').trim()));
  }, mode, scopeSelector);
  const element = handle.asElement();
  if (element) { await element.scrollIntoView(); await element.click(); }
  await handle.dispose();
  await page.waitForFunction(requested => (new URLSearchParams(location.search).get('priceMode') || 'gross') === requested, { timeout: 20000 }, mode);
  await waitReady(page);
}
async function typeRange(page, name, value) {
  const input = await page.$(`aside input[name="${name}"]`);
  if (!input) throw new Error(`Missing visible range input: ${name}`);
  await input.scrollIntoView();
  await input.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.type(value, { delay: 20 });
  await input.dispose();
  const key = name === 'priceMin' ? 'min' : 'max';
  await page.waitForFunction((field, expected) => new URLSearchParams(location.search).get(field) === expected, { timeout: 20000 }, key, value);
  await waitReady(page);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const puppeteerModule = await import(pathToFileURL(require.resolve('puppeteer-core')).href);
  const puppeteer = puppeteerModule.default || puppeteerModule;
  fs.mkdirSync(options.output, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ferre-functional-'));
  const results = [], consoleErrors = [], requests = [], forbiddenRequests = [], httpErrors = [];
  const sourcePath = path.join(__dirname, '..', 'src/data/products.json');
  const sourceBytes = fs.readFileSync(sourcePath);
  const sourceById = new Map(JSON.parse(sourceBytes).map(product => [product.id, product]));
  const report = { baseUrl: options.baseUrl, utc: new Date().toISOString(), sourceHash: crypto.createHash('sha256').update(sourceBytes).digest('hex'),
    rangeDecision: 'The entered COP range is retained on mode changes and interpreted in the newly active mode; each product uses its own tax rate.', results, consoleErrors, forbiddenRequests, httpErrors };
  try { report.head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim(); } catch {}
  const buildFile = path.join(__dirname, '..', '.next', 'BUILD_ID');
  if (fs.existsSync(buildFile)) report.localBuildId = fs.readFileSync(buildFile, 'utf8').trim();
  let browser;
  async function api(relativeUrl) {
    const pageUrl = new URL(relativeUrl, options.baseUrl);
    const params = pageUrl.searchParams;
    if (pageUrl.pathname.startsWith('/catalogo/')) {
      const categories = [...sourceById.values()].map(product => product.cat);
      const slug = pageUrl.pathname.split('/')[2];
      const category = [...new Set(categories)].find(name => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === slug);
      if (!category) throw new Error(`Unrecognized category route: ${slug}`);
      params.set('cat', category);
    }
    const response = await fetch(options.baseUrl + '/api/catalogo?' + params, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Public API returned ${response.status}`);
    return response.json();
  }
  async function observe(name, page, { ssr = false, extra = [] } = {}) {
    const mode = new URL(page.url()).searchParams.get('priceMode') === 'net' ? 'net' : 'gross';
    const response = await api(page.url());
    if (!ssr) {
      await page.waitForFunction(expectedIds => {
        const section = document.querySelector('section[aria-label="Productos del catálogo"]');
        const actual = [...(section?.querySelectorAll('article') || [])].map(card => {
          const code = [...card.querySelectorAll('span')].map(node => (node.textContent || '').replace(/\s+/g, ' ').trim()).find(value => /^SKU\s+[\w-]+$/.test(value));
          return card.getAttribute('data-sku') || code?.match(/^SKU\s+([\w-]+)$/)?.[1] || null;
        });
        return section && section.getAttribute('aria-busy') !== 'true' && JSON.stringify(actual) === JSON.stringify(expectedIds);
      }, { timeout: 20000 }, response.products.map(product => product.id));
    }
    let state = await page.evaluate(readCatalogState);
    if (!ssr) {
      const deadline = Date.now() + 1500;
      while (Date.now() < deadline && (state.busy || state.mode !== mode || state.storage !== mode)) {
        await sleep(75);
        state = await page.evaluate(readCatalogState);
      }
    }
    const issues = [...compareCatalogState(state, response, mode, sourceById), ...extra];
    if (state.errorOverlay) issues.push('A framework error overlay is visible.');
    if (!ssr && state.storage !== mode) issues.push('Persisted price preference disagrees with the active URL.');
    const before = requests.length;
    if (!ssr) { await sleep(750); if (requests.length !== before) issues.push('The settled catalog keeps fetching without a user action.'); }
    const entry = { name, passed: issues.length === 0, issues, state, api: { total: response.total, page: response.page, priceMode: response.priceMode, priceBounds: response.priceBounds, ids: response.products.map(product => product.id) }, idleApiRequests: requests.length - before };
    results.push(entry);
    fs.writeFileSync(path.join(options.output, `${name}.json`), JSON.stringify(entry, null, 2));
    await page.screenshot({ path: path.join(options.output, `${name}.png`), fullPage: false });
    console.log(`${entry.passed ? 'PASS' : 'FAIL'} ${name}${issues.length ? ': ' + issues.join(' ') : ''}`);
    return entry;
  }
  async function pageIn(context) {
    const page = await context.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    page.on('pageerror', error => consoleErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) { const url = new URL(response.url()); httpErrors.push({ url: url.origin === options.baseUrl ? url.pathname + url.search : url.origin + url.pathname, status: response.status() }); } });
    page.on('request', request => { const url = new URL(request.url()); if (url.pathname === '/api/catalogo') requests.push(url.pathname + url.search); });
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (/^(?:https?:\/\/)?(?:wa\.me|(?:www\.)?api\.whatsapp\.com|(?:www\.)?web\.whatsapp\.com)\//i.test(request.url())) { forbiddenRequests.push(request.url()); void request.abort(); }
      else void request.continue();
    });
    return page;
  }
  try {
    browser = await puppeteer.launch({ executablePath: options.chromePath, userDataDir: profile, headless: true,
      args: ['--no-first-run', '--no-default-browser-check', ...(process.platform === 'linux' ? ['--no-sandbox', '--disable-dev-shm-usage'] : [])] });
    const defaultContext = browser.defaultBrowserContext();
    const ssrPage = await pageIn(defaultContext);
    await ssrPage.setJavaScriptEnabled(false);
    for (const [name, route] of [['ssr-gross', '/catalogo'], ['ssr-shared-net', '/catalogo?priceMode=net'], ['ssr-category-page2-net', '/catalogo/cerrajeria?page=2&priceMode=net']]) {
      await ssrPage.goto(options.baseUrl + route, { waitUntil: 'domcontentloaded' });
      const response = await api(route);
      await observe(name, ssrPage, { ssr: true, extra: response.products.length !== 24 ? ['The SSR fixture must contain 24 actual product cards.'] : [] });
    }
    await ssrPage.close();
    const page = await pageIn(defaultContext);
    await page.goto(options.baseUrl + '/catalogo', { waitUntil: 'domcontentloaded' });
    await waitReady(page);
    await observe('clean-gross', page);
    await selectMode(page, 'net'); await observe('toggle-net', page);
    await selectMode(page, 'gross'); await observe('toggle-gross', page);
    for (const [name, direction, mode] of [['back-net', 'back', 'net'], ['back-clean-gross', 'back', 'gross'], ['forward-net', 'forward', 'net'], ['forward-gross', 'forward', 'gross']]) {
      await page[direction === 'back' ? 'goBack' : 'goForward']({ waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForFunction(expected => (new URLSearchParams(location.search).get('priceMode') || 'gross') === expected, { timeout: 20000 }, mode);
      await waitReady(page); await observe(name, page);
    }
    await selectMode(page, 'net');
    await typeRange(page, 'priceMin', '1000'); await typeRange(page, 'priceMax', '25000');
    await observe('range-net', page);
    await selectMode(page, 'gross');
    await observe('range-retained-gross', page, { extra: await page.evaluate(() => {
      const params = new URLSearchParams(location.search);
      return params.get('min') === '1000' && params.get('max') === '25000' ? [] : ['Mode change incorrectly transforms or removes the entered COP range.'];
    }) });
    const availability = await page.$('aside input[type="radio"][value="on-request"]');
    if (!availability) throw new Error('Availability control is missing.');
    const label = await availability.evaluateHandle(node => node.closest('label'));
    await label.asElement().scrollIntoView(); await label.asElement().click(); await label.dispose(); await availability.dispose();
    await page.waitForFunction(() => new URLSearchParams(location.search).get('availability') === 'on-request', { timeout: 20000 });
    await waitReady(page); await observe('range-followed-availability', page);
    const selected = await api(page.url());
    const brand = selected.brands.find(item => item.count > 0);
    if (!brand) throw new Error('The range/availability fixture has no brand to exercise.');
    await page.select('aside select[name="brand"]', brand.name);
    await page.waitForFunction(expected => new URLSearchParams(location.search).get('brand') === expected, { timeout: 20000 }, brand.name);
    await waitReady(page); await observe('range-followed-brand', page);
    await page.close();

    const storedContext = await browser.createBrowserContext();
    const stored = await pageIn(storedContext);
    const storedSeed = await stored.evaluateOnNewDocument(() => localStorage.setItem('fp_price_mode', 'net'));
    await stored.goto(options.baseUrl + '/catalogo', { waitUntil: 'domcontentloaded' });
    await stored.removeScriptToEvaluateOnNewDocument(storedSeed.identifier);
    await stored.waitForFunction(() => new URLSearchParams(location.search).get('priceMode') === 'net', { timeout: 20000 });
    await waitReady(stored); await observe('saved-net-on-clean-first-visit', stored);
    await stored.goBack({ waitUntil: 'domcontentloaded', timeout: 20000 });
    await stored.waitForFunction(() => location.pathname === '/catalogo' && !location.search, { timeout: 20000 });
    await waitReady(stored); await observe('back-clean-overrides-saved-net', stored);
    await storedContext.close();

    const sharedContext = await browser.createBrowserContext();
    const shared = await pageIn(sharedContext);
    const sharedSeed = await shared.evaluateOnNewDocument(() => localStorage.setItem('fp_price_mode', 'gross'));
    const exact = sourceById.get('0435');
    if (!exact?.priceVerified) throw new Error('Expected confirmed product0435 is unavailable in the fixture.');
    const netPrice = Math.round(exact.precio);
    await shared.goto(options.baseUrl + `/catalogo?priceMode=net&q=0435&min=${netPrice}&max=${netPrice}`, { waitUntil: 'domcontentloaded' });
    await shared.removeScriptToEvaluateOnNewDocument(sharedSeed.identifier);
    await waitReady(shared); await observe('shared-net-overrides-saved-gross', shared);
    const detailsLink = await shared.$('section[aria-label="Productos del catálogo"] article h3 a');
    await detailsLink.scrollIntoView(); await detailsLink.click(); await detailsLink.dispose();
    await shared.waitForSelector('[role="dialog"]', { timeout: 20000 });
    const modalControls = await shared.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return { present: !!dialog?.querySelector('input[type="checkbox"], input[type="radio"], button[aria-pressed]'), pr9: !!document.querySelector('[data-design-card]') };
    });
    if (modalControls.present) {
      for (const mode of ['gross', 'net']) {
        await selectMode(shared, mode, '[role="dialog"]');
        const modal = await shared.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]');
          const text = node => (node?.textContent || '').replace(/\s+/g, ' ').trim();
          const price = dialog?.querySelector('[data-design-price]') || [...(dialog?.querySelectorAll('p') || [])].find(node => /^\$/.test(text(node)));
          const params = new URLSearchParams(location.search);
          return { price: text(price), min: params.get('min'), max: params.get('max') };
        });
        const expected = expectedDisplay(exact, mode);
        const issues = parseCOP(modal.price) !== expected.amount || !modal.price.includes(expected.tax) ? ['Modal price does not follow its selector and catalog URL.'] : [];
        if (modal.min !== String(netPrice) || modal.max !== String(netPrice)) issues.push('The modal selector transforms the retained COP range.');
        await observe(`modal-toggle-${mode}`, shared, { extra: issues });
      }
    } else {
      results.push({ name: 'modal-price-mode', applicability: modalControls.pr9 ? 'required' : 'not-applicable', passed: !modalControls.pr9,
        issues: modalControls.pr9 ? ['PR9 modal price selector is missing.'] : [], note: 'PR8 has no price selector in the product modal. After PR9 integration, its selector is required and tested.' });
      console.log(`${modalControls.pr9 ? 'FAIL' : 'N/A'} modal-price-mode (PR8 has no selector)`);
    }
    await shared.click('[role="dialog"] button[aria-label*="Cerrar"]');
    await shared.waitForSelector('[role="dialog"]', { hidden: true, timeout: 20000 });
    await observe('modal-closed-range-net', shared);
    await shared.goto(options.baseUrl + '/catalogo', { waitUntil: 'domcontentloaded' });
    await waitReady(shared);
    const search = await shared.$('input[role="combobox"][name="q"]');
    await search.click(); await shared.keyboard.type('0435', { delay: 35 }); await search.dispose();
    await shared.waitForFunction(() => new URLSearchParams(location.search).get('q') === '0435' && !!document.querySelector('[role="option"]'), { timeout: 20000 });
    await waitReady(shared); await observe('suggestion-mob-display', shared);
    const suggestion = await shared.$('[role="option"]');
    const suggestionText = await suggestion.evaluate(node => node.textContent);
    if (!/mueble/i.test(suggestionText)) results.push({ name: 'suggestion-mob-expanded', passed: false, issues: ['Expected MOB display expansion to mueble is missing.'] });
    await suggestion.click(); await suggestion.dispose();
    await shared.waitForFunction(() => location.pathname === '/producto/0435-bisagra-parche-mob-mini-par', { timeout: 20000 });
    const product = await shared.evaluate(() => ({ path: location.pathname, heading: document.querySelector('h1')?.textContent || '', canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'), notFound: /404|No encontrado/.test(document.querySelector('h1')?.textContent || '') }));
    const detailIssues = product.notFound || !product.heading || !product.canonical?.endsWith(product.path) ? ['Suggested product does not resolve to its stable canonical detail page.'] : [];
    results.push({ name: 'suggestion-stable-product-route', passed: detailIssues.length === 0, issues: detailIssues, product });
    await shared.screenshot({ path: path.join(options.output, 'suggestion-stable-product-route.png'), fullPage: false });
    console.log(`${detailIssues.length ? 'FAIL' : 'PASS'} suggestion-stable-product-route`);
    await sharedContext.close();
  } catch (error) {
    report.runtimeError = error.stack || error.message;
    console.error(`Runtime error: ${error.message}`);
    if (browser) {
      try {
        const lastPage = (await browser.pages()).at(-1);
        if (lastPage && !lastPage.isClosed()) {
          await lastPage.screenshot({ path: path.join(options.output, 'runtime-error.png'), fullPage: false });
          fs.writeFileSync(path.join(options.output, 'runtime-error.html'), await lastPage.content());
        }
      } catch { /* Preserve the original error if diagnostics cannot be captured. */ }
    }
  } finally {
    if (browser) await browser.close();
    const resolvedProfile = path.resolve(profile);
    const intendedRoot = path.resolve(os.tmpdir()) + path.sep;
    if (resolvedProfile.startsWith(intendedRoot) && path.basename(resolvedProfile).startsWith('ferre-functional-')) fs.rmSync(resolvedProfile, { recursive: true, force: true });
    report.apiRequests = requests;
    report.missingCases = REQUIRED_CASES.filter(name => !results.some(result => result.name === name));
    const measured = results.filter(result => result.applicability !== 'not-applicable');
    report.measured = { passed: measured.filter(result => result.passed).length, total: measured.length, notApplicable: results.length - measured.length };
    report.passed = !report.runtimeError && !consoleErrors.length && !forbiddenRequests.length && !httpErrors.length && !report.missingCases.length && results.every(result => result.passed);
    fs.writeFileSync(path.join(options.output, 'summary.json'), JSON.stringify(report, null, 2));
    console.log(`${report.passed ? 'PASS' : 'FAIL'} functional catalog: ${report.measured.passed}/${report.measured.total}; N/A=${report.measured.notApplicable}; console errors=${consoleErrors.length}; WhatsApp requests=${forbiddenRequests.length}`);
    process.exitCode = report.runtimeError ? 2 : report.passed ? 0 : 1;
  }
}

module.exports = { parseArgs, parseCOP, expectedDisplay, compareCatalogState, readCatalogState };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 2; });

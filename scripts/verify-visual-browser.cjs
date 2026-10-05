#!/usr/bin/env node
/* Purpose-specific, isolated browser audit. It never connects to an existing browser. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');
const { classifyUtility } = require('./verify-visual-tokens.cjs');
const { catalogLayoutChecks, measureViewportLayout, measureCatalogHits, planViewportCases } = require('./verify-visual-layout.cjs');

// Photo coverage evolves: the empty-media case must still use a genuinely unphotographed SKU.
const sourceLoader = require('../tests/load-ts.cjs')();
const { getCatalogProducts } = sourceLoader('src/lib/catalog-service.ts');
const { getProductPath } = sourceLoader('src/lib/catalog/routes.ts');
const noPhotoProduct = getCatalogProducts().find(product => !product.img && !product.gallery?.length);
if (!noPhotoProduct) throw new Error('No real unphotographed product remains; replace the empty-media fixture with an explicit failed-image test.');

const VIEWS = {
  inicio: '/', catalogo: '/catalogo', categoria: '/catalogo/cerrajeria',
  'ficha-foto': '/producto/0435-bisagra-parche-mob-mini-par',
  'ficha-sin-foto': getProductPath(noPhotoProduct),
  'sin-resultados': '/catalogo?q=zzzz-inexistente-92846',
  footer: '/', cotizacion: '/producto/0435-bisagra-parche-mob-mini-par',
};

function groupRows(cards, tolerance = 2) {
  const rows = [];
  const bottom = rect => Number.isFinite(rect.bottom) ? rect.bottom : Number.isFinite(rect.height) ? rect.top + rect.height : null;
  const right = rect => Number.isFinite(rect.right) ? rect.right : Number.isFinite(rect.width) ? rect.left + rect.width : null;
  const sharesRow = (a, b) => {
    const aBottom = bottom(a), bBottom = bottom(b), aRight = right(a), bRight = right(b);
    // Legacy unit fixtures may omit box dimensions; real DOM rows use overlap,
    // independently of the 2px tolerance applied to price/action positions.
    if ([aBottom, bBottom, aRight, bRight].some(value => value === null)) return Math.abs(a.top - b.top) <= tolerance;
    const verticalOverlap = Math.min(aBottom, bBottom) - Math.max(a.top, b.top);
    const horizontallySeparate = Math.min(aRight, bRight) <= Math.max(a.left, b.left);
    return verticalOverlap > 0 && horizontallySeparate;
  };
  for (const card of [...cards].sort((a, b) => a.card.top - b.card.top || a.card.left - b.card.left)) {
    let row = rows.find(candidate => candidate.cards.every(member => sharesRow(member.card, card.card)));
    if (!row) { row = { top: card.card.top, cards: [] }; rows.push(row); }
    row.cards.push(card);
  }
  return rows.map(row => {
    const missing = row.cards.filter(card => !card.price || !card.actions).map(card => card.sku);
    const range = field => {
      const values = row.cards.map(card => card[field]?.top).filter(Number.isFinite);
      return values.length === row.cards.length ? Math.max(...values) - Math.min(...values) : null;
    };
    const priceDeltaPx = range('price'), actionsDeltaPx = range('actions');
    return { top: row.top, skus: row.cards.map(card => card.sku), missing, priceDeltaPx, actionsDeltaPx, comparable: row.cards.length > 1, passed: missing.length === 0 && (row.cards.length < 2 || (priceDeltaPx <= tolerance && actionsDeltaPx <= tolerance)) };
  });
}

function sessionCLS(entries) {
  let max = 0, current = 0, start = 0, previous = 0;
  for (const entry of [...entries].sort((a, b) => a.startTime - b.startTime)) {
    if (entry.hadRecentInput) continue;
    if (current === 0 || entry.startTime - previous >= 1000 || entry.startTime - start >= 5000) { current = entry.value; start = entry.startTime; }
    else current += entry.value;
    previous = entry.startTime;
    max = Math.max(max, current);
  }
  return max;
}

function countPaintRegions(paints) {
  const groups = [];
  const intersects = (a, b) => a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
  for (const paint of paints) {
    const touching = groups.filter(group => group.some(item => intersects(item.rect, paint.rect)));
    if (!touching.length) groups.push([paint]);
    else {
      const merged = [paint, ...touching.flat()];
      for (const group of touching) groups.splice(groups.indexOf(group), 1);
      groups.push(merged);
    }
  }
  return groups.map(group => group.map(item => ({ selector: item.selector, pseudo: item.pseudo })));
}

function systemFontCheck(fonts) {
  const firstFamily = (fonts.bodyFamily || '').split(',')[0].trim().replace(/^['"]|['"]$/g, '');
  return ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'ui-sans-serif'].includes(firstFamily)
    && Array.isArray(fonts.faces) && fonts.faces.length === 0
    && Array.isArray(fonts.preloads) && fonts.preloads.length === 0
    && Array.isArray(fonts.fontRequests) && fonts.fontRequests.length === 0
    && Array.isArray(fonts.unreadableSheets) && fonts.unreadableSheets.length === 0;
}

// This function is serialized by Puppeteer; all DOM helpers deliberately live inside it.
function measureDocument() {
  const rootStyle = getComputedStyle(document.documentElement);
  const tokens = Object.fromEntries(['brand', 'brand-press', 'wa'].map(name => [name, rootStyle.getPropertyValue(`--${name}`).trim().split(/\s+/).map(Number)]));
  const rectangle = rect => ({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height });
  const rgb = value => {
    const values = value.match(/[\d.]+/g)?.map(Number);
    return values?.length >= 3 ? { channels: values.slice(0, 3), alpha: values[3] ?? 1 } : null;
  };
  const sameColor = (a, b) => a && b && a.length === 3 && b.length === 3 && a.every((value, i) => Math.abs(value - b[i]) < .5);
  const selector = node => {
    if (node.id) return `#${CSS.escape(node.id)}`;
    if (node.hasAttribute('data-design-card')) return `[data-design-card][data-sku="${CSS.escape(node.getAttribute('data-sku') || '')}"]`;
    const parts = [];
    while (node && node !== document.documentElement && parts.length < 5) {
      const parent = node.parentElement;
      const siblings = parent ? [...parent.children].filter(sibling => sibling.tagName === node.tagName) : [node];
      parts.unshift(`${node.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(node) + 1})`);
      node = parent;
    }
    return parts.join(' > ');
  };
  function clippedRect(element, input, withViewport = true) {
    let r = withViewport ? { left: Math.max(0, input.left), top: Math.max(0, input.top), right: Math.min(innerWidth, input.right), bottom: Math.min(innerHeight, input.bottom) } : { left: input.left, top: input.top, right: input.right, bottom: input.bottom };
    let opacity = 1;
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (style.display === 'none' || style.visibility !== 'visible') return null;
      opacity *= Number(style.opacity);
      if (ancestor !== element) {
        const box = ancestor.getBoundingClientRect();
        if (/(hidden|clip|scroll|auto)/.test(style.overflowX)) { r.left = Math.max(r.left, box.left); r.right = Math.min(r.right, box.right); }
        if (/(hidden|clip|scroll|auto)/.test(style.overflowY)) { r.top = Math.max(r.top, box.top); r.bottom = Math.min(r.bottom, box.bottom); }
      }
    }
    if (!opacity || r.right <= r.left || r.bottom <= r.top) return null;
    return { ...r, width: r.right - r.left, height: r.bottom - r.top, opacity };
  }
  const points = r => [[(r.left + r.right) / 2, (r.top + r.bottom) / 2], [r.left + .5, r.top + .5], [r.right - .5, r.top + .5], [r.left + .5, r.bottom - .5], [r.right - .5, r.bottom - .5]];
  const hitVisible = (element, r) => points(r).some(([x, y]) => { const hit = document.elementFromPoint(x, y); return hit && (hit === element || element.contains(hit)); });
  function paintVisible(element, r) {
    return points(r).some(([x, y]) => {
      let hit = document.elementFromPoint(x, y);
      if (!hit || (hit !== element && !element.contains(hit))) return false;
      while (hit !== element) {
        const style = getComputedStyle(hit), background = rgb(style.backgroundColor);
        if (['IMG', 'VIDEO', 'CANVAS'].includes(hit.tagName) || style.backgroundImage !== 'none' || (background && background.alpha >= .99)) return false;
        hit = hit.parentElement;
      }
      return true;
    });
  }
  function pseudoRect(element, style) {
    const width = parseFloat(style.width), height = parseFloat(style.height);
    if (!Number.isFinite(width) || !Number.isFinite(height) || !['absolute', 'fixed'].includes(style.position)) return null;
    let owner = element;
    if (style.position !== 'fixed') while (getComputedStyle(owner).position === 'static' && owner.parentElement) owner = owner.parentElement;
    const box = style.position === 'fixed' ? { left: 0, top: 0, width: innerWidth, height: innerHeight } : owner.getBoundingClientRect();
    const left = style.left !== 'auto' ? box.left + parseFloat(style.left) : style.right !== 'auto' ? box.left + box.width - parseFloat(style.right) - width : NaN;
    const top = style.top !== 'auto' ? box.top + parseFloat(style.top) : style.bottom !== 'auto' ? box.top + box.height - parseFloat(style.bottom) - height : NaN;
    if (!Number.isFinite(left) || !Number.isFinite(top) || style.transform !== 'none') return null;
    return { left, top, width, height, right: left + width, bottom: top + height };
  }
  const paints = [], translucentPaints = [], unresolvedPseudos = [], gradients = [], runtimeClasses = new Set();
  for (const element of document.querySelectorAll('body *')) {
    (element.getAttribute('class') || '').split(/\s+/).filter(Boolean).forEach(token => runtimeClasses.add(token));
    for (const pseudo of [null, '::before', '::after']) {
      const style = getComputedStyle(element, pseudo);
      if (pseudo && ['none', 'normal'].includes(style.content)) continue;
      const color = rgb(style.backgroundColor);
      const red = color && (sameColor(color.channels, tokens.brand) || sameColor(color.channels, tokens['brand-press']));
      const green = color && sameColor(color.channels, tokens.wa);
      if (!red && !green) continue;
      const box = pseudo ? pseudoRect(element, style) : element.getBoundingClientRect();
      if (!box) {
        if (clippedRect(element, element.getBoundingClientRect())) unresolvedPseudos.push({ selector: selector(element), pseudo, background: style.backgroundColor, position: style.position, width: style.width, height: style.height, transform: style.transform });
        continue;
      }
      const clipped = clippedRect(element, box);
      if (!clipped || !paintVisible(element, clipped)) continue;
      const paint = { selector: selector(element), pseudo, kind: red ? 'brand-red' : 'whatsapp', rect: rectangle(clipped), background: style.backgroundColor, effectiveAlpha: clipped.opacity * color.alpha };
      if (style.backgroundImage !== 'none') { gradients.push({ ...paint, backgroundImage: style.backgroundImage }); continue; }
      if (paint.effectiveAlpha >= .99) paints.push(paint); else translucentPaints.push(paint);
    }
  }
  const cards = [...document.querySelectorAll('[data-design-card]')].map(element => {
    const card = element.getBoundingClientRect();
    const price = element.querySelector('[data-design-price]'), actions = element.querySelector('[data-design-actions]');
    return { sku: element.getAttribute('data-sku'), card: rectangle(card), price: price ? rectangle(price.getBoundingClientRect()) : null, priceText: price?.textContent?.trim(), actions: actions ? rectangle(actions.getBoundingClientRect()) : null };
  }).filter(card => card.card.width > 0 && card.card.height > 0);
  const targets = [], seenTargets = new Set();
  const activeDialog = [...document.querySelectorAll('[aria-modal="true"]')].find(element => clippedRect(element, element.getBoundingClientRect()));
  const controls = 'button, [role="button"], select, input:not([type="hidden"]), summary, header a[href], footer a[href], a[aria-label^="Ampliar imagen"], [data-design-actions] a, .quote-panel a, [class*="btn-"]';
  for (const control of document.querySelectorAll(controls)) {
    if (activeDialog && !activeDialog.contains(control)) continue; // The modal intentionally makes the background inactive.
    let target = control;
    if (control.matches('input[type="radio"],input[type="checkbox"]')) target = control.closest('label') || (control.id && document.querySelector(`label[for="${CSS.escape(control.id)}"]`)) || control;
    if (seenTargets.has(target)) continue;
    seenTargets.add(target);
    const rect = target.getBoundingClientRect(), visible = clippedRect(target, rect), ancestorVisible = clippedRect(target, rect, false);
    if (!visible || !ancestorVisible) continue;
    const parent = target.parentElement;
    const fontSize = parseFloat(getComputedStyle(target).fontSize);
    const viewportClipped = visible.width < ancestorVisible.width - .01 || visible.height < ancestorVisible.height - .01;
    const centerHit = document.elementFromPoint((visible.left + visible.right) / 2, (visible.top + visible.bottom) / 2);
    targets.push({ selector: selector(target), name: control.getAttribute('aria-label') || target.textContent?.trim().slice(0, 140) || control.getAttribute('name'), rect: rectangle(rect), availableRect: rectangle(ancestorVisible), visibleRect: rectangle(visible), disabled: control.matches(':disabled'), fontSize, isButton: control.matches('button,[role="button"],summary,[class*="btn-"]'), clipped: visible.width < rect.width || visible.height < rect.height, viewportClipped, ancestorClipped: ancestorVisible.width < rect.width - .01 || ancestorVisible.height < rect.height - .01, hitVisible: hitVisible(target, visible), centerHit: !!centerHit && (centerHit === target || target.contains(centerHit)), centerOccluder: centerHit ? selector(centerHit) : null, nestedIn: parent?.tagName });
  }
  const stripQuotes = value => value.trim().replace(/^['"]|['"]$/g, '');
  const bodyFamily = getComputedStyle(document.body).fontFamily;
  const faces = [], unreadableSheets = [];
  function inspectRules(rules, source) {
    for (const rule of rules) {
      if (rule.type === CSSRule.FONT_FACE_RULE) {
        const urls = [...rule.style.getPropertyValue('src').matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(match => new URL(match[1], source || location.href).href);
        faces.push({ family: stripQuotes(rule.style.getPropertyValue('font-family')), weight: rule.style.getPropertyValue('font-weight'), display: rule.style.getPropertyValue('font-display'), urls });
      } else if (rule.cssRules) inspectRules(rule.cssRules, source);
    }
  }
  for (const sheet of document.styleSheets) {
    try { inspectRules(sheet.cssRules, sheet.href); } catch { unreadableSheets.push(sheet.href); }
  }
  const preloads = [...document.querySelectorAll('link[rel="preload"][as="font"]')].map(link => ({ href: link.href, type: link.type, crossOrigin: link.crossOrigin }));
  const fontRequests = performance.getEntriesByType('resource').filter(entry => /\.(?:woff2?|ttf|otf)(?:[?#]|$)|fonts\.(?:googleapis|gstatic)\.com/i.test(entry.name)).map(entry => entry.name);
  const loadedFaces = [...document.fonts].filter(face => face.status === 'loaded').map(face => ({ family: stripQuotes(face.family), weight: face.weight, status: face.status }));
  return {
    url: location.href, theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    viewport: { width: innerWidth, height: innerHeight, devicePixelRatio }, scrollY,
    paints, translucentPaints, unresolvedPseudos, gradients, cards, targets, runtimeClasses: [...runtimeClasses],
    images: [...document.images].filter(image => clippedRect(image, image.getBoundingClientRect())).map(image => ({ src: image.currentSrc || image.src, alt: image.alt, complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight })),
    fonts: { strategy: 'system', bodyFamily, fontRequests, preloads, faces, loadedFaces, unreadableSheets },
    layoutShifts: window.__visualAuditShifts || [], clsSupported: !!window.__visualAuditClsSupported,
  };
}

function summarizeMeasurement(dom, { alignmentRequired, redBudgetRequired, fontGate, layoutScope, initialViewport = false }) {
  const rows = groupRows(dom.cards), comparable = rows.filter(row => row.comparable);
  const red = dom.paints.filter(paint => paint.kind === 'brand-red'), green = dom.paints.filter(paint => paint.kind === 'whatsapp');
  const redRegions = countPaintRegions(red), greenRegions = countPaintRegions(green);
  const runtimeColors = dom.runtimeClasses.map(value => ({ value, rule: classifyUtility(value) })).filter(item => item.rule);
  const touchFailures = dom.targets.filter(target => !target.disabled && ((target.availableRect || target.rect).width < 43.99 || (target.availableRect || target.rect).height < 43.99));
  const occlusionFailures = dom.targets.filter(target => !target.disabled && !target.viewportClipped && target.centerHit === false);
  const buttonTypeFailures = dom.targets.filter(target => target.isButton && !target.disabled && target.fontSize < 13.99);
  const cls = dom.clsSupported ? sessionCLS(dom.layoutShifts) : null;
  const checks = {
    redSurfaces: { required: redBudgetRequired, budget: 2, count: redRegions.length, regions: redRegions, passed: redRegions.length <= 2 && dom.unresolvedPseudos.length === 0 && dom.gradients.length === 0 },
    alignment: { required: alignmentRequired, tolerancePx: 2, cards: dom.cards.length, rows, passed: comparable.length > 0 && rows.every(row => row.passed) },
    runtimeColors: { passed: runtimeColors.length === 0, findings: runtimeColors },
    imagesLoaded: { passed: Array.isArray(dom.images) && dom.images.every(image => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0), failures: (dom.images || []).filter(image => !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0), scope: 'Visible image elements must finish decoding; offscreen lazy images are excluded.' },
    touch44: { passed: touchFailures.length === 0, failures: touchFailures },
    targetOcclusion: { required: false, passed: occlusionFailures.length === 0, warnings: occlusionFailures, partialViewportTargets: dom.targets.filter(target => target.viewportClipped), scope: 'Current viewport center hit test only. Fixed bars can cover a reachable control at this scroll position; this report is not a scroll-to-reveal or end-of-document reachability gate.' },
    buttons14: { passed: buttonTypeFailures.length === 0, failures: buttonTypeFailures },
    fonts: { required: fontGate === 'required', passed: systemFontCheck(dom.fonts), evidence: dom.fonts },
    cls: { required: true, maximumExclusive: .1, value: cls, passed: cls !== null && cls < .1, scope: 'Observed initial load and current state, session-window CLS; not a Lighthouse/PSI run.' },
    whatsappFill: { passed: greenRegions.length <= 1, count: greenRegions.length, regions: greenRegions },
    ...catalogLayoutChecks(dom.viewportLayout?.catalog, dom.viewport || {}, dom.scrollY, groupRows(dom.viewportLayout?.catalog?.cards || []), initialViewport && layoutScope === 'catalog'),
    homeStripes: { required: initialViewport && layoutScope === 'home' && [360,390,430].includes(dom.viewport?.width), passed: dom.viewportLayout?.stripes?.passed === true, evidence: dom.viewportLayout?.stripes || null },
  };
  const required = Object.values(checks).filter(check => check.required !== false);
  return { checks, passed: required.every(check => check.passed) };
}

function parseArgs(argv) {
  const options = {};
  const allowed = new Set(['base-url', 'output', 'views', 'widths', 'themes', 'font-preload-gate', 'chrome-path']);
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--') || !argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`Expected value for ${argv[i]}.`);
    if (!allowed.has(argv[i].slice(2))) throw new Error(`Unknown argument: ${argv[i]}.`);
    options[argv[i].slice(2)] = argv[++i];
  }
  const base = new URL(options['base-url'] || 'http://localhost:3010');
  if (!['http:', 'https:'].includes(base.protocol) || (base.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(base.hostname))) throw new Error('Use localhost HTTP or an explicitly supplied HTTPS origin.');
  if (base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw new Error('base-url must be a plain origin without credentials.');
  const output = options.output && path.resolve(options.output);
  if (!output) throw new Error('--output is required; keep evidence outside the repository.');
  const views = (options.views || Object.keys(VIEWS).join(',')).split(',');
  if (views.some(view => !(view in VIEWS))) throw new Error('Unknown view.');
  const widths = (options.widths || '390,1440').split(',').map(Number);
  if (widths.some(width => !Number.isInteger(width) || width < 320 || width > 2560)) throw new Error('Invalid widths.');
  const themes = (options.themes || 'light,dark').split(',');
  if (themes.some(theme => !['light', 'dark'].includes(theme))) throw new Error('Invalid themes.');
  const fontGate = options['font-preload-gate'] || 'required';
  if (!['required', 'report'].includes(fontGate)) throw new Error('font-preload-gate is required or report.');
  const chromePath = options['chrome-path'] || process.env.CHROME_PATH;
  if (!chromePath || !fs.existsSync(chromePath)) throw new Error('Provide --chrome-path or CHROME_PATH for a separate headless Chrome.');
  return { base, output, views, widths, themes, fontGate, chromePath };
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().filter(animation => animation.playState === 'running' && animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}
async function clickVisible(page, selector) {
  for (const element of await page.$$(selector)) {
    if (await element.isVisible()) { await element.click(); return; }
  }
  throw new Error(`No visible action: ${selector}`);
}
async function auditState(page, axeSource, output, key, options) {
  await settle(page);
  // A newly revealed lazy image gets time to settle, but an actual broken resource still fails.
  await page.waitForFunction(() => [...document.images].filter(image => {
    const rect = image.getBoundingClientRect(), style = getComputedStyle(image);
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth && style.visibility === 'visible' && Number(style.opacity) > 0;
  }).every(image => image.complete), { timeout: 15000, polling: 100 }).catch(() => {});
  const dom = await page.evaluate(measureDocument);
  dom.viewportLayout = await page.evaluate(measureViewportLayout);
  const summary = summarizeMeasurement(dom, options);
  await page.addScriptTag({ content: axeSource });
  const axe = await page.evaluate(async () => window.axe.run(document, { resultTypes: ['violations', 'incomplete', 'passes', 'inapplicable'] }));
  fs.writeFileSync(path.join(output, `${key}.dom.json`), JSON.stringify({ ...dom, ...summary }, null, 2) + '\n');
  fs.writeFileSync(path.join(output, `${key}.axe.json`), JSON.stringify(axe, null, 2) + '\n');
  await page.screenshot({ path: path.join(output, `${key}.png`), fullPage: false });
  return { key, url: dom.url, theme: dom.theme, viewport: dom.viewport, ...summary, axe: { violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, html: n.html, failureSummary: n.failureSummary })) })), incomplete: axe.incomplete.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) }, passed: summary.passed && axe.violations.length === 0, evidence: [`${key}.dom.json`, `${key}.axe.json`, `${key}.png`] };
}

async function probeHomeStripes(page, output, key) {
  const states = [], buttons = await page.$$('.home-hero button[aria-label^="Ver diapositiva "]');
  if (buttons.length === 0) {
    await settle(page);
    const layout = await page.evaluate(measureViewportLayout);
    const evidence = `${key}-static-hero.png`;
    await page.screenshot({ path: path.join(output, evidence), fullPage: false });
    states.push({ presentation: 'static', evidence, ...layout.stripes, passed: layout.stripes?.passed === true });
    const result = { passed: states[0].passed, presentation: 'static', states };
    fs.writeFileSync(path.join(output, `${key}.stripes.json`), JSON.stringify(result, null, 2) + '\n');
    return result;
  }
  if (buttons.length !== 3) return { passed: false, states, reason: 'Expected three carousel slide controls; cannot verify every title and paragraph.' };
  for (const [index, button] of buttons.entries()) {
    await button.click(); // Focus pauses the existing carousel; no timer or UI state is rewritten.
    await settle(page);
    const layout = await page.evaluate(measureViewportLayout);
    const evidence = `${key}-slide-${index + 1}.png`;
    await page.screenshot({ path: path.join(output,evidence), fullPage: false });
    states.push({ slide: index + 1, evidence, ...layout.stripes, passed: layout.stripes?.passed === true });
  }
  const result = { passed: states.length === 3 && states.every(state => state.passed), states };
  fs.writeFileSync(path.join(output,`${key}.stripes.json`),JSON.stringify(result,null,2)+'\n');
  return result;
}

async function probeCatalogMobile(page, output, key) {
  const originalScroll = await page.evaluate(() => scrollY);
  const maximum = await page.evaluate(() => Math.max(0,document.documentElement.scrollHeight-innerHeight));
  const down = Math.min(maximum,633), up = Math.max(0,down-317);
  const phases = [{ phase:'initial',scroll:0,triggerVisible:true },{ phase:'down',scroll:down,triggerVisible:false },{ phase:'up',scroll:up,triggerVisible:true }];
  const states = [];
  try {
    for (const phase of phases) {
      await page.evaluate(top => scrollTo({ top,behavior:'instant' }),phase.scroll);
      await settle(page);
      await settle(page); // Let the scroll listener commit, then settle its finite transform transition.
      const measurement = await page.evaluate(measureCatalogHits);
      const scrollValid = phase.phase === 'initial' ? measurement.scrollY <= .5 : phase.phase === 'down' ? measurement.scrollY > 100 : measurement.scrollY < down-8;
      const triggerPassed = measurement.trigger.present && measurement.trigger.visible === phase.triggerVisible && measurement.trigger.visibleCount === (phase.triggerVisible ? 1 : 0);
      const evidence = `${key}-scroll-${phase.phase}.png`;
      await page.screenshot({ path:path.join(output,evidence),fullPage:false });
      states.push({ phase:phase.phase,expectedTriggerVisible:phase.triggerVisible,scrollValid,triggerPassed,evidence,...measurement,passed:measurement.passed && scrollValid && triggerPassed });
    }
  } finally { await page.evaluate(top => scrollTo({ top,behavior:'instant' }),originalScroll); await settle(page); }
  const result = { required:true,passed:states.length===3&&states.every(state=>state.passed),states,scope:'All enabled card actions completely inside the unobstructed viewport: center and four interior quarter points. Fixed-header cuts are excluded with evidence; Pardito is not excluded. No action or WhatsApp link is clicked.' };
  fs.writeFileSync(path.join(output,`${key}.hits.json`),JSON.stringify(result,null,2)+'\n');
  return result;
}

// The outline is outside the control: compare it with the composed ancestor background.
function measureFocusProbe() {
  const element = document.activeElement, style = getComputedStyle(element), box = element.getBoundingClientRect();
  const parse = value => { const channels = value.match(/[\d.]+/g)?.map(Number); return channels?.length >= 3 ? [...channels.slice(0, 3), channels[3] ?? 1] : null; };
  const composite = (foreground, background) => foreground.slice(0, 3).map((value, index) => value * foreground[3] + background[index] * (1 - foreground[3]));
  const ancestors = []; let opacity = 1, visible = box.width > 0 && box.height > 0;
  for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
    const ancestorStyle = getComputedStyle(ancestor);
    opacity *= Number(ancestorStyle.opacity);
    visible = visible && ancestorStyle.visibility === 'visible' && ancestorStyle.display !== 'none';
    if (ancestor !== element) ancestors.unshift(ancestor);
  }
  let background = [255, 255, 255], backgroundKnown = true;
  for (const ancestor of ancestors) {
    const ancestorStyle = getComputedStyle(ancestor), color = parse(ancestorStyle.backgroundColor);
    if (color) { background = composite(color, background); if (color[3] >= .99) backgroundKnown = true; }
    if (ancestorStyle.backgroundImage !== 'none') backgroundKnown = false;
  }
  const outline = parse(style.outlineColor);
  const luminance = color => color.map(value => { const v = value / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const effective = outline ? composite([...outline.slice(0, 3), outline[3] * opacity], background) : null;
  const contrast = effective && backgroundKnown ? (Math.max(luminance(effective), luminance(background)) + .05) / (Math.min(luminance(effective), luminance(background)) + .05) : null;
  const center = document.elementFromPoint((box.left + box.right) / 2, (box.top + box.bottom) / 2);
  const centerHit = !!center && (center === element || element.contains(center));
  return { tag: element.tagName, name: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 120), outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, outlineColor: style.outlineColor, effectiveAlpha: (outline?.[3] || 0) * opacity, background, backgroundKnown, contrast, centerHit, passed: element !== document.body && visible && centerHit && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0 && (outline?.[3] || 0) * opacity >= .99 && contrast !== null && contrast >= 3 };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const puppeteerModule = await import(pathToFileURL(require.resolve('puppeteer-core')).href);
  const puppeteer = puppeteerModule.default || puppeteerModule;
  const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  fs.mkdirSync(options.output, { recursive: true });
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ferre-visual-'));
  let browser;
  const results = [], errors = [];
  const plannedCases = planViewportCases(options);
  let sha = null, sourceState = null;
  try {
    const repository = path.join(__dirname, '..');
    sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim();
    const changes = execFileSync('git', ['status', '--porcelain'], { cwd: repository, encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
    const buildFile = path.join(repository, '.next', 'BUILD_ID');
    sourceState = { head: sha, dirty: changes.length > 0, changes, localBuildId: options.base.protocol === 'http:' && fs.existsSync(buildFile) ? fs.readFileSync(buildFile, 'utf8').trim() : null };
  } catch {}
  try {
    browser = await puppeteer.launch({ executablePath: options.chromePath, headless: true, userDataDir: temporaryRoot, args: ['--no-first-run', '--no-default-browser-check'] });
    for (const planned of plannedCases) {
      const { view,width,theme } = planned;
      const key = `${view}-${width}-${theme}`;
      console.log(`Auditing ${key}`);
      const context = await browser.createBrowserContext();
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(45000);
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        await page.setViewport({ width, height: width < 768 ? 844 : 900, deviceScaleFactor: 1, isMobile: width < 768, hasTouch: width < 768 });
        await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
        await page.evaluateOnNewDocument(selectedTheme => {
          localStorage.setItem('theme', selectedTheme);
          window.__visualAuditShifts = [];
          window.__visualAuditClsSupported = PerformanceObserver.supportedEntryTypes.includes('layout-shift');
          if (window.__visualAuditClsSupported) new PerformanceObserver(list => {
            list.getEntries().forEach(entry => window.__visualAuditShifts.push({ value: entry.value, startTime: entry.startTime, hadRecentInput: entry.hadRecentInput }));
          }).observe({ type: 'layout-shift', buffered: true });
        }, theme);
        const url = new URL(VIEWS[view], options.base);
        await page.goto(url.href, { waitUntil: 'networkidle0', timeout: 45000 });
        if (new URL(page.url()).origin !== options.base.origin) throw new Error('Unexpected origin redirect; do not audit a login page.');
        await page.waitForFunction(selectedTheme => document.documentElement.classList.contains('dark') === (selectedTheme === 'dark'), {}, theme);
        const stateOptions = { alignmentRequired: width >= 768 && ['catalogo', 'categoria'].includes(view), redBudgetRequired: width >= 768 && url.pathname.startsWith('/catalogo'), fontGate: options.fontGate, layoutScope: ['catalogo','categoria'].includes(view) ? 'catalog' : view === 'inicio' ? 'home' : null, initialViewport: true };
        if (view === 'footer') await page.$eval('footer', element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
        if (view === 'cotizacion') {
          await clickVisible(page, '[data-quote-trigger]');
          await page.waitForSelector('[data-design-quote]', { visible: true });
          results.push(await auditState(page, axeSource, options.output, `${key}-empty`, { ...stateOptions, alignmentRequired: false, redBudgetRequired: false }));
          await clickVisible(page, 'button[aria-label="Cerrar cotización"]');
          await clickVisible(page, 'button[aria-label^="Agregar a cotización"]');
          await clickVisible(page, '[data-quote-trigger]');
          await page.waitForFunction(() => document.querySelector('[data-quote-sku="0435"]') && !document.querySelector('[data-design-quote]')?.textContent.includes('Actualizando precios y disponibilidad'));
          await clickVisible(page, '.quote-prepare');
          await page.waitForSelector('[data-quote-final-action]', { visible: true });
        }
        const result = await auditState(page, axeSource, options.output, key, stateOptions);
        // One keyboard probe, kept separate from the untouched initial screenshot/axe state.
        await page.keyboard.press('Tab');
        result.focusProbe = await page.evaluate(measureFocusProbe);
        result.pageErrors = pageErrors;
        result.passed = result.passed && result.focusProbe.passed && pageErrors.length === 0;
        result.primaryCase = planned.primary;
        if (view === 'inicio' && [360,390,430].includes(width)) {
          result.stripeSequence = await probeHomeStripes(page,options.output,key);
          result.passed = result.passed && result.stripeSequence.passed;
          result.evidence.push(`${key}.stripes.json`);
        }
        if (['catalogo','categoria'].includes(view) && width < 640) {
          result.catalogHitSequence = await probeCatalogMobile(page,options.output,key);
          result.passed = result.passed && result.catalogHitSequence.passed;
          result.evidence.push(`${key}.hits.json`);
        }
        results.push(result);
        if (planned.primary && ['catalogo', 'categoria'].includes(view) && width >= 768) {
          await page.mouse.move(0, 0);
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
          const button = await page.$('[data-design-card] button[aria-label^="Agregar a cotización"]');
          if (!button) throw new Error('Missing card CTA; cannot verify hover.');
          await button.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
          await button.hover();
          const hover = await auditState(page, axeSource, options.output, `${key}-hover`, { ...stateOptions,initialViewport:false });
          hover.hoverProbe = await button.evaluate(element => {
            const background = getComputedStyle(element).backgroundColor;
            const expected = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim().split(/\s+/).map(Number);
            const actual = background.match(/[\d.]+/g)?.map(Number);
            return { name: element.getAttribute('aria-label'), background, expectedToken: 'brand', passed: actual?.length >= 3 && expected.length === 3 && expected.every((value, index) => Math.abs(value - actual[index]) < .5) && (actual[3] ?? 1) >= .99 };
          });
          hover.passed = hover.passed && hover.hoverProbe.passed;
          results.push(hover);
          await clickVisible(page, '[data-design-card] button[aria-label^="Agregar a cotización"]');
          await page.waitForFunction(() => [...document.querySelectorAll('[data-design-card] button')].some(button => button.textContent.includes('En cotización')));
          results.push(await auditState(page, axeSource, options.output, `${key}-added`, { ...stateOptions,initialViewport:false }));
        }
        if (['catalogo', 'categoria'].includes(view) && width < 640) {
          await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
          await clickVisible(page, '[data-design-card] button[aria-label^="Agregar a cotización"]');
          await page.waitForFunction(() => [...document.querySelectorAll('[data-design-card] button')].some(button => button.getAttribute('aria-label')?.startsWith('Agregado ')));
          results.push(await auditState(page, axeSource, options.output, `${key}-added`, { ...stateOptions, initialViewport: false }));
        }
        const failedChecks = Object.entries(result.checks).filter(([,check])=>check.required!==false&&!check.passed).map(([name])=>name);
        if (result.stripeSequence?.passed===false) failedChecks.push('stripeSequence');
        if (result.catalogHitSequence?.passed===false) failedChecks.push('catalogHitSequence');
        if (!result.focusProbe.passed) failedChecks.push('focusProbe');
        console.log(`${key}: ${result.passed ? 'PASS' : 'FAIL'}, axe=${result.axe.violations.length}, red=${result.checks.redSurfaces.count}, alignment=${result.checks.alignment.required ? result.checks.alignment.passed : 'n/a'}, failedChecks=${failedChecks.join(',')||'none'}`);
      } catch (error) {
        const entry = { key, message: error.message };
        errors.push(entry);
        fs.writeFileSync(path.join(options.output, `${key}.error.json`), JSON.stringify(entry, null, 2));
        console.error(`${key}: runtime/config error: ${error.message}`);
      } finally { await context.close(); }
      // Persist progress so failures are reviewable before the batch completes.
      fs.writeFileSync(path.join(options.output, 'summary.json'), JSON.stringify({ reportedCommit: sha, sourceState, browser: await browser.version(), baseUrl: options.base.origin, fontPreloadGate: options.fontGate, primaryCasesExpected: options.views.length * options.widths.length * options.themes.length, supplementalViewportCasesExpected: plannedCases.filter(item=>!item.primary).length, results, errors }, null, 2) + '\n');
    }
  } finally {
    if (browser) await browser.close();
    const resolved = path.resolve(temporaryRoot), approved = path.resolve(os.tmpdir()) + path.sep;
    if (resolved.startsWith(approved) && path.basename(resolved).startsWith('ferre-visual-')) fs.rmSync(resolved, { recursive: true, force: true });
  }
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const rows = results.map(result => `<tr><td>${escape(result.key)}</td><td>${result.passed ? 'PASS' : 'FAIL'}</td><td>${result.axe.violations.length}</td><td>${result.checks.redSurfaces.count}</td><td>${result.checks.alignment.required ? result.checks.alignment.passed : 'n/a'}</td><td>${result.checks.cls.value}</td><td>${result.evidence.map(file => `<a href="${escape(file)}">${escape(file.split('.').slice(-2).join('.'))}</a>`).join(' · ')}</td></tr>`).join('');
  fs.writeFileSync(path.join(options.output, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Verificación visual</title><style>body{font:16px system-ui;max-width:1200px;margin:32px auto;padding:0 16px}table{border-collapse:collapse;width:100%}td,th{padding:8px;border:1px solid #ccc;text-align:left}</style><h1>Verificación visual</h1><p>Commit ${escape(sha)}. Evidencia de laboratorio; axe incomplete y font gate report requieren revisión separada. No se envía WhatsApp.</p><table><thead><tr><th>Estado</th><th>Resultado</th><th>Axe</th><th>Rojo</th><th>Alineación</th><th>CLS observado</th><th>Evidencia</th></tr></thead><tbody>${rows}</tbody></table><pre>${escape(JSON.stringify(errors, null, 2))}</pre>`);
  process.exitCode = errors.length ? 2 : results.every(result => result.passed) ? 0 : 1;
}

if (require.main === module) main().catch(error => { console.error(error.stack); process.exitCode = 2; });
module.exports = { VIEWS, groupRows, sessionCLS, countPaintRegions, systemFontCheck, measureDocument, summarizeMeasurement, parseArgs };

/* Geometry and interaction evidence for PR9. No catalog data or UI is modified. */
function inside(box, bounds, tolerance = .01) {
  return !!box && box.width > 0 && box.height > 0 && [box.left, box.top, box.right, box.bottom].every(Number.isFinite) && box.left >= bounds.left - tolerance && box.top >= bounds.top - tolerance && box.right <= bounds.right + tolerance && box.bottom <= bounds.bottom + tolerance;
}

function catalogLayoutChecks(catalog, viewport, scrollY, rows, required) {
  const cards = catalog?.cards || [];
  const firstRow = rows[0];
  const firstCards = firstRow ? firstRow.skus.map(sku => cards.find(card => card.sku === sku)).filter(Boolean) : [];
  const first = cards[0];
  const bounds = { left: 0, top: catalog?.fixedHeaderBottom || 0, right: viewport.width, bottom: viewport.height };
  const complete = card => inside(card?.card, bounds) && inside(card?.price, bounds) && inside(card?.actions, bounds);
  const desktop = viewport.width >= 1024;
  const expectedRatio = desktop ? 4 / 3 : 1;
  const ratios = cards.map(card => ({ sku: card.sku, frame: card.frame, ratio: card.frame?.height > 0 ? card.frame.width / card.frame.height : null }));
  const ratioRequired = required && (desktop || viewport.width < 640);
  const foldRequired = required && [390, 1440].includes(viewport.width);
  const foldCards = viewport.width === 390 ? (first ? [first] : []) : firstCards;
  const columns = firstCards.length;
  return {
    catalogHeroHeight: { required, maximumPx: 120, measuredPx: catalog?.hero?.height ?? null, passed: !!catalog?.hero && catalog.hero.height > 0 && catalog.hero.height <= 120 },
    catalogFourColumns: { required: required && viewport.width >= 1280, measured: columns, expected: 4, templateColumns: catalog?.templateColumns ?? null, firstRowSkus: firstRow?.skus || [], passed: catalog?.display === 'grid' && columns === 4 && firstCards.every((card, index) => index === 0 || card.card.left >= firstCards[index - 1].card.right - .01) },
    catalogFirstViewport: { required: foldRequired, scrollY, bounds, cardSkus: foldCards.map(card => card.sku), bottoms: foldCards.map(card => card.card.bottom), passed: Math.abs(scrollY) <= .5 && foldCards.length === (viewport.width === 390 ? 1 : 4) && foldCards.every(complete), scope: 'Initial position only; full card, price and action rectangles must fit below the fixed header and inside the viewport.' },
    catalogMediaRatio: { required: ratioRequired, expected: expectedRatio, tolerance: .01, frames: ratios, passed: ratios.length > 0 && ratios.every(item => item.ratio !== null && Math.abs(item.ratio - expectedRatio) <= .01), scope: 'Catalog grid frames only: 4:3 from 1024px, 1:1 below 640px; detail, featured and list media are excluded.' },
  };
}

// Serialized in Chrome. SVG geometry uses painted path strokes, not empty SVG boxes.
function measureViewportLayout() {
  const rect = element => { if (!element) return null; const r = element.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
  const fixedHeaderBottom = [...document.querySelectorAll('header')].filter(element => ['fixed', 'sticky'].includes(getComputedStyle(element).position)).reduce((bottom, element) => { const r = rect(element); return r.top <= .5 && r.bottom > 0 ? Math.max(bottom, r.bottom) : bottom; }, 0);
  const grid = document.querySelector('[data-catalog-grid]');
  const hero = document.querySelector('[data-catalog-hero]');
  const catalog = grid || hero ? { hero: rect(hero), grid: rect(grid), fixedHeaderBottom, display: grid ? getComputedStyle(grid).display : null, templateColumns: grid ? getComputedStyle(grid).gridTemplateColumns : null, cards: grid ? [...grid.querySelectorAll('[data-design-card]')].filter(element => !element.classList.contains('product-card--list')).map(element => ({ sku: element.getAttribute('data-sku'), card: rect(element), price: rect(element.querySelector('[data-design-price]')), actions: rect(element.querySelector('[data-design-actions]')), frame: rect(element.querySelector('.product-media-frame')) })) : [] } : null;
  const home = document.querySelector('.home-hero');
  let stripes = null;
  if (home) {
    const title = home.querySelector('[data-home-title],h1');
    const intro = home.querySelector('[data-home-intro]') || (title?.nextElementSibling?.tagName === 'P' ? title.nextElementSibling : null);
    const texts = [{ role: 'h1', text: title?.textContent, rect: rect(title) }, { role: 'paragraph', text: intro?.textContent, rect: rect(intro) }];
    const homeBox = rect(home);
    const drawings = [...new Set(home.querySelectorAll('[data-home-stripes],.brand-stripes'))];
    const paths = [...new Set(drawings.flatMap(svg => [...svg.querySelectorAll('path')]))];
    const evidence = [], unknown = [], collisions = [];
    const distance = (point, box) => Math.hypot(Math.max(box.left - point.x, 0, point.x - box.right), Math.max(box.top - point.y, 0, point.y - box.bottom));
    for (const [index, path] of paths.entries()) {
      try {
        let opacity = 1, visible = true;
        for (let ancestor = path; ancestor; ancestor = ancestor.parentElement) { const style = getComputedStyle(ancestor); opacity *= Number(style.opacity); visible = visible && style.display !== 'none' && style.visibility === 'visible'; }
        const style = getComputedStyle(path), strokeWidth = parseFloat(style.strokeWidth), channels = style.stroke.match(/[\d.]+/g)?.map(Number);
        opacity *= Number(style.strokeOpacity) * (channels?.length >= 4 ? channels[3] : 1);
        if (!visible || !opacity || style.stroke === 'none' || !(strokeWidth > 0)) { evidence.push({ path: index, painted: false }); continue; }
        const matrix = path.getScreenCTM(), length = path.getTotalLength();
        if (!matrix || matrix.is2D === false || !Number.isFinite(length) || length <= 0) throw new Error('Unresolved painted path geometry');
        const maximumScale = Math.hypot(matrix.a, matrix.b, matrix.c, matrix.d);
        if (!(maximumScale > 0)) throw new Error('Unresolved SVG transform scale');
        const radius = strokeWidth / 2 * (style.vectorEffect === 'non-scaling-stroke' ? 1 : maximumScale);
        const stepPx = .25, steps = Math.max(1, Math.ceil(length * maximumScale / stepPx));
        const hitRoles = new Set();
        for (let step = 0; step <= steps; step++) {
          const local = path.getPointAtLength(length * step / steps);
          const point = { x:matrix.a*local.x+matrix.c*local.y+matrix.e, y:matrix.b*local.x+matrix.d*local.y+matrix.f };
          if (point.x + radius < homeBox.left || point.x - radius > homeBox.right || point.y + radius < homeBox.top || point.y - radius > homeBox.bottom) continue;
          for (const text of texts) if (text.rect && distance(point, text.rect) <= radius + stepPx) hitRoles.add(text.role);
        }
        const item = { path: index, painted: true, stroke: style.stroke, effectiveOpacity: opacity, maximumScale, radiusPx: radius, sampleSpacingMaximumPx: stepPx, samples: steps + 1, overlap: [...hitRoles] };
        evidence.push(item);
        if (hitRoles.size) collisions.push(item);
      } catch (error) { unknown.push({ path: index, message: error.message }); }
    }
    const searchForm = home.querySelector('form[role="search"]');
    const searchInput = searchForm?.querySelector('input[type="search"][name="q"]');
    const searchSubmit = searchForm?.querySelector('button[type="submit"]');
    const searchRect = rect(searchForm);
    const search = { present: !!searchInput && !!searchSubmit, action: searchForm?.getAttribute('action'), method: searchForm?.getAttribute('method'), rect: searchRect,
      passed: !!searchInput && !!searchSubmit && searchForm.getAttribute('action') === '/catalogo' && searchForm.getAttribute('method')?.toLowerCase() === 'get' && !!searchRect && searchRect.left >= 0 && searchRect.right <= innerWidth && searchRect.top >= fixedHeaderBottom && searchRect.bottom <= innerHeight };
    const decorationsResolved = drawings.length === 0 || paths.length > 0;
    stripes = { hero: homeBox, texts, search, svgCount: drawings.length, pathCount: paths.length, evidence, unknown, collisions, passed: texts.every(text => text.text?.trim() && text.rect && text.rect.width > 0 && text.rect.height > 0 && text.rect.left >= 0 && text.rect.right <= innerWidth) && search.passed && decorationsResolved && unknown.length === 0 && collisions.length === 0, scope: 'Static hero must show its title, introduction, and working GET search above the fold. Optional decorative paths must not cross text: conservative stroke sampling at <=0.25 screen px.' };
  }
  return { catalog, stripes };
}

// Only completely visible card actions below a fixed header are eligible. An overlay
// such as Pardito is intentionally not excluded: its obstruction is the regression.
function measureCatalogHits() {
  const rect = element => { const r = element.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
  const visible = element => { for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) { const s = getComputedStyle(ancestor); if (s.display === 'none' || s.visibility !== 'visible' || Number(s.opacity) === 0) return false; } return true; };
  const fixedHeaderBottom = [...document.querySelectorAll('header')].filter(element => ['fixed', 'sticky'].includes(getComputedStyle(element).position)).reduce((bottom, element) => { const r = rect(element); return r.top <= .5 && r.bottom > 0 ? Math.max(bottom, r.bottom) : bottom; }, 0);
  const grid = document.querySelector('[data-catalog-grid]');
  const triggers = [...document.querySelectorAll('[data-pardito-trigger]')];
  const inViewport = element => { const r = rect(element); return visible(element) && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  const visibleTriggers = triggers.filter(inViewport);
  const trigger = visibleTriggers[0] || triggers[0];
  const triggerRect = trigger ? rect(trigger) : null;
  const triggerVisible = !!trigger && visible(trigger) && triggerRect.width > 0 && triggerRect.height > 0 && triggerRect.bottom > 0 && triggerRect.top < innerHeight && triggerRect.right > 0 && triggerRect.left < innerWidth;
  const controls = [], excluded = [];
  for (const element of grid?.querySelectorAll('[data-design-actions] button,[data-design-actions] a[href]') || []) {
    if (element.matches(':disabled') || !visible(element)) continue;
    const box = rect(element), item = { sku: element.closest('[data-design-card]')?.getAttribute('data-sku'), tag: element.tagName, name: element.getAttribute('aria-label') || element.textContent?.trim(), rect: box };
    const fullyVisible = box.width > 0 && box.height > 0 && box.left >= 0 && box.right <= innerWidth && box.top >= fixedHeaderBottom && box.bottom <= innerHeight;
    if (!fullyVisible) { excluded.push({ ...item, reason: 'Outside the unobstructed viewport or under the fixed header at this scroll position' }); continue; }
    const points = [[.5,.5],[.25,.25],[.75,.25],[.25,.75],[.75,.75]];
    const hits = points.map(([x,y]) => { const point = { x: box.left + box.width*x, y: box.top + box.height*y }, hit = document.elementFromPoint(point.x,point.y); return { ...point, passed: !!hit && (hit === element || element.contains(hit)), occluder: hit?.closest('[data-pardito-trigger]') ? 'PARDITO trigger' : hit?.tagName, occluderClass: hit?.getAttribute('class') }; });
    controls.push({ ...item, hits, passed: hits.every(hit => hit.passed) });
  }
  return { scrollY, viewport: { width: innerWidth, height: innerHeight }, gridPresent: !!grid, fixedHeaderBottom, trigger: { present: !!trigger, visible: triggerVisible, visibleCount: visibleTriggers.length, rect: triggerRect }, controls, excluded, passed: !!grid && controls.length > 0 && controls.every(control => control.passed) };
}

function planViewportCases(options) {
  const cases = [];
  for (const view of options.views) for (const width of options.widths) for (const theme of options.themes) cases.push({ view, width, theme, primary: true });
  const add = (view,width) => { if (!options.widths.includes(width)) for (const theme of options.themes) cases.push({ view,width,theme,primary:false }); };
  if (options.widths.some(width => width >= 1280)) for (const view of options.views.filter(view => ['catalogo','categoria'].includes(view))) add(view,1280);
  if (options.views.includes('inicio') && options.widths.some(width => width < 640)) { add('inicio',360); add('inicio',430); }
  return cases;
}

module.exports = { inside, catalogLayoutChecks, measureViewportLayout, measureCatalogHits, planViewportCases };

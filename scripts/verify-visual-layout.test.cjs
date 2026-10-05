const test = require('node:test');
const assert = require('node:assert/strict');
const { catalogLayoutChecks, planViewportCases, measureViewportLayout, inside } = require('./verify-visual-layout.cjs');
const { groupRows } = require('./verify-visual-browser.cjs');
const box = (left,top,width,height) => ({ left,top,width,height,right:left+width,bottom:top+height });
function catalog(count=4, bottom=890, ratio=4/3) {
  const cards = Array.from({length:count},(_,index)=>({sku:index===0?'0435':String(index),card:box(index*250,500,230,bottom-500),price:box(index*250,780,230,44),actions:box(index*250,830,230,56),frame:box(index*250,500,230,230/ratio)}));
  return {hero:box(0,80,1440,120),display:'grid',templateColumns:'230px '.repeat(count),fixedHeaderBottom:80,cards};
}
const check = (data,viewport={width:1440,height:900},scroll=0) => catalogLayoutChecks(data,viewport,scroll,groupRows(data?.cards||[]),true);

test('four real cards and their full price/actions fit in the initial desktop viewport',()=>{
  const checks=check(catalog());
  assert.ok(checks.catalogHeroHeight.passed);
  assert.ok(checks.catalogFourColumns.passed);
  assert.ok(checks.catalogFirstViewport.passed);
  assert.ok(checks.catalogMediaRatio.passed);
});
test('declared four-column CSS cannot approve a three-card row or an empty grid',()=>{
  const data=catalog(3); data.templateColumns='repeat(4,minmax(0,1fr))';
  assert.equal(check(data).catalogFourColumns.passed,false);
  assert.equal(check(catalog(0)).catalogFourColumns.passed,false);
  assert.equal(check(null).catalogFirstViewport.passed,false);
  assert.equal(check(null).catalogMediaRatio.passed,false);
});
test('the initial viewport gate rejects clipping, overflow actions and a scroll-adjusted screenshot',()=>{
  assert.equal(check(catalog(4,901)).catalogFirstViewport.passed,false);
  const data=catalog(); data.cards[0].actions.bottom=901;
  assert.equal(check(data).catalogFirstViewport.passed,false);
  assert.equal(check(catalog(),{width:1440,height:900},100).catalogFirstViewport.passed,false);
  assert.equal(inside(box(0,0,10,10),{left:0,top:1,right:100,bottom:100}),false);
});
test('390px requires a complete first card through844px and square mobile media',()=>{
  const data=catalog(1,844,1); data.cards[0].card=box(16,500,358,344); data.cards[0].price=box(120,790,140,44); data.cards[0].actions=box(274,790,96,44);
  assert.equal(check(data,{width:390,height:844}).catalogFirstViewport.passed,true);
  assert.equal(check(data,{width:390,height:844}).catalogMediaRatio.passed,true);
  data.cards[0].card.bottom=844.1;
  assert.equal(check(data,{width:390,height:844}).catalogFirstViewport.passed,false);
  data.cards[0].frame=box(16,500,88,66);
  assert.equal(check(data,{width:390,height:844}).catalogMediaRatio.passed,false);
});
test('catalog hero cannot exceed120px and missing frame cannot approve desktop ratio',()=>{
  const data=catalog(); data.hero.height=120.01;
  assert.equal(check(data).catalogHeroHeight.passed,false);
  data.cards[0].frame=null;
  assert.equal(check(data).catalogMediaRatio.passed,false);
  assert.equal(check(catalog(4,890,1)).catalogMediaRatio.passed,false);
});
test('coverage includes1280 boundary and all three narrow home widths without duplicates',()=>{
  const planned=planViewportCases({views:['inicio','catalogo','categoria'],widths:[390,1440],themes:['light','dark']});
  assert.equal(planned.filter(item=>item.primary).length,12);
  assert.equal(planned.filter(item=>!item.primary).length,8);
  assert.equal(planned.filter(item=>item.view==='inicio').length,8);
  const keys=planned.map(item=>[item.view,item.width,item.theme].join('-'));
  assert.equal(new Set(keys).size,keys.length);
  assert.ok(planned.some(item=>item.view==='catalogo'&&item.width===1280));
  assert.equal(planViewportCases({views:['catalogo'],widths:[1280],themes:['light']}).length,1);
});

test('static home requires genuine visible copy and a GET catalog search within the first viewport', () => {
  const saved = { document: global.document, innerWidth: global.innerWidth, innerHeight: global.innerHeight };
  const title = { textContent: 'Grandes proyectos.', getBoundingClientRect: () => box(16, 130, 358, 96) };
  const intro = { textContent: 'La herramienta indicada.', getBoundingClientRect: () => box(16, 240, 358, 72) };
  const form = { attributes: { action: '/catalogo', method: 'get' }, search: true, submit: true, rect: box(16, 336, 358, 56),
    getBoundingClientRect() { return this.rect; },
    getAttribute(name) { return this.attributes[name]; },
    querySelector(selector) { return selector.startsWith('input') ? this.search && {} : this.submit && {}; },
  };
  const home = {
    getBoundingClientRect: () => box(0, 80, 390, 764),
    querySelector: selector => selector.startsWith('[data-home-title') ? title : selector === '[data-home-intro]' ? intro : selector.startsWith('form') ? form : null,
    querySelectorAll: () => [],
  };
  global.document = { querySelectorAll: () => [], querySelector: selector => selector === '.home-hero' ? home : null };
  global.innerWidth = 390;
  global.innerHeight = 844;
  try {
    assert.equal(measureViewportLayout().stripes.passed, true, 'a static hero does not need decorative SVGs or carousel controls');
    form.rect.bottom = 845;
    assert.equal(measureViewportLayout().stripes.passed, false, 'search must not slip below the fold');
    form.rect.bottom = 392;
    form.attributes.action = '/incorrect';
    assert.equal(measureViewportLayout().stripes.passed, false);
    form.attributes.action = '/catalogo';
    form.attributes.method = 'post';
    assert.equal(measureViewportLayout().stripes.passed, false);
    form.attributes.method = 'get';
    form.submit = false;
    assert.equal(measureViewportLayout().stripes.passed, false);
    form.submit = true;
    title.textContent = ' ';
    assert.equal(measureViewportLayout().stripes.passed, false);
    title.textContent = 'Grandes proyectos.';
    title.getBoundingClientRect = () => box(16, 130, 390, 96);
    assert.equal(measureViewportLayout().stripes.passed, false, 'headline overflow must fail');
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete global[name]; else global[name] = value;
    }
  }
});

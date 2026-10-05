#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { performance } = require("node:perf_hooks");

const repoRoot = path.resolve(__dirname, "..");
const productionOrigin = "https://ferre-oficial.vercel.app";

function origin(value, flag) {
  let url;
  try { url = new URL(value); } catch { throw new Error(`${flag} requires an absolute HTTP(S) origin`); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`${flag} requires an HTTP(S) origin without a path, credentials, query or fragment`);
  }
  return url.origin;
}

function parseArgs(argv) {
  const options = { requireIsr: false, canonicalOrigin: productionOrigin, output: path.resolve(repoRoot, "../outputs/catalog-http/report.json") };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (flag === "--help") { options.help = true; continue; }
    if (flag === "--require-isr") { options.requireIsr = true; continue; }
    if (!["--url", "--output", "--canonical-origin"].includes(flag)) throw new Error(`Unknown argument: ${flag}`);
    const value = argv[++index];
    if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
    if (flag === "--url") options.url = origin(value, flag);
    if (flag === "--canonical-origin") options.canonicalOrigin = origin(value, flag);
    if (flag === "--output") options.output = path.resolve(value);
  }
  if (!options.help && !options.url) throw new Error("--url is required");
  const relative = path.relative(repoRoot, options.output);
  if (!relative.startsWith(".." + path.sep) && !path.isAbsolute(relative)) throw new Error("--output must be outside the repository");
  return options;
}

function decodeHtml(value) {
  const named = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: "\u00a0" };
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (all, entity) => {
    if (entity[0] !== "#") return named[entity.toLowerCase()] ?? all;
    const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : all;
  });
}

function attributes(tag) {
  const result = {};
  const body = tag.replace(/^<\/?[\w:-]+/, "").replace(/\/?\s*>$/, "");
  const pattern = /([^\s=<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of body.matchAll(pattern)) result[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? "");
  return result;
}

function textContent(html) { return decodeHtml(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim(); }
function hasType(schema, type) { return schema?.["@type"] === type || (Array.isArray(schema?.["@type"]) && schema["@type"].includes(type)); }
function findSchema(schemas, type) {
  for (const schema of schemas) {
    if (hasType(schema, type)) return schema;
    const nested = Array.isArray(schema?.["@graph"]) ? findSchema(schema["@graph"], type) : undefined;
    if (nested) return nested;
  }
}

// Only inspect real HTML tags. Flight scripts can contain product data even when
// a CSR bailout leaves no cards in the initial HTML, so they cannot count as SSR.
function parseHtml(html) {
  const schemas = [], schemaErrors = [];
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    if (attributes(match[0].slice(0, match[0].indexOf(">") + 1)).type !== "application/ld+json") continue;
    try {
      const schema = JSON.parse(match[1]);
      schemas.push(...(Array.isArray(schema) ? schema : [schema]));
    } catch (error) { schemaErrors.push(error.message); }
  }
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, "")
    .replace(/<template\b[^>]*>[\s\S]*?<\/template\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  const tags = Array.from(visible.matchAll(/<[a-z][^>]*>/gi), match => ({ tag: match[0].match(/^<([\w:-]+)/)[1].toLowerCase(), attrs: attributes(match[0]) }));
  const meta = (key, value) => tags.find(tag => tag.tag === "meta" && tag.attrs[key]?.toLowerCase() === value)?.attrs.content || null;
  const canonical = tags.find(tag => tag.tag === "link" && tag.attrs.rel?.split(/\s+/).includes("canonical"))?.attrs.href || null;
  const cards = Array.from(visible.matchAll(/<article\b[^>]*>[\s\S]*?<\/article\s*>/gi), match => {
    const links = Array.from(match[0].matchAll(/<a\b[^>]*>/gi), link => attributes(link[0]).href).filter(Boolean);
    return links.find(href => { try { return new URL(href, productionOrigin).pathname.startsWith("/producto/"); } catch { return false; } }) || null;
  });
  return {
    title: textContent(visible.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] || ""),
    description: meta("name", "description"), ogDescription: meta("property", "og:description"), robots: meta("name", "robots"), canonical,
    h1: Array.from(visible.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi), match => textContent(match[1])),
    cards, schemas, schemaErrors,
    loading: tags.some(tag => tag.tag === "section" && tag.attrs["aria-busy"] === "true") || /PARDITO está buscando tus productos|Buscando productos…|No pudimos cargar el catálogo/.test(textContent(visible)),
  };
}

function sourceModules() {
  // Execute the repository's pure TS helpers in memory; no emitted files or build.
  const ts = require("typescript"), cache = new Map();
  const emptyComponent = { __esModule: true, default() { return null; } };
  function load(relative) {
    const filename = path.resolve(repoRoot, relative);
    if (cache.has(filename)) return cache.get(filename);
    if (filename.endsWith(".json")) return JSON.parse(fs.readFileSync(filename, "utf8"));
    const exports = {};
    cache.set(filename, exports);
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), { fileName: filename, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    vm.runInNewContext(compiled, { exports, process, Intl, URL, URLSearchParams, setTimeout, clearTimeout, require(name) {
      if (name === "server-only") return {};
      if (name === "../CatalogClient" || name === "../Breadcrumbs") return emptyComponent;
      if (name.startsWith(".") || name.startsWith("@/")) {
        const base = name.startsWith("@/") ? path.resolve(repoRoot, "src", name.slice(2)) : path.resolve(path.dirname(filename), name);
        const target = [base, base + ".ts", base + ".tsx", base + ".json"].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (!target) throw new Error(`Cannot resolve source helper ${name}`);
        return load(path.relative(repoRoot, target));
      }
      return require(name);
    } }, { filename });
    return exports;
  }
  return {
    ...load("src/lib/catalog-service.ts"), ...load("src/lib/catalog-filters.ts"), ...load("src/lib/utils.ts"),
    ...load("src/lib/catalog/routes.ts"), ...load("src/lib/product-enrichment.ts"),
    ...load("src/lib/catalog/categories.ts"), ...load("src/components/catalog/CatalogPage.tsx"),
  };
}

function selectFixtures(products, getPrice, imagePath) {
  const choose = (preferred, condition) => products.find(product => product.id === preferred && condition(product)) || products.find(condition);
  const photo = choose("0435", product => !!imagePath(product.img) && getPrice(product, "gross") !== null);
  const noPhoto = choose("00050", product => !imagePath(product.img) && getPrice(product, "gross") !== null);
  const pending = products.find(product => getPrice(product, "gross") === null);
  if (!photo || !noPhoto || !pending) throw new Error("The real catalog must contain confirmed-price products with/without a photo and one pending-price product");
  return [{ kind: "photo", product: photo }, { kind: "no-photo", product: noPhoto }, { kind: "price-unknown", product: pending }];
}

const check = (name, passed, actual, expected) => ({ name, passed: !!passed, actual, ...(expected === undefined ? {} : { expected }) });
const pathname = value => { try { return new URL(value, productionOrigin).pathname; } catch { return null; } };
const redirectDestination = (location, requestUrl) => { try { return location ? new URL(location, requestUrl).href : null; } catch { return null; } };
const equal = (first, second) => JSON.stringify(first) === JSON.stringify(second);

function inspectCatalog(parsed, expected, metadata, h1, canonicalOrigin) {
  const list = findSchema(parsed.schemas, "ItemList");
  const paths = list?.itemListElement?.map(item => pathname(item.url)) || [];
  const expectedPaths = expected.products.map(product => expected.getProductPath(product));
  const cardPaths = parsed.cards.map(pathname);
  const canonical = new URL(metadata.alternates.canonical, canonicalOrigin).href;
  const index = /(?:^|,)\s*index\s*(?:,|$)/i.test(parsed.robots || "");
  const noindex = /(?:^|,)\s*noindex\s*(?:,|$)/i.test(parsed.robots || "");
  return [
    check("server-h1", equal(parsed.h1, [h1]), parsed.h1, [h1]),
    check("server-metadata", !!parsed.title && !!parsed.description, { title: parsed.title, description: parsed.description }),
    check("public-canonical", parsed.canonical === canonical, parsed.canonical, canonical),
    check("robots", (metadata.robots.index ? index && !noindex : noindex && !index) && /(?:^|,)\s*follow\s*(?:,|$)/i.test(parsed.robots || ""), parsed.robots, metadata.robots),
    check("no-initial-loader", !parsed.loading, parsed.loading, false),
    check("jsonld-valid", parsed.schemaErrors.length === 0, parsed.schemaErrors, []),
    check("server-cards", equal(cardPaths, expectedPaths) && new Set(cardPaths).size === expectedPaths.length, cardPaths, expectedPaths),
    check("filtered-itemlist", !!list && equal(paths, expectedPaths), paths, expectedPaths),
    check("itemlist-positions", !!list && list.itemListElement.every((item, index) => item.position === (expected.page - 1) * expected.pageSize + index + 1), list?.itemListElement?.map(item => item.position) || [], expectedPaths.map((_, index) => (expected.page - 1) * expected.pageSize + index + 1)),
  ];
}

function inspectProduct(parsed, product, source, canonicalOrigin) {
  const gross = source.getCatalogPrice(product, "gross");
  const prefix = gross === null ? "Precio por confirmar" : `${source.formatCOP(gross)} IVA incluido`;
  const schema = findSchema(parsed.schemas, "Product");
  const expectedCanonical = new URL(source.getProductPath(product), canonicalOrigin).href;
  const offers = schema?.offers;
  return [
    check("server-h1", parsed.h1.length === 1, parsed.h1),
    check("public-canonical", parsed.canonical === expectedCanonical, parsed.canonical, expectedCanonical),
    check("price-description-prefix", parsed.description?.startsWith(prefix + ". "), parsed.description, prefix + ". "),
    check("og-price-prefix", parsed.ogDescription?.startsWith(prefix + " | "), parsed.ogDescription, prefix + " | "),
    check("literal-sku", schema?.sku === product.id, schema?.sku ?? null, product.id),
    check("jsonld-valid", parsed.schemaErrors.length === 0, parsed.schemaErrors, []),
    check("offer-price", gross === null ? offers === undefined : offers?.price === gross && offers?.priceCurrency === "COP" && offers?.priceSpecification?.valueAddedTaxIncluded === true, offers?.price ?? null, gross),
    check("offer-canonical", gross === null ? offers === undefined : offers?.url === expectedCanonical, offers?.url ?? null, gross === null ? null : expectedCanonical),
    check("offer-stock", gross === null ? offers === undefined : offers?.availability === (source.getAvailableQuantity(product) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"), offers?.availability ?? null),
  ];
}

async function get(url) {
  const start = performance.now();
  try {
    const response = await fetch(url, { method: "GET", redirect: "manual", headers: { Accept: "text/html" }, signal: AbortSignal.timeout(30000) });
    const html = await response.text();
    const headers = Object.fromEntries(["x-vercel-cache", "x-nextjs-cache", "x-vercel-id", "cache-control", "age", "location", "content-type"].map(name => [name, response.headers.get(name)]));
    return { url, status: response.status, headers, elapsedMs: Math.round(performance.now() - start), parsed: parseHtml(html) };
  } catch (error) { return { url, status: null, headers: {}, elapsedMs: Math.round(performance.now() - start), error: error.message, parsed: parseHtml("") }; }
}

async function run(options) {
  const report = { startedAt: new Date().toISOString(), baseUrl: options.url, canonicalOrigin: options.canonicalOrigin, requireIsr: options.requireIsr, nextVersion: require("next/package.json").version, methodology: "Sequential GET, manual redirects, no cookies/cache-busting/retries; compares initial HTML with the checked-out public catalog snapshot.", records: [], checks: [] };
  try {
    const source = sourceModules();
    const category = source.CATALOG_CATEGORIES.find(item => item.slug === "cerrajeria") || source.CATALOG_CATEGORIES[0];
    const paths = ["/catalogo", "/catalogo/" + category.slug];
    async function catalogRequest(publicPath, label, expectedCount) {
      const publicUrl = new URL(publicPath, options.url);
      const currentCategory = publicUrl.pathname === "/catalogo" ? undefined : category;
      const params = new URLSearchParams(publicUrl.search);
      if (currentCategory) params.set("cat", currentCategory.name);
      const expected = source.queryCatalog(params);
      const metadata = source.catalogMetadata({ category: currentCategory, searchParams: Object.fromEntries(publicUrl.searchParams) });
      const result = await get(publicUrl.href);
      const checks = [check("http-200", result.status === 200, result.status, 200), ...inspectCatalog(result.parsed, { ...expected, getProductPath: source.getProductPath }, metadata, currentCategory?.name || "Catálogo Ferretería Pardo", options.canonicalOrigin)];
      if (expectedCount !== undefined) checks.push(check("required-card-count", result.parsed.cards.length === expectedCount, result.parsed.cards.length, expectedCount));
      report.records.push({ label, url: result.url, status: result.status, headers: result.headers, elapsedMs: result.elapsedMs, ...(result.error ? { error: result.error } : {}), checks });
      return result;
    }
    for (const publicPath of paths) {
      await catalogRequest(publicPath, "clean-first", 24);
      const second = await catalogRequest(publicPath, "clean-second", 24);
      report.checks.push(check("second-get-isr:" + publicPath, !options.requireIsr || second.headers["x-vercel-cache"] === "HIT", second.headers["x-vercel-cache"] ?? null, options.requireIsr ? "HIT" : "report-only; use --require-isr for production delivery"));
    }
    // Queries must not overwrite or reuse the first-page ISR HTML.
    for (const publicPath of ["/catalogo?q=0435", "/catalogo?brand=YALE", "/catalogo?sort=price-asc", "/catalogo?page=2", "/catalogo?q=zzzz-inexistente-92846", paths[1] + "?page=2"]) {
      await catalogRequest(publicPath, "dynamic-query");
    }
    await catalogRequest("/catalogo", "clean-after-queries", 24);
    for (const fixture of selectFixtures(source.getCatalogProducts(), source.getCatalogPrice, source.getLocalProductImagePath)) {
      const result = await get(new URL(source.getProductPath(fixture.product), options.url).href);
      report.records.push({ label: "product-" + fixture.kind, sku: fixture.product.id, url: result.url, status: result.status, headers: result.headers, elapsedMs: result.elapsedMs, ...(result.error ? { error: result.error } : {}), checks: [check("http-200", result.status === 200, result.status, 200), ...inspectProduct(result.parsed, fixture.product, source, options.canonicalOrigin)] });
    }
    for (const publicPath of ["/catalogo-interno?q=0435", "/catalogo-interno/cerrajeria?page=2"]) {
      const result = await get(new URL(publicPath, options.url).href);
      const expected = new URL(publicPath.replace("/catalogo-interno", "/catalogo"), options.url).href;
      report.records.push({ label: "internal-direct", url: result.url, status: result.status, headers: result.headers, checks: [check("public-301", result.status === 301 && redirectDestination(result.headers.location, result.url) === expected, { status: result.status, location: result.headers.location }, { status: 301, location: expected })] });
    }
  } catch (error) { report.checks.push(check("audit-completed", false, error.message)); }
  report.finishedAt = new Date().toISOString();
  const all = [...report.checks, ...report.records.flatMap(record => record.checks)];
  report.summary = { passed: all.every(item => item.passed), checks: all.length, failed: all.filter(item => !item.passed).length, requests: report.records.length, isrRequired: options.requireIsr };
  fs.mkdirSync(path.dirname(options.output), { recursive: true });
  fs.writeFileSync(options.output, JSON.stringify(report, null, 2) + "\n");
  return report;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log("node scripts/verify-catalog-http.cjs --url https://ferre-oficial.vercel.app --require-isr --output ../outputs/catalog-http/production.json [--canonical-origin https://ferre-oficial.vercel.app]");
    return;
  }
  const report = await run(options);
  console.log(JSON.stringify({ ...report.summary, output: options.output }));
  for (const record of report.records) for (const result of record.checks) if (!result.passed) console.error(`${record.label} ${record.url}: ${result.name}`);
  for (const result of report.checks) if (!result.passed) console.error(`${result.name}: ${JSON.stringify(result.actual)}`);
  if (!report.summary.passed) process.exitCode = 1;
}

module.exports = { parseArgs, decodeHtml, attributes, parseHtml, findSchema, selectFixtures, inspectCatalog, inspectProduct, redirectDestination, run };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });

#!/usr/bin/env node
"use strict";

// Install audit dependencies in a temporary prefix, never in the application:
// npm install --prefix <tools> --no-save --package-lock=false --ignore-scripts lighthouse@13.5.0 chrome-launcher@1.2.2
// node scripts/verify-lighthouse-mobile.cjs --base-url http://127.0.0.1:3010 --output <reports> --chrome-path <Chrome> --audit-tools <tools>
// Official programmatic API: https://github.com/GoogleChrome/lighthouse/blob/main/docs/readme.md

const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { createRequire } = require("node:module");
const { pathToFileURL } = require("node:url");

const MIN_PERFORMANCE = 95;
const MAX_CLS = 0.1;
const PRODUCT_PATH = "/producto/0435-bisagra-parche-mob-mini-par";

function parseArgs(argv) {
  const values = {};
  const allowed = new Set(["base-url", "output", "chrome-path", "audit-tools", "runs", "product-path"]);
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (!argument.startsWith("--") || !allowed.has(argument.slice(2))) throw new Error(`Unknown argument: ${argument}`);
    const key = argument.slice(2);
    if (key in values) throw new Error(`Duplicate argument: --${key}`);
    const value = argv[++index];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    values[key] = value;
  }
  const base = new URL(values["base-url"] || "http://127.0.0.1:3010");
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || !["", "/"].includes(base.pathname)) {
    throw new Error("--base-url must be an HTTP(S) origin without credentials, path, query or fragment.");
  }
  if (!values.output) throw new Error("--output is required; use a report directory outside the repository.");
  const productPath = values["product-path"] || PRODUCT_PATH;
  const product = new URL(productPath, base);
  if (!productPath.startsWith("/producto/") || product.origin !== base.origin || product.search || product.hash) throw new Error("--product-path must be a same-origin product path without query or fragment.");
  const runs = Number(values.runs || 1);
  if (!Number.isInteger(runs) || runs < 1 || runs > 5) throw new Error("--runs must be an integer from 1 to 5.");
  const chromePath = values["chrome-path"] || process.env.CHROME_PATH;
  if (!chromePath) throw new Error("--chrome-path (or CHROME_PATH) is required; use an installed official Chrome/Chromium executable.");
  return {
    baseURL: base.origin, output: path.resolve(values.output), chromePath: path.resolve(chromePath), runs,
    auditTools: values["audit-tools"] ? path.resolve(values["audit-tools"]) : undefined,
    targets: [{ key: "catalogo", path: "/catalogo" }, { key: "ficha-foto", path: product.pathname }],
  };
}

function evaluateLhr(lhr) {
  const score = lhr?.categories?.performance?.score;
  const cls = lhr?.audits?.["cumulative-layout-shift"]?.numericValue;
  const validPerformance = typeof score === "number" && Number.isFinite(score) && score >= 0 && score <= 1;
  const validCls = typeof cls === "number" && Number.isFinite(cls) && cls >= 0;
  const checks = [
    { label: "Lighthouse completed without a runtime error", pass: !lhr?.runtimeError },
    { label: "Mobile form factor", pass: lhr?.configSettings?.formFactor === "mobile" },
    { label: "Performance >= 95", pass: validPerformance && score >= MIN_PERFORMANCE / 100 },
    { label: "CLS < 0.1", pass: validCls && cls < MAX_CLS },
  ];
  const numeric = (id) => {
    const value = lhr?.audits?.[id]?.numericValue;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  };
  return {
    passed: checks.every((check) => check.pass), checks,
    performance: validPerformance ? score * 100 : null,
    accessibility: typeof lhr?.categories?.accessibility?.score === "number" ? lhr.categories.accessibility.score * 100 : null,
    seo: typeof lhr?.categories?.seo?.score === "number" ? lhr.categories.seo.score * 100 : null,
    cls: validCls ? cls : null,
    firstContentfulPaintMs: numeric("first-contentful-paint"), largestContentfulPaintMs: numeric("largest-contentful-paint"),
    totalBlockingTimeMs: numeric("total-blocking-time"), speedIndexMs: numeric("speed-index"),
    runWarnings: lhr?.runWarnings || [], runtimeError: lhr?.runtimeError || null,
  };
}

async function main(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log("Usage: node scripts/verify-lighthouse-mobile.cjs --base-url <origin> --output <directory> --chrome-path <executable> [--audit-tools <temporary-prefix>] [--runs 1..5] [--product-path /producto/sku-slug]\nFixed gates: mobile performance >=95 and CLS <0.1. Every requested run must pass; all reports and warnings are retained.");
    return 0;
  }
  await fs.mkdir(options.output, { recursive: true });
  const summary = {
    dateUTC: new Date().toISOString(), baseURL: options.baseURL,
    thresholds: { performance: MIN_PERFORMANCE, clsExclusiveMaximum: MAX_CLS },
    methodology: "Fresh Chrome profile per route/run; default Lighthouse simulated mobile throttling. All requested runs must pass. No retries, discarded runs, CPU recalibration or best-result selection.",
    requestedRunsPerRoute: options.runs,
    context: { node: process.version, platform: process.platform, architecture: process.arch, cpuCount: os.cpus().length, cpuModel: os.cpus()[0]?.model || null, totalMemoryBytes: os.totalmem(), commit: process.env.GITHUB_SHA || null },
    results: [], errors: [],
  };
  let configurationError = false;
  try {
    await fs.access(options.chromePath);
    const auditRequire = options.auditTools ? createRequire(path.join(options.auditTools, "package.json")) : require;
    const lighthouse = (await import(pathToFileURL(auditRequire.resolve("lighthouse")).href)).default;
    const chromeLauncher = await import(pathToFileURL(auditRequire.resolve("chrome-launcher")).href);
    for (const target of options.targets) {
      for (let run = 1; run <= options.runs; run++) {
        const name = `${target.key}-mobile-${run}`;
        const url = new URL(target.path, options.baseURL).href;
        let chrome;
        try {
          chrome = await chromeLauncher.launch({
            chromePath: options.chromePath,
            chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
            logLevel: "silent",
          });
          const result = await lighthouse(url, {
            port: chrome.port, output: "html", logLevel: "error", formFactor: "mobile",
            throttlingMethod: "simulate", onlyCategories: ["performance", "accessibility", "seo"],
          });
          if (!result?.lhr) throw new Error("Lighthouse did not return an audit result.");
          const jsonFile = `${name}.json`, htmlFile = `${name}.html`;
          // Full results preserve diagnostics, machine warnings and the measurement configuration.
          await fs.writeFile(path.join(options.output, jsonFile), JSON.stringify(result.lhr, null, 2) + "\n");
          const html = Array.isArray(result.report) ? result.report[0] : result.report;
          if (typeof html !== "string") throw new Error("Lighthouse did not return its HTML report.");
          await fs.writeFile(path.join(options.output, htmlFile), html);
          const measured = evaluateLhr(result.lhr);
          const finalURL = result.lhr.finalDisplayedUrl || result.lhr.finalUrl || result.lhr.requestedUrl;
          const destination = new URL(finalURL || url);
          measured.checks.push({ label: "Audit stays on the requested origin and route", pass: destination.origin === options.baseURL && destination.pathname === target.path });
          measured.passed = measured.checks.every((check) => check.pass);
          const record = { key: target.key, run, requestedURL: url, finalURL, lighthouseVersion: result.lhr.lighthouseVersion, fetchTime: result.lhr.fetchTime, benchmarkIndex: result.lhr.environment?.benchmarkIndex ?? null, browserUserAgent: result.lhr.environment?.hostUserAgent || result.lhr.userAgent || null, settings: result.lhr.configSettings, jsonFile, htmlFile, ...measured };
          summary.results.push(record);
          console.log(JSON.stringify({ key: target.key, run, performance: measured.performance, cls: measured.cls, passed: measured.passed, warnings: measured.runWarnings }));
        } catch (error) {
          const message = String(error.message || error).slice(0, 500);
          const failure = { key: target.key, run, requestedURL: url, passed: false, error: message };
          summary.results.push(failure);
          await fs.writeFile(path.join(options.output, `${name}-error.json`), JSON.stringify(failure, null, 2) + "\n");
          console.error(JSON.stringify({ key: target.key, run, passed: false, error: message }));
        } finally {
          if (chrome) await chrome.kill();
        }
      }
    }
  } catch (error) {
    configurationError = true;
    summary.errors.push(String(error.message || error).slice(0, 500));
  }
  const expected = options.targets.length * options.runs;
  summary.passed = !summary.errors.length && summary.results.length === expected && summary.results.every((result) => result.passed);
  summary.expectedMeasurements = expected;
  summary.retainedMeasurements = summary.results.length;
  await fs.writeFile(path.join(options.output, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
  console.log(JSON.stringify({ report: path.join(options.output, "summary.json"), passed: summary.passed, retainedMeasurements: summary.retainedMeasurements, errors: summary.errors }));
  return configurationError ? 2 : summary.passed ? 0 : 1;
}

module.exports = { parseArgs, evaluateLhr };
if (require.main === module) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }).catch((error) => {
    console.error(String(error.message || error).slice(0, 500));
    process.exitCode = 2;
  });
}

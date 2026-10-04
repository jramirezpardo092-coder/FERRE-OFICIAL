const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
module.exports = function createLoader(overrides = {}) {
  const modules = new Map();
  function load(relative) {
    const filename = path.resolve(__dirname, "..", relative);
    if (modules.has(filename)) return modules.get(filename);
    if (filename.endsWith(".json")) return JSON.parse(fs.readFileSync(filename, "utf8"));
    const exports = {}; modules.set(filename, exports);
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), { fileName: filename, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    vm.runInNewContext(source, { exports, process, Intl, URL, URLSearchParams, setTimeout, clearTimeout, require(name) {
      if (name in overrides) return overrides[name];
      if (name === "server-only") return {};
      if (name.startsWith(".") || name.startsWith("@/")) {
        const base = name.startsWith("@/") ? path.resolve(__dirname, "../src", name.slice(2)) : path.resolve(path.dirname(filename), name);
        const target = [base, base + ".ts", base + ".tsx", base + ".json"].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (!target) throw new Error(`Missing ${name} in ${filename}`);
        return load(path.relative(path.resolve(__dirname, ".."), target));
      }
      return require(name);
    } }, { filename });
    return exports;
  }
  return load;
};

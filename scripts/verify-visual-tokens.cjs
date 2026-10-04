#!/usr/bin/env node
/* Static source audit: inspect the AST, so comments cannot hide or create findings. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const postcss = require('postcss');

const SEMANTIC_COLORS = new Set(['paper', 'surface', 'ink', 'ink-2', 'line', 'control', 'brand', 'brand-press', 'brand-text', 'brand-tint', 'on-brand', 'on-ink', 'ok', 'warn', 'muted', 'wa', 'wa-edge', 'on-wa', 'hero', 'hero-ink', 'hero-muted', 'photo', 'overlay']);
const PALETTE = /^(?:white|black|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3})(?:\/.*)?$/;
const COLOR_UTILITY = /^(?:bg|text|placeholder|decoration|fill|stroke|accent|caret|outline|shadow|ring(?:-offset)?|divide|border(?:-[xytrblse])?|from|via|to)-(.+)$/;
const STRUCTURAL = new Set(['transparent', 'current', 'currentColor', 'inherit']);
const COLOR_STYLE = /^(?:color|background(?:color|image)?|border(?:top|right|bottom|left|inline|block|inlineStart|inlineEnd|blockStart|blockEnd)?(?:color)?|outline(?:color)?|boxshadow|textshadow|fill|stroke|accentcolor|caretcolor|textdecorationcolor|columnrule(?:color)?)$/i;

function classifyStyleColor(property, value) {
  if (!COLOR_STYLE.test(property.replaceAll('-', ''))) return null;
  if (/(?:linear|radial|conic)-gradient\(/i.test(value)) return 'gradient';
  const variables = [...value.matchAll(/var\(\s*--([\w-]+)/g)].map(match => match[1]);
  if (variables.some(name => !SEMANTIC_COLORS.has(name))) return 'unknown-color-variable';
  if (/#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})\b/i.test(value)) return 'literal-color';
  for (const match of value.matchAll(/(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/gi)) {
    let depth = 1, end = match.index + match[0].length;
    for (; end < value.length && depth; end++) {
      if (value[end] === '(') depth++;
      if (value[end] === ')') depth--;
    }
    if (!/var\(\s*--/.test(value.slice(match.index, end))) return 'literal-color';
  }
  const remaining = value.replace(/url\([^)]*\)/gi, '').replace(/var\(\s*--[\w-]+\s*\)/g, '');
  const words = remaining.match(/[a-z]+(?:-[a-z]+)*/gi) || [];
  const allowed = new Set(['none', 'transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'revert', 'revert-layer', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'hidden', 'rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color', 'calc', 'px', 'em', 'rem', 'vh', 'vw', 'vmin', 'vmax', 'thin', 'medium', 'thick']);
  return words.some(word => !allowed.has(word.toLowerCase())) ? 'literal-color' : null;
}

function withoutVariants(token) {
  let depth = 0, last = -1;
  for (let i = 0; i < token.length; i++) {
    if (token[i] === '[' || token[i] === '(') depth++;
    if (token[i] === ']' || token[i] === ')') depth--;
    if (token[i] === ':' && depth === 0) last = i;
  }
  return token.slice(last + 1).replace(/^!/, '');
}

function classifyUtility(token) {
  const base = withoutVariants(token);
  const match = base.match(COLOR_UTILITY);
  if (!match) return null;
  const value = match[1];
  if (PALETTE.test(value)) return 'tailwind-palette';
  if (/^gradient-to-/.test(value)) return 'gradient';
  const plain = value.split('/')[0];
  if (SEMANTIC_COLORS.has(plain) || STRUCTURAL.has(plain)) return null;
  if (/^brand-/.test(plain) || /^ferro-/.test(plain)) return 'unknown-color-token';
  if (!value.startsWith('[')) return null; // Widths, alignment and type scale are not colors.
  const arbitrary = value.slice(1, value.lastIndexOf(']')).replace(/_/g, ' ');
  if (/#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})\b/i.test(arbitrary)) return 'arbitrary-hex';
  if (/(?:linear|radial|conic)-gradient\(/i.test(arbitrary)) return 'gradient';
  if (/var\(--/.test(arbitrary)) {
    const names = [...arbitrary.matchAll(/var\(--([\w-]+)/g)].map(m => m[1]);
    return names.every(name => SEMANTIC_COLORS.has(name)) ? null : 'unknown-color-variable';
  }
  if (/^(?:color:)?(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/i.test(arbitrary) || /^color:/i.test(arbitrary)) return 'literal-color';
  if (['none', 'transparent', 'currentColor', 'inherit', 'center', 'top', 'bottom', 'left', 'right'].includes(arbitrary)) return null;
  if (/^(?:bg|text|border|fill|stroke)-\[/.test(base) && /^[a-z]+$/i.test(arbitrary)) return 'literal-color';
  return null;
}

function scanSource(source, file = 'component.tsx') {
  const kind = /\.tsx?$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.JSX;
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, kind);
  const findings = [], seen = new Set();
  function report(node, value, rule) {
    const start = node.getStart(ast);
    const key = `${start}:${value}:${rule}`;
    if (seen.has(key)) return;
    seen.add(key);
    const pos = ast.getLineAndCharacterOfPosition(start);
    findings.push({ file, line: pos.line + 1, column: pos.character + 1, rule, value });
  }
  function inspect(node, value) {
    for (const token of value.split(/\s+/).filter(Boolean)) {
      const rule = classifyUtility(token);
      if (rule) report(node, token, rule);
    }
    for (const hex of value.matchAll(/#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})\b/gi)) report(node, hex[0], 'literal-hex');
    for (const color of value.matchAll(/(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(\s*[^)]*/gi)) {
      if (!/\bvar\(--/.test(color[0])) report(node, color[0], 'literal-color');
    }
  }
  function constant(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const left = constant(node.left), right = constant(node.right);
      if (left !== null && right !== null) return left + right;
    }
    return null;
  }
  function visit(node) {
    if (ts.isPropertyAssignment(node)) {
      const name = ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) ? node.name.text : null;
      let ancestor = node.parent;
      while (ancestor && !ts.isJsxAttribute(ancestor) && !ts.isStatement(ancestor)) ancestor = ancestor.parent;
      const value = constant(node.initializer);
      if (name && value !== null && ancestor && ts.isJsxAttribute(ancestor) && ancestor.name.text === 'style') {
        const rule = classifyStyleColor(name, value);
        if (rule) report(node.initializer, value, rule);
      }
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) inspect(node, node.text);
    if (ts.isTemplateExpression(node)) {
      const fragments = [node.head, ...node.templateSpans.map(span => span.literal)];
      fragments.forEach(fragment => inspect(fragment, fragment.text));
      const dynamicPrefix = /(?:^|\s|:)(?:bg|text|border|ring|fill|stroke|from|via|to)-$/;
      fragments.slice(0, -1).forEach(fragment => { if (dynamicPrefix.test(fragment.text)) report(fragment, fragment.text, 'dynamic-color-utility'); });
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const value = constant(node);
      if (value !== null) inspect(node, value);
      else if (ts.isStringLiteral(node.left) && /(?:bg|text|border|ring|fill|stroke)-$/.test(node.left.text)) report(node, node.left.text, 'dynamic-color-utility');
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  for (const diagnostic of ast.parseDiagnostics) report(ast, ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'), 'parse-error');
  return findings;
}

function scanCss(source, file = 'component.css') {
  const findings = [];
  try {
    postcss.parse(source, { from: file }).walkDecls(declaration => {
      const rule = classifyStyleColor(declaration.prop, declaration.value);
      if (rule) findings.push({ file, line: declaration.source.start.line, column: declaration.source.start.column, rule, value: `${declaration.prop}: ${declaration.value}` });
    });
  } catch (error) {
    findings.push({ file, line: error.line || 1, column: error.column || 1, rule: 'css-parse-error', value: error.reason || error.message });
  }
  return findings;
}

function scanRepository(root) {
  const roots = ['src/components', 'src/app'];
  const files = [];
  function walk(directory) {
    if (!fs.existsSync(directory)) throw new Error(`Missing source scope: ${directory}`);
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.[jt]sx?$/.test(file) || (file.endsWith('.css') && path.relative(root, file).replaceAll(path.sep, '/') !== 'src/app/globals.css')) files.push(file);
    }
  }
  roots.forEach(scope => walk(path.join(root, scope)));
  const findings = files.flatMap(file => (file.endsWith('.css') ? scanCss : scanSource)(fs.readFileSync(file, 'utf8'), path.relative(root, file).replaceAll(path.sep, '/')));
  return { generatedAt: new Date().toISOString(), scope: roots, filesScanned: files.length, passed: findings.length === 0, findingCount: findings.length, findings, coverage: 'AST literals, concatenations, template fragments and inline style colors; color declarations in component CSS and app CSS except globals.css token definitions. Runtime expressions are additionally inspected by the browser verifier.' };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const rootIndex = args.indexOf('--root'), outputIndex = args.indexOf('--output');
    const root = path.resolve(rootIndex >= 0 ? args[rootIndex + 1] : path.join(__dirname, '..'));
    const result = scanRepository(root);
    if (outputIndex >= 0) {
      const output = path.resolve(args[outputIndex + 1]);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
    }
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.passed ? 0 : 1;
  } catch (error) { console.error(error.message); process.exitCode = 2; }
}
module.exports = { SEMANTIC_COLORS, classifyUtility, classifyStyleColor, scanSource, scanCss, scanRepository };

import { APPROVED_NAME_ABBREVIATIONS, BRAND_DICTIONARY, MODEL_WORDS, NAME_ABBREVIATIONS, NAME_SPELLING, PRESERVED_ACRONYMS, UNIT_DICTIONARY } from "./dictionaries";

export type BrandSuggestion = { suggestion: string | null; confidence: number };

const quantityFormatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 20 });
const brandsByName = new Map(BRAND_DICTIONARY.map((brand) => [brand.name, brand.display]));
const nameCache = new Map<string, string>();
const routeNameCache = new Map<string, string>();
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const fold = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").trim().replace(/\s+/g, " ").toLocaleLowerCase("es-CO");

const abbreviations = NAME_ABBREVIATIONS.map(([abbreviation, replacement]) => ({
  // C/F y S/P son códigos ambiguos: una letra inmediatamente tras la barra no se expande.
  pattern: new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(abbreviation)}${abbreviation.endsWith("/") ? "(?=\\p{L}{2}|\\s|$)" : "(?=$|[^\\p{L}\\p{N}])"}`, "giu"),
  replacement,
}));
const brandPatterns = BRAND_DICTIONARY.map((brand) => ({
  ...brand,
  pattern: new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(brand.name)}(?=$|[^\\p{L}\\p{N}])`, "iu"),
}));

function normalizeWord(token: string, expandApprovedAbbreviations: boolean): string {
  const upper = token.toLocaleUpperCase("es-CO");
  if (brandsByName.has(upper)) return brandsByName.get(upper)!;
  if (PRESERVED_ACRONYMS.has(upper)) return upper;
  // No se interpretan números como medidas ni se modifica la escritura de un modelo.
  if (/\p{N}/u.test(token) || (token.length === 1 && upper !== "Y")) return token;
  if (/[./+_-]/u.test(token)) return token.replace(/\p{L}+/gu, (word) => normalizeWord(word, false));
  return (expandApprovedAbbreviations ? APPROVED_NAME_ABBREVIATIONS[upper] : undefined)
    ?? MODEL_WORDS[upper] ?? NAME_SPELLING[upper] ?? token.toLocaleLowerCase("es-CO");
}

function normalizeName(name: string, expandApprovedAbbreviations: boolean): string {
  const cache = expandApprovedAbbreviations ? nameCache : routeNameCache;
  const cached = cache.get(name);
  if (cached !== undefined) return cached;
  let text = name.trim().replace(/\s+/g, " ");
  for (const { pattern, replacement } of abbreviations) {
    text = text.replace(pattern, (_match, prefix: string) => `${prefix}${replacement}`);
  }
  text = text.replace(/\bELECTRO\s+ESTATICA\b/giu, "electrostática").replace(/\s+/g, " ").trim();
  text = text.replace(/[\p{L}\p{N}]+(?:[./+_-][\p{L}\p{N}]+)*/gu, (token) => normalizeWord(token, expandApprovedAbbreviations));
  text = text.replace(/(\S)\((par|unidad)\)/giu, "$1 ($2)");
  const normalized = text.replace(/\p{L}/u, (letter) => letter.toLocaleUpperCase("es-CO"));
  if (cache.size >= 3000) cache.clear();
  cache.set(name, normalized);
  return normalized;
}

/** Tipo oración para mostrar. Los modelos alfanuméricos, fracciones y códigos quedan intactos. */
export function normalizeProductName(name: string): string {
  return normalizeName(name, true);
}

/** Las expansiones nuevas de presentación no modifican enlaces ya publicados. */
export function normalizeProductNameForRoute(name: string): string {
  return normalizeName(name, false);
}

/** Muestra exclusivamente la marca ya declarada; no consulta detectBrand. */
export function displayBrand(brand: string): string {
  const text = brand.trim().replace(/\s+/g, " ");
  if (!text || fold(text) === "sin marca") return "";
  return brandsByName.get(text.toLocaleUpperCase("es-CO")) ?? text;
}

/** Sin cantidad devuelve la unidad canónica; las unidades pendientes permanecen ocultas. */
export function formatUnit(unit: string, quantity?: number): string {
  const key = fold(unit);
  if (!key || key === "consultar unidad") return "";
  const known = UNIT_DICTIONARY[key];
  const label = known ? (quantity === undefined || Math.abs(quantity) === 1 ? known.singular : known.plural) : unit.trim().toLocaleLowerCase("es-CO");
  if (quantity === undefined) return label;
  if (!Number.isFinite(quantity)) return "";
  return `${quantityFormatter.format(quantity)} ${label}`;
}

/** Confianza léxica de 0 a 1 para revisión humana. No modifica la marca del producto. */
export function detectBrand(name: string): BrandSuggestion {
  const text = name.trim();
  const matches = brandPatterns.filter(({ name: brand, pattern }) => {
    if (!pattern.test(text)) return false;
    // En rieles/cables/tubos, "3M" puede ser longitud. No se atribuye a un fabricante.
    if (brand === "3M" && /\b(riel|cable|tubo|manguera|cuerda|varilla|cadena|perfil|malla|rollo)\b/iu.test(text) && !/\bmarca\s+3m\b/iu.test(text)) return false;
    return true;
  });
  if (matches.length !== 1) return { suggestion: null, confidence: 0 };
  const brand = matches[0].name;
  const compatible = new RegExp(`(?:\\bpara\\s+|\\bp/\\s*|\\btipo\\s+|\\bcompatible\\s+(?:con\\s+)?)${escapeRegex(brand)}(?=$|[^\\p{L}\\p{N}])`, "iu").test(text);
  return { suggestion: brand, confidence: compatible ? 0.5 : brand === "3M" ? 0.6 : 0.95 };
}

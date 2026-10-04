const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const test = require("node:test");
const ts = require("typescript");

function loadModule(file, dependencies = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const exports = {};
  const compiled = ts.transpileModule(source, { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(compiled, { exports, Intl, require: (name) => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

const dictionaries = loadModule("src/lib/catalog/dictionaries.ts");
const { normalizeProductName, displayBrand, formatUnit, detectBrand } = loadModule("src/lib/catalog/normalize.ts", { "./dictionaries": dictionaries });
const plain = (value) => JSON.parse(JSON.stringify(value));

// Nombres reales de 40 referencias publicadas, con resultados escritos explícitamente.
const nameCases = [
  ["0059", "STANLEY PISTOLA SILICONA 30W", "Stanley pistola silicona 30W"],
  ["0080", "FRESA MAXI PARA MADERA BISAGRA 35MM", "Fresa Maxi para madera bisagra 35MM"],
  ["0081", "RIEL OCULTO MAGIC DOOR CIERRE SUAVE", "Riel oculto Magic Door cierre suave"],
  ["0102", "LIJA DE BANDA 3X21X60 NORTON", "Lija de banda 3X21X60 Norton"],
  ["0111", "LIJA DE BANDA R219 #60 4X24", "Lija de banda R219 #60 4X24"],
  ["0172", "CORREDERA EXT. BONUIT TRAFICO PESADO 70CM 45KG", "Corredera extensión Bonuit tráfico pesado 70CM 45KG"],
  ["0173", "PUNTA EXTENSION TALADRO MAKITA 1/4\"X3-1/8\" 80MM B-48795", "Punta extensión taladro Makita 1/4\"X3-1/8\" 80MM B-48795"],
  ["0188", "TELA ESMERIL PARA MOLDURA R243 4X25MM A-120", "Tela esmeril para moldura R243 4X25MM A-120"],
  ["0240", "MODULOS DATOS-HDMI-VGA-USB DATOS-USB CARGA", "Módulos datos-HDMI-VGA-USB datos-USB carga"],
  ["0287", "BISAGRA OMEGA BO-90 NEGRA ELECTRO ESTATICA (PAR)", "Bisagra Omega BO-90 negra electrostática (par)"],
  ["0299", "BISAGRA OMEGA BO-90 NIQUELADA (PAR)", "Bisagra Omega BO-90 niquelada (par)"],
  ["0302", "BISAGRA MINIOMEGA BO-10 ZINC AZUL (PAR)", "Bisagra Miniomega BO-10 zinc azul (par)"],
  ["0313", "BISAGRA PIVOTE RECTO BP-40(PAR)", "Bisagra pivote recto BP-40 (par)"],
  ["0394", "BISAGRA INVISIBLE TAMBOR 12 MM(PAR)", "Bisagra invisible tambor 12 mm (par)"],
  ["0407", "BISAGRA PIANO DE 25MM X 2MTS DORADA (UND)", "Bisagra piano de 25MM X 2MTS dorada (unidad)"],
  ["0886", "KL CERRADURA SOBREPONER DOBLE PASADOR MULTIPUNTO DERECHA", "KL cerradura sobreponer doble pasador multipunto derecha"],
  ["0951", "CERRADURA YALE 170-1/4 LL-LL NIQUELADA", "Cerradura Yale 170-1/4 LL-LL niquelada"],
  ["1071", "ENCHUFE 518 GRIS 2TOMAS 1HDMI 2USB", "Enchufe 518 gris 2TOMAS 1HDMI 2USB"],
  ["1551", "ENCHUFE 518 NEGRO 2TOMAS 1HDMI 2USB", "Enchufe 518 negro 2TOMAS 1HDMI 2USB"],
  ["1630", "REBORDEADORA MAKITA PROFESIONAL 1/4\" 530W M3700B", "Rebordeadora Makita profesional 1/4\" 530W M3700B"],
  ["1753", "BROCA INCOLMA 1/4 HSS", "Broca Incolma 1/4 HSS"],
  ["2477", "DISCO SIERRA MADERA TRUPER 7-1/4\"X60 DIENTES EJE 5/8", "Disco sierra madera Truper 7-1/4\"X60 dientes eje 5/8"],
  ["2706", "STANLEY JUEGO DESTORNILLADOR 4PZ 3/16-1/4", "Stanley juego destornillador 4PZ 3/16-1/4"],
  ["3296", "CAT BATERIA DE LITIO 18V 4.0 AH", "CAT batería de litio 18V 4.0 AH"],
  ["6328", "MAKITA TALADRO ROTOMARTILLO SDSPLUS 15/16\" 780W", "Makita taladro rotomartillo SDSPLUS 15/16\" 780W"],
  ["6354", "ESCUADRA DECORADA ES-140P 20X280MM FUERTE PINTURA ELECTROESTATICA", "Escuadra decorada ES-140P 20X280MM fuerte pintura electrostática"],
  ["10341", "COCINA PATA PLASTICA ZOCALO ALUMINIZADO-PVC 10CMS", "Cocina pata plástica zócalo aluminizado-PVC 10CMS"],
  ["10626", "BISAGRA MAXI SEMIPARCHE CIERRE LENTO CON CLIP INOX (PAR)", "Bisagra Maxi semiparche cierre lento con clip INOX (par)"],
  ["11842", "OJO MAGICO MHA PEQUEÑO 18-35-60 FT-6110", "Ojo mágico MHA pequeño 18-35-60 FT-6110"],
  ["15710", "CERRADURA MHA DIGITAL 5 METODOS DE APERTURA HC321 PLUS", "Cerradura MHA digital 5 métodos de apertura HC321 PLUS"],
  ["00050", "DISCO DW PULIR METAL 1/4X4.1/2 T27", "Disco DW pulir metal 1/4X4.1/2 T27"],
  ["0170", "GROMMET SELENE NEGRO 75MM 2CORRIENTES 1USB 1TIPOC", "Grommet Selene negro 75MM 2CORRIENTES 1USB 1TIPOC"],
  ["231", "TORNILLO AUTOPERF. TW 3X8 ZINCADO", "Tornillo autoperforante TW 3X8 zincado"],
  ["1957", "DUCASSE SIST. DN-80 C/F", "Ducasse sist. DN-80 C/F"],
  ["2194", "CERRADURA YALE DOB/PAS 987-1/4S.D.P PLUS", "Cerradura Yale DOB/PAS 987-1/4S.D.P PLUS"],
  ["1392", "TOTAL BROCA ESCALONADA JUEGO 3 PIE 3/15 A", "Total broca escalonada juego 3 PIE 3/15 A"],
  ["5964", "RIEL DUCASSE U-21 3M ALUMINIO COLGANTE", "Riel Ducasse U-21 3M aluminio colgante"],
  ["14429", "PANEL LED REDONDO S/P 8\" 18W 6500K", "Panel LED redondo S/P 8\" 18W 6500K"],
  ["15352", "GROMMET SATURNO B-N-G CORRIENTE-USB", "Grommet Saturno B-N-G corriente-USB"],
  ["13478", "CERRADURA MHA CAZOLETA PICOLORO 45MM LLAVE-LLAVE ALCOBA SL.15-ET", "Cerradura MHA cazoleta picoloro 45MM llave-llave alcoba SL.15-ET"],
];

for (const [sku, original, expected] of nameCases) {
  test(`real SKU ${sku}: sentence case preserves model and variant`, () => {
    assert.equal(normalizeProductName(original), expected);
  });
}

test("abbreviations have word boundaries and do not expand ambiguous function codes", () => {
  assert.equal(normalizeProductName("  BISAGRA INDUMA P/MUEBLE 3\" DORADA(PAR)  "), "Bisagra Induma para mueble 3\" dorada (par)");
  assert.equal(normalizeProductName("TUBO PVC C/ROSCA LED USB"), "Tubo PVC con rosca LED USB");
  assert.equal(normalizeProductName("PERFIL P/C C/F S/P"), "Perfil P/C C/F S/P");
  assert.equal(normalizeProductName("CERRADURA AUTOPERFECTA EXT-400"), "Cerradura autoperfecta EXT-400");
  assert.equal(normalizeProductName(""), "");
  assert.equal(normalizeProductName(" \n\t "), "");
});

test("plus and underscore model tokens retain their literal identity", () => {
  assert.equal(normalizeProductName("CALADORA TE-JS18+ST ABC_400Z"), "Caladora TE-JS18+ST ABC_400Z");
  assert.equal(normalizeProductName("CERRADURA B-360 LL+MRP CROMO MATE"), "Cerradura B-360 LL+MRP cromo mate");
});

test("normalizing an already displayed real name keeps spelling stable", () => {
  for (const [, , expected] of nameCases) assert.equal(normalizeProductName(expected), expected);
});

test("declared brands are visible without inferring missing ones", () => {
  assert.equal(displayBrand("Sin marca"), "");
  assert.equal(displayBrand(" SIN MARCA "), "");
  assert.equal(displayBrand(""), "");
  assert.equal(displayBrand("YALE"), "Yale");
  assert.equal(displayBrand("DEWALT"), "DeWalt");
  assert.equal(displayBrand("KL"), "KL");
  assert.equal(displayBrand("Marca del proveedor"), "Marca del proveedor");
});

const unitCases = [
  ["unidad", undefined, "unidad"], ["unidad", 1, "1 unidad"], ["unidad", 31, "31 unidades"],
  ["unidad", 0, "0 unidades"], ["numero de pares", 44, "44 pares"], ["número de pares", 1, "1 par"],
  ["metro", 23.14, "23,14 m"], ["metro", undefined, "m"], ["kilogramo neto", 2.5, "2,5 kg"],
  ["Caja", 2, "2 cajas"], ["caja", 1, "1 caja"], ["combo", 2, "2 combos"],
  ["conjunto", 2, "2 conjuntos"], ["banda", 2, "2 bandas"], ["paquete", 2, "2 paquetes"],
  ["hoja", 2, "2 hojas"], ["galón", 2, "2 galones"], ["número de rollos", 2, "2 rollos"],
  ["libra", 2, "2 libras"], ["carrete", 2, "2 carretes"], ["Consultar unidad", 10, ""],
  [" CONSULTAR UNIDAD ", undefined, ""], ["", 7, ""], ["envase especial", 2, "2 envase especial"],
  ["unidad", 1234, "1.234 unidades"], ["metro", 0.001, "0,001 m"], ["unidad", NaN, ""],
  ["unidad", Infinity, ""],
];
for (const [unit, quantity, expected] of unitCases) {
  test(`unit ${unit}, quantity ${quantity}: explicit plural and Colombian number format`, () => assert.equal(formatUnit(unit, quantity), expected));
}

test("brand detection produces review suggestions rather than substring guesses", () => {
  assert.deepEqual(plain(detectBrand("CANDADO YALE ALEMAN 800 70MM")), { suggestion: "YALE", confidence: 0.95 });
  assert.deepEqual(plain(detectBrand("RIEL DUCASSE U-21 3M ALUMINIO COLGANTE")), { suggestion: "DUCASSE", confidence: 0.95 });
  assert.deepEqual(plain(detectBrand("CABLE NEGRO 3M")), { suggestion: null, confidence: 0 });
  assert.deepEqual(plain(detectBrand("RESPIRADOR 8822V 3M")), { suggestion: "3M", confidence: 0.6 });
  assert.deepEqual(plain(detectBrand("MARCA 3M CINTA")), { suggestion: "3M", confidence: 0.6 });
  assert.deepEqual(plain(detectBrand("DISCO DW PULIR METAL 1/4X4.1/2 T27")), { suggestion: null, confidence: 0 });
  assert.deepEqual(plain(detectBrand("REPUESTO P/YALE")), { suggestion: "YALE", confidence: 0.5 });
  assert.deepEqual(plain(detectBrand("REPUESTO COMPATIBLE CON YALE")), { suggestion: "YALE", confidence: 0.5 });
  assert.deepEqual(plain(detectBrand("CERRADURA TIPO YALE")), { suggestion: "YALE", confidence: 0.5 });
  assert.deepEqual(plain(detectBrand("KIT YALE + KL")), { suggestion: null, confidence: 0 });
  assert.deepEqual(plain(detectBrand("YALEMASTER KL110H DW54830")), { suggestion: null, confidence: 0 });
  assert.deepEqual(plain(detectBrand("CALADORA EINHELL TE-JS18+ST")), { suggestion: "EINHELL", confidence: 0.95 });
});

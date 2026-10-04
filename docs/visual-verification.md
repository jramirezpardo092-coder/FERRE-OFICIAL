# Verificación visual reproducible

Los verificadores inspeccionan el diseño descrito en `DESIGN.md`. Guardan la evidencia de cada estado, incluidos los fallos, y no seleccionan una ejecución favorable. No sustituyen la revisión visual ni las comprobaciones manuales que axe identifica como `incomplete`.

## Herramientas

El escáner AST usa el TypeScript del proyecto. El navegador requiere Node y herramientas de auditoría externas: `puppeteer-core@25.12.0` y `axe-core@4.13.0`, además de Chrome instalado o Chrome for Testing oficial. El workflow instala estas dependencias en un directorio temporal, separado de la aplicación. Para usar una instalación externa existente, exponga su `node_modules` mediante `NODE_PATH`.

```powershell
$env:NODE_PATH = Join-Path $env:AUDIT_TOOLS 'node_modules'
# CHROME_PATH debe apuntar al ejecutable de Chrome o Chrome for Testing.
node scripts/verify-visual-tokens.cjs --output ../outputs/visual/tokens.json
node scripts/verify-visual-browser.cjs --base-url http://localhost:3010 --output ../outputs/visual/browser --chrome-path $env:CHROME_PATH --font-preload-gate report
```

El servidor debe estar compilado y estable antes de ejecutar el navegador. La ejecución usa un perfil temporal propio y un contexto nuevo para cada caso; no conecta con el navegador ni con el perfil personal. El directorio temporal se elimina al cerrar Chrome. No modifica datos comerciales ni abre el enlace final de WhatsApp.

En CI Linux el preload es obligatorio:

```sh
NODE_PATH="$AUDIT_TOOLS/node_modules" node scripts/verify-visual-browser.cjs \
  --base-url http://localhost:3010 --output "$REPORT_DIR/visual" \
  --chrome-path "$CHROME_PATH" --font-preload-gate required
```

`--font-preload-gate` acepta `required` (predeterminado) o `report`. El modo `report` se usa para diagnosticar la ausencia conocida del preload en la compilación local de Next 14 en Windows; conserva el fallo en el JSON y no permite afirmar que el preload fue validado. CI exige exactamente un enlace `as="font"` que coincida con el `@font-face` de `--font-archivo` y que esa familia real tenga estado `loaded`. Un fallback no satisface el criterio. No depende del hash del archivo y rechaza preload de Manrope o Plex adicional.

## Casos y criterios

La matriz predeterminada contiene ocho vistas (`inicio`, `catalogo`, `categoria`, `ficha-foto`, `ficha-sin-foto`, `sin-resultados`, `footer`, `cotizacion`), anchos 390 y 1440 px y temas claro y oscuro: 32 casos. Las fichas corresponden a SKU exactos `0435` y `00050`. La búsqueda vacía es `/catalogo?q=zzzz-inexistente-92846`.

El catálogo de escritorio añade estados hover y agregado en cada tema. El hover desplaza el CTA al viewport, lo apunta con el cursor y verifica que su fondo corresponda a `brand`. La cotización añade un estado vacío antes de preparar un producto real. Son 12 comprobaciones adicionales. Cada caso usa almacenamiento vacío y queda aislado de los demás.

- AST: cero colores de paleta Tailwind, hex o colores literales en `src/components` y `src/app`; acepta los tokens semánticos. Inspecciona literales, concatenaciones constantes y fragmentos de plantillas, ignorando comentarios. Las clases que se generan al ejecutar se inspeccionan también en el navegador.
- Catálogo de escritorio: hasta dos regiones rojas sólidas visibles, incluidas las de hover. El JSON conserva los nodos que pintan, recortes, opacidades y pseudoelementos no resolubles; un pseudoelemento sin medición impide dar ese criterio por aprobado.
- Filas de escritorio: diferencias de posición superior del precio y las acciones de como máximo 2 px, usando `data-design-card`, `data-sku`, `data-design-price` y `data-design-actions`. Comprueba todas las tarjetas montadas, también las filas fuera del primer viewport.
- Accesibilidad: cero infracciones axe en cada estado; controles de al menos 44 × 44 px, midiendo el área que dejan disponible los ancestros que recortan. Incluye botones, inputs, selects, summaries, enlaces Header/Footer, acciones de tarjeta/cotización y Ampliar imagen. Un recorte natural en el borde del viewport se informa aparte, pues se puede desplazar la página. Texto de botones de al menos 14 px; un primer foco de teclado con outline opaco, centro visible y contraste ≥3:1 contra el fondo compuesto de sus ancestros. Un fondo con imagen no resuelto no aprueba el foco. Este probe es limitado y no equivale a recorrer todos los controles.
- CLS: valor de ventana de sesión menor de 0,1, observado desde la navegación hasta el estado medido. No aplica throttle y no es una medición Lighthouse o PageSpeed; la auditoría móvil de rendimiento se ejecuta por separado.
- WhatsApp: como máximo una región verde sólida visible; la cotización preparada verifica el CTA sin accionarlo.

Las regiones de color cuentan superficies contiguas, evitando contar dos veces un padre y un hijo que pintan la misma zona. No cuentan un ícono o trazo rojo como fondo sólido. La evidencia de contraste conserva también los resultados `incomplete` de axe para revisión humana.

El centro de los controles se somete también a hit testing para advertir superposiciones. Esta comprobación es informativa: una barra fija puede cubrir un control en la posición inicial y permitirlo al hacer scroll. No acredita que el último control del documento pueda salir de detrás de una barra fija; esa comprobación requiere la revisión manual del final de la página.

Se puede reducir explícitamente el lote para diagnosticar, sin reemplazar la matriz completa:

```sh
node scripts/verify-visual-browser.cjs --base-url http://localhost:3010 \
  --output "$REPORT_DIR/diagnostic" --chrome-path "$CHROME_PATH" \
  --views catalogo,categoria --widths 1440 --themes light,dark
```

## Informes y códigos de salida

El navegador guarda `summary.json`, `index.html` y por estado `*.dom.json`, `*.axe.json` y captura PNG del viewport. Los errores de ejecución se guardan en `*.error.json` y no se presentan como fallos de accesibilidad medidos. `summary.json` incluye URL, viewport, tema, versión de Chrome, commit HEAD, estado de cambios con rutas relativas y BUILD_ID del servidor local; el commit por sí solo no acredita una copia sin cambios locales. Las rutas de uso personal no se incluyen en el resumen.

Código `0`: los criterios obligatorios pasan. Código `1`: existe un fallo medido. Código `2`: error de configuración o ejecución, incluso si otros casos llegaron a medirse. Los informes parciales se conservan después de cada caso.

Pruebas de los límites del verificador:

```sh
node --test scripts/verify-visual.test.cjs
```

# Ferretería Pardo — mostrador experto

Fuente de verdad visual. Alcance: presentación y estados de interfaz; conservar datos, fotos aprobadas, logo, rutas, textos legales, metadatos, JSON-LD y reglas de cotización. Base: `6909394e0f59a585caeaece768ffec4eee6f83d8`. Las 32 referencias anteriores al cambio están en `outputs/ferrepardo-visual-20261004/before` fuera del repositorio.

## Dirección

Catálogo industrial y etiquetas de estantería: papel cálido, negro, rojo preciso, información técnica legible y alineación constante. Sin degradados, cristales, elevación grande, decoración flotante ni animaciones de entrada al hacer scroll. El blanco de las fotografías se trata como soporte fotográfico y no como otro marco.

## Tokens de color

Los valores se declaran una sola vez como componentes RGB en `globals.css`. Tailwind expone nombres semánticos con `rgb(var(--token) / <alpha-value>)`, incluyendo opacidades. Prohibidas las paletas Tailwind y los hex arbitrarios en componentes y páginas; `transparent`, `currentColor` e `inherit` son valores estructurales permitidos.

| Variable / utilidad | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--paper` / paper | #F6F4EF | #121417 | Fondo general |
| `--surface` / surface | #FFFFFF | #1B1F24 | Tarjetas y paneles |
| `--ink` / ink | #15171B | #F6F4EF | Texto y selección neutra |
| `--ink-2` / ink-2 | #4A4F57 | #B9BEC6 | Texto secundario |
| `--line` / line | #E3DFD6 | #343A43 | Separadores y bordes no esenciales |
| `--control` / control | #74716B | #7C838C | Borde esencial de campos y controles (≥ 3:1) |
| `--brand` / brand | #D02731 | #D02731 | CTA principal y contador |
| `--brand-press` / brand-press | #A91F28 | #A91F28 | CTA pulsado |
| `--brand-text` / brand-text | #CF2630 | #FF949A | Texto y borde de CTA sobre tinte |
| `--brand-tint` / brand-tint | #FBEAEA | #3D2228 | CTA de tarjeta en reposo |
| `--on-brand` / on-brand | #FFFFFF | #FFFFFF | Texto sobre rojo sólido |
| `--on-ink` / on-ink | #FFFFFF | #15171B | Texto en chips/estado seleccionado |
| `--ok` / ok | #2E6B3F | #70B985 | Punto de stock positivo exclusivamente |
| `--warn` / warn | #A76412 | #E9B75F | Punto de últimas unidades |
| `--muted` / muted | #73777E | #929BA7 | Punto de stock a confirmar |
| `--wa` / wa | #1FA855 | #1FA855 | Exclusivamente WhatsApp |
| `--wa-edge` / wa-edge | #176B38 | #67CA8D | Borde de acción WhatsApp |
| `--on-wa` / on-wa | #071B10 | #071B10 | Texto accesible sobre verde WhatsApp |
| `--hero` / hero | #15171B | #15171B | Inicio y footer, negro de marca estable |
| `--hero-ink` / hero-ink | #F6F4EF | #F6F4EF | Texto sobre negro de marca |
| `--hero-muted` / hero-muted | #B9BEC6 | #B9BEC6 | Texto secundario de footer |
| `--photo` / photo | #FFFFFF | #FFFFFF | Fondo óptico de fotos y soporte del logo |
| `--overlay` / overlay | #15171B | #000000 | Fondo de diálogos, con opacidad |

El rojo sólido en catálogo de escritorio se limita a dos elementos visibles como máximo. Las franjas son decorativas finas, no paneles. La tarjeta usa tinte en reposo y negro cuando ya forma parte de la cotización; sólo la tarjeta bajo hover se vuelve roja. En ficha la acción principal es roja. El panel usa verde WhatsApp como excepción específica solicitada; es el único CTA verde sólido. El resto de enlaces de WhatsApp son outline, con ícono verde sobre `surface` (3,09:1), no directamente sobre `paper` (2,81:1). El botón verde usa texto `on-wa` (5,79:1), nunca blanco.

El rojo de marca permanece #D02731. Sobre #FBEAEA da 4,496:1, ligeramente inferior al piso de 4,5:1: el token exclusivo para texto se ajusta un paso a #CF2630. Contrastes iniciales calculados: ink-2/paper 7,50:1; dark ink-2/surface 8,87:1; dark brand-text/brand-tint 6,83:1. Texto ≥ 4,5:1 y límites esenciales/foco ≥ 3:1, también en hover y oscuro. `line` es decorativo; no sustituye el borde `control` de un campo.

## Tipografía

- **Display:** Archivo, ancho fijado en `wdth=80` y peso variable 700–800; `font-display: swap`, latin. H1/H2, precios y cifras. Única fuente con preload. `font-display` es el nombre de utilidad y `--font-archivo` la variable de Next. El archivo se limita a los ejes usados mediante `fontTools.varLib.instancer`: 24.328 bytes frente a 90.104, conservando los 302 glifos y su mapa Unicode; véase [informe](docs/visual/reports/font-optimization.json).
- **Texto:** Manrope existente, estilos usados 400/600; `display: swap`, latin y preload desactivado. No introducir otra familia de texto.
- **Técnica:** IBM Plex Mono 500 normal, latin, `display: swap`, sin preload; SKU, referencia, medidas, fecha, contadores y paginación. Nunca por debajo de 12 px.
- Máximo dos archivos binarios nuevos: Archivo latin variable e IBM Plex Mono latin 500. Usar `next/font/local` con originales oficiales y licencia OFL para evitar que el loader de Google emita otros subconjuntos. Manrope mantiene su origen existente.
- Escala: 12/16, 14/20, 16/24, 18/28, 22/28, 28/32, 40/44, 56/56 (tamaño/interlineado px). Botones 14 px semibold. Nombre de tarjeta 16/22, dos líneas. Espaciado del display grande: −0,025 em; de la tipografía técnica: 0,025 em. Precios y totales `tabular-nums`.

## Forma, espacio y movimiento

- Contenedor máximo 1280 px; laterales 16 px móvil, 24 px tablet, 32 px escritorio. Base 4 px; separaciones de bloque 24/32/48 px.
- `--radius-control: 6px`, `--radius-card: 10px`, `--radius-chip: 999px`. La excepción circular es el flotante PARDITO de 56 px.
- Borde 1 px; sin sombra en reposo. Hover de tarjeta: borde ink-2 y sombra 0 2px 6px con overlay al 6 %, desplazamiento máximo 1 px.
- Transiciones 150–200 ms en color, borde, foco, imagen y estado agregado. Imagen hover 1,03. Pulso del contador una sola vez y ≤ 200 ms. Sin animación decorativa o dependiente de scroll. `prefers-reduced-motion` elimina animación, escala y desplazamiento.
- Motivo: tres trazos diagonales paralelos a 60°, decorativos `aria-hidden`, un acento por bloque. Color brand; trazos finos, no fondo sólido dominante. Inicio y footer; separadores puntuales y estado vacío. No sustituir ni alterar el logo original.

## Anatomía de componentes

### Header

Una barra de surface con borde line. Logo original de al menos 36 px en escritorio y 30 px en móvil, con soporte photo cuando el modo oscuro lo requiera. Navegación sobria; asesor outline con ícono wa. Datos de contacto y horario en footer; redes en footer. Cambio de tema en footer o menú. Cotización en pastilla neutra con contador brand y área táctil ≥ 44 px. Menú y diálogos conservan su navegación/foco.

### Inicio y hero compacto

Inicio con fondo hero negro, acento diagonal en esquina, H1 display de 56 px en escritorio y 40 px en móvil, y buscador protagonista. Contenido y destinos existentes conservados. Catálogo/categoría con hero paper: H1 display de 40 px en escritorio y 28 px en móvil, y fecha mono `ACTUALIZADO 02·10·2026`. Altura máxima de 140/110 px respectivamente. Las introducciones de categoría existentes se mantienen completas en el DOM y pueden colocarse inmediatamente debajo del bloque compacto, sin alterar metadatos.

### Herramientas y filtros

Buscador de 52 px, radio de 6 px y borde control; foco de 1,5 px ink. Categorías en chips con conteo mono; activo ink/on-ink; ocultar conteos de 0. El filtro activo sigue disponible en la lista de filtros aplicados para quitarlo. Información de confianza en una línea de íconos de 16 px y divisores, sin caja, con desplazamiento horizontal móvil. Segmento Con IVA / Sin IVA (empresas) junto al selector de orden, usando el store existente. Radios de 16 px dentro de etiquetas táctiles de 44 px; disponibilidad en fila compacta con texto y descripción; secciones con separadores line y títulos mono uppercase. Barra lateral sticky con scroll propio.

### Tarjeta

`data-design-card` y SKU identifican la tarjeta para medición. Grilla: área 1:1 constante, fondo photo para imagen real y margen interior del 10 %, `object-contain`; sin foto usa paper, ícono de 40 px ink-2 y «Foto pendiente» de 12 px. Lista móvil: imagen de 88 px.

Metadatos en una sola línea truncada: marca existente uppercase ink, SKU/ref mono ink-2. Nombre de 16/22 px semibold, dos líneas y altura mínima de 44 px. Stock: punto de 8 px ok/warn/muted más texto ink-2, sin colorear el texto. Precio display de 22/28 px, IVA de 12 px; segunda línea de 12 px para base + IVA + unidad. Reservar la misma altura aunque falten precio/unidad. `data-design-price` marca el precio principal y `data-design-actions` el bloque de acciones.

Grilla de 3 columnas con barra lateral a 1280 px, 4 sin barra lateral: conserva el CTA a 14 px sin comprimirlo. Acciones ancladas al fondo y alineadas por fila con diferencia ≤ 2 px. Botón tint/brand-text con borde brand-text y +; hover brand/on-brand. Si la cantidad en cotización es positiva: ink/on-ink y «✓ En cotización · cantidad» durante la sesión, con snapshot escalar del store existente. El estado no cambia la operación ni validación de agregar. En móvil el CTA es un botón «+» de 44 px a la derecha del precio con nombre accesible; el estado agregado muestra cantidad/confirmación. WhatsApp es un botón cuadrado de 44 px, outline sobre surface. Agotados siguen cotizables y marcados a confirmar.

### Ficha

Un marco fotográfico y miniaturas bajo la imagen, misma galería y originales. Columna técnica con meta mono, H1 display, precio sin caja y separador; cantidad y CTA principal a la misma altura. Tabla Datos del producto de dos columnas con SKU, referencia, marca si existe, unidad si existe, categoría y disponibilidad de los campos actuales; no inferir especificaciones. Móvil: una barra fija inferior con precio y CTA, mismo estado/cantidad/handlers, padding y safe-area reservados. PARDITO flotante oculto mientras existe esta barra en móvil; no ocultar su diálogo ni quitar foco.

### Cotización

Mantener revalidación, límites, IVA, campos opcionales y mensaje WhatsApp. Líneas con miniatura o ícono de 48 px, nombre, SKU mono y selector de cantidad compacto de 44 px. Totales en tabla, cifras tabulares a la derecha; total display de 28 px y línea IVA ink-2. Botón final WhatsApp wa/on-wa, borde wa-edge. Preparar cotización conserva su paso/handler. Estado vacío con PARDITO de 160–200 px y Ver catálogo.

### Vacíos, paginación y footer

PARDITO de 160–200 px en búsqueda vacía, cotización vacía y página 404; título breve, motivo diagonal y acción existente con término buscado o catálogo. Conservar ilustraciones corporativas; ninguna foto sintética de producto. Paginación mono, página actual ink/on-ink, enlaces y aria-current intactos. Footer hero/hero-ink, franjas discretas, contactos y redes; medios de pago en mono sin pastillas.

## Verificación y entrega

Una PR. Comparativas antes/después: 8 vistas × 2 anchos (390/1440) × 2 temas = 32 antes y 32 después; footer/estado vacío pueden ser capturas completas para que sus acciones sean legibles. Capturas [antes](docs/visual/before/) y [después](docs/visual/after/); [índice de comparativas y resultados reproducibles](docs/visual/README.md). Los informes no incluyen datos privados ni credenciales.

Script reproducible: detectar colores Tailwind no tokenizados en todos los componentes/páginas; contar fondos rojos sólidos efectivos visibles en catálogo desktop (incluye pseudo-elementos y estados reales); agrupar tarjetas por fila y comprobar diferencias de alineación de precio/acciones ≤ 2 px; axe con 0 violaciones en ambos temas y anchos. Comprobar foco/44 px, estados agregados, barra móvil, precio/IVA y contrastes. CLS < 0,1 y PSI móvil ≥ 95 en catálogo/ficha; conservar todas las mediciones, sin seleccionar reintentos favorables.

Congelados: JSON de datos y enriquecimiento, core cart-store, rutas/middleware, seo.ts/metadata/JSON-LD y APIs. Las pruebas funcionales existentes siguen pasando; adaptar únicamente expectativas legítimas de presentación con evidencia.

## Validación de dirección con la propietaria/el propietario

Se implementan las decisiones explícitas del encargo: Archivo con ancho 80, franjas a 60° y PARDITO existente. Se entrega la comparación para validar su intensidad y tamaño. Cualquier nueva ilustración de PARDITO o cambio de fuente distinto de Archivo requerirá una propuesta visual posterior; esta entrega no introduce nuevas ilustraciones.

# Entrega del catálogo de Ferretería Pardo

Corte de esta documentación: 4 de octubre de 2026. La web permite preparar una **cotización por WhatsApp**, sin checkout ni pago en línea. Las casillas marcadas describen cambios implementados; la aceptación final se registra por separado.

## Fuente conservada

La normalización modifica la presentación, no los datos publicados de Siigo ni las fotos aprobadas. La actualización de precios sigue siendo un snapshot manual; no hay sincronización automática con Siigo.

| Indicador de la fuente revisada | Cantidad |
| --- | ---: |
| Productos publicados | 1.319 |
| Productos con foto aprobada | 192 |
| Productos con stock y sin foto | 717 |
| Productos con unidad «Consultar unidad» | 159 |
| Productos con marca «Sin marca» | 921 |
| Sugerencias léxicas de marca en el CSV | 503 |
| Sugerencias correspondientes a «Sin marca» | 147 |

SHA-256 comprobados durante esta entrega:

- `src/data/products.json`: `5b3b707bd63933803b6119ba5639a1dbc35804a13e26c529da2cd22ad875ab0a`
- `src/data/product-enrichment.json`: `ffed71c4f0ee0a05f2b16d763fe1d5ea7cc6eb24a8e13f35f5de9576630f6a7a`

Los SKU se conservan como strings, incluidos sus ceros iniciales. Las 503 detecciones son propuestas para revisión, no marcas confirmadas ni entradas nuevas de filtros. Caso explícito: el SKU `5964` tiene marca fuente `3M`, pero su nombre menciona Ducasse y una longitud de 3 m; la capa de presentación no sobrescribe esa marca ni confunde longitud con fabricante.

## Fase 1 — SEO técnico

Referencia: commit `e59b325`.

- [x] Primera página renderizada en servidor; enlaces de producto reales y paginación de 24.
- [x] Categorías con rutas limpias, metadatos y contenido propio; fichas con SKU y nombre normalizado en la URL.
- [x] Redirecciones 301 desde las rutas antiguas, canonical y reglas de indexación para búsqueda y filtros; sitemap con las rutas nuevas.
- [x] Datos estructurados del negocio, catálogo, producto y migas de pan; origen configurable mediante `NEXT_PUBLIC_SITE_URL`.
- [ ] Aceptación final: comprobar respuestas HTTP, HTML inicial y Rich Results Test con evidencia del build final.

## Fase 2 — Normalización

Referencia: commit `0cc2ae6`.

- [x] Helpers y diccionario editable en `src/lib/catalog/normalize.ts` y `dictionaries.ts`: nombres, marca visible, unidades y sugerencias léxicas.
- [x] Preservación de siglas, modelos, medidas y códigos; «Sin marca» y unidades pendientes ocultos en presentación.
- [x] COP sin centavos; precio con IVA redondeado al peso. Cantidades con plural y formato de Colombia.
- [x] CSV de 1.319 marcas para revisión y lista de 200 prioridades de fotos, ambos fuera de Git.
- [ ] El responsable del catálogo debe aprobar correcciones de marca y las 159 unidades pendientes antes de modificar la fuente.

## Fase 3 — UX y cotización

Referencia: commit `0388405`.

- [x] Precio con IVA como principal y preferencia persistente para empresas; importes pendientes se identifican como pendientes.
- [x] Orden explícito por disponibilidad, foto y nombre cuando no hay frecuencia de ventas pública; no se anuncia «alta rotación» ni «más vendidos» sin esa evidencia.
- [x] Lista móvil, cuadrícula de escritorio y tarjetas sin foto con icono compacto; no se añaden imágenes inventadas.
- [x] Acción principal de cotización, WhatsApp secundario, toast y contador; agotados incluidos con disponibilidad a confirmar.
- [x] Búsqueda con sinónimos, filtros, chips, PARDITO como único flotante y cotización con SKU, cantidades, IVA y campos opcionales.
- [ ] Confirmar condiciones de envío y completar la revisión visual y funcional final.

## Fase 4 — Rendimiento

Referencia: commit `094172b`; ajustes posteriores se incluyen en el cierre final.

- [x] Fachada del mapa: Google Maps se carga tras interacción, con enlace externo disponible.
- [x] Logo SVG en header; PARDITO usa la mascota corporativa PNG, `sizes` según tamaño mostrado, calidad 75 y carga diferida.
- [x] Imágenes con tamaños responsivos; galerías secundarias tras interacción y enlaces de tarjetas sin prefetch.
- [x] API pública con caché; solo 24 productos cruzan al cliente por página.
- [x] Formateadores Intl reutilizados, caché de nombres, guards contra renders iniciales redundantes y modal de producto diferido.
- [ ] Lighthouse móvil final con throttling estándar: objetivo rendimiento ≥90. No se declara alcanzado hasta registrar resultados.

## Fase 5 — Accesibilidad

Referencia del commit final: **PENDIENTE**.

- [x] Ajustes de tipografía mínima, contraste oscuro, foco visible y objetivos táctiles de 44 px en los controles revisados.
- [x] Nomenclatura de cotización en etiquetas accesibles, estados, diálogos y respeto a movimiento reducido.
- [x] Mapa, PARDITO y acciones principales usan controles semánticos operables con teclado.
- [ ] Recorrido completo con Tab/Shift+Tab, Enter/Espacio y Escape, incluyendo retorno de foco, menú, filtros, galería y panel de cotización.
- [ ] Registrar axe-core y Lighthouse del build final. La revisión de teclado y objetivos táctiles no constituye una declaración de conformidad AAA de todo el sitio.

## Archivos de revisión fuera de Git

- Marcas: `C:/Users/DELL/Documents/outputs/ferrepardo-ecommerce-20261004/marcas-revision.csv` — 1.319 filas; columnas `sku,nombre,marca_detectada,confianza`.
- Fotos: `C:/Users/DELL/Documents/outputs/ferrepardo-ecommerce-20261004/prioridades-fotos-200.csv` — 200 de las 717 referencias con stock y sin foto, ordenadas por stock publicado porque no existe frecuencia de ventas en la fuente pública.

Los CSV conservan el SKU literal; al abrirlos en Excel debe importarse esa columna como texto. La cantidad de stock compara unidades de venta distintas y no demuestra rotación. No incorporar estos CSV a Git ni activar las marcas propuestas sin aprobación.

## Validación final — PENDIENTE de resultados

Suite registrada por el responsable de integración: **131 tests PASS**. No sustituye las comprobaciones de navegador, HTTP ni Google.

| Criterio de aceptación | Estado del cierre |
| --- | --- |
| HTML de catálogo y cerrajería con ≥24 enlaces de producto | PENDIENTE de evidencia final |
| 301 de `?cat=` y `/producto/[sku]` | PENDIENTE de evidencia final |
| Lighthouse móvil: rendimiento ≥90, SEO 100, accesibilidad ≥95 | PENDIENTE de resultados finales |
| axe-core: cero violaciones serias o críticas | PENDIENTE de resultados finales |
| Rich Results Test: negocio, producto, migas e ItemList | PENDIENTE de validación y elegibilidad |
| Búsquedas: chapa, visagra, tornillo drywall, candado yale, lija 120, broca 1/4 | PENDIENTE de registro final |
| Capturas a 390 y 1.440 px de catálogo, categoría, fichas con/sin foto, vacío y cotización | PENDIENTE de rutas de artefactos finales |

Los tipos schema.org válidos no garantizan resultados enriquecidos de Google. Revisar por ficha la elegibilidad de Product, especialmente cuando falta foto o el precio está pendiente; no fabricar datos para satisfacer requisitos.

## Pendientes y responsables

- **Ferretería Pardo:** confirmar cobertura, coste y condiciones de envío; aprobar el CSV de marcas y aportar las 159 unidades pendientes.
- **Responsable del catálogo:** revisar el SKU `5964`, validar paquetes/funciones/acabados y priorizar fotos exactas de las 200 referencias. Mantener las 192 fotos publicadas como punto de partida; ampliar solo con evidencia y aprobación.
- **Responsable técnico:** incorporar hash del commit final, resultados de aceptación y rutas de capturas; comprobar SEO tras cualquier actualización aprobada de datos.
- **Responsable de publicación:** para la futura promoción a `ferreteriapardo.com`, configurar `NEXT_PUBLIC_SITE_URL` en el entorno correspondiente, reconstruir y verificar canonical, JSON-LD, sitemap y redirecciones 301. Sin cambios de DNS en esta entrega; la migración requiere coordinar origen y destino para evitar URLs contradictorias.

## Pendiente técnico — dependencias

**Responsable técnico:** planificar una migración separada de Next.js 14 a 16 y Tailwind 3 a 4, con revisión de compatibilidad y validación propia. No se realizan esas migraciones dentro de esta entrega.

Según el `npm audit` actual registrado por integración, hay **11 vulnerabilidades preexistentes**. La incorporación de `sharp` **0.35.5** no añadió vulnerabilidades nuevas en esa comparación; los hallazgos existentes permanecen como trabajo técnico pendiente. Este registro no afirma que se hayan mitigado exploits ni determina por sí solo la aceptación de la publicación.

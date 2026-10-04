# Entrega del catálogo de Ferretería Pardo

Corte de esta documentación: 4 de octubre de 2026. Las cinco fases están implementadas y publicadas en [ferre-oficial.vercel.app](https://ferre-oficial.vercel.app). La web permite preparar una **cotización por WhatsApp**, sin checkout ni pago en línea. HTTP, Google PageSpeed móvil, axe y los recorridos de teclado registrados están comprobados. Se conservan por separado los resultados inferiores del CLI ejecutado en el equipo local.

## Publicación confirmada

[PR #6](https://github.com/jramirezpardo092-coder/FERRE-OFICIAL/pull/6) y [PR #7](https://github.com/jramirezpardo092-coder/FERRE-OFICIAL/pull/7) están fusionadas. El SHA del código auditado es `03b9923fd811986ab4658b0b8741425907418808`, publicado en el despliegue Vercel `dpl_21kj7HmvB5DaC6Nqw4Xi5Py2WN9i` con estado Ready y alias confirmado por integración. El cierre posterior modifica únicamente esta documentación.

Google Rich Results corresponde al merge de PR #6, `3f6a4a8412d8757e7e6ef51f033675c05cf5b3d1`. Las 12 capturas corresponden a producción `03b9923`, con anchos exactos de 390 y 1.440 px. Diez usan alturas de 844 y 900 px; las dos búsquedas sin resultados muestran la página completa, de 390×3.482 y 1.440×2.306 px. PR #7 incorpora el ajuste del aviso, commit `493b4b9`: abrir la cotización cierra el aviso de agregado, confirmado en producción final.

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
- [x] HTTP público final: 179/179 PASS, cero fallos; HTML inicial con 24 enlaces/IDs distintos en catálogo y cerrajería, 301, canonical, noindex, sitemap y las seis búsquedas de aceptación.
- [x] Evidencias guardadas de Google para la ficha 0435, categoría cerrajería e ItemList; alcance detallado en validación.
- [x] Lighthouse y axe finales registrados, con alcance y metodologías separados en validación.

## Fase 2 — Normalización

Referencia: commit `0cc2ae6`.

- [x] Helpers y diccionario editable en `src/lib/catalog/normalize.ts` y `dictionaries.ts`: nombres, marca visible, unidades y sugerencias léxicas.
- [x] Preservación de siglas, modelos, medidas y códigos; «Sin marca» y unidades pendientes ocultos en presentación.
- [x] COP sin centavos; precio con IVA redondeado al peso. Cantidades con plural y formato de Colombia.
- [x] CSV de 1.319 marcas para revisión y lista de 200 prioridades de fotos, ambos fuera de Git.
- [ ] El responsable del catálogo debe aprobar correcciones de marca y las 159 unidades pendientes antes de modificar la fuente.

## Fase 3 — UX y cotización

Referencia: commit `0388405`; ajuste del aviso en PR #7, commit `493b4b9`.

- [x] Precio con IVA como principal y preferencia persistente para empresas; importes pendientes se identifican como pendientes.
- [x] Orden explícito por disponibilidad, foto y nombre cuando no hay frecuencia de ventas pública; no se anuncia «alta rotación» ni «más vendidos» sin esa evidencia.
- [x] Lista móvil, cuadrícula de escritorio y tarjetas sin foto con icono compacto; no se añaden imágenes inventadas.
- [x] Acción principal de cotización, WhatsApp secundario, toast y contador; agotados incluidos con disponibilidad a confirmar.
- [x] Búsqueda con sinónimos, filtros, chips, PARDITO como único flotante y cotización con SKU, cantidades, IVA y campos opcionales.
- [x] Cotización en producción final: aviso cerrado al abrir el panel, botón de envío visible y dos capturas actualizadas; la prueba dejó el panel vacío y no envió mensajes.
- [x] Galería de tres fotos del SKU 8466 comprobada por teclado en producción final.
- [ ] Confirmar condiciones de envío con la ferretería.

## Fase 4 — Rendimiento

Referencia: commit `094172b`; ajustes posteriores se incluyen en el cierre final.

- [x] Fachada del mapa: Google Maps se carga tras interacción, con enlace externo disponible.
- [x] Logo SVG en header; PARDITO usa la mascota corporativa PNG, `sizes` según tamaño mostrado, calidad 75 y carga diferida.
- [x] Imágenes con tamaños responsivos; galerías secundarias tras interacción y enlaces de tarjetas sin prefetch.
- [x] API pública con caché; solo 24 productos cruzan al cliente por página. Origen verificado con `s-maxage=300,stale-while-revalidate=86400` en 159/159 comprobaciones locales; producción registra `public` y diez respuestas CDN HIT.
- [x] Formateadores Intl reutilizados, caché de nombres, guards contra renders iniciales redundantes y modal de producto diferido.
- [x] Google PageSpeed móvil: 99/99/98/100/100, un ensayo por ruta y objetivo ≥90 cumplido en esas cinco mediciones. El CLI público conserva 68/68/74/73/73 y advertencia de CPU lenta en cinco; no alcanza ≥90 en ese entorno.

## Fase 5 — Accesibilidad

Referencias: commits `3f45829` y `14df555`, integrados en PR #6; SHA de publicación final `03b9923fd811986ab4658b0b8741425907418808`.

- [x] Ajustes de tipografía mínima, contraste oscuro, foco visible y objetivos táctiles de 44 px en los controles revisados.
- [x] Nomenclatura de cotización en etiquetas accesibles, estados, diálogos y respeto a movimiento reducido.
- [x] Mapa, PARDITO y acciones principales usan controles semánticos operables con teclado.
- [x] Filtros: foco inicial, ciclo Tab/Shift+Tab y Escape con retorno; Enter abre cotización y ayuda, Escape devuelve foco. Registrado en producción `3f6a4a8`.
- [x] Menú móvil: Enter abre, Tab llega a Inicio y Escape devuelve foco, comprobado en preview `493b4b9`.
- [x] Galería 8466: Tab entre controles, Enter/Espacio seleccionan fotos, estado accesible actualizado, enlace a original y retorno Shift+Tab, registrados en producción final.
- [x] Cinco axe válidos con cero violations, incluidas serias/críticas; incomplete de contraste separado de la revisión manual. Lighthouse accesibilidad 100 en las cinco rutas.

La revisión de teclado y objetivos táctiles no constituye una declaración de conformidad AAA de todo el sitio. No se realizó una prueba con lector de pantalla.

## Archivos de revisión fuera de Git

- Marcas: `C:/Users/DELL/Documents/outputs/ferrepardo-ecommerce-20261004/marcas-revision.csv` — 1.319 filas; columnas `sku,nombre,marca_detectada,confianza`.
- Fotos: `C:/Users/DELL/Documents/outputs/ferrepardo-ecommerce-20261004/prioridades-fotos-200.csv` — 200 de las 717 referencias con stock y sin foto, ordenadas por stock publicado porque no existe frecuencia de ventas en la fuente pública.

Los CSV conservan el SKU literal; al abrirlos en Excel debe importarse esa columna como texto. La cantidad de stock compara unidades de venta distintas y no demuestra rotación. No incorporar estos CSV a Git ni activar las marcas propuestas sin aprobación.

## Validación final

Suite registrada por el responsable de integración: **132 tests PASS**. HTTP final público: **179/179 PASS**; HTTP local: **159/159 PASS**. Las comprobaciones de accesibilidad y Lighthouse se registran por separado.

| Criterio de aceptación | Estado del cierre |
| --- | --- |
| HTML de catálogo y cerrajería con ≥24 enlaces de producto | PASS: 24 enlaces/IDs distintos en cada ruta |
| 301 de `?cat=` y `/producto/[sku]` | PASS: comprobadas en producción |
| Lighthouse móvil: rendimiento ≥90, SEO 100, accesibilidad ≥95 | PASS en Google PSI: rendimiento 98–100, accesibilidad 100; SEO 100 en cuatro páginas indexables y 69 en query noindex esperado. CLI separado abajo |
| axe-core: cero violaciones serias o críticas | PASS: cinco JSON válidos, cero violations; incomplete manual registrado aparte |
| Rich Results Test: negocio, producto, migas e ItemList | PASS en las URLs probadas, con avisos no críticos y alcance limitado |
| Búsquedas: chapa, visagra, tornillo drywall, candado yale, lija 120, broca 1/4 | PASS: HTTP 200 y resultados en las seis |
| Capturas a 390 y 1.440 px de catálogo, categoría, fichas con/sin foto, vacío y cotización | PASS: 12 archivos con los anchos verificados; los estados vacíos muestran la página completa |

Artefactos en `C:/Users/DELL/Documents/outputs/ferrepardo-ecommerce-20261004/`: `http-final-production.json`, `http-final-local.json`, `keyboard-verification.json`, `gallery-keyboard-verification.json`, `pagespeed-summary.private.json`, `reports-production/summary.json`, `summary.html` y carpeta `screenshots/`. El informe HTTP de producción verifica identidades, precios, impuestos y stock contra la fuente, junto con la lista permitida de campos públicos.

| Ruta / informe oficial móvil | Rendimiento Google PSI | Rendimiento CLI sobre producción | Accesibilidad, ambos | Buenas prácticas, ambos | SEO, ambos |
| --- | ---: | ---: | ---: | ---: | ---: |
| [Catálogo](https://pagespeed.web.dev/analysis/https-ferre-oficial-vercel-app-catalogo/m571e5a9us?form_factor=mobile) | 99 | 68 | 100 | 100 | 100 |
| [Cerrajería](https://pagespeed.web.dev/analysis/https-ferre-oficial-vercel-app-catalogo-cerrajeria/m5tzyn5n49?form_factor=mobile) | 99 | 68 | 100 | 100 | 100 |
| [Ficha con foto 0435](https://pagespeed.web.dev/analysis/https-ferre-oficial-vercel-app-producto-0435-bisagra-parche-mob-mini-par/j89iptrom2?form_factor=mobile) | 98 | 74 | 100 | 100 | 100 |
| [Ficha sin foto 00050](https://pagespeed.web.dev/analysis/https-ferre-oficial-vercel-app-producto-00050-disco-dw-pulir-metal-1-4x4-1-2-t27/8sch1vu482?form_factor=mobile) | 100 | 73 | 100 | 100 | 100 |
| [Búsqueda sin resultados](https://pagespeed.web.dev/analysis/https-ferre-oficial-vercel-app-catalogo/qv7u86thdn?form_factor=mobile) | 100 | 73 | 100 | 100 | 69 |

Google PSI: una ejecución por URL, Móvil seleccionado, Moto G Power emulado, 4G lenta y HeadlessChromium 153. Evidencia guardada desde la interfaz oficial como DOM y capturas, no como JSON Lighthouse original. No hay datos de usuarios reales/CrUX en esos cinco informes.

CLI: Chrome 154, Lighthouse móvil con CPU ×4 y throttling simulado estándar, RTT 150 ms y 1.638,4 kbps. Las cinco ejecuciones públicas muestran advertencia de CPU del equipo más lenta de lo esperado. Son entornos distintos: no se promedian, no se ocultan puntuaciones ni se presentan como experimento controlado antes/después.

Axe usa viewport 758×426. Los incomplete son 2–3 nodos de contraste por ruta, por degradado del footer y símbolos decorativos no textuales. Revisión manual de integración: texto blanco del footer mínimo 4,615:1 incluso con dos adornos white/5; chip claro 4,780:1 y oscuro 9,979:1. Se distinguen estos resultados manuales de los cero violations automáticos.

Galería comprobada: SKU `8466`, tres fotos; Enter selecciona la segunda, Espacio la tercera, se actualiza el texto de estado y el enlace «Ampliar» apunta al original `8466-3.webp`. Shift+Tab vuelve al tercer control. Alcance registrado en `gallery-keyboard-verification.json`; no se afirma verificación de todas las galerías ni anuncio mediante un lector de pantalla.

Google: [ficha 0435](https://search.google.com/test/rich-results/result?id=8HCXabeOurbD2L743iDKpw), cinco elementos válidos; [cerrajería](https://search.google.com/test/rich-results/result?id=9BX2gmSyCw_vVCcVwYREUA), cuatro; [ItemList](https://search.google.com/test/rich-results/result/r%2Fcarousels?id=9BX2gmSyCw_vVCcVwYREUA), tipo ItemList y posiciones 1–24. Las pruebas incluyen Product, HardwareStore, BreadcrumbList e ItemList. Los resúmenes muestran avisos no críticos en fragmentos de producto, fichas de comerciantes y organización; no detallan los campos afectados. No se inventan causas de esos avisos.

Vercel consume `s-maxage` y `stale-while-revalidate` antes de devolver la respuesta pública, conforme a su [documentación oficial](https://vercel.com/docs/caching/cache-control-headers). La política numérica se verifica en origen; no se deduce de observar HIT en producción.

Los tipos schema.org válidos no garantizan resultados enriquecidos de Google. Revisar por ficha la elegibilidad de Product, especialmente cuando falta foto o el precio está pendiente; no fabricar datos para satisfacer requisitos.

## Pendientes y responsables

- **Ferretería Pardo:** confirmar cobertura, coste y condiciones de envío; aprobar el CSV de marcas y aportar las 159 unidades pendientes.
- **Responsable del catálogo:** revisar el SKU `5964`, validar paquetes/funciones/acabados y priorizar fotos exactas de las 200 referencias. Mantener las 192 fotos publicadas como punto de partida; ampliar solo con evidencia y aprobación.
- **Responsable técnico:** conservar artefactos y repetir las comprobaciones relevantes tras cambios; comprobar SEO tras cualquier actualización aprobada de datos y decidir aparte la futura sincronización de Siigo.
- **Responsable de publicación:** para la futura promoción a `ferreteriapardo.com`, configurar `NEXT_PUBLIC_SITE_URL` en el entorno correspondiente, reconstruir y verificar canonical, JSON-LD, sitemap y redirecciones 301. Sin cambios de DNS en esta entrega; la migración requiere coordinar origen y destino para evitar URLs contradictorias.

## Pendiente técnico — dependencias

**Responsable técnico:** planificar una migración separada de Next.js 14 a 16 y Tailwind 3 a 4, con revisión de compatibilidad y validación propia. No se realizan esas migraciones dentro de esta entrega.

Según el `npm audit` actual registrado por integración, hay **11 vulnerabilidades preexistentes**. La incorporación de `sharp` **0.35.5** no añadió vulnerabilidades nuevas en esa comparación; los hallazgos existentes permanecen como trabajo técnico pendiente. Este registro no afirma que se hayan mitigado exploits ni determina por sí solo la aceptación de la publicación.

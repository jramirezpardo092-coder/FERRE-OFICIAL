# Refinamiento visual · Ferretería Pardo

**Revisión del 04·10·2026:** las correcciones móviles, las cuatro columnas y el horario solicitado se documentan en [las 12 comparativas nuevas](revision-2/README.md). La evidencia que sigue es el primer refinamiento y se conserva como historial.

Fuente de verdad: [DESIGN.md](../../DESIGN.md). Comparación con producción basada en `6909394e0f59a585caeaece768ffec4eee6f83d8`. Las 32 referencias se capturaron antes de modificar componentes. Las cuatro capturas de cotización se reencuadraron sobre la misma producción para mostrar el panel completo, sin cambiar la cotización ni enviar mensajes.

El primer refinamiento conservó rutas, precios, datos, fotos aprobadas, metadatos, JSON-LD y la lógica de cotización. [Informe de invariantes original](reports/invariants.json). La revisión 2 añade la actualización de horario visible y de `openingHoursSpecification` solicitada expresamente por el propietario; el resto sigue protegido.

## Resultados de verificación

[CI de la revisión 236d11d](https://github.com/jramirezpardo092-coder/FERRE-OFICIAL/actions/runs/37233918680): 44 estados aprobados, cero infracciones de axe y preload exclusivo de Archivo. Lighthouse móvil: catálogo 98 y ficha 95; CLS 0,019 y 0,00009. Son mediciones de laboratorio, no datos de campo. La última revisión vuelve a ejecutar los mismos gates; sus informes completos quedan en el check de la PR.

[Resumen CI](reports/ci-verification.json) · [Historial de rendimiento, incluido el primer fallo](reports/performance-history.json) · [Verificación local](reports/visual-verification.json). Se conservan los resultados `incomplete` de axe para revisión humana.

## Decisiones visuales para revisión

- Archivo variable con ancho 80 y peso 700–800; Manrope 400/600 e IBM Plex Mono 500. Sólo dos archivos nuevos de fuente y preload exclusivo de Archivo.
- Tres franjas a 60° como remate: esquina del inicio, separadores y vacíos. Sin degradados ni animaciones al hacer scroll.
- PARDITO corporativo existente de 180 px en vacíos y discreto en ayuda. No se crearon ilustraciones nuevas ni fotos de productos.
- La revisión inicial tenía tres columnas con barra lateral a 1280 px. La revisión 2 muestra cuatro, con CTA de 14 px en dos líneas y marco fotográfico 4:3.
- El rojo sólido sigue siendo #D02731; su token de texto sobre el tinte es #CF2630 para superar 4,5:1 (el par original da 4,496:1). WhatsApp usa texto oscuro sobre el único CTA verde sólido; blanco sobre ese verde no alcanza 4,5:1.

## Evidencia antes y después

Cada ancho es el viewport CSS real: 390 × 844 y 1440 × 900. Footer y búsqueda vacía se muestran completos para incluir sus acciones. El panel usa datos públicos de prueba y se dejó vacío al terminar. No se enviaron mensajes de WhatsApp.

### Claro · 390 px

<details>
<summary>Inicio</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Inicio](before/inicio-390-claro.jpg) | ![Después: Inicio](after/inicio-390-claro.jpg) |

</details>

<details>
<summary>Catálogo</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Catálogo](before/catalogo-390-claro.jpg) | ![Después: Catálogo](after/catalogo-390-claro.jpg) |

</details>

<details>
<summary>Categoría: Cerrajería</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Categoría: Cerrajería](before/categoria-390-claro.jpg) | ![Después: Categoría: Cerrajería](after/categoria-390-claro.jpg) |

</details>

<details>
<summary>Ficha con foto · SKU 0435</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Ficha con foto · SKU 0435](before/ficha-foto-390-claro.jpg) | ![Después: Ficha con foto · SKU 0435](after/ficha-foto-390-claro.jpg) |

</details>

<details>
<summary>Ficha sin foto · SKU 00050</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Ficha sin foto · SKU 00050](before/ficha-sin-foto-390-claro.jpg) | ![Después: Ficha sin foto · SKU 00050](after/ficha-sin-foto-390-claro.jpg) |

</details>

<details>
<summary>Búsqueda sin resultados</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Búsqueda sin resultados](before/sin-resultados-390-claro.jpg) | ![Después: Búsqueda sin resultados](after/sin-resultados-390-claro.jpg) |

</details>

<details>
<summary>Cotización preparada · 1 par SKU 0435</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Cotización preparada · 1 par SKU 0435](before/cotizacion-390-claro.jpg) | ![Después: Cotización preparada · 1 par SKU 0435](after/cotizacion-390-claro.jpg) |

</details>

<details>
<summary>Footer</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Footer](before/footer-390-claro.jpg) | ![Después: Footer](after/footer-390-claro.jpg) |

</details>


### Claro · 1440 px

<details>
<summary>Inicio</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Inicio](before/inicio-1440-claro.jpg) | ![Después: Inicio](after/inicio-1440-claro.jpg) |

</details>

<details>
<summary>Catálogo</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Catálogo](before/catalogo-1440-claro.jpg) | ![Después: Catálogo](after/catalogo-1440-claro.jpg) |

</details>

<details>
<summary>Categoría: Cerrajería</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Categoría: Cerrajería](before/categoria-1440-claro.jpg) | ![Después: Categoría: Cerrajería](after/categoria-1440-claro.jpg) |

</details>

<details>
<summary>Ficha con foto · SKU 0435</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Ficha con foto · SKU 0435](before/ficha-foto-1440-claro.jpg) | ![Después: Ficha con foto · SKU 0435](after/ficha-foto-1440-claro.jpg) |

</details>

<details>
<summary>Ficha sin foto · SKU 00050</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Ficha sin foto · SKU 00050](before/ficha-sin-foto-1440-claro.jpg) | ![Después: Ficha sin foto · SKU 00050](after/ficha-sin-foto-1440-claro.jpg) |

</details>

<details>
<summary>Búsqueda sin resultados</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Búsqueda sin resultados](before/sin-resultados-1440-claro.jpg) | ![Después: Búsqueda sin resultados](after/sin-resultados-1440-claro.jpg) |

</details>

<details>
<summary>Cotización preparada · 1 par SKU 0435</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Cotización preparada · 1 par SKU 0435](before/cotizacion-1440-claro.jpg) | ![Después: Cotización preparada · 1 par SKU 0435](after/cotizacion-1440-claro.jpg) |

</details>

<details>
<summary>Footer</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Footer](before/footer-1440-claro.jpg) | ![Después: Footer](after/footer-1440-claro.jpg) |

</details>


### Oscuro · 390 px

<details>
<summary>Inicio</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Inicio](before/inicio-390-oscuro.jpg) | ![Después: Inicio](after/inicio-390-oscuro.jpg) |

</details>

<details>
<summary>Catálogo</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Catálogo](before/catalogo-390-oscuro.jpg) | ![Después: Catálogo](after/catalogo-390-oscuro.jpg) |

</details>

<details>
<summary>Categoría: Cerrajería</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Categoría: Cerrajería](before/categoria-390-oscuro.jpg) | ![Después: Categoría: Cerrajería](after/categoria-390-oscuro.jpg) |

</details>

<details>
<summary>Ficha con foto · SKU 0435</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Ficha con foto · SKU 0435](before/ficha-foto-390-oscuro.jpg) | ![Después: Ficha con foto · SKU 0435](after/ficha-foto-390-oscuro.jpg) |

</details>

<details>
<summary>Ficha sin foto · SKU 00050</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Ficha sin foto · SKU 00050](before/ficha-sin-foto-390-oscuro.jpg) | ![Después: Ficha sin foto · SKU 00050](after/ficha-sin-foto-390-oscuro.jpg) |

</details>

<details>
<summary>Búsqueda sin resultados</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Búsqueda sin resultados](before/sin-resultados-390-oscuro.jpg) | ![Después: Búsqueda sin resultados](after/sin-resultados-390-oscuro.jpg) |

</details>

<details>
<summary>Cotización preparada · 1 par SKU 0435</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Cotización preparada · 1 par SKU 0435](before/cotizacion-390-oscuro.jpg) | ![Después: Cotización preparada · 1 par SKU 0435](after/cotizacion-390-oscuro.jpg) |

</details>

<details>
<summary>Footer</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Footer](before/footer-390-oscuro.jpg) | ![Después: Footer](after/footer-390-oscuro.jpg) |

</details>


### Oscuro · 1440 px

<details>
<summary>Inicio</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Inicio](before/inicio-1440-oscuro.jpg) | ![Después: Inicio](after/inicio-1440-oscuro.jpg) |

</details>

<details>
<summary>Catálogo</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Catálogo](before/catalogo-1440-oscuro.jpg) | ![Después: Catálogo](after/catalogo-1440-oscuro.jpg) |

</details>

<details>
<summary>Categoría: Cerrajería</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Categoría: Cerrajería](before/categoria-1440-oscuro.jpg) | ![Después: Categoría: Cerrajería](after/categoria-1440-oscuro.jpg) |

</details>

<details>
<summary>Ficha con foto · SKU 0435</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Ficha con foto · SKU 0435](before/ficha-foto-1440-oscuro.jpg) | ![Después: Ficha con foto · SKU 0435](after/ficha-foto-1440-oscuro.jpg) |

</details>

<details>
<summary>Ficha sin foto · SKU 00050</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Ficha sin foto · SKU 00050](before/ficha-sin-foto-1440-oscuro.jpg) | ![Después: Ficha sin foto · SKU 00050](after/ficha-sin-foto-1440-oscuro.jpg) |

</details>

<details>
<summary>Búsqueda sin resultados</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Búsqueda sin resultados](before/sin-resultados-1440-oscuro.jpg) | ![Después: Búsqueda sin resultados](after/sin-resultados-1440-oscuro.jpg) |

</details>

<details>
<summary>Cotización preparada · 1 par SKU 0435</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Cotización preparada · 1 par SKU 0435](before/cotizacion-1440-oscuro.jpg) | ![Después: Cotización preparada · 1 par SKU 0435](after/cotizacion-1440-oscuro.jpg) |

</details>

<details>
<summary>Footer</summary>

| Antes | Después |
| --- | --- |
| ![Antes: Footer](before/footer-1440-oscuro.jpg) | ![Después: Footer](after/footer-1440-oscuro.jpg) |

</details>

## Comprobaciones

Los resultados de axe, alineación, fondos rojos, controles táctiles y estabilidad se guardan en los [informes](reports/). Los scripts no ejecutan envíos de WhatsApp. Las mediciones de rendimiento identifican entorno y versión; no se presenta una puntuación antigua de producción como resultado del código nuevo.

El check de la PR contiene la validación de su última revisión. Cada ejecución conserva JSON, HTML y capturas completos, también cuando un criterio falla.

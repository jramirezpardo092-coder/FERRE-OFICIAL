# Correcciones visuales · revisión 2

Se corrige la PR #9 sobre `codex/refinamiento-visual-mostrador`. La PR sigue abierta: la fusión corresponde al propietario. Esta entrega conserva la lógica de cotización, los precios, los datos, las fotos y las rutas.

## Cambios y alcance

- Franjas del inicio móvil en la esquina superior derecha, fuera del H1 y el párrafo en las tres diapositivas.
- Hero compacto y una sola línea debajo del título. Se elimina la ayuda repetida; resultados, Filtros y orden comparten fila móvil.
- Selector «Con IVA / Sin IVA» sin saltos; «empresas» en el nombre accesible.
- PARDITO ocupa 44 px reservados en el header del catálogo móvil: desaparece al bajar y reaparece al subir, sin cubrir las acciones. Se conserva el espacio inferior de la lista y el retorno del foco al cerrar la ayuda, incluso tras cambiar el ancho.
- Cuatro columnas desde 1280 px y fotos 4:3 en catálogo de escritorio. CTA de 14 px, dos líneas y 56 px de alto.
- Categorías con migas compactas y filtros activos junto al buscador en escritorio, conservando las acciones.
- Horario solicitado: lunes a jueves 08:15–16:45, viernes 08:15–16:30 y sábado 08:15–13:00. Es la única excepción autorizada sobre el contenido de negocio y su JSON-LD.

[DESIGN.md](../../../DESIGN.md) documenta únicamente estas correcciones necesarias. [Informe de invariantes](invariants.json). La lista 2 de Siigo, ISR, descripción de precio, filtro IVA, abreviaturas y relevancia corresponden a la PR funcional posterior a la fusión de la #9. Los precios actuales no se han reetiquetado como lista 2.

## Validación

Mediciones del build corregido, iguales en claro y oscuro:

| Criterio | Catálogo | Categoría Cerrajería |
| --- | ---: | ---: |
| Borde inferior de la primera tarjeta a 390×844 | 662 px | 762 px |
| Borde inferior de la fila completa a 1440×900 | 851 px | 895 px |
| Hero de escritorio | 76 px | 76 px |
| Columnas desde 1280 px | 4 | 4 |

Compilación de producción y 154 pruebas aprobadas. El primer lote local completo midió 52 estados y detectó los dos fallos de altura de categoría indicados abajo; el lote dirigido posterior aprueba sus 32 estados con cero infracciones de axe. [Historial de verificación](verification-history.json). La matriz completa se exige nuevamente en CI antes de declarar lista la PR. El preload local de Next 14/Windows permanece sólo como diagnóstico; CI Linux lo exige.

Los [verificadores](../../visual-verification.md) incluyen 52 estados con axe, los límites de 1280 px, las tres diapositivas en 360/390/430 px y las secuencias de scroll con PARDITO. Los botones completamente visibles se comprueban en cinco puntos por control. Los recortados por viewport/header se registran aparte; no se afirma cobertura de todos sus píxeles.

La primera ejecución de esta revisión detectó que la categoría terminaba a 975 px en escritorio; se conservaron sus resultados y se corrigió la distribución. La compilación final y sus gates reproducibles se ejecutan en el [check de la PR #9](https://github.com/jramirezpardo092-coder/FERRE-OFICIAL/pull/9/checks). Ese check incluye Lighthouse móvil ≥95 en catálogo y ficha, CLS <0,1 y preload exclusivo de Archivo. Las mediciones son de laboratorio; los informes completos conservan todos los resultados.

## Comparativas

12 capturas antes y 12 después, con viewport completo sin scroll: inicio, catálogo y búsqueda vacía a **390×844** y **1440×900**, en claro y oscuro. Antes: revisión `29d0e63` en Vercel. Después: build de producción local de la revisión corregida, navegador aislado. Manifiestos: [antes](before-manifest.json) y [después](after-manifest.json). El formato y el motor de captura están documentados; no se comparan píxeles como si fueran el mismo motor.

### 390×844 · claro

<details>
<summary>Inicio</summary>

| Antes | Después |
| --- | --- |
| ![Inicio antes](before/inicio-390-claro.jpg) | ![Inicio después](after/inicio-390-claro.png) |

</details>

<details>
<summary>Catálogo</summary>

| Antes | Después |
| --- | --- |
| ![Catálogo antes](before/catalogo-390-claro.jpg) | ![Catálogo después](after/catalogo-390-claro.png) |

</details>

<details>
<summary>Búsqueda sin resultados</summary>

| Antes | Después |
| --- | --- |
| ![Búsqueda sin resultados antes](before/sin-resultados-390-claro.jpg) | ![Búsqueda sin resultados después](after/sin-resultados-390-claro.png) |

</details>

### 390×844 · oscuro

<details>
<summary>Inicio</summary>

| Antes | Después |
| --- | --- |
| ![Inicio antes](before/inicio-390-oscuro.jpg) | ![Inicio después](after/inicio-390-oscuro.png) |

</details>

<details>
<summary>Catálogo</summary>

| Antes | Después |
| --- | --- |
| ![Catálogo antes](before/catalogo-390-oscuro.jpg) | ![Catálogo después](after/catalogo-390-oscuro.png) |

</details>

<details>
<summary>Búsqueda sin resultados</summary>

| Antes | Después |
| --- | --- |
| ![Búsqueda sin resultados antes](before/sin-resultados-390-oscuro.jpg) | ![Búsqueda sin resultados después](after/sin-resultados-390-oscuro.png) |

</details>

### 1440×900 · claro

<details>
<summary>Inicio</summary>

| Antes | Después |
| --- | --- |
| ![Inicio antes](before/inicio-1440-claro.jpg) | ![Inicio después](after/inicio-1440-claro.png) |

</details>

<details>
<summary>Catálogo</summary>

| Antes | Después |
| --- | --- |
| ![Catálogo antes](before/catalogo-1440-claro.jpg) | ![Catálogo después](after/catalogo-1440-claro.png) |

</details>

<details>
<summary>Búsqueda sin resultados</summary>

| Antes | Después |
| --- | --- |
| ![Búsqueda sin resultados antes](before/sin-resultados-1440-claro.jpg) | ![Búsqueda sin resultados después](after/sin-resultados-1440-claro.png) |

</details>

### 1440×900 · oscuro

<details>
<summary>Inicio</summary>

| Antes | Después |
| --- | --- |
| ![Inicio antes](before/inicio-1440-oscuro.jpg) | ![Inicio después](after/inicio-1440-oscuro.png) |

</details>

<details>
<summary>Catálogo</summary>

| Antes | Después |
| --- | --- |
| ![Catálogo antes](before/catalogo-1440-oscuro.jpg) | ![Catálogo después](after/catalogo-1440-oscuro.png) |

</details>

<details>
<summary>Búsqueda sin resultados</summary>

| Antes | Después |
| --- | --- |
| ![Búsqueda sin resultados antes](before/sin-resultados-1440-oscuro.jpg) | ![Búsqueda sin resultados después](after/sin-resultados-1440-oscuro.png) |

</details>

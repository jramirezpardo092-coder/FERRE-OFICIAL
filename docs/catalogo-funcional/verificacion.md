# Estado de la verificación

Esta rama nació de `main` en `6909394` (PR8). La PR9 todavía figura abierta en GitHub. La entrega permanece en borrador hasta incorporar esa base y completar el pulido visual solicitado.

## Funcional

- Build de producción: correcto. El manifiesto declara 300 segundos para `/catalogo` y las nueve categorías; las consultas se renderizan de forma dinámica.
- Suite de pruebas: 205 comprobaciones aprobadas, incluidos los 1.319 enlaces existentes.
- Navegador aislado: 20 escenarios aprobados, cero errores de consola o HTTP. Cubre SSR, selector IVA, orden/rango/marca/disponibilidad, restauración de preferencias, Atrás/Adelante y sugerencia de producto con MOB. Se corrigió una carrera de hidratación que dejaba tarjetas en modo bruto tras restaurar una URL neta.
- Selector IVA dentro de vista rápida: no existe en la base PR8; el verificador lo exigirá cuando esté incorporado el diseño de PR9. No se contabiliza como escenario aprobado.
- HTTP local: 149 comprobaciones aprobadas, segundo GET con `x-nextjs-cache: HIT`, SSR e ItemList correctos y tres fichas reales: `0435` (foto), `00050` (sin foto) y `0242-1` (precio pendiente).

Los informes completos se generan fuera del repositorio con los scripts de verificación. [ISR y comando posterior al merge](../catalogo-isr.md).

## Referencias visuales anteriores

Se conservan las capturas del catálogo del [CI de PR9](https://github.com/jramirezpardo092-coder/FERRE-OFICIAL/actions/runs/37241722772), cuyo head es `36e46a3`. Son imágenes anteriores de esa base, sin cambios ni reescalado, y **no son capturas posteriores de esta rama**. El [manifiesto](./before-pr9/manifest.json) registra origen y dimensiones. El commit temporal utilizado por CI no significa que PR9 esté fusionada en `main`.

| Tamaño | Claro | Oscuro |
| --- | --- | --- |
| 390 × 844 | [Antes](./before-pr9/catalogo-390-light.png) | [Antes](./before-pr9/catalogo-390-dark.png) |
| 1440 × 900 | [Antes](./before-pr9/catalogo-1440-light.png) | [Antes](./before-pr9/catalogo-1440-dark.png) |

## Pendientes para marcar la PR lista

- Incorporar `main` una vez que contenga PR9 y aplicar el pulido autorizado: CTA corto, disponibilidad sin recortes y precio secundario móvil en una línea.
- Capturas posteriores y comparación con las referencias anteriores.
- `verify-visual-browser`, `verify-visual-layout`, axe sin fallos y PageSpeed móvil ≥95 del resultado combinado. No se trasladan resultados antiguos a esta rama.
- Después del merge por el usuario y del despliegue Ready: ejecutar el verificador HTTP con `--require-isr` sobre producción y comprobar las tres fichas. El HIT local no acredita el header `x-vercel-cache` de Vercel.

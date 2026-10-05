# Catálogo: precios, búsqueda y caché

## Precio y filtros

`priceMode=gross|net` es parte de la URL y de la API pública del catálogo. Si falta, se usa `gross`. La misma base gobierna el selector, las tarjetas, el rango, los límites disponibles y la ordenación por precio. Una URL compartida tiene prioridad sobre una preferencia guardada. En una primera visita sin parámetros se restaura la preferencia guardada; Atrás/Adelante vuelve al estado de la URL.

El filtro compara COP enteros, tal como se ven en la tarjeta. Cada producto utiliza su IVA confirmado (0, 5 o 19 %), con un único redondeo al presentar. No se modifican los precios base ni los cálculos precisos de la cotización. Un precio pendiente se conserva en el catálogo general y queda fuera de un rango de precio. Una base confirmada con IVA desconocido sólo participa en rangos sin IVA.

Al alternar el selector, el importe escrito se conserva como presupuesto en COP y se interpreta según la nueva base; los límites y los resultados se recalculan. No se multiplica un rango completo por 1,19: los productos pueden tener tarifas distintas. El modo no cuenta como un filtro activo y no se borra con «Limpiar filtros».

Las metadescripciones de las fichas comienzan por el importe con IVA. Si el importe final no es verificable, comienzan por «Precio por confirmar». El JSON fuente y la lista de precios no cambian.

## Búsqueda y nombres

Los identificadores exactos preceden a las coincidencias de nombre. Una coincidencia al inicio del nombre precede a una accesoria, incluidos los sinónimos colombianos y «visagra». El stock y las promociones no pueden desplazar esas prioridades.

Sólo se amplían MOB y ECON. Las otras 48 entradas de la [revisión de abreviaturas](./abreviaturas.md) conservan su estado de revisión o sus reglas anteriores. El normalizador de rutas conserva los 1.319 enlaces publicados, verificados contra un snapshot de la base. Las sugerencias navegan por SKU y utilizan la redirección canónica existente, sin fabricar una URL a partir del nombre expandido.

## Verificación

`npm test` cubre precios fraccionarios, tarifas de IVA, pendientes, búsquedas reales, colisiones entre SKU y referencia, SSR, metadatos y todos los enlaces publicados. `npm run build` debe generar `/catalogo` y las nueve categorías con un intervalo de 300 segundos.

La [documentación de ISR](../catalogo-isr.md) explica cómo se separan las rutas limpias de las consultas y cómo verificar el despliegue. Un resultado local no sustituye la comprobación HTTP en producción después de fusionar.

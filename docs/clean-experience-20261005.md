# Experiencia Pardo: integración y verificación

## Alcance

La rama integra las PR #9 y #10, conservando ambas historias. Mejora jerarquía, búsqueda en portada, consistencia tipográfica, fichas móviles y acciones de cotización. El catálogo mantiene sus 1.319 registros, identificadores, valores comerciales y rutas canónicas.

Se añadieron seis fotografías exactas recuperadas de la tienda existente: 0344, 0350, 0678, 10444, 10445 y 10585. La del SKU 0344 muestra una pieza del par, indicado expresamente en su texto alternativo; la unidad comercial no cambia. Las fuentes y correspondencias están en `product-image-provenance-20261005.json`. Los archivos originales se convierten a WebP sin pérdida, sin recorte, generación ni duplicación artificial de piezas.

No se publican los 18 candidatos adicionales de fabricantes/distribuidores mientras no se confirme su permiso de reutilización. Tampoco se activan imágenes de cerraduras de alcoba para variantes de baño ni fotos de familias con medidas/acabados no verificables. El SKU 2267 sigue requiriendo aclaración de 3/8 frente a referencia 1/2. Los pendientes conservan una indicación honesta; completar cobertura no justifica una foto incorrecta.

## Verificación reproducible

- `npm run lint`
- `npm run typecheck`
- `node --test --test-concurrency=1 tests/*.test.cjs scripts/*.test.cjs`
- `python -m unittest discover -s tests -p 'test_*.py'`
- `npm run build`
- Iniciar con `node node_modules/next/dist/bin/next start --hostname localhost --port 3010`
- `node scripts/verify-catalog-http.cjs --url http://localhost:3010 --output /tmp/pardo-http.json`
- Ejecutar los verificadores funcionales, visuales y Lighthouse con el mismo origen y un Chrome local aislado.

Importante para Next 14: usar **localhost tanto en hostname del servidor como en la URL del verificador**. NextURL normaliza la dirección 127.0.0.1, pero un servidor enlazado explícitamente con ese hostname puede interpretar su reescritura como externa y redirigir la consulta al alias público. Con ambos valores localhost, las 149 comprobaciones HTTP pasan. Esta configuración está incorporada a CI; no cambia rutas públicas ni reglas comerciales.

La comprobación fuente/build debe ejecutarse tras compilar los mismos archivos. Añadir una fotografía cambia legítimamente el orden recomendado, por lo que un build anterior no se debe comparar con el catálogo enriquecido posterior.

## Evidencia disponible en esta etapa

Compilación optimizada correcta con 1.340 rutas. Lint limpio, typecheck correcto, 231 pruebas Node y 9 Python correctas. Auditoría de tokens sin hallazgos. HTTP: 149 comprobaciones, cero fallos en el build de cinco fotos previo al último añadido. Repetir al incorporar cualquier cambio. Navegador y rendimiento se validan en CI y revisión de escritorio antes de producción; no afirmar éxito de etapas pendientes.

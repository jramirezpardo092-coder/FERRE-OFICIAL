# Experiencia Pardo: integración y verificación

## Alcance

La rama integra las PR #9 y #10, conservando ambas historias. Mejora jerarquía, búsqueda en portada, consistencia tipográfica, fichas móviles y acciones de cotización. El catálogo mantiene sus 1.319 registros, identificadores, valores comerciales y rutas canónicas.

Se añadieron 81 imágenes de referencias antes sin imagen: nueve recuperadas de la tienda existente y setenta y dos de fuentes de fabricante/distribuidor, contrastando SKU, modelo, función y variante. Las fuentes y correspondencias están en `product-image-provenance-20261005.json`. Los originales se convierten a WebP sin pérdida, sin recorte, generación ni duplicación artificial de piezas. El SKU 0344 muestra una pieza del par, indicado en su texto alternativo; el SKU 10268 conserva stock cero; 6263 es el visor de repuesto, sin atribuirle certificaciones ni presentar una careta completa.

Se conserva el copyright de las fuentes; no se afirma que las imágenes sean de dominio público o tengan licencia abierta. Se excluyen fuentes con restricciones de reutilización incompatibles, muros de pago o marcas de agua de terceros. Tampoco se activan imágenes de cerraduras de alcoba para variantes de baño ni fotos de familias con medidas/acabados no verificables. El SKU 2267 sigue requiriendo aclaración de 3/8 frente a referencia 1/2. Los pendientes conservan una indicación honesta; completar cobertura no justifica una foto incorrecta.

Los renders del fabricante/distribuidor, la ficha técnica existente y las vistas parciales de componentes, pares y perfiles llevan una aclaración visible. No se cuentan indiscriminadamente como fotografías; los destacados de portada sólo usan fotografías sin esa clasificación.

La revisión de navegador detectó y corrigió dos regresiones: la imagen de portada necesitaba normalizar la ruta relativa antes de pasarla a Next Image; y Atrás/Adelante debía cerrar la vista rápida y liberar su bloqueo de foco. La vista rápida recupera también el selector de IVA compartido con catálogo.

## Actualización de seguridad

La entrega integra Next16.3.8 y React19.2.8. Véase `security-upgrade-20261005.md`: cero vulnerabilidades en dependencias de producción, con una limitación conocida sin parche en herramientas de desarrollo. El proyecto conserva Webpack, las rutas y el comportamiento de ISR.

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

La combinación de seguridad, medios y accesibilidad debe repetir todos los gates en su commit final. La revisión previa de escritorio verificó búsqueda, IVA, filtros, historial, cantidades, galería, vacíos y cotización; corrigió la foto de portada y el cierre de vista rápida. La medición CI previa obtuvo Lighthouse móvil 97 en catálogo y 98 en ficha, CLS0. Estos resultados previos no sustituyen los del commit final.

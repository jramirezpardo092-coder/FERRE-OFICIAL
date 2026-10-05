# Actualización de dependencias — 5 de octubre de 2026

## Decisión

Se actualiza Next.js 14.2.35 a **16.3.8** y React/React DOM a **19.2.8**, con versiones exactas y lockfile reproducible. Next 15.5.27 también corrige los avisos críticos, pero Next 16 es la rama Active LTS y evita una segunda migración próxima. Se conserva Webpack explícitamente, Tailwind 3 y la separación actual entre catálogo ISR y consultas dinámicas. No se activa Cache Components.

Fuentes verificadas:

- [Política de soporte de Next.js](https://nextjs.org/support-policy)
- [Versión 16.3.8](https://github.com/vercel/next.js/releases/tag/v16.3.8)
- [Migración oficial a Next 15](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [Migración oficial a Next 16](https://nextjs.org/docs/app/guides/upgrading/version-16)

## Avisos y aplicabilidad

El audit inicial identifica 14 dependencias afectadas: 1 crítica, 11 altas, 1 moderada y 1 baja. Son entradas del árbol, no 14 ataques independientes.

- [GHSA-p293-qw3h-jr36](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36): RCE condicionada a servidores con filesystem Windows. El entorno de compilación probado aquí es Linux; no se atribuye esta exposición a la publicación sin verificar su entorno.
- [GHSA-2xp9-vwfh-vxw4](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4): problema de libheif/sharp al optimizar entradas AVIF. Permitir salida AVIF no demuestra que un atacante pueda suministrar una entrada afectada. Se actualiza el framework sin ejecutar pruebas de explotación.
- Ambos avisos se publicaron el 25 de agosto de 2026. Las ramas corregidas comienzan en Next 15.5.24 y 16.3.3.
- PostCSS directo se actualiza a 8.5.29. Next 16.3.8 incorpora PostCSS 8.5.23, fuera de los rangos afectados detectados. También se actualizan dependencias transitivas compatibles mediante `npm audit fix`, sin `--force`.

## Cambios de compatibilidad

- `params` y `searchParams` se esperan como promesas en las cuatro rutas afectadas; metadatos y pruebas se adaptan al mismo contrato.
- `src/middleware.ts` pasa a `src/proxy.ts`, con la misma lógica de redirecciones y reescrituras. Se comprueban SKU con ceros iniciales, filtros, rutas canónicas y consultas aisladas de ISR.
- TypeScript adopta los ajustes generados por Next 16. `typecheck` genera primero los tipos de rutas, de modo que funciona tras una instalación limpia.
- `next lint` pasa al CLI ESLint y configuración plana. CI ejecuta lint explícitamente porque Next 16 ya no lo ejecuta dentro del build. También se añade el audit de dependencias de producción a CI.
- Se mantiene ESLint 9.39.5: los plugins publicados de React, import y accesibilidad usados por Next todavía no declaran soporte para ESLint 10. La prueba con ESLint 10 producía un árbol de peers inválido y se revirtió.
- Dos reglas nuevas de React Compiler (`set-state-in-effect` y `refs`) quedan como advertencias en `src`, conservando visibles 17 patrones previos. No se modifica la gestión del estado de la interfaz durante esta migración. Las reglas existentes de hooks y dependencias siguen activas.

## Resultado y límite residual

`npm audit --omit=dev` informa **0 vulnerabilidades**. El audit completo conserva **7 entradas altas**, todas derivadas de [braces GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), sin versión corregida publicada al verificar. Llegan por las herramientas de desarrollo Tailwind/chokidar y ESLint/fast-glob/micromatch.

La aplicación no recibe patrones glob ni CSS aportados por visitantes. Estas dependencias se usan al desarrollar, compilar y revisar código. El riesgo residual exige tratar el código y las configuraciones de compilación no confiables como no confiables. No se fuerza Tailwind 4 ni se oculta este hallazgo. Revisar la corrección upstream y la compatibilidad de ESLint 10 en un mantenimiento posterior.

## Verificación

- Instalación limpia mediante `npm ci` y árbol de dependencias sin peers inválidos.
- Typecheck aprobado; 238 pruebas aprobadas, 0 fallidas.
- Lint aprobado con las 17 advertencias nuevas indicadas arriba.
- Build de producción Next 16.3.8/Webpack aprobado: 1.338 rutas prerenderizadas, incluidas las 1.319 fichas de producto.
- Verificador HTTP: 149 comprobaciones, 16 peticiones, 0 fallos. Incluye SSR, metadatos, precios, filtros, redirecciones y aislamiento de consultas.
- ISR local de `/catalogo` y `/catalogo/cerrajeria`: `x-nextjs-cache: HIT` y `s-maxage=300`. La comprobación `--require-isr` del verificador exige específicamente el CDN de Vercel; corresponde ejecutarla en la publicación, no contra localhost.
- Optimización de imagen: HTTP 200 y salida `image/avif` con una imagen PNG local conocida.
- `src/data` y las imágenes no cambian. Las 1.319 filas originales conservan sus bytes.
- Verificación visual e interacciones en navegador: pendiente en el entorno de navegador independiente y en CI después de integrar esta migración; no se afirma que las pruebas HTTP sustituyan esa revisión.

La publicación debe continuar sólo después de las pruebas de navegador y CI del commit integrado.

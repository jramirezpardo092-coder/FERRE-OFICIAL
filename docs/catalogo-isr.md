# Catálogo: ISR y consultas en Next 14.2.35

`/catalogo` y las nueve rutas `/catalogo/[category]` sin parámetros usan `revalidate = 300`, runtime Node y `dynamic = "error"`. No leen `searchParams` en la página ni en sus metadatos. Las categorías desconocidas responden 404.

Cualquier parámetro de usuario, incluidos `page`, valores vacíos y claves desconocidas, hace que Middleware reescriba la petición a `/catalogo-interno[/category]`. Esas páginas usan `force-dynamic` y reutilizan `CatalogPage`: conservan el H1, los metadatos y el ItemList filtrado en el HTML inicial. La dirección del navegador y los canonical siguen siendo públicos. Las visitas directas al prefijo interno reciben una redirección 301 a la URL pública con sus parámetros. Las redirecciones antiguas por categoría y SKU se conservan antes de decidir el renderizado.

La separación es necesaria porque [leer `searchParams` vuelve dinámica una página en Next 14](https://nextjs.org/docs/14/app/api-reference/file-conventions/page), y las [rutas dinámicas no usan Full Route Cache](https://nextjs.org/docs/14/app/building-your-application/caching). Middleware se ejecuta [antes del contenido en caché y del matching de rutas](https://nextjs.org/docs/14/app/building-your-application/routing/middleware). No se usa `force-static` para ignorar parámetros.

`CatalogClient` debe conservar `initialData` e `initialParamsKey` durante SSR y aislar `useSearchParams` en una pequeña isla `Suspense` de sincronización. [Ese hook provoca renderizado cliente hasta su límite Suspense en una ruta estática](https://nextjs.org/docs/14/app/api-reference/functions/use-search-params); envolver el listado entero eliminaría sus tarjetas del HTML inicial. El adaptador de Next 14.2.35 [retira las queries internas como `_rsc` antes de entregar la petición a Middleware](https://github.com/vercel/next.js/blob/v14.2.35/packages/next/src/server/web/adapter.ts).

Los datos de precios y stock siguen siendo un snapshot JSON incluido en el build. ISR regenera HTML a partir de esa fuente; no consulta Siigo ni renueva el snapshot cada cinco minutos. Tras el intervalo, una petición puede recibir HTML anterior mientras se regenera en segundo plano.

## Comprobación HTTP después del build

1. Confirmar `initialRevalidateSeconds: 300` para catálogo y categorías en `.next/prerender-manifest.json`; los alias internos deben quedar dinámicos. Verificar que el HTML inicial contiene H1, metadatos y las 24 tarjetas correspondientes a su ItemList.
2. En Vercel, hacer dos GET consecutivos de la misma URL limpia, sin cabeceras `no-cache`, cookies, autenticación ni parámetros únicos. Guardar `x-vercel-cache`, `x-vercel-id`, `Cache-Control`, canonical y robots. Esperar `HIT` en la segunda petición y documentar si el despliegue devuelve otro estado; el primer resultado puede estar caliente. Localmente, revisar `x-nextjs-cache`, no exigir un header de Vercel.
3. Intercalar peticiones limpias y `?q=0435`, `?brand=YALE`, `?sort=price-asc`, `?page=2` y una búsqueda vacía. Sus HTML/ItemList deben corresponder a cada consulta, con canonical público y noindex de filtros; página 2 conserva su canonical y posiciones desde 25. Repetir la URL limpia para comprobar que no recibió la respuesta filtrada. No exigir HIT a las páginas dinámicas.
4. Comprobar por GET que un alias interno redirige una sola vez y que un enlace antiguo conserva filtros y SKU con ceros. Ningún alias debe aparecer en sitemap o canonical.
5. En tres fichas reales con precios y reglas de IVA distintos, comparar metadescripción y Product/Offer JSON-LD contra el helper de precio público usado por la interfaz. Comprobar SKU literal, canonical, precio COP con IVA y disponibilidad. Registrar también un caso con precio pendiente si lo hay; no inventar fixtures publicados.

[`x-vercel-cache` describe el caché de la respuesta CDN](https://vercel.com/docs/headers/response-headers#x-vercel-cache); un HIT de la API o una fecha visible de la fuente no demuestra por sí solo ISR del HTML. Los resultados HTTP quedan pendientes hasta ejecutar esas peticiones sobre el nuevo build.

Pruebas de aislamiento y SSR: `node --test tests/catalog-isr.test.cjs`.

## Verificador reutilizable

Requiere Node y las dependencias del proyecto (`npm ci`). Ejecuta peticiones HTTP secuenciales, conserva todas sus cabeceras y comprueba las 24 tarjetas HTML reales, H1, metadatos, ItemList, búsquedas, página 2 y redirecciones internas. Selecciona tres fichas existentes con foto, sin foto y con precio pendiente; compara su descripción y Offer con `getCatalogPrice`/`formatCOP` del checkout. No cuenta datos serializados en scripts Flight como tarjetas SSR, ni rechaza el marcador de bailout de la pequeña isla URL `Suspense`.

Con el nuevo servidor local o una preview, sin exigir un header de Vercel:

```powershell
node scripts/verify-catalog-http.cjs --url http://localhost:3010 --output ../outputs/catalog-http/local.json
```

El canonical esperado sigue apuntando a producción. Para otro dominio público configurado se puede indicar `--canonical-origin`. Los informes se guardan fuera del repositorio; un fallo da exit code 1 y no activa reintentos.

**Después del merge y del despliegue de producción Ready**, ejecutar el requisito de entrega completo:

```powershell
node scripts/verify-catalog-http.cjs --url https://ferre-oficial.vercel.app --require-isr --output ../outputs/catalog-http/production.json
```

`--require-isr` exige `x-vercel-cache: HIT` en el segundo GET de `/catalogo` y de `/catalogo/cerrajeria`. Sin esa opción el estado se informa y no se presenta como ISR de producción confirmado. La auditoría debe usar el checkout correspondiente al build objetivo; una preview protegida necesita primero un origen accesible autorizado, sin cambiar su protección. Pruebas del parser y los gates: `node --test tests/catalog-http.test.cjs`.

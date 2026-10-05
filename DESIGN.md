# Ferretería Pardo: claridad para elegir

La instrucción del 5 de octubre de 2026 actualiza la dirección visual de la PR #9: una experiencia limpia, precisa y tranquila, inspirada en los principios de jerarquía, consistencia y accesibilidad de Apple. Conserva la identidad de Pardo y las funcionalidades de las PR #9 y #10.

## Principios

- El producto y la tarea llevan el protagonismo. No hay rotación automática de mensajes ni controles decorativos.
- Buscar, comprobar la referencia y cotizar son las acciones principales. La búsqueda está cerca del título en móvil.
- Fotografías reales verificadas, sin sustituir variantes por artículos parecidos. Un diagrama no es una fotografía. Donde falta evidencia, se muestra «Foto pendiente».
- La cotización no es un pago ni una confirmación de existencia. El asesor confirma disponibilidad, total y entrega.
- No mostrar testimonios sin fuente. El bloque anterior de citas anónimas se sustituye por los pasos reales de cotización.

## Sistema visual

Los colores están definidos mediante tokens semánticos en `src/app/globals.css`. Papel gris neutro, superficies blancas, texto oscuro, rojo Pardo como acción principal. Modo oscuro completo y soporte fotográfico blanco constante. Los tokens `photo-ink`, `photo-muted` y `photo-line` mantienen contraste dentro del soporte fotográfico incluso en oscuro.

Fuentes nativas de sistema: Apple system, BlinkMacSystemFont, Segoe UI, Arial. No descargas ni precargas de fuentes. Una sola familia visual para títulos y texto, monospace de sistema para referencias cuando aporta claridad. Títulos de espaciado ajustado, cuerpo de 16 px, botones de 14 px. Radios de controles de 12 px, tarjetas de 20 px y chips circulares.

Contenedor máximo de 1280 px. Márgenes laterales de 16/24/32 px. Espacio generoso en portada, mayor compacidad en catálogo. Borde de campo con contraste esencial, foco visible de 2 px. Objetivos táctiles de 44 px como mínimo. El header usa fondo casi opaco y desenfoque discreto; el contenido no usa materiales translúcidos.

## Experiencias

- Portada estática con búsqueda GET nativa; fotografía existente del SKU 13751 enlazada a su ficha real, con alternativa de producto destacado si deja de estar disponible. Los conteos se calculan desde catálogo.
- Categorías en una cuadrícula simple y marcas del catálogo real. No afirmaciones de representación oficial.
- Catálogo con búsqueda/filtrado compartibles por URL, navegación atrás/adelante, filtros de IVA y orden coherentes. Las categorías móviles indican que se pueden desplazar. La información de entrega y pago aparece después de los resultados.
- Tarjetas móviles con acción textual «Agregar» y estado «Agregado». WhatsApp conserva su acción separada, sin enviar mensajes automáticamente.
- Ficha móvil con nombre y referencia antes de la foto, fotografía de altura controlada y barra inferior de cotización. Cuando no hay foto se reduce el panel vacío.
- Galería, detalles, disponibilidad, cantidades, cotización persistente y revalidación conservan la lógica existente.

## Datos protegidos

No se modifican precios, inventario, marcas, unidades, nombres originales ni rutas canónicas al cambiar presentación. La mejora de IVA de la PR #10 se integra conservando los controles de la PR #9. Los horarios aprobados de la PR #9 se mantienen. Fotografías adicionales se documentan por SKU con fuente y correspondencia exacta; las discrepancias se registran para aclaración comercial.

## Verificación

Ejecutar `npm run lint`, `npm run typecheck`, `npm test`, `node --test scripts/*.test.cjs`, `python -m unittest discover -s tests -p 'test_*.py'`, `npm run build` y los verificadores HTTP, funcionales de navegador y visuales disponibles. Navegador: escritorio y móvil, ambos temas, interacción repetida, cierre/Escape, navegación atrás/adelante, IVA, búsqueda, filtros, imágenes fallidas, cotización y ausencia de desbordamiento. Mantener cero violaciones axe y CLS menor de 0,1; registrar rendimiento sin seleccionar únicamente resultados favorables.

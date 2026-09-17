# Quickstart: Toolbar Redesign & Insert Pickers

**Feature**: [spec.md](./spec.md)

Guía de validación manual de los escenarios de esta feature. Documenta cómo verificar lo ya
implementado; no reemplaza los tests automatizados existentes (`tests/MarkdownEditor/*.test.tsx`),
que ya cubren estos escenarios y no se vuelven a ejecutar como parte de este documento.

## Escenario 1 — Barra en una sola fila con encogimiento del selector de encabezado (US1)

1. Montar `<MarkdownEditor />` dentro de un contenedor progresivamente más angosto.
2. Observar que el selector "Párrafo/Encabezado N" reduce su ancho (hasta 30px) antes que
   cualquier botón de icono cambie de tamaño.
3. Verificar que el botón "Cita" aplica blockquote al párrafo actual.

## Escenario 2 — Selector visual de tamaño de tabla (US2)

1. Hacer clic en el botón "Insertar tabla".
2. Verificar que ninguna celda de la cuadrícula 10×10 está resaltada al abrir.
3. Mover el mouse hasta la celda de la columna 3, fila 4 → debe mostrarse "3 × 4" y resaltarse esa
   región.
4. Mover el mouse fuera de la cuadrícula sin hacer clic → "3 × 4" debe seguir resaltado.
5. Hacer clic sobre esa celda → se inserta una tabla de 3 columnas × 4 filas y el panel se cierra.

## Escenario 3 — Selector de lenguaje de bloque de código (US3)

1. Con el cursor en un bloque de código existente, abrir el selector de lenguaje.
2. Elegir "JavaScript" → el bloque queda marcado con ese lenguaje (visible en el Markdown
   exportado como ` ```javascript `).
3. Reabrir el selector sobre el mismo bloque → debe mostrar "JavaScript" preseleccionado.
4. Elegir "Otro…" e ingresar "graphql" → el bloque queda marcado con ese lenguaje personalizado.

## Escenario 4 — Icono de exportar anclado a la derecha (US4)

1. Observar que el control de exportar se muestra como un icono de descarga, sin texto.
2. Reducir/ampliar el ancho del editor → el icono permanece en el extremo derecho de la barra.
3. Abrir el menú y confirmar que "Copiar como Markdown" y "Copiar como HTML" siguen funcionando.

## Escenario 5 — Paneles sin recorte ni superposición de botones (US5)

1. Forzar que la barra necesite scroll horizontal (contenedor angosto).
2. Abrir cada panel (tabla, lenguaje de código, imagen, enlace, HTML, exportar) → cada uno debe
   verse completo, por encima del editor, sin quedar cortado por el borde de la barra.
3. Abrir el diálogo de insertar HTML embebido → los botones "Cancelar" e "Insertar" deben verse
   como botones de texto separados y correctamente dimensionados, sin superponerse.

## Criterio de éxito global

Los 5 escenarios anteriores ya fueron validados durante el desarrollo iterativo de esta feature
(commits `af499c1`, `a867c64`, `94ea0b8`, `07949ed`) mediante prueba manual en el playground local
y suite automatizada (`npm test`). Este documento queda como referencia de regresión para
futuros cambios sobre la toolbar.

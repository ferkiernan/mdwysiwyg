# Research: Table Context Menus, Mermaid, Cursor Preservation, Extended Theming & Imperative API

**Feature**: [spec.md](./spec.md) | **Date**: 2026-09-18

## 1. Menús contextuales de columna/fila en tablas

**Decision**: Usar los comandos ya provistos por `@tiptap/extension-table` (`addColumnBefore`,
`addColumnAfter`, `deleteColumn`, `addRowBefore`, `addRowAfter`, `deleteRow`) más un comando
manual de "mover columna/fila" (no provisto de fábrica por la extensión) implementado sobre la
API de `prosemirror-tables` (`TableMap`) para recalcular e intercambiar el contenido de columnas o
filas adyacentes. El menú en sí reutiliza `FloatingPanel` (mismo mecanismo que `TableSizePicker`,
`LinkPopover`, etc.), disparado por un `handleDOMEvents.click` (mismo patrón ya usado para el
popover de enlaces) que detecta clic sobre `th`/`td` y compara con la celda que tenía el foco
inmediatamente antes del clic (estado `lastFocusedCell` en `MarkdownEditor.tsx`).

**Rationale**: `@tiptap/extension-table` ya está instalada; sus comandos de añadir/eliminar
cubren directamente FR-003/FR-004 sin dependencias nuevas. "Mover columna/fila" no tiene comando
nativo, pero `TableMap.get(table)` (reexportado por `@tiptap/pm/tables`) permite calcular los
rangos de celdas de dos columnas/filas adyacentes e intercambiar su contenido vía una única
transacción, sin necesitar una librería de terceros.

**Alternatives considered**: Extensión de terceros para "reorder columns/rows en Tiptap" — no hay
ninguna ampliamente mantenida en 2026 para Tiptap v2; implementar el intercambio manualmente sobre
`TableMap` es más simple y evita una dependencia externa (Principio VIII).

## 2. Detección de "segundo clic sobre celda ya enfocada"

**Decision**: Estado `lastFocusedCellPos: number | null` en `MarkdownEditor.tsx`, actualizado en
cada clic dentro de una celda de tabla: si la posición de celda resuelta en el clic actual es
igual a `lastFocusedCellPos`, se abre el menú; si es distinta, solo se actualiza el estado (se
reposiciona el cursor, sin abrir menú). Se limpia (`null`) en cualquier clic fuera de una celda de
tabla, satisfaciendo el edge case de la spec ("clic en otra parte y volver" cuenta como primer
clic nuevo).

**Rationale**: Mismo patrón ya usado para el popover de enlaces (comparación de estado antes/
después del clic vía `handleDOMEvents.click`); no requiere lógica ProseMirror adicional más allá
de resolver la posición de la celda contenedora con `$pos.before(depth)` para el nodo `tableCell`/
`tableHeader`.

**Alternatives considered**: Usar el evento de doble clic nativo del navegador (`dblclick`) — se
descarta porque el pedido especifica explícitamente que el menú se abre en un clic posterior *tras
haber posicionado el cursor*, no en un doble clic rápido consecutivo (son interacciones distintas
para el usuario).

## 3. Preservación de posición del cursor al alternar de vista

**Decision**: Extender el pipeline `unified` existente (`pipeline.ts`) para exponer las
posiciones de origen (`node.position.start.offset` / `end.offset`) que `remark-parse` ya calcula
por defecto en el árbol mdast. Al alternar de Markdown→WYSIWYG: se localiza, en el AST recién
parseado, el nodo mdast cuyo rango `[start, end)` contiene el offset del cursor en el textarea, y
se traduce a una posición ProseMirror equivalente buscando el nodo correspondiente en el documento
recién construido (mismo texto, misma estructura, por lo que la posición relativa dentro del nodo
se preserva). Al alternar WYSIWYG→Markdown: se usa `editor.state.selection.from` para ubicar el
nodo ProseMirror actual, se determina su índice/offset relativo de texto, y se busca la posición
equivalente en el string Markdown recién serializado localizando ese mismo nodo en el AST de
salida. En ambos casos, si no se encuentra una correspondencia exacta (contenido normalizado,
nodo atómico como una imagen o un HTML embebido), se usa el límite más cercano del nodo contenedor
como aproximación (FR-006, Assumption de la spec).

**Rationale**: No requiere ninguna dependencia nueva — `remark-parse` ya adjunta posiciones de
origen a cada nodo del AST por defecto (`position: false` solo si se desactivara explícitamente,
lo cual el proyecto no hace). Reutiliza el mismo AST intermedio que el pipeline ya construye para
la conversión, evitando mantener un segundo mecanismo de mapeo de posiciones en paralelo.

**Alternatives considered**: Guardar un mapeo de posiciones "carácter a carácter" completo en
cada conversión — más preciso en teoría, pero de costo cuadrático innecesario y frágil ante
cualquier normalización de formato (ya documentada como comportamiento existente); la
aproximación por nodo AST es suficiente para el caso de uso (posicionar el cursor "cerca de" donde
estaba, no una restauración byte-exacta garantizada, según lo definido en Assumptions de la spec).

## 4. Diagramas Mermaid

**Decision**: `mermaid` (paquete oficial, `mermaid.js.org`), versión `^11.10.0` o superior
(evita CVE-2025-54881), cargada vía `import()` dinámico (nunca en el entry point estático) para no
penalizar el bundle de consumidores que no usan diagramas. Se integra como comportamiento
condicional del `NodeView` ya usado por `CodeBlockLowlight`: cuando `node.attrs.language ===
"mermaid"`, se monta un contenedor síncrono con estado "renderizando", se llama a
`mermaid.parse(source, { suppressErrors: true })` y, si es válido, `mermaid.render(id, source)`
de forma asíncrona, reemplazando el contenido con el SVG resultante; con sintaxis inválida, se
muestra el texto del bloque de forma legible sin romper el documento (FR-008). Se configura
`securityLevel: 'strict'` explícitamente (ya es el default de la librería, pero se fija para no
depender de defaults futuros) — Mermaid en `strict` escapa HTML en labels y deshabilita callbacks
de clic, cerrando el vector de XSS conocido para contenido no confiable (relevante porque el
contenido puede originarse en "insertar HTML" pegado por el usuario).

**Detección al insertar HTML**: se invoca `mermaid.parse(texto, { suppressErrors: true })` sobre
el contenido ingresado en el diálogo de insertar HTML; si devuelve un resultado válido (no
`false`), el contenido se inserta como bloque de código con `language: "mermaid"` en lugar de
como `HtmlBlock`. Se usa `mermaid.parse()` como única fuente de verdad de la detección (no una
lista de palabras clave mantenida aparte), evitando que la detección quede desactualizada cuando
Mermaid agregue nuevos tipos de diagrama.

**Rationale**: Es la librería estándar de facto para diagramas en el ecosistema Markdown/GFM
(soportada nativamente por GitHub, GitLab, Notion); el `import()` dinámico cumple con Principio
VIII/XII manteniendo el core de la librería sin penalización de bundle para quien no usa
diagramas. Reutilizar el `NodeView` del bloque de código (en vez de un nodo nuevo) cumple con la
decisión ya tomada en clarifications (mismo mecanismo de lenguaje ya existente) y con el
Principio XV (Simplicidad).

**Alternatives considered**:
- `@mermaid-js/tiny`: ~50% más liviano, pero excluye tipos de diagrama (mindmap, architecture,
  KaTeX) — se descarta por riesgo de que un diagrama Mermaid válido "estándar" falle en el editor;
  se documenta como posible fallback futuro si el tamaño de bundle se vuelve bloqueante.
- Otros motores de diagramas (D2, PlantUML, Graphviz): sintaxis distinta a Mermaid, no cumplen el
  requisito explícito (el usuario pidió Mermaid específicamente, estándar de facto en Markdown).
- `securityLevel: 'loose'`: habilita HTML sin sanitizar en labels y clics ejecutables — vector de
  XSS confirmado en advisories reales (OneUptime GHSA-wvh5-6vjm-23qh, gogs GHSA-26gq-grmh-6xm6);
  se descarta explícitamente para contenido no confiable.
- Lista de palabras clave (`graph`, `flowchart`, `sequenceDiagram`, ...) como único mecanismo de
  detección: frágil (falsos positivos/negativos, se desactualiza con nuevos tipos de diagrama); se
  usa opcionalmente solo como filtro de performance antes de invocar `parse()`, nunca como fuente
  de verdad única.

## 5. API imperativa (`reset()`, `isModified()`)

**Decision**: `forwardRef` + `useImperativeHandle` (patrón estándar de React), exponiendo un
objeto `{ reset(): void; isModified(): boolean }`. El "contenido original" se guarda en un
`useRef` inicializado con `initialContent` al montar; `isModified()` compara el `source` actual
contra ese ref; `reset()` restablece `source` y sincroniza ambas vistas (equivalente a remontar el
contenido del editor Tiptap vía `setContent`, igual que ya hace `toggleView`).

**Rationale**: Es el mecanismo estándar de React para exponer una API imperativa sin agregar
props — ya confirmado con el usuario en Clarifications. No requiere ninguna dependencia nueva.

**Alternatives considered**: Prop de callback (`onReady`) — descartada explícitamente por el
usuario en Clarifications a favor del patrón de ref, más convencional en el ecosistema React para
este tipo de necesidad.

## Resumen de dependencias nuevas a introducir

| Dependencia | Propósito | Justificación (Principio VIII) |
|---|---|---|
| `mermaid` (`^11.10.0+`) | Renderizado de diagramas Mermaid como SVG | Librería estándar de facto para diagramas en el ecosistema Markdown; cargada vía `import()` dinámico para no penalizar el bundle de consumidores que no la usan |

Ninguna otra dependencia nueva: los menús de tabla reutilizan `@tiptap/extension-table` ya
instalada; la preservación de cursor reutiliza el AST de `remark-parse` ya generado por el
pipeline existente; el theming extendido son solo nuevas CSS Custom Properties; la API imperativa
usa `forwardRef`/`useImperativeHandle` nativos de React.

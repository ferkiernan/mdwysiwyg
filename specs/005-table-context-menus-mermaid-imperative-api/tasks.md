---

description: "Task list for Table Context Menus, Mermaid Diagrams, Cursor Preservation, Extended Theming & Imperative API"
---

# Tasks: Table Context Menus, Mermaid Diagrams, Cursor Preservation, Extended Theming & Imperative API

**Input**: Design documents from `/specs/005-table-context-menus-mermaid-imperative-api/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/MarkdownEditor.md, quickstart.md

**Tests**: INCLUIDOS — la constitución (Principios IX y XIV) exige tests de comportamiento como condición de Definition of Done.

**Organization**: Tareas agrupadas por historia de usuario (US1–US6), en orden de prioridad (P1 primero).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: US1 (aviso onlyView), US2 (menús de tabla), US3 (preservación de cursor), US4 (Mermaid), US5 (theming extendido), US6 (API imperativa)

## Path Conventions

Single project: `src/` y `tests/` en la raíz del repo.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Instalar la única dependencia nueva (research.md)

- [x] T001 Instalar `mermaid` (`^11.10.0` o superior) como dependencia de runtime

**Checkpoint**: dependencia disponible para US4

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extender `MarkdownEditorProps`/tipos y convertir el componente a `forwardRef` —
bloquea US1 y US6; US2/US3/US4/US5 no dependen de esto pero conviene secuenciar tras esta fase
para evitar conflictos de merge sobre `MarkdownEditor.tsx`

- [x] T002 En `src/components/MarkdownEditor/types.ts`: añadir `onlyViewNotice?: string`, `documentId?: string`, `fileName?: string` a `MarkdownEditorProps`; crear y exportar `export interface MarkdownEditorHandle { reset(): void; isModified(): boolean; }` (FR-001, FR-018, contrato en `contracts/MarkdownEditor.md`)
- [x] T003 Convertir `src/components/MarkdownEditor/MarkdownEditor.tsx` a `forwardRef<MarkdownEditorHandle, MarkdownEditorProps>`; actualizar `src/components/MarkdownEditor/index.ts` y `src/index.ts` para exportar `MarkdownEditorHandle` (Principio V, XII)

**Checkpoint**: props y tipo de ref disponibles — todas las historias pueden proceder

---

## Phase 3: User Story 1 - Personalizar el aviso de solo lectura (Priority: P3)

**Goal**: `onlyViewNotice` (default `"Edición desactivada"`) reemplaza el texto fijo de la barra en modo `onlyView`

**Independent Test**: montar con y sin `onlyViewNotice` y verificar el texto mostrado en la barra en cada caso

### Tests for User Story 1

- [x] T004 [P] [US1] Crear `tests/MarkdownEditor/only-view-notice.test.tsx`: sin `onlyViewNotice`, la barra en modo `onlyView` muestra "Edición desactivada"; con `onlyViewNotice="informe.md"`, la barra muestra "informe.md" en su lugar (FR-001)

### Implementation for User Story 1

- [x] T005 [US1] En `src/components/MarkdownEditor/Toolbar/Toolbar.tsx`: aceptar prop `onlyViewNotice?: string`; usarla (con default `"Edición desactivada"`) en el `<span className={styles.readOnlyNotice}>` en lugar del texto hardcodeado (FR-001)
- [x] T006 [US1] En `MarkdownEditor.tsx`: leer `onlyViewNotice` de las props y pasarla a `<Toolbar>`

**Checkpoint**: US1 completa — aviso de solo lectura personalizable

---

## Phase 4: User Story 2 - Menús contextuales de columna/fila en tablas (Priority: P1) 🎯 MVP

**Goal**: un segundo clic sobre una celda de tabla ya enfocada abre un menú de columna (encabezado) o de fila (celda de datos) con acciones de añadir/mover/eliminar

**Independent Test**: insertar una tabla, hacer clic dos veces sobre una celda de encabezado y verificar el menú de columna; repetir sobre una celda de datos para el menú de fila; verificar cada acción

### Tests for User Story 2

- [x] T007 [P] [US2] Crear `tests/MarkdownEditor/table-column-menu.test.tsx`: primer clic sobre celda de encabezado no abre menú; segundo clic sobre la misma celda abre el menú de columna con "Añadir columna" (a la derecha/izquierda), "Mover columna" (a la derecha/izquierda), "Eliminar esta columna", en ese orden; cada acción modifica la tabla y el Markdown resultante correctamente (FR-002, FR-003, FR-005)
- [x] T008 [P] [US2] Crear `tests/MarkdownEditor/table-row-menu.test.tsx`: mismo patrón que T007 pero sobre una celda de datos, verificando "Añadir fila" (arriba/abajo), "Mover fila" (subir esta fila/bajar esta fila), "Eliminar esta fila" (FR-002, FR-004, FR-005)
- [x] T009 [P] [US2] Añadir a `table-column-menu.test.tsx`/`table-row-menu.test.tsx`: hacer clic en una celda, luego clic fuera de la tabla, luego clic de nuevo en la misma celda → NO abre el menú (cuenta como primer clic nuevo, edge case de la spec)
- [x] T010 [P] [US2] Añadir caso: intentar mover la primera columna hacia la izquierda (o la última fila hacia abajo) → la tabla permanece sin cambios visibles (edge case de la spec)

### Implementation for User Story 2

- [x] T011 [US2] En `MarkdownEditor.tsx`: añadir estado `lastFocusedCellPos: number | null` y `tableMenu: {kind: "column" | "row"; anchor: HTMLElement; cellPos: number} | null`; extender `handleDOMEvents.click` (mismo patrón que la detección de clic sobre enlace) para detectar clic sobre `th`/`td` dentro de una tabla, resolver la posición de la celda contenedora, y comparar con `lastFocusedCellPos`: si coincide, abrir `tableMenu` con `kind` según si es `th` (columna) o `td` (fila); si no coincide, solo actualizar `lastFocusedCellPos` (FR-002, research.md §2)
- [x] T012 [US2] Crear `src/components/MarkdownEditor/Toolbar/buttons/TableColumnMenu.tsx`: componente de menú (mismo patrón visual que `LinkPopover` modo "menu": `role="menu"`, `.menu`/`.menuItem`/`.menuSeparator`, cierre con Escape/clic afuera) con las acciones "Añadir columna a la derecha", "Añadir columna a la izquierda", "Mover columna a la derecha", "Mover columna a la izquierda", "Eliminar esta columna", invocando comandos recibidos por props (FR-003)
- [x] T013 [US2] Crear `src/components/MarkdownEditor/Toolbar/buttons/TableRowMenu.tsx`: análogo a T012 para fila, con "Añadir fila arriba", "Añadir fila abajo", "Subir esta fila", "Bajar esta fila", "Eliminar esta fila" (FR-004)
- [x] T014 [US2] Crear `src/components/MarkdownEditor/markdown/tableCommands.ts`: funciones `moveColumn(editor, direction)` y `moveRow(editor, direction)` que usan `TableMap` (`@tiptap/pm/tables`) para calcular e intercambiar el contenido de columnas/filas adyacentes en una transacción; sin efecto si no hay columna/fila adyacente en esa dirección (FR-005, research.md §1, edge case de límites)
- [x] T015 [US2] En `MarkdownEditor.tsx`: renderizar `<TableColumnMenu>`/`<TableRowMenu>` (dentro de `FloatingPanel`, anclados a `tableMenu.anchor`) cuando `tableMenu !== null`; cablear "Añadir columna/fila" a `editor.chain().addColumnBefore()/addColumnAfter()/addRowBefore()/addRowAfter()` (comandos nativos de `@tiptap/extension-table`), "Eliminar" a `deleteColumn()/deleteRow()`, "Mover" a `moveColumn`/`moveRow` de T014; cerrar el menú tras cada acción (FR-003, FR-004, FR-005)

**Checkpoint**: US2 completa — estructura de tabla completamente editable desde la vista renderizada

> **Desviaciones respecto al plan (implementación real):**
>
> - **T012/T013**: en lugar de dos componentes (`TableColumnMenu.tsx` + `TableRowMenu.tsx`), se
>   implementó un único `TableContextMenu.tsx` genérico que recibe la lista de acciones por props.
>   Los dos menús solo difieren en sus etiquetas y comandos, así que duplicar el componente habría
>   duplicado también el manejo de Escape/clic-afuera y los roles ARIA (Principio XV).
> - **T014**: `prosemirror-tables` ya exporta `moveTableColumn`/`moveTableRow`, así que
>   `tableCommands.ts` los reutiliza (resolviendo el índice actual con `selectedRect`) en vez de
>   intercambiar celdas manualmente con `TableMap` como anticipaba el plan — menos código propio
>   sobre una API ya provista por la librería.

---

## Phase 5: User Story 3 - Preservar la posición del cursor al alternar de vista (Priority: P2)

**Goal**: alternar entre vista renderizada y vista Markdown posiciona el cursor en el punto equivalente del documento

**Independent Test**: posicionar el cursor en un punto específico en una vista, alternar, y verificar que el cursor en la otra vista corresponde al mismo punto relativo

### Tests for User Story 3

- [x] T016 [P] [US3] Crear `tests/MarkdownEditor/cursor-preservation.test.tsx`: con el cursor dentro de una palabra específica en la vista renderizada, alternar a Markdown y verificar `selectionStart`/`selectionEnd` del textarea en el offset correspondiente a esa palabra; con el cursor en un punto específico del textarea, alternar a renderizada y verificar que la selección de ProseMirror cae dentro del nodo correspondiente (FR-006, SC-003)
- [x] T017 [P] [US3] Añadir a `cursor-preservation.test.tsx`: con el cursor dentro de un bloque de código o un nodo atómico (imagen/HTML embebido) sin correspondencia textual directa, alternar de vista y verificar que el cursor cae en un límite razonable del bloque, sin lanzar error ni quedar fuera de rango (edge case de la spec)

### Implementation for User Story 3

- [x] T018 [US3] En `src/components/MarkdownEditor/markdown/pipeline.ts`: verificar/exponer que `markdownToEditorHtml`/`editorHtmlToMarkdown` conservan accesibles las posiciones de origen (`node.position`) del AST mdast intermedio (ya calculadas por defecto por `remark-parse`); si el pipeline actual descarta esa información en algún paso, ajustar para preservarla hasta donde se necesite (research.md §3)
- [x] T019 [US3] Crear `src/components/MarkdownEditor/markdown/cursorMapping.ts`: función `markdownOffsetToProseMirrorPos(markdown: string, offset: number, doc: ProseMirrorNode): number` que parsea el Markdown a AST, localiza el nodo mdast que contiene `offset`, y devuelve la posición ProseMirror equivalente recorriendo `doc` en el mismo orden; y la función inversa `proseMirrorPosToMarkdownOffset(editor: Editor, pos: number, markdown: string): number`; ambas retornan la mejor aproximación (límite del nodo contenedor) cuando no hay correspondencia exacta (FR-006, data-model.md)
- [x] T020 [US3] En `MarkdownEditor.tsx`, función `toggleView`: antes de alternar, capturar la posición actual (`editor.state.selection.from` en WYSIWYG, o `textareaRef.current.selectionStart` en Markdown); tras reconstruir el contenido de la vista destino, usar `cursorMapping.ts` para calcular y aplicar la posición equivalente (`editor.commands.setTextSelection(...)` o `textarea.setSelectionRange(...)`) (FR-006)

**Checkpoint**: US3 completa — alternar de vista preserva el punto de edición

---

## Phase 6: User Story 4 - Diagramas Mermaid (Priority: P2)

**Goal**: bloques de código con lenguaje Mermaid se renderizan como diagrama; contenido Mermaid pegado vía insertar HTML se detecta y trata como bloque de código Mermaid

**Independent Test**: insertar un documento con un bloque ` ```mermaid ` válido y verificar que se muestra como diagrama; usar insertar HTML con sintaxis Mermaid y verificar que se inserta como bloque de código Mermaid, no como HTML embebido

### Tests for User Story 4

- [x] T021 [P] [US4] Crear `tests/MarkdownEditor/mermaid.test.tsx`: mockear el módulo `mermaid` (`vi.mock`) para no depender de renderizado SVG real en jsdom; con `initialContent` conteniendo ` ```mermaid\ngraph TD\nA-->B\n``` `, verificar que el nodo del bloque de código invoca el render mockeado y sustituye su contenido por el SVG simulado, no mostrando el texto plano del código (FR-007)
- [x] T022 [P] [US4] Añadir a `mermaid.test.tsx`: con `mermaid.parse` mockeado para devolver `false` (sintaxis inválida), verificar que el bloque muestra el texto fuente de forma legible sin lanzar error ni afectar el resto del documento (FR-008)
- [x] T023 [P] [US4] Añadir a `mermaid.test.tsx`: abrir el diálogo de insertar HTML, ingresar contenido con sintaxis Mermaid válida (mock de `mermaid.parse` devolviendo válido), confirmar, y verificar que el resultado es un bloque de código con `language: "mermaid"` (presente en el Markdown como ` ```mermaid `), no un `htmlBlock` (FR-009)
- [x] T024 [P] [US4] Añadir a `mermaid.test.tsx`: repetir el flujo de insertar HTML con contenido no-Mermaid (por ejemplo `<div>Hola</div>`, mock de `mermaid.parse` devolviendo `false`) y verificar que se inserta como `htmlBlock`, comportamiento sin cambios respecto a `002` (regresión)
- [x] T025 [P] [US4] Añadir a `mermaid.test.tsx`: alternar un documento con bloque Mermaid entre vista renderizada y Markdown, y verificar que el Markdown fuente del bloque (fence info string y contenido) permanece exactamente igual antes y después (FR-010)

### Implementation for User Story 4

- [x] T026 [US4] En `src/components/MarkdownEditor/markdown/tiptapMarkdownBridge.ts`: extender el `NodeView` de `CodeBlockLowlight` (o envolverlo con un `addNodeView` propio cuando `node.attrs.language === "mermaid"`) para: montar un `div` contenedor de forma síncrona con estado "pending"; cargar `mermaid` vía `import("mermaid")` (dinámico); llamar `mermaid.parse(source, {suppressErrors: true})` y, si es válido, `mermaid.render(id, source)` de forma async, reemplazando `dom.innerHTML` con el SVG resultante; si es inválido, mostrar el texto fuente de forma legible; usar `update(node)` para evitar re-render si `node.textContent` no cambió respecto al último render exitoso (FR-007, FR-008, research.md §4, data-model.md `renderState`/`lastRenderedSource`)
- [x] T027 [US4] En el mismo archivo, configurar `mermaid.initialize({ securityLevel: "strict", startOnLoad: false })` una sola vez (lazy, en el primer uso) (research.md §4, seguridad)
- [x] T028 [US4] En `src/components/MarkdownEditor/Toolbar/buttons/InsertDialogs.tsx`: en el flujo de `kind === "html"`, antes de insertar como `htmlBlock`, invocar `mermaid.parse(html, {suppressErrors: true})` (import dinámico); si el resultado es válido, insertar como bloque de código con `language: "mermaid"` (`editor.chain().focus().toggleCodeBlock({language: "mermaid"}).insertContent(html)` o equivalente) en lugar de `insertContent({type: "htmlBlock", ...})` (FR-009, research.md §4)

**Checkpoint**: US4 completa — diagramas Mermaid renderizados, detección automática al insertar HTML

---

## Phase 7: User Story 5 - Theming extendido (Priority: P3)

**Goal**: nuevas CSS Custom Properties para color/fuente de contenido por vista, scrollbar, y fondos adicionales de la barra

**Independent Test**: aplicar cada variable nueva desde CSS externo y verificar el aspecto correspondiente; verificar que sin personalización, el aspecto por defecto no cambia

### Tests for User Story 5

- [x] T029 [P] [US5] Añadir a `tests/MarkdownEditor/toolbar-theming.test.tsx` (o crear `extended-theming.test.tsx`): verificar que `--mdw-content-markdown-fg`/`--mdw-content-markdown-font-family` resuelven a sus defaults en el contenedor de la vista Markdown, y a un valor personalizado cuando se sobreescribe vía `className` (FR-011)
- [x] T030 [P] [US5] Añadir: mismo patrón para `--mdw-content-wysiwyg-fg`/`--mdw-content-wysiwyg-font-family` sobre el contenedor de la vista renderizada (FR-011)
- [x] T031 [P] [US5] Añadir: verificar que `--mdw-scrollbar-thumb`/`--mdw-scrollbar-track` están declaradas con su default en `.root`, y resuelven a un valor personalizado cuando se sobreescriben (FR-012)
- [x] T032 [P] [US5] Añadir: verificar que `--mdw-toolbar-select-bg`, `--mdw-button-active-bg`, `--mdw-button-hover-gradient-from`/`--mdw-button-hover-gradient-to` están declaradas con sus defaults y resuelven a valores personalizados (FR-013)
- [x] T033 [P] [US5] Añadir: montar el componente sin ninguna de estas nuevas variables sobreescritas y verificar que el aspecto (valores computados) es idéntico al de antes de esta feature (FR-014)

### Implementation for User Story 5

- [x] T034 [US5] En `MarkdownEditor.module.css`, declarar en `.root` los defaults: `--mdw-content-markdown-fg: var(--mdw-fg); --mdw-content-markdown-font-family: ui-monospace, Consolas, monospace; --mdw-content-wysiwyg-fg: var(--mdw-fg); --mdw-content-wysiwyg-font-family: inherit; --mdw-scrollbar-thumb: #c1c1c1; --mdw-scrollbar-track: transparent; --mdw-toolbar-select-bg: #e9e9e9; --mdw-button-active-bg: #c8c8c8; --mdw-button-hover-gradient-from: #ffffff; --mdw-button-hover-gradient-to: #d8d8d8;` (valores por defecto actuales, data-model.md)
- [x] T035 [US5] Aplicar `--mdw-content-markdown-fg`/`--mdw-content-markdown-font-family` como `color`/`font-family` en `.source` (textarea, ya no `color: inherit`); aplicar `--mdw-content-wysiwyg-fg`/`--mdw-content-wysiwyg-font-family` en `.content :global(.ProseMirror)` (FR-011)
- [x] T036 [US5] Añadir reglas `scrollbar-color: var(--mdw-scrollbar-thumb) var(--mdw-scrollbar-track);` y el equivalente `::-webkit-scrollbar`/`::-webkit-scrollbar-thumb`/`::-webkit-scrollbar-track` sobre `.content`, `.toolbar` (si aplica overflow-x) y `.source` (FR-012)
- [x] T037 [US5] Reemplazar el `background-color: #e9e9e9` hardcodeado de `.headingSelect` por `var(--mdw-toolbar-select-bg)`; reemplazar el `background: #c8c8c8` de `.button:active/[aria-pressed="true"]` por `var(--mdw-button-active-bg)`; reemplazar el `linear-gradient(to bottom, #ffffff, #d8d8d8)` de `.button:hover` por `linear-gradient(to bottom, var(--mdw-button-hover-gradient-from), var(--mdw-button-hover-gradient-to))` (FR-013)

**Checkpoint**: US5 completa — theming extendido sin cambios en el aspecto por defecto

---

## Phase 8: User Story 6 - API imperativa y props pasivas (Priority: P1)

**Goal**: `reset()`/`isModified()` vía ref, más `documentId`/`fileName` aceptadas sin uso obligatorio

**Independent Test**: modificar el contenido, verificar `isModified() === true`, invocar `reset()`, verificar que el contenido vuelve al original y `isModified() === false`

### Tests for User Story 6

- [x] T038 [P] [US6] Crear `tests/MarkdownEditor/imperative-api.test.tsx`: con un `ref` obtenido vía `useRef<MarkdownEditorHandle>`, sin modificar el contenido, `ref.current.isModified()` devuelve `false`; tras modificar el contenido (WYSIWYG o Markdown), devuelve `true` (FR-016)
- [x] T039 [P] [US6] Añadir: modificar el contenido, invocar `ref.current.reset()`, y verificar que el contenido vuelve exactamente al `initialContent` original en ambas vistas (FR-015)
- [x] T040 [P] [US6] Añadir: tras `reset()`, `ref.current.isModified()` devuelve `false` (FR-017)
- [x] T041 [P] [US6] Añadir: montar con `documentId="doc-1"` y `fileName="a.md"` y verificar que el componente se monta sin error y sin comportamiento adicional forzado (FR-018)

### Implementation for User Story 6

- [x] T042 [US6] En `MarkdownEditor.tsx`: añadir `const originalContentRef = useRef(initialContent)` (capturado una sola vez al montar); implementar `useImperativeHandle(ref, () => ({ reset() {...}, isModified() {...} }), [...])`, donde `reset()` restablece `source`/el contenido del editor Tiptap (mismo mecanismo que `toggleView` usa para `setContent`) al valor de `originalContentRef.current`, e `isModified()` compara `sourceRef.current !== originalContentRef.current` (FR-015, FR-016, FR-017, data-model.md)
- [x] T043 [US6] Aceptar `documentId`/`fileName` en la desestructuración de props de `MarkdownEditor` (sin uso obligatorio interno más allá de aceptarlas) (FR-018)

**Checkpoint**: US6 completa — control imperativo y props pasivas disponibles

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Definition of Done (constitución) y documentación (FR-020)

- [x] T044 [P] Test de accesibilidad: verificar que `TableColumnMenu`/`TableRowMenu` exponen `role="menu"`/`role="menuitem"` y foco correcto al abrirse (mismo patrón que `LinkPopover`, ya cubierto en `accessibility.test.tsx`); verificar que el SVG renderizado de un diagrama Mermaid válido es accesible (por ejemplo `role="img"` con un `aria-label` derivado del código fuente o un título genérico) (Principio VI)
- [x] T045 [P] Actualizar `src/components/MarkdownEditor/README.md`: documentar `onlyViewNotice`, los menús de columna/fila de tabla, la preservación de cursor, el soporte Mermaid (con su nota de seguridad `strict`), las nuevas variables CSS de theming, y la API imperativa (`ref`, `reset()`, `isModified()`, `documentId`, `fileName`) con ejemplos (FR-020, Principio X)
- [x] T046 [P] Actualizar `README.md` (raíz del repo) y `llms.txt`: reflejar las 6 capacidades nuevas en "What's inside"/"Core capabilities" (FR-020)
- [x] T047 Verificar tipado estricto: `npm run typecheck` sin errores y sin `any` no justificado en los archivos tocados (Principio II)
- [x] T048 Ejecutar `npm run build` y verificar que `dist/` sigue generando ESM + CJS + `.d.ts` + CSS sin errores, y que `mermaid` NO aparece en el bundle base (solo se resuelve como chunk/import dinámico) (Principios VIII, XII, XIII)
- [x] T049 Validar manualmente los 6 escenarios de `specs/005-table-context-menus-mermaid-imperative-api/quickstart.md` en el playground local (`npm run dev`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — requerida antes de US4 (T026–T028)
- **Foundational (Phase 2)**: sin dependencias — requerida antes de US1 (T005–T006) y US6 (T042–T043)
- **US1 (Phase 3)**: requiere Phase 2
- **US2 (Phase 4)**: independiente de Phase 2; puede empezar en paralelo con Foundational
- **US3 (Phase 5)**: independiente de Phase 2; usa el pipeline existente
- **US4 (Phase 6)**: requiere Phase 1 (dependencia instalada); independiente de Phase 2
- **US5 (Phase 7)**: completamente independiente (solo CSS)
- **US6 (Phase 8)**: requiere Phase 2
- **Polish (Phase 9)**: requiere las historias deseadas completas

### User Story Dependencies

- **US2 (P1)** y **US6 (P1)**: ambas de máxima prioridad, independientes entre sí — pueden desarrollarse en paralelo
- **US3 (P2)** y **US4 (P2)**: independientes entre sí y de US2/US6
- **US1 (P3)** y **US5 (P3)**: independientes de todo lo demás

### Parallel Opportunities

- Tras Setup + Foundational: US1, US2, US3, US4, US5, US6 pueden implementarse en paralelo (tocan
  mayormente archivos distintos, salvo `MarkdownEditor.tsx`/`MarkdownEditor.module.css`
  compartidos entre varias historias — coordinar si se paraleliza con más de una persona)
- Tests de cada historia ([P]) en paralelo entre sí
- T044–T046 en paralelo en Polish

---

## Implementation Strategy

### MVP First (User Stories 2 y 6 — ambas P1)

1. Foundational → US2 (menús de tabla) y US6 (API imperativa) en paralelo
2. **VALIDAR**: estructura de tabla editable + control imperativo funcionando
3. Demo/uso real posible ya en este punto

### Incremental Delivery

1. Foundational → US2 + US6 (P1) → Demo
2. + US3 + US4 (P2) → Demo
3. + US1 + US5 (P3) → Demo final, feature completa
4. Polish (documentación, build, validación manual)

---

## Notes

- Los 6 puntos de la Definition of Done (constitución) quedan cubiertos por: T047 (tipado), tests
  T004–T041 (comportamiento), T044 (accesibilidad), T045/T046 (documentación), T048 (build),
  research.md (dependencia justificada y cargada perezosamente)
- Commit tras cada tarea o grupo lógico

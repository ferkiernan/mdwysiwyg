---

description: "Task list for Toolbar Redesign & Insert Pickers (retroactive record)"
---

# Tasks: Toolbar Redesign & Insert Pickers

**Input**: Design documents from `/specs/002-toolbar-redesign-insert-pickers/`

**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md

**Note**: Todas las tareas de esta lista ya fueron implementadas y validadas (tests, typecheck,
build) durante el desarrollo iterativo de esta feature, antes de que esta spec se redactara. Se
documentan aquí, marcadas como completadas, como registro formal — no se vuelven a ejecutar ni
revalidar como parte de este comando.

**Tests**: Incluidos, igual que en `001-markdown-editor` (Principios IX/XIV de la constitución).

**Organization**: Tareas agrupadas por historia de usuario, en el orden en que fueron
efectivamente implementadas.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Podría haberse ejecutado en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia a la que pertenece (US1–US5)

## Path Conventions

Single project (librería): `src/` y `tests/` en la raíz del repo, según plan.md.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ninguna infraestructura nueva requerida — se reutiliza el tooling de
`001-markdown-editor` (TypeScript, Vitest, tsup) sin cambios.

*(Sin tareas — no se agregaron dependencias, scripts ni configuración nueva.)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Mecanismo de posicionamiento flotante — bloquea las historias US2, US3, US4 y US5,
ya que todas dependen de que los paneles se muestren correctamente.

- [X] T001 [P] Crear `FloatingPanel` en `src/components/MarkdownEditor/Toolbar/buttons/FloatingPanel.tsx`: portal a `document.body` vía `createPortal`, posicionamiento `position: fixed` calculado desde el `getBoundingClientRect()` del ancla, envoltura con la clase `.root` para heredar custom properties CSS fuera del subárbol original, soporte de `align="start"|"end"` y `autoFocus` (FR-018)
- [X] T002 [P] Agregar estilos `.tablePicker`, `.tablePickerLabel`, `.tablePickerGrid`, `.tablePickerCell`, `.textButton` y simplificar `.dialog`/`.menu` (quitar `position: absolute` propio, ahora gestionado por `FloatingPanel`) en `MarkdownEditor.module.css`
- [X] T003 Cambiar `.dialog` de `width: max-content` a `width: 260px` fijo, resolviendo la referencia circular de tamaño que colapsaba el diálogo y superponía sus botones de acción (FR-019)

**Checkpoint**: paneles ya pueden montarse fuera del recorte de la toolbar — historias pueden
proceder

---

## Phase 3: User Story 1 - Barra rediseñada con apariencia clásica (Priority: P1)

**Goal**: estilo visual de botones de icono con relieve, separadores, botón de Cita nuevo, layout
de una sola fila con selector de encabezado encogible

### Tests for User Story 1

- [X] T004 [P] [US1] Test de Cita en `tests/MarkdownEditor/wysiwyg-formatting.test.tsx`: aplicar blockquote desde el botón "Cita" y verificar `<blockquote>` en el render y `> texto` en el Markdown (FR-003)

### Implementation for User Story 1

- [X] T005 [P] [US1] Crear iconos SVG (`IconCode`, `IconCodeBlock`, `IconBullets`, `IconNumbered`, `IconChecklist`, `IconIndent`, `IconOutdent`, `IconQuote`, `IconTable`, `IconLink`, `IconImage`, `IconHr`) en `src/components/MarkdownEditor/Toolbar/buttons/icons.tsx` (FR-001)
- [X] T006 [US1] Rediseñar `.toolbar`, `.button`, `.separator`, `.headingSelect` en `MarkdownEditor.module.css` con gradiente, estados hover/active con relieve, y `flex-wrap: nowrap` (FR-001, FR-002, FR-004)
- [X] T007 [US1] Dar a `.headingSelect` `flex-shrink: 1` con `min-width: 30px` y `text-overflow: ellipsis`, y `flex-shrink: 0` al resto de botones/separadores/spacer, para que solo el selector de encabezado ceda espacio (FR-005)
- [X] T008 [US1] Añadir soporte de `className` en `ToolbarButton` (para glifos de texto B/i/S) en `src/components/MarkdownEditor/Toolbar/buttons/ToolbarButton.tsx`
- [X] T009 [US1] Reestructurar `Toolbar.tsx`: mover el botón `</>` al inicio, reemplazar iconos de texto por SVG, añadir botón "Cita" (`toggleBlockquote`), reordenar grupos con `Separator` (FR-001, FR-002, FR-003)

**Checkpoint**: US1 completa — apariencia rediseñada, Cita funcional, layout de una fila con
encogimiento correcto

---

## Phase 4: User Story 2 - Selector visual de tamaño de tabla (Priority: P1)

**Goal**: cuadrícula 10×10 interactiva que reemplaza el formulario numérico de filas/columnas

### Tests for User Story 2

- [X] T010 [P] [US2] Crear `tests/MarkdownEditor/table-size-picker.test.tsx`: sin selección inicial, cuadrícula de 100 celdas, resaltado de 3×4 al pasar el mouse, persistencia de la selección al salir de la cuadrícula, confirmación por clic, navegación y confirmación por teclado, cierre con Escape sin seleccionar (FR-006 a FR-011)
- [X] T011 [US2] Actualizar `tests/MarkdownEditor/insert-elements.test.tsx`: reemplazar el test de tabla basado en formulario numérico por el flujo del picker visual (hover + clic sobre celda `3x4`, verificando 3 `<th>` y 4 `<tr>`) (FR-010)

### Implementation for User Story 2

- [X] T012 [US2] Crear `TableSizePicker` en `src/components/MarkdownEditor/Toolbar/buttons/TableSizePicker.tsx`: estado `TableSize | null` (sin selección inicial), cuadrícula generada dinámicamente, resaltado por `onMouseEnter`, etiqueta "N × M", confirmación por `onClick`/Enter, cierre por Escape, navegación por flechas — desacoplado del botón que lo invoca vía props `onSelect`/`onClose` (FR-006 a FR-012)
- [X] T013 [US2] Eliminar el diálogo numérico de tabla de `InsertDialogs.tsx` (quitar `"table"` de `DialogKind` y su rama del formulario)
- [X] T014 [US2] Cablear `TableSizePicker` en `Toolbar.tsx`: el botón "Insertar tabla" solo abre el panel y pasa `{cols, rows}` recibido a `editor.chain().insertTable(...)` (FR-012)

**Checkpoint**: US2 completa — inserción de tablas 100% visual, componente reutilizable verificado
de forma aislada

---

## Phase 5: User Story 3 - Selector de lenguaje de bloque de código (Priority: P2)

**Goal**: asociar JSON/SQL/TypeScript/JavaScript/Java u "Otro" a un bloque de código

### Tests for User Story 3

- [X] T015 [P] [US3] Actualizar `tests/MarkdownEditor/insert-elements.test.tsx`: elegir "JavaScript" desde el selector y verificar `language-javascript` en el render y ` ```javascript ` en el Markdown; elegir "Otro…" con valor personalizado "graphql" y verificar el mismo round-trip (FR-013, FR-014)

### Implementation for User Story 3

- [X] T016 [US3] Crear `CodeLanguagePicker` en `src/components/MarkdownEditor/Toolbar/buttons/CodeLanguagePicker.tsx`: `<select>` con los 5 lenguajes predefinidos + "Otro…", campo de texto condicional, preselección desde `currentLanguage` (FR-013, FR-014, FR-015)
- [X] T017 [US3] Cablear `CodeLanguagePicker` en `Toolbar.tsx`: el botón "Bloque de código" abre el panel; al confirmar, aplica `updateAttributes("codeBlock", {language})` si ya hay un bloque activo, o `toggleCodeBlock({language})` si no (FR-013)

**Checkpoint**: US3 completa — lenguaje de código persistido y recuperable, verificado por
round-trip Markdown

---

## Phase 6: User Story 4 - Icono de exportar anclado a la derecha (Priority: P3)

**Goal**: reemplazar el texto "Export" por un icono de descarga, siempre al extremo derecho

### Tests for User Story 4

- [X] T018 [P] [US4] Verificar en `tests/MarkdownEditor/export.test.tsx` y `accessibility.test.tsx` que el botón conserva `aria-label="Export"` y su funcionalidad de copiar Markdown/HTML tras el cambio visual (FR-016)

### Implementation for User Story 4

- [X] T019 [P] [US4] Añadir `IconDownload` en `icons.tsx`
- [X] T020 [US4] Actualizar `ExportMenu.tsx`: reemplazar el texto "Export" por `<IconDownload />` manteniendo `aria-label`/`title="Export"`; usar `FloatingPanel align="end"` para el menú desplegable (FR-016, FR-017)

**Checkpoint**: US4 completa — control reconocible por icono, siempre alineado a la derecha

---

## Phase 7: User Story 5 - Paneles sin interferencia (Priority: P1)

**Goal**: ningún panel queda recortado por el scroll de la toolbar; botones de acción de texto
correctamente dimensionados

**Nota**: implementada en paralelo/como consecuencia directa de la Fase 2 (Foundational) y de
correcciones puntuales sobre `InsertDialogs.tsx`/`CodeLanguagePicker.tsx`; se lista aquí para
trazabilidad con la Historia 5 de la spec.

### Tests for User Story 5

- [X] T021 [P] [US5] Actualizar `tests/MarkdownEditor/accessibility.test.tsx`: verificar que el menú Export se abre, se cierra con Escape y devuelve el foco al botón disparador, ahora operando sobre contenido portado (FR-018)
- [X] T022 [P] [US5] Verificar que los diálogos de imagen/enlace/HTML mantienen foco inicial correcto y cierre por Escape tras portarse vía `FloatingPanel` (`tests/MarkdownEditor/accessibility.test.tsx`, `insert-elements.test.tsx`) (FR-018)

### Implementation for User Story 5

- [X] T023 [US5] Envolver los 4 paneles (`TableSizePicker`, `CodeLanguagePicker`, `InsertDialog`, menú de `ExportMenu`) con `FloatingPanel` en `Toolbar.tsx`/`ExportMenu.tsx`, capturando el botón disparador (`event.currentTarget`) como `anchor` (FR-018)
- [X] T024 [US5] Añadir botones de acción con clase `.textButton` (ancho automático) en lugar de `.button` (29×29px fijo) en `InsertDialogs.tsx` y `CodeLanguagePicker.tsx`, eliminando la superposición de "Cancelar"/"Insertar"/"Aplicar" (FR-019)
- [X] T025 [US5] Mover el `autoFocus` de los paneles al propio `FloatingPanel` (enfoca el primer elemento interactivo tras montarse en el portal), reemplazando el `useEffect` previo en `ExportMenu` que corría antes de que el contenido existiera en el DOM (FR-018)

**Checkpoint**: US5 completa — los defectos de recorte y superposición no se reproducen; todas las
historias (US1–US5) funcionan de forma independiente y en conjunto

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T026 [P] Actualizar `src/components/MarkdownEditor/README.md`: documentar el selector visual de tabla (convención columnas × filas), el selector de lenguaje de código, y la nota de layout de una sola fila
- [X] T027 Build de distribución (`npm run build`) verificado sin errores tras cada etapa (ESM+CJS+`.d.ts`)
- [X] T028 Validación manual en playground local (`npm run dev`) de los 5 escenarios de `quickstart.md`, iterando sobre observaciones directas del usuario (captura de pantalla del diálogo HTML superpuesto, e inspección de dimensiones del botón "Cancelar")

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: sin dependencias — BLOQUEÓ US2, US3, US4, US5 en la práctica, ya que
  introduce `FloatingPanel`, usado por todas ellas
- **US1 (Phase 3)**: independiente de Foundational (cambios puramente visuales de la toolbar base)
- **US2, US3, US4 (Phases 4–6)**: dependían de Foundational (Phase 2) para el posicionamiento
  correcto de sus paneles
- **US5 (Phase 7)**: coincide en gran parte con el trabajo de Foundational; se separó en la spec
  por ser la historia que documenta explícitamente las correcciones de defectos
- **Polish (Phase 8)**: posterior a todas las historias

### Orden real de implementación (para referencia)

1. US1 (rediseño visual) y US2 (picker de tabla) y US3 (picker de lenguaje) y US4 (icono export) —
   en una única iteración inicial
2. Corrección de defecto: paneles recortados por `overflow-x` de la toolbar → Foundational
   (`FloatingPanel`) retrofitteado sobre US2/US3/US4 (US5, parte 1)
3. Corrección de defecto: ancho `max-content` del diálogo colapsando botones → US5, parte 2
4. Corrección de defecto: botones de acción con clase de icono fijo → US5, parte 3

---

## Notes

- Ninguna tarea de esta lista requiere re-ejecución: todas fueron validadas (tests + typecheck +
  build) en su momento, como parte de los commits ya mergeados a `master`.
- Esta spec y su `tasks.md` existen como registro formal retroactivo, no como plan de trabajo
  pendiente.

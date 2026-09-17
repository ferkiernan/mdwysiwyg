---

description: "Task list for Link Insertion UX & Floating Link Popover"
---

# Tasks: Link Insertion UX & Floating Link Popover

**Input**: Design documents from `/specs/004-link-insertion-ux-floating-popover/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/MarkdownEditor.md, quickstart.md

**Tests**: INCLUIDOS — la constitución (Principios IX y XIV) exige tests de comportamiento como condición de Definition of Done.

**Organization**: Tareas agrupadas por historia de usuario (US1–US3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: US1 (diálogo condicional), US2 (autocompletado de protocolo), US3 (popover)

## Path Conventions

Single project: `src/` y `tests/` en la raíz del repo.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ninguna dependencia nueva requerida (research.md) — no hay tareas de setup.

*(Sin tareas.)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Función compartida de autocompletado de protocolo — bloquea US1 (diálogo) y US3
(popover), ambos la consumen.

- [ ] T001 [P] Crear `src/components/MarkdownEditor/markdown/links.ts`: función pura `ensureProtocol(url: string): string` que antepone `"http://"` cuando el valor no contiene `"://"`, sin modificar valores que ya lo tienen (FR-004, FR-005, FR-006)
- [ ] T002 [P] Crear `tests/MarkdownEditor/links.test.ts`: casos `ensureProtocol("www.ejemplo.com")` → `"http://www.ejemplo.com"`, `ensureProtocol("ejemplo.com")` → `"http://ejemplo.com"`, `ensureProtocol("https://ejemplo.com")` → sin cambios, `ensureProtocol("ftp://x")` → sin cambios

**Checkpoint**: `ensureProtocol` disponible y testeada — US1 y US3 pueden consumirla

---

## Phase 3: User Story 1 - Enlazar texto ya seleccionado (Priority: P1) 🎯 MVP

**Goal**: el diálogo de insertar enlace pide solo la URL cuando hay selección activa, y aplica el
enlace sobre ese texto sin alterarlo

**Independent Test**: seleccionar texto, abrir el diálogo, verificar que solo pide URL, confirmar
y verificar que el texto seleccionado quedó convertido en enlace sin cambios textuales

### Tests for User Story 1

- [ ] T003 [P] [US1] Crear `tests/MarkdownEditor/link-insertion.test.tsx`: con texto seleccionado, abrir el diálogo de enlace y verificar que NO existe el campo "Texto del enlace" (solo "URL del enlace"); confirmar con una URL y verificar que el texto originalmente seleccionado queda envuelto en un `<a>` con ese href, sin alterar su contenido textual (FR-001, FR-002)
- [ ] T004 [P] [US1] Añadir a `link-insertion.test.tsx`: sin texto seleccionado, abrir el diálogo de enlace y verificar que SÍ existen ambos campos ("URL del enlace" y "Texto del enlace"), igual que el comportamiento ya cubierto por `insert-elements.test.tsx` de `002-toolbar-redesign-insert-pickers` (FR-003, regresión)

### Implementation for User Story 1

- [ ] T005 [US1] En `src/components/MarkdownEditor/Toolbar/buttons/InsertDialogs.tsx`: en `InsertDialog`, leer `const hasSelection = kind === "link" && !editor.state.selection.empty` una vez al montar (no reactivo); cuando `hasSelection` es `true`, renderizar el `DialogShell` del caso "link" con solo el campo de URL (omitir el campo "Texto del enlace"); cuando es `false`, mantener el comportamiento actual con ambos campos (FR-001, FR-003)
- [ ] T006 [US1] En el mismo archivo, ajustar `submit()` para que el caso `kind === "link"` con `hasSelection === true` no dependa de la presencia de `text` (que ya no existe en ese modo) para decidir la rama de `chain()`; debe ir siempre por `extendMarkRange('link').setLink(...)` cuando hay selección (FR-002)

**Checkpoint**: US1 completa — diálogo condicional funcional, tests T003/T004 en verde

---

## Phase 4: User Story 2 - Autocompletar protocolo (Priority: P2)

**Goal**: cualquier URL sin protocolo recibe `http://` automáticamente al aplicarse, en el
diálogo de inserción

**Independent Test**: ingresar URLs sin protocolo en el diálogo de inserción y verificar que el
enlace resultante siempre incluye uno

### Tests for User Story 2

- [ ] T007 [P] [US2] Añadir a `link-insertion.test.tsx`: insertar un enlace con URL `"www.ejemplo.com"` y verificar que el href resultante es `"http://www.ejemplo.com"`; con `"ejemplo.com"` verificar `"http://ejemplo.com"`; con `"https://ejemplo.com"` verificar que se conserva sin cambios (FR-004, FR-005, FR-006)

### Implementation for User Story 2

- [ ] T008 [US2] En `InsertDialogs.tsx`, importar `ensureProtocol` de `../../markdown/links` y aplicarlo al valor de `url` antes de pasarlo a `setLink`/`insertContent` en la rama `kind === "link"` de `submit()` (FR-004, FR-005, FR-006)

**Checkpoint**: US2 completa — autocompletado de protocolo funcional en el diálogo de inserción

---

## Phase 5: User Story 3 - Popover de acciones sobre enlace existente (Priority: P1)

**Goal**: un clic sobre un enlace en la vista renderizada abre un popover con
Ir/Copiar/Editar-Eliminar-Guardar

**Independent Test**: insertar un enlace, hacer clic sobre él, verificar el menú de 3 acciones +
separador, y cada acción produce el efecto esperado

### Tests for User Story 3

- [ ] T009 [P] [US3] Crear `tests/MarkdownEditor/link-popover.test.tsx`: hacer clic sobre un enlace renderizado y verificar que aparece un panel con "Ir a la url", "Copiar url", un separador, y "Editar url", en ese orden (FR-007)
- [ ] T010 [P] [US3] Añadir a `link-popover.test.tsx`: mock de `window.open`, seleccionar "Ir a la url" y verificar que se llama con la URL del enlace y `"_blank", "noopener,noreferrer"` (FR-008)
- [ ] T011 [P] [US3] Añadir a `link-popover.test.tsx`: mock de `navigator.clipboard.writeText`, seleccionar "Copiar url" y verificar que se llama con la URL exacta del enlace (FR-009)
- [ ] T012 [P] [US3] Añadir a `link-popover.test.tsx`: seleccionar "Editar url" y verificar que el panel muestra un input con el valor actual del href, un texto/enlace "Eliminar link", y un botón "Guardar" (FR-010)
- [ ] T013 [P] [US3] Añadir a `link-popover.test.tsx`: en modo edición, cambiar el input a una URL sin protocolo y presionar "Guardar"; verificar que el enlace se actualiza con `http://` antepuesto y que el panel se cierra (FR-012, reutiliza FR-004 vía `ensureProtocol`)
- [ ] T014 [P] [US3] Añadir a `link-popover.test.tsx`: en modo edición, vaciar el input y presionar "Guardar"; verificar que el enlace conserva su URL original (sin cambios) (FR-013)
- [ ] T015 [P] [US3] Añadir a `link-popover.test.tsx`: en modo edición, seleccionar "Eliminar link"; verificar que el texto permanece pero ya no tiene marca de enlace, y que el panel se cierra (FR-011)
- [ ] T016 [P] [US3] Añadir a `link-popover.test.tsx`: abrir el popover, presionar Escape (y por separado, hacer clic fuera); verificar en ambos casos que el enlace no cambia y el panel se cierra (FR-014)
- [ ] T017 [P] [US3] Añadir a `link-popover.test.tsx`: con el editor montado en modo `onlyView`, hacer clic sobre un enlace y verificar que el panel muestra solo "Ir a la url" y "Copiar url", sin "Editar url" (FR-015)

### Implementation for User Story 3

- [ ] T018 [US3] Crear `src/components/MarkdownEditor/Toolbar/buttons/LinkPopover.tsx`: componente con dos modos internos (`"menu" | "edit"`), reutilizando `FloatingPanel` para el posicionamiento y clases ya existentes (`.menu`/`.menuItem`/`.separator` para el modo menú, `.dialog`/`.dialogField`/`.textButton` para el modo edición); recibe `url`, `anchorRect` (o elemento sintético), `onlyView`, `onNavigate`, `onCopy`, `onSave(newUrl)`, `onRemove`, `onClose` como props (FR-007, FR-010, FR-015; Principio IV, componente desacoplado de la lógica de Tiptap)
- [ ] T019 [US3] En `LinkPopover.tsx`, implementar el modo `"menu"`: "Ir a la url" invoca `onNavigate` (que a su vez llama `window.open(url, "_blank", "noopener,noreferrer")`); "Copiar url" invoca `onCopy` (`navigator.clipboard.writeText(url)`); separador visual (`Separator`, ya usado en `Toolbar.tsx`); "Editar url" cambia el modo interno a `"edit"`; en `onlyView`, omitir el botón "Editar url" y el separador (FR-007, FR-008, FR-009, FR-015)
- [ ] T020 [US3] En `LinkPopover.tsx`, implementar el modo `"edit"`: input controlado inicializado con `url`, texto/enlace "Eliminar link" que invoca `onRemove`, botón "Guardar" que invoca `onSave(ensureProtocol(inputValue))` solo si `inputValue` no está vacío (FR-010, FR-011, FR-012, FR-013)
- [ ] T021 [US3] En `src/components/MarkdownEditor/views/RenderedView.tsx`: aceptar props nuevas (`onLinkClick: (attrs: {href: string}, rect: DOMRect, range: {from: number; to: number}) => void`) y configurar `editorProps.handleClickOn` en el `useEditor` de `MarkdownEditor.tsx` (o pasar la opción a través de `RenderedView` si allí se centraliza) para detectar clic sobre un nodo con marca `link`, obtener el rango vía `getMarkRange`, y invocar el callback con el `href`, el `DOMRect` del elemento clicado, y el rango (research.md §3)
- [ ] T022 [US3] En `src/components/MarkdownEditor/MarkdownEditor.tsx`: estado `linkPopover: {url, range, anchorRect} | null`; pasar el handler de clic a `useEditor`; renderizar `<LinkPopover>` cuando `linkPopover !== null`, cableando `onSave`/`onRemove` a `editor.chain().focus().setTextSelection(range).extendMarkRange('link').setLink({href: ensureProtocol(newUrl)})` / `.unsetLink()` respectivamente, y `onClose` a `setLinkPopover(null)` (FR-011, FR-012, data-model.md)

**Checkpoint**: US3 completa — popover funcional en ambos modos, incluyendo el caso `onlyView`

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T023 [P] Test de accesibilidad en `tests/MarkdownEditor/accessibility.test.tsx` (o `link-popover.test.tsx`): verificar `role` apropiado del popover en cada modo, que el primer elemento interactivo recibe foco al abrirse (reutilizando `autoFocus` de `FloatingPanel`), y que "Eliminar link" es accesible por teclado (Principio VI)
- [ ] T024 [P] Actualizar `src/components/MarkdownEditor/README.md`: documentar el comportamiento condicional del diálogo de enlace, el autocompletado de protocolo, y el popover de acciones sobre enlaces existentes (incluyendo el caso `onlyView`)
- [ ] T025 Verificar tipado estricto: `npm run typecheck` sin errores y sin `any` no justificado en los archivos tocados (Principio II)
- [ ] T026 Ejecutar `npm run build` y verificar que `dist/` sigue generando ESM + CJS + `.d.ts` + CSS sin errores
- [ ] T027 Validar manualmente los 6 escenarios de `specs/004-link-insertion-ux-floating-popover/quickstart.md` en el playground local (`npm run dev`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: sin dependencias — bloquea US1 (T006, que aplica `ensureProtocol`... nota: en realidad T006 no la usa, la usa T008) y US3 (T020)
- **US1 (Phase 3)**: requiere Phase 2 completa (por convención de orden, aunque T005/T006 no consumen directamente `ensureProtocol`)
- **US2 (Phase 4)**: requiere Phase 2 (T008 consume `ensureProtocol`) y US1 (T008 modifica el mismo bloque de `submit()` que T006)
- **US3 (Phase 5)**: requiere Phase 2 (T020 consume `ensureProtocol`); independiente de US1/US2 en cuanto a archivos tocados (`LinkPopover.tsx`, `RenderedView.tsx` vs. `InsertDialogs.tsx`), pero comparte el mismo componente `MarkdownEditor.tsx` en el paso de integración final
- **Polish (Phase 6)**: requiere las historias deseadas completas

### User Story Dependencies

- **US1 (P1)**: Foundational — MVP de esta feature
- **US2 (P2)**: Foundational + US1 (mismo archivo `InsertDialogs.tsx`, secuencial para evitar conflictos)
- **US3 (P1)**: Foundational; independiente de US1/US2 en implementación, pero su integración final en `MarkdownEditor.tsx` conviene hacerse después de que US1/US2 estabilicen `InsertDialogs.tsx`

### Parallel Opportunities

- T001/T002 (Foundational) en paralelo
- Tests de cada historia ([P]) en paralelo entre sí dentro de la misma historia
- US3 (T009–T022) puede desarrollarse en paralelo con US1/US2 si se coordina el archivo compartido `MarkdownEditor.tsx` al final
- T023–T026 en paralelo en Polish

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 2 (Foundational) → Phase 3 (US1)
2. **VALIDAR**: diálogo condicional funcional
3. Demo/uso real posible ya en este punto

### Incremental Delivery

1. Foundational → US1 (diálogo condicional) → Demo
2. + US2 (autocompletado) → Demo
3. + US3 (popover) → Demo final, feature completa

---

## Notes

- Los 6 puntos de la Definition of Done (constitución) quedan cubiertos por: T025 (tipado), tests
  T002–T023 (comportamiento, incluye accesibilidad), T024 (documentación), T026 (build),
  research.md (cero dependencias nuevas, nada que justificar)
- Commit tras cada tarea o grupo lógico

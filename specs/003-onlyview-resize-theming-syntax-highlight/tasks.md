---

description: "Task list for Only-View Mode, Resizable Editor, Toolbar Theming & Syntax Highlighting"
---

# Tasks: Only-View Mode, Resizable Editor, Toolbar Theming & Code Syntax Highlighting

**Input**: Design documents from `/specs/003-onlyview-resize-theming-syntax-highlight/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/MarkdownEditor.md, quickstart.md

**Tests**: INCLUIDOS — la constitución (Principios IX y XIV) exige tests de comportamiento como condición de Definition of Done.

**Organization**: Tareas agrupadas por historia de usuario (US1–US4).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: US1 (onlyView), US2 (resizable), US3 (theming), US4 (syntax highlight)

## Path Conventions

Single project: `src/` y `tests/` en la raíz del repo.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Instalar las 3 dependencias nuevas de resaltado de sintaxis (research.md)

- [x] T001 Instalar dependencias de runtime: `@tiptap/extension-code-block-lowlight`, `lowlight`, `rehype-highlight` (versiones compatibles con Tiptap v2 y con la cadena `unified`/`rehype` ya instalada)

**Checkpoint**: dependencias disponibles para US4

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extender `MarkdownEditorProps` con las 2 props nuevas — bloquea US1 y US2 (US3 y US4 no dependen de esto)

- [x] T002 Añadir `onlyView?: boolean` y `resizable?: boolean` a `MarkdownEditorProps` en `src/components/MarkdownEditor/types.ts`, con comentario de su default (FR-001, FR-009; contrato en `contracts/MarkdownEditor.md`)

**Checkpoint**: props tipadas — US1 y US2 pueden implementarse

---

## Phase 3: User Story 1 - Modo de solo lectura (Priority: P1) 🎯 MVP

**Goal**: `onlyView` bloquea edición en ambas vistas y reduce la toolbar a "Edición desactivada" + exportar

**Independent Test**: montar con `onlyView` y verificar que ningún control de edición está disponible, que el aviso se muestra, que exportar sigue funcionando, y que sin la prop el componente se comporta igual que antes

### Tests for User Story 1

- [x] T003 [P] [US1] Crear `tests/MarkdownEditor/only-view.test.tsx`: con `onlyView`, verificar que el editor Tiptap no acepta entrada de teclado (contenido no cambia tras `userEvent.type`), que la toolbar muestra el texto "Edición desactivada", que el botón `</>` no está presente, que el botón "Export" sigue presente y funcional (mock de `navigator.clipboard`), y que sin `onlyView` (o `onlyView={false}`) el editor permanece editable y la toolbar completa (FR-001 a FR-008)
- [x] T004 [P] [US1] Añadir caso a `tests/MarkdownEditor/accessibility.test.tsx`: en modo `onlyView`, el aviso "Edición desactivada" se expone de forma perceptible (no solo visual) — por ejemplo como texto real en el DOM, no solo un ícono (Principio VI)

### Implementation for User Story 1

- [x] T005 [US1] En `src/components/MarkdownEditor/MarkdownEditor.tsx`: aceptar `onlyView = false`; pasar `editable: !onlyView` a `useEditor` (y a las `[deps]` del hook para que se reevalúe si cambia); pasar `readOnly={onlyView}` a `MarkdownSourceView`; forzar `viewMode` a `"wysiwyg"` cuando `onlyView` está activo (FR-002, FR-003, FR-006)
- [x] T006 [US1] Añadir prop `readOnly?: boolean` a `MarkdownSourceViewProps` en `src/components/MarkdownEditor/views/MarkdownSourceView.tsx` y aplicarla al `<textarea>` nativo (FR-003)
- [x] T007 [US1] En `src/components/MarkdownEditor/Toolbar/Toolbar.tsx`: aceptar prop `onlyView`; cuando es `true`, renderizar únicamente un `<span>`/`<div>` con el texto "Edición desactivada" seguido del `ExportMenu` (mismo `.spacer` a la derecha), omitiendo el resto de los grupos de controles y el botón `</>` (FR-004, FR-005, FR-006, FR-007)
- [x] T008 [US1] Añadir estilo `.readOnlyNotice` en `MarkdownEditor.module.css` para el texto "Edición desactivada" (tipografía consistente con el resto de la toolbar) y pasar `onlyView` desde `MarkdownEditor.tsx` a `<Toolbar>`

**Checkpoint**: US1 completa — modo de solo lectura funcional, tests en verde

---

## Phase 4: User Story 2 - Redimensionamiento manual (Priority: P2)

**Goal**: `resizable` (default `true`) habilita arrastre desde la esquina inferior derecha vía CSS nativo

**Independent Test**: montar con y sin `resizable`, verificar presencia/ausencia del handle de arrastre y que el tamaño mínimo protege la usabilidad de la toolbar

### Tests for User Story 2

- [x] T009 [P] [US2] Crear `tests/MarkdownEditor/resizable.test.tsx`: por default (`resizable` no especificado), el contenedor raíz tiene `resize: both` computado; con `resizable={false}`, tiene `resize: none`; verificar que `min-width`/`min-height` están definidos en ambos casos (FR-009 a FR-012)

### Implementation for User Story 2

- [x] T010 [US2] En `src/components/MarkdownEditor/MarkdownEditor.tsx`: aceptar `resizable = true`; aplicar clase condicional (`styles.resizable` cuando `true`) al contenedor raíz además de `rootClassName` (FR-009, FR-011)
- [x] T011 [US2] En `MarkdownEditor.module.css`: añadir `.resizable { resize: both; overflow: auto; min-width: <valor razonable, p. ej. 320px>; min-height: <valor razonable, p. ej. 200px>; }`; asegurar que `.root` sin esa clase mantiene `resize: none` implícito (default de la plataforma) (FR-010, FR-012)

**Checkpoint**: US2 completa — redimensionamiento nativo funcional, tamaño mínimo protegido

---

## Phase 5: User Story 3 - Personalización visual de la toolbar (Priority: P2)

**Goal**: CSS Custom Properties `--mdw-toolbar-*` reemplazan los valores hardcodeados del degradado/texto/fuente, sobreescribibles sin tocar el código fuente

**Independent Test**: aplicar un override de CSS externo sobre `className` y verificar que la toolbar refleja los nuevos valores; verificar que una personalización parcial no afecta las variables no tocadas

### Tests for User Story 3

- [x] T012 [P] [US3] Crear `tests/MarkdownEditor/toolbar-theming.test.tsx`: renderizar el componente con una hoja de estilo de test que sobreescribe `--mdw-toolbar-fg` sobre un `className` dado, y verificar (vía `getComputedStyle`) que la variable resuelve al valor personalizado en el elemento de la toolbar; verificar que `--mdw-toolbar-gradient-from` conserva su default cuando no se sobreescribe (FR-013 a FR-016)
- [x] T012a [P] [US3] Añadir a `tests/MarkdownEditor/toolbar-theming.test.tsx`: verificar que `--mdw-content-bg` resuelve a `var(--mdw-bg)` por defecto en el contenedor `.content`, y que un override (probado con un `linear-gradient`) se refleja correctamente (FR-016a) — tarea añadida retroactivamente tras detectar el gap

### Implementation for User Story 3

- [x] T013 [US3] En `MarkdownEditor.module.css`, declarar en `.root`: `--mdw-toolbar-gradient-from: #eeeeee; --mdw-toolbar-gradient-via: #dcdcdc; --mdw-toolbar-gradient-to: #cfcfcf; --mdw-toolbar-fg: #222222; --mdw-toolbar-font-family: Arial, sans-serif;` (valores por defecto actuales, ver data-model.md)
- [x] T014 [US3] En `.toolbar`, reemplazar el `background: linear-gradient(...)` hardcodeado por `background: linear-gradient(to bottom, var(--mdw-toolbar-gradient-from) 0%, var(--mdw-toolbar-gradient-via) 45%, var(--mdw-toolbar-gradient-to) 100%)`, y en `.button`/`.headingSelect`/glifos de texto reemplazar `color: #222`/`font-family: Arial, sans-serif` por `color: var(--mdw-toolbar-fg)` / `font-family: var(--mdw-toolbar-font-family)` (FR-013, FR-015, FR-016)
- [x] T014a [US3] Añadir `--mdw-content-bg: var(--mdw-bg);` a `.root`; aplicar `background: var(--mdw-content-bg)` en `.content`; cambiar `.source` (textarea) de `background: var(--mdw-bg)` a `background: transparent` para que herede el fondo de `.content` en vez de taparlo (FR-016a) — tarea añadida retroactivamente tras detectar el gap
- [x] T015 [US3] Documentar las 5 (ahora 6) variables CSS en `src/components/MarkdownEditor/README.md` (tabla nombre/default/qué controla), incluyendo `--mdw-content-bg` con ejemplos de color, degradado e imagen con transparencia, como parte de la superficie de personalización pública (Principio X)

**Checkpoint**: US3 completa — toolbar y fondo del área de contenido completamente themeables vía CSS estándar, aspecto por defecto sin cambios

---

## Phase 6: User Story 4 - Resaltado de sintaxis en bloques de código (Priority: P3)

**Goal**: bloques de código con lenguaje reconocido muestran resaltado en la vista WYSIWYG y en el HTML exportado, vía el mismo motor `lowlight`

**Independent Test**: insertar un bloque de código con un lenguaje predefinido y verificar múltiples colores de token; verificar degradación legible para lenguaje no reconocido; verificar que el Markdown fuente no cambia

### Tests for User Story 4

- [x] T016 [P] [US4] Crear `tests/MarkdownEditor/syntax-highlight.test.tsx`: con `language: "javascript"`, verificar que el bloque renderizado contiene múltiples `<span class="hljs-...">` con contenido distinto (al menos 2 tokens de clase diferente); con un lenguaje personalizado no registrado, verificar que el bloque se renderiza sin excepción y con el texto completo visible; con un bloque sin `language`, verificar ausencia de clases `hljs-*` (comportamiento idéntico a antes); verificar que alternar a vista Markdown y volver preserva el Markdown fuente exacto (FR-017 a FR-020)
- [x] T017 [P] [US4] Actualizar `tests/MarkdownEditor/markdown-roundtrip.test.ts` si `markdownToHtml` cambia su salida para bloques de código (verificar que el HTML exportado incluye clases `hljs-*` para lenguajes reconocidos) (FR-020, quickstart escenario 4 paso 5)

### Implementation for User Story 4

- [x] T018 [US4] En `src/components/MarkdownEditor/markdown/tiptapMarkdownBridge.ts`: crear `createLowlight()` registrando únicamente `json`, `sql`, `typescript`, `javascript`, `java` (importados individualmente desde `highlight.js/lib/languages/*` vía `lowlight`), y reemplazar la `CodeBlock` de `StarterKit` por `CodeBlockLowlight.configure({ lowlight })` en `createEditorExtensions` (deshabilitando `codeBlock` en `StarterKit.configure({ codeBlock: false })`) (FR-017, research.md §4)
- [x] T019 [US4] En `src/components/MarkdownEditor/markdown/pipeline.ts`: añadir `rehype-highlight` (configurado con los mismos 5 lenguajes y `{ ignoreMissing: true }`) al pipeline de `markdownToHtml`, insertado entre `rehypeRaw` y el paso de sanitización condicional (FR-017, FR-018)
- [x] T020 [US4] Extender el schema de sanitización (`rehypeSanitize`) en `pipeline.ts` para permitir explícitamente el atributo `class` en las etiquetas `code` y `span` (por defecto el schema GFM lo elimina), de forma que el HTML exportado con sanitización activa conserve las clases `hljs-*` (research.md, nota de implementación)
- [x] T021 [US4] Verificar/ajustar el manejo de bloques de código en `editorHtmlToMarkdown` (`pipeline.ts`) para que las clases `hljs-*` inyectadas por `CodeBlockLowlight`/`rehype-highlight` en el HTML del editor NO se filtren al Markdown serializado (el fence info string debe seguir siendo solo el `language`, sin metadatos de resaltado) (FR-020)

**Checkpoint**: US4 completa — resaltado consistente entre editor y export, sin afectar el Markdown fuente

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T022 [P] Actualizar `src/components/MarkdownEditor/README.md`: documentar `onlyView` y `resizable` en la tabla de props (propósito, default, ejemplos), añadir un ejemplo de uso combinado (`onlyView` + tema personalizado)
- [x] T023 Verificar tipado estricto: `npm run typecheck` sin errores y sin `any` no justificado en los archivos tocados (Principio II)
- [x] T024 Ejecutar `npm run build` y verificar que `dist/` sigue generando ESM + CJS + `.d.ts` + CSS sin errores, y que el tamaño de bundle no crece de forma desproporcionada por los lenguajes de `lowlight` registrados (Principios VIII, XIII)
- [x] T025 Validar manualmente los 4 escenarios de `specs/003-onlyview-resize-theming-syntax-highlight/quickstart.md` en el playground local (`npm run dev`), incluyendo el caso de personalización de tema con CSS externo

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias — requerida antes de US4 (T018–T021)
- **Foundational (Phase 2)**: sin dependencias — requerida antes de US1 y US2
- **US1 (Phase 3)**: requiere Phase 2
- **US2 (Phase 4)**: requiere Phase 2; independiente de US1
- **US3 (Phase 5)**: independiente de Phase 1/2 (no toca props, solo CSS); puede hacerse en paralelo con US1/US2
- **US4 (Phase 6)**: requiere Phase 1 (dependencias instaladas); independiente de US1/US2/US3
- **Polish (Phase 7)**: requiere las historias deseadas completas

### User Story Dependencies

- **US1 (P1)**: Foundational (Phase 2) — MVP de esta feature
- **US2 (P2)**: Foundational (Phase 2); independiente de US1
- **US3 (P2)**: ninguna dependencia de props — completamente independiente de las demás
- **US4 (P3)**: Setup (Phase 1); independiente de US1/US2/US3

### Parallel Opportunities

- Tras Setup + Foundational: US1, US2, US3 y US4 pueden implementarse en paralelo (tocan archivos
  mayormente distintos, salvo `MarkdownEditor.tsx`/`MarkdownEditor.module.css` compartidos entre
  US1/US2/US3 — coordinar si se paraleliza con más de una persona)
- Tests de cada historia ([P]) en paralelo entre sí
- T022–T024 en paralelo en Polish

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (solo si se aborda US4 junto) → Phase 2 → Phase 3 (US1)
2. **VALIDAR**: modo de solo lectura funcional
3. Demo/uso real posible ya en este punto

### Incremental Delivery

1. Foundational → US1 (modo solo lectura) → Demo
2. + US2 (resize) → Demo
3. + US3 (theming) → Demo
4. + US4 (syntax highlight) → Demo final, feature completa

---

## Notes

- Los 6 puntos de la Definition of Done (constitución) quedan cubiertos por: T023 (tipado), tests
  T003–T017 (comportamiento), T004 (accesibilidad del aviso de solo lectura), T015/T022
  (documentación), T024 (build), research.md (dependencias justificadas)
- Commit tras cada tarea o grupo lógico

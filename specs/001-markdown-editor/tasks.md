---

description: "Task list for Markdown Editor implementation"
---

# Tasks: Markdown Editor

**Input**: Design documents from `/specs/001-markdown-editor/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/MarkdownEditor.md, quickstart.md

**Tests**: INCLUIDOS — la constitución (Principios IX y XIV) exige tests de comportamiento como condición de Definition of Done; no son opcionales en este proyecto.

**Organization**: Tareas agrupadas por historia de usuario para permitir implementación y prueba independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia a la que pertenece (US1, US2, US3, US4)
- Rutas de archivo exactas en cada descripción

## Path Conventions

Single project (librería): `src/` y `tests/` en la raíz del repo, según plan.md.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del paquete npm y tooling

- [ ] T001 Inicializar package.json como librería: nombre `mdwysiwyg`, `type: module`, `peerDependencies` react/react-dom >=18, `sideEffects: ["**/*.css"]`, campos `exports`/`main`/`module`/`types` apuntando a `dist/`
- [ ] T002 Instalar dependencias de runtime: `@tiptap/react`, `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header`, `@tiptap/extension-task-list`, `@tiptap/extension-task-item`, `@tiptap/extension-link`, `@tiptap/extension-image`, `unified`, `remark-parse`, `remark-gfm`, `remark-rehype`, `rehype-stringify`, `rehype-sanitize`, `remark-stringify`, `rehype-remark` (o `hast-util-*` equivalente para HTML→MD si se necesita)
- [ ] T003 Instalar devDependencies: `typescript`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `tsup` (build ESM+CJS+d.ts), `react`, `react-dom`, `@types/react`, `@types/react-dom`
- [ ] T004 [P] Crear tsconfig.json con `strict: true`, `jsx: react-jsx`, `moduleResolution: bundler`, incluyendo `src/` y `tests/`
- [ ] T005 [P] Configurar vitest.config.ts con entorno `jsdom`, setup file `tests/setup.ts` (jest-dom) y soporte CSS Modules
- [ ] T006 [P] Configurar tsup.config.ts: entry `src/index.ts` + `src/components/MarkdownEditor/index.ts`, formatos `esm`+`cjs`, `dts: true`, CSS inyectado o emitido como asset consumible estándar
- [ ] T007 [P] Añadir scripts npm en package.json: `build` (tsup), `test` (vitest run), `test:watch`, `typecheck` (tsc --noEmit)

**Checkpoint**: `npm run typecheck` y `npm run test` corren (aún sin tests ni código)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pipeline Markdown y esqueleto del componente — bloquea todas las historias

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta completar esta fase

- [ ] T008 [P] Crear tipos públicos en src/components/MarkdownEditor/types.ts: `MarkdownEditorProps` (initialContent?, onChange?, width?, height?, sanitizeEmbeddedHtml?, className?) según contracts/MarkdownEditor.md, y tipo interno `ViewMode = "wysiwyg" | "markdown"`
- [ ] T009 [P] Implementar pipeline unified en src/components/MarkdownEditor/markdown/pipeline.ts: `markdownToHtml(md, {sanitize})` (remark-parse + remark-gfm + remark-rehype con `allowDangerousHtml` + rehype-sanitize condicional + rehype-stringify) y `markdownToHast`/helpers para GFM (FR-021, FR-022, FR-023)
- [ ] T010 Implementar puente Tiptap↔Markdown en src/components/MarkdownEditor/markdown/tiptapMarkdownBridge.ts: `markdownToTiptapDoc(md)` y `tiptapDocToMarkdown(doc)` con soporte GFM completo (tablas, task lists, tachado, HTML embebido como nodo raw) — Markdown como fuente de verdad (FR-020); depende de T009
- [ ] T011 [P] Crear estilos base encapsulados en src/components/MarkdownEditor/MarkdownEditor.module.css: contenedor con tamaño por props (default 700×500px vía CSS custom properties), layout toolbar arriba + área de edición (FR-002, FR-016)
- [ ] T012 Crear shell del componente en src/components/MarkdownEditor/MarkdownEditor.tsx: estado `source` (string) + `viewMode`, render condicional de vistas (placeholders), aplicación de width/height con defaults 700/500, invocación de `onChange` en cada cambio de `source` (FR-014–FR-018); depende de T008, T011
- [ ] T013 [P] Crear exports: src/components/MarkdownEditor/index.ts (export nombrado `MarkdownEditor` + `MarkdownEditorProps`) y src/index.ts (entry point del paquete reexportando el componente) — Principio XII
- [ ] T014 [P] Crear tests/setup.ts (import jest-dom) y test humo tests/MarkdownEditor/smoke.test.tsx: monta `<MarkdownEditor />` vacío sin errores, tamaño default aplicado (FR-015, FR-016, SC-005)

**Checkpoint**: componente montable, pipeline MD↔HTML funcionando aislado — historias pueden comenzar

---

## Phase 3: User Story 1 - Editar en vista renderizada (WYSIWYG) (Priority: P1) 🎯 MVP

**Goal**: edición rich-text con toolbar (párrafo, headings, negrita, cursiva, tachado, listas ordenadas/no ordenadas/anidadas/checklist) en vista renderizada, reflejada en el Markdown subyacente

**Independent Test**: montar el componente vacío, aplicar formato desde la toolbar y verificar el resultado visual y el Markdown emitido por `onChange`

### Tests for User Story 1

> Escribir primero, verificar que fallan antes de implementar

- [ ] T015 [P] [US1] Test de comportamiento en tests/MarkdownEditor/wysiwyg-formatting.test.tsx: escribir texto y aplicar negrita/cursiva/tachado/heading desde toolbar → contenido visible con formato y `onChange` recibe el GFM correcto (escenarios 1 y 3 de US1)
- [ ] T016 [P] [US1] Test de listas en tests/MarkdownEditor/wysiwyg-lists.test.tsx: crear lista ordenada, no ordenada, checklist e indentar ítem a lista anidada desde toolbar → estructura correcta en render y en Markdown (escenario 2 de US1, FR-009)

### Implementation for User Story 1

- [ ] T017 [US1] Implementar vista WYSIWYG en src/components/MarkdownEditor/views/RenderedView.tsx: `useEditor` de @tiptap/react con StarterKit (strike habilitado) + TaskList/TaskItem + extensiones de tabla/link/image, contenido inicial desde `source` vía bridge (T010), emisión de Markdown en `onUpdate` (FR-001, FR-005, FR-006)
- [ ] T018 [P] [US1] Crear componente de botón de toolbar accesible en src/components/MarkdownEditor/Toolbar/buttons/ToolbarButton.tsx: `<button type="button">` con `aria-label`, `aria-pressed` para estados activos, y estilos en Toolbar.module.css (Principio VI)
- [ ] T019 [US1] Implementar Toolbar en src/components/MarkdownEditor/Toolbar/Toolbar.tsx con grupo de formato: párrafo, headings H1–H6 (select o botones), negrita, cursiva, tachado, lista ordenada, lista no ordenada, checklist, indent/outdent de ítems (FR-008, FR-009); depende de T018
- [ ] T020 [US1] Integrar RenderedView + Toolbar en MarkdownEditor.tsx: pasar instancia del editor a la toolbar, sincronizar `source` ↔ editor, `onChange` con Markdown actualizado (FR-006, FR-018); depende de T017, T019

**Checkpoint**: US1 completa — editor WYSIWYG funcional con formato y listas, tests T015/T016 en verde

---

## Phase 4: User Story 2 - Editar en vista Markdown y ver el texto fuente (Priority: P1)

**Goal**: botón `</>` que alterna a vista de texto Markdown crudo editable, sin pérdida de contenido en ninguna dirección

**Independent Test**: activar `</>`, editar Markdown crudo, volver a vista renderizada y verificar sincronización exacta

### Tests for User Story 2

- [ ] T021 [P] [US2] Test de alternancia en tests/MarkdownEditor/view-toggle.test.tsx: toggle muestra Markdown idéntico, edición en textarea se refleja al volver a WYSIWYG, alternancia repetida sin editar preserva contenido bit a bit, `onChange` NO se dispara por mero cambio de vista (FR-003, FR-004, FR-007, SC-002; contrato punto 3)

### Implementation for User Story 2

- [ ] T022 [P] [US2] Implementar vista de texto en src/components/MarkdownEditor/views/MarkdownSourceView.tsx: `<textarea>` controlado con `aria-label`, estilos monoespaciados en MarkdownEditor.module.css, actualiza `source` en cada cambio (FR-005, FR-007)
- [ ] T023 [US2] Añadir botón toggle `</>` a Toolbar.tsx con `aria-pressed` según vista activa; deshabilitar/ocultar controles de formato no aplicables en vista Markdown (FR-003)
- [ ] T024 [US2] Cablear alternancia en MarkdownEditor.tsx: al salir de WYSIWYG serializar doc→`source`; al entrar reconstruir doc desde `source` vía bridge; garantizar cero pérdida (FR-004, FR-020); depende de T022, T023

**Checkpoint**: US1 + US2 funcionan — doble vista sincronizada, tests T021 en verde

---

## Phase 5: User Story 3 - Insertar elementos estructurados (Priority: P2)

**Goal**: inserción desde toolbar de bloque de código, imagen (URL), enlace, tabla, línea horizontal y HTML embebido (con sanitización configurable)

**Independent Test**: invocar cada acción de inserción sobre contenido existente y verificar el elemento en ambas vistas

### Tests for User Story 3

- [ ] T025 [P] [US3] Test de inserciones en tests/MarkdownEditor/insert-elements.test.tsx: bloque de código, imagen por URL, enlace sobre selección, tabla, línea horizontal → elemento presente en vista renderizada y sintaxis GFM correcta en `onChange` (escenarios 1–5 de US3, FR-010, FR-011)
- [ ] T026 [P] [US3] Test de sanitización en tests/MarkdownEditor/sanitize-html.test.tsx: con default, `<script>` embebido no se renderiza ejecutable; con `sanitizeEmbeddedHtml={false}`, HTML de confianza se renderiza intacto (FR-022, FR-023; quickstart escenario 5)

### Implementation for User Story 3

- [ ] T027 [P] [US3] Crear diálogos/prompts accesibles de inserción en src/components/MarkdownEditor/Toolbar/buttons/InsertDialogs.tsx: formularios mínimos para URL de imagen, URL+texto de enlace, dimensiones de tabla y bloque HTML (labels asociados, manejo de foco y Escape — Principio VI)
- [ ] T028 [US3] Añadir grupo de inserción a Toolbar.tsx: bloque de código, imagen, enlace, tabla, línea horizontal, HTML embebido, conectados a comandos Tiptap (FR-010, FR-011); depende de T027
- [ ] T029 [US3] Soportar nodo de HTML embebido en el bridge (tiptapMarkdownBridge.ts) y aplicar sanitización del pipeline según prop `sanitizeEmbeddedHtml` en RenderedView (FR-022, FR-023); depende de T009, T010

**Checkpoint**: todas las inserciones operativas en ambas vistas, tests T025/T026 en verde

---

## Phase 6: User Story 4 - Exportar el contenido (Priority: P3)

**Goal**: botón `Export` con copiar como Markdown y copiar como HTML

**Independent Test**: crear contenido variado, exportar en ambos formatos y verificar fidelidad

### Tests for User Story 4

- [ ] T030 [P] [US4] Test de export en tests/MarkdownEditor/export.test.tsx: mock de `navigator.clipboard`, "copiar como Markdown" copia el `source` exacto y "copiar como HTML" copia el HTML del pipeline (FR-012, FR-013, SC-003)

### Implementation for User Story 4

- [ ] T031 [US4] Implementar menú Export en src/components/MarkdownEditor/Toolbar/buttons/ExportMenu.tsx: botón `Export` con dos acciones (Markdown/HTML) usando `navigator.clipboard.writeText`, HTML generado con `markdownToHtml` de T009; menú accesible por teclado (Principio VI)
- [ ] T032 [US4] Integrar ExportMenu en Toolbar.tsx (FR-012, FR-013); depende de T031

**Checkpoint**: las 4 historias completas e independientes

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: gates de la Definition of Done (constitución) y validación final

- [ ] T033 [P] Test de accesibilidad en tests/MarkdownEditor/accessibility.test.tsx: todos los botones de toolbar con `aria-label`, estados `aria-pressed` correctos, navegación por teclado del toggle y menú Export, textarea con label asociado (Principio VI)
- [ ] T034 [P] Escribir documentación pública en src/components/MarkdownEditor/README.md: propósito, API/props, ejemplos de uso (los 5 escenarios de quickstart.md), casos relevantes y edge cases (Principio X)
- [ ] T035 [P] Verificar tipado estricto: `npm run typecheck` sin errores y sin `any` no justificado en src/ (Principio II)
- [ ] T036 Ejecutar `npm run build` y verificar dist/: ESM + CJS + `.d.ts` presentes, import individual `mdwysiwyg` funciona en un proyecto de prueba mínimo (Principios XI, XII, XIII; SC-005)
- [ ] T037 Validar manualmente los 5 escenarios de specs/001-markdown-editor/quickstart.md en un playground local (vite o similar temporal) incluyendo edge cases de la spec (Markdown inválido pegado, `**` sin cerrar, URL de imagen rota)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: requiere Phase 1 — BLOQUEA todas las historias
- **US1 (Phase 3)**: requiere Phase 2
- **US2 (Phase 4)**: requiere Phase 2; se integra con la toolbar de US1 (T023 asume Toolbar.tsx existente de T019)
- **US3 (Phase 5)**: requiere Phase 2 y la Toolbar de US1
- **US4 (Phase 6)**: requiere Phase 2 y el pipeline (T009); independiente de US3
- **Polish (Phase 7)**: requiere las historias deseadas completas

### User Story Dependencies

- **US1 (P1)**: solo Foundational — MVP autónomo
- **US2 (P1)**: Foundational + Toolbar base de US1 (T019)
- **US3 (P2)**: Foundational + Toolbar base de US1; independiente de US2
- **US4 (P3)**: Foundational + Toolbar base de US1; independiente de US2/US3

### Within Each User Story

- Tests primero, verificar que fallan, luego implementación
- Vistas antes de integración en MarkdownEditor.tsx
- Historia completa antes de pasar a la siguiente prioridad

### Parallel Opportunities

- Phase 1: T004–T007 en paralelo tras T001–T003
- Phase 2: T008, T009, T011 en paralelo; T014 tras T012–T013
- Tests de cada historia ([P]) en paralelo entre sí
- Tras Phase 3 (Toolbar existente): US2, US3 y US4 pueden avanzar en paralelo
- Phase 7: T033–T035 en paralelo

---

## Parallel Example: User Story 1

```bash
# Tests de US1 juntos (deben fallar antes de implementar):
Task: "T015 wysiwyg-formatting.test.tsx"
Task: "T016 wysiwyg-lists.test.tsx"

# Implementación paralela inicial:
Task: "T017 RenderedView.tsx" y "T018 ToolbarButton.tsx" (archivos distintos)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 → Phase 2 → Phase 3 (US1)
2. **VALIDAR**: editor WYSIWYG con formato completo y `onChange` correcto
3. Demo/uso real posible ya en este punto

### Incremental Delivery

1. + US2 → doble vista (el diferenciador clave del componente)
2. + US3 → inserciones estructuradas + sanitización
3. + US4 → export
4. Phase 7 → gates de Definition of Done → publicable

---

## Notes

- Los 6 puntos de la Definition of Done (constitución) quedan cubiertos por: T035 (tipado), tests T014–T033 (comportamiento), T033 (accesibilidad), T034 (documentación), T036 (build), research.md (dependencias justificadas)
- Commit tras cada tarea o grupo lógico
- Cada checkpoint permite validar la historia de forma independiente

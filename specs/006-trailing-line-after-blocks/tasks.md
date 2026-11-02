---

description: "Task list for Línea editable tras bloques al final del documento"
---

# Tasks: Línea editable tras bloques al final del documento

**Input**: Design documents from `/specs/006-trailing-line-after-blocks/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/editing-behavior.md, quickstart.md

**Tests**: INCLUIDOS — la constitución (Principios IX y XIV) exige tests de comportamiento como condición de Definition of Done.

**Organization**: Tareas agrupadas por historia de usuario (US1–US4), en orden de prioridad.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: US1 (tabla final), US2 (código/Mermaid final), US3 (otros bloques), US4 (sin efectos secundarios)

## Path Conventions

Single project: `src/` y `tests/` en la raíz del repo.

---

## Phase 1: Setup

**Purpose**: Línea base verde antes de modificar

- [x] T001 Ejecutar `npm test` y `npm run typecheck` en la raíz y confirmar que pasan (línea base)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Mecanismo común a todas las historias (research.md D1, D2, D4)

- [x] T002 Crear `src/components/MarkdownEditor/markdown/trailingLine.ts` exportando `ensureTrailingParagraph(editor)` (si el editor es editable y el último hijo del documento no es párrafo, inserta un párrafo vacío al final con meta `preventUpdate` y `addToHistory: false`) y `handleBlankAreaMouseDown(view, event)` (si el editor es editable y el objetivo es `view.dom` en/bajo el último hijo cuando éste es un párrafo vacío o el punto está bajo todo el contenido, o es un `.tableWrapper` inmediatamente anterior al párrafo final vacío: `preventDefault`, `TextSelection.atEnd(doc)`, `view.focus()`, devuelve `true`; en otro caso `false`)
- [x] T003 Cablear en `src/components/MarkdownEditor/MarkdownEditor.tsx`: llamar `ensureTrailingParagraph` en `onCreate` de `useEditor` y añadir `mousedown(view, event) { return handleBlankAreaMouseDown(view, event); }` a `editorProps.handleDOMEvents`

**Checkpoint**: mecanismo disponible; las historias lo verifican por tipo de bloque

---

## Phase 3: User Story 1 - Tabla final (Priority: P1) 🎯 MVP

**Goal**: clic a la derecha/debajo de una tabla final posiciona el cursor en la línea posterior; Enter y escribir funcionan.

**Independent Test**: documento que termina en tabla → `mousedown` en área libre → escribir → el texto queda tras la tabla.

- [x] T004 [US1] Crear `tests/MarkdownEditor/trailing-line.test.tsx` con tests de tabla final (usar `setupEditor` de `tests/MarkdownEditor/helpers.tsx`): (a) carga inicial con tabla final → último hijo de `.ProseMirror` es `P` vacío y `onChange` no se invocó; (b) `mousedown` sobre `.tableWrapper` + escribir "hola" → Markdown de `onChange` contiene la tabla seguida de "hola" y la celda no cambia; (c) `mousedown` sobre `.ProseMirror` (debajo) + escribir → igual; (d) Enter desde la línea posterior crea otro párrafo vacío y el Markdown no cambia
- [x] T005 [US1] Ejecutar `npx vitest run tests/MarkdownEditor/trailing-line.test.tsx` y ajustar `trailingLine.ts` hasta que pase

**Checkpoint**: US1 funcional y verificada (MVP)

---

## Phase 4: User Story 2 - Código y Mermaid finales (Priority: P1)

**Goal**: mismo comportamiento para bloque de código y diagrama Mermaid finales.

**Independent Test**: documento que termina en bloque de código / Mermaid → clic libre → Enter/escribir fuera del bloque.

- [x] T006 [US2] Añadir en `tests/MarkdownEditor/trailing-line.test.tsx` (con `vi.mock("mermaid", …)` como en `tests/MarkdownEditor/mermaid.test.tsx`) tests: bloque de código final y Mermaid final → párrafo final vacío presente; `mousedown` en `.ProseMirror` + escribir "hola" → "hola" queda después del bloque y el contenido del bloque no cambia; Enter crea línea en blanco sin alterar el bloque
- [x] T007 [US2] Ajustar `trailingLine.ts` si algún test de T006 falla

**Checkpoint**: US1 y US2 verificadas

---

## Phase 5: User Story 3 - Otros bloques finales (Priority: P2)

**Goal**: cita, regla horizontal, imagen y lista finales.

**Independent Test**: documentos que terminan en cada elemento → clic libre → escribir tras el elemento.

- [x] T008 [US3] Añadir en `tests/MarkdownEditor/trailing-line.test.tsx` tests parametrizados (`it.each`) para cita (`> hi`), regla horizontal (`text` + `---`), imagen (`![a](http://x/y.png)`) y lista (`- a`): párrafo final vacío presente; `mousedown` libre + escribir "hola" → "hola" fuera del elemento; para lista, Enter en ítem vacío conserva el comportamiento habitual de salir de la lista
- [x] T009 [US3] Ajustar `trailingLine.ts` si algún test de T008 falla

**Checkpoint**: US1–US3 verificadas

---

## Phase 6: User Story 4 - Sin efectos secundarios (Priority: P2)

**Goal**: no regresiones ni cambios espurios en el Markdown.

**Independent Test**: documentos terminados en párrafo, `onlyView`, clic dentro de bloques, deshacer.

- [x] T010 [US4] Añadir en `tests/MarkdownEditor/trailing-line.test.tsx`: (a) documento terminado en párrafo con texto → sin párrafo extra, `mousedown` libre + escribir añade al final de ese párrafo; (b) clic libre sin escribir nunca invoca `onChange` y `ref.isModified()` sigue `false`; (c) `onlyView` → sin párrafo vacío final; (d) `mousedown` sobre una celda no se redirige (escribir queda en la celda); (e) si ya existe un párrafo vacío posterior, no se crea otro (conteo de hijos igual tras `mousedown`); (f) deshacer (Ctrl+Z) tras escribir en la línea posterior restaura el Markdown previo sin dañar el bloque
- [x] T011 [P] [US4] Añadir en `tests/MarkdownEditor/markdown-roundtrip.test.ts` casos: `<table>…</table><p></p>` y `<pre><code>x</code></pre><p></p><p></p>` se serializan igual que sin los párrafos vacíos finales
- [x] T012 [US4] Ajustar `trailingLine.ts` / `MarkdownEditor.tsx` si algún test de T010–T011 falla
- [x] T013 [US4] Ejecutar `npm test` completo y confirmar que ningún test existente (tablas, código, Mermaid, cursor, imperativo) regresiona

**Checkpoint**: todas las historias verificadas

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T014 [P] Documentar el comportamiento en `README.md` y `src/components/MarkdownEditor/README.md` (qué hace, bloques cubiertos, nota sobre líneas en blanco múltiples y Markdown)
- [x] T015 [P] Actualizar `llms.txt` con el comportamiento de la línea posterior
- [x] T016 [P] Añadir entrada `0.2.2` en `CHANGELOG.md` (Fixed: cursor/Enter tras tabla, código, Mermaid y otros bloques al final del documento)
- [x] T017 Ejecutar `npm run typecheck`, `npm test` y `npm run build` sin errores (Definition of Done)
- [x] T018 Validación manual en playground no ejecutable en esta sesión (sin navegador interactivo); comportamiento cubierto por tests jsdom + contrato (mousedown sobre wrapper/contenedor). Pendiente de verificación visual por el usuario
- [x] T019 Subir versión a `0.2.2` en `package.json`/`package-lock.json`, commit, push a git y `npm publish` (autorizado por el usuario)

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 (MVP) → US2 → US3 → US4 → Polish.
- US2–US4 dependen solo del mecanismo de Phase 2; sus tests comparten el archivo `trailing-line.test.tsx`, por lo que se escriben secuencialmente.
- T011, T014, T015, T016 son paralelizables (archivos distintos).

## Implementation Strategy

- **MVP**: Phase 1–3 (tabla final). Luego incrementar por historia.
- Cada historia añade tests; el ajuste de `trailingLine.ts` se hace solo si el test falla.

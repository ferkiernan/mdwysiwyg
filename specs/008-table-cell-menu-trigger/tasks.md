---

description: "Task list for Table Cell Menu Trigger (corner triangle)"
---

# Tasks: Table Cell Menu Trigger (corner triangle)

**Input**: Design documents from `/specs/008-table-cell-menu-trigger/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/table-cell-trigger.md, quickstart.md

**Tests**: Included. The constitution (Principles IX, XIV) makes behavior tests part of the Definition of Done. Write each story's tests first and confirm they fail before implementing.

**Organization**: Grouped by user story. US1 and US2 are both P1; US2 depends on US1's trigger existing (otherwise removing the second click would leave no way to open the menu).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3 (maps to spec.md)
- Menu labels stay in Spanish as today ("Acciones de columna", "Acciones de fila"). New trigger labels: "Abrir acciones de columna" / "Abrir acciones de fila".

## Path Conventions

Single project: `src/components/MarkdownEditor/` and `tests/MarkdownEditor/` at the repository root.

---

## Phase 1: Setup

- [X] T001 Run `npm run typecheck` and `npm test` from the repo root and record the baseline (all green expected) before touching code

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Styling hooks and a test helper that every story uses.

**⚠️ CRITICAL**: Complete before Phase 3.

- [X] T002 [P] In `src/components/MarkdownEditor/MarkdownEditor.module.css`: add `position: relative` to `.content`; add a base `.tableMenuTrigger` class (`position: absolute`, `padding: 0`, `border: 0`, `font-size: inherit`, `background: transparent`, `z-index` above table content); declare on `.root` the custom properties `--mdw-table-menu-trigger-size: 0.7em` and `--mdw-table-menu-trigger-color: var(--mdw-scrollbar-thumb)` (aligned with the scrollbar colour tokens; shape/cursor come in T023)
- [X] T003 [P] In `tests/MarkdownEditor/helpers.tsx`: add `openTableMenuViaTrigger(cell: HTMLElement)` that `userEvent.hover(cell)` then clicks the button whose name matches `/^Abrir acciones de (columna|fila)$/`

**Checkpoint**: Foundation ready.

---

## Phase 3: User Story 1 - Open cell options from a corner triangle (Priority: P1) 🎯 MVP

**Goal**: Hovering a cell shows a corner trigger; one click opens the existing column (header) / row (data) menu for that cell. Menu stays keyboard-reachable.

**Independent Test**: Hover any cell → trigger appears; click → correct menu with the 5 existing actions; action applies to that cell.

### Tests for User Story 1 ⚠️ (write first, must fail)

- [X] T004 [US1] Create `tests/MarkdownEditor/table-cell-trigger.test.tsx`: hovering a `td` shows a button named "Abrir acciones de fila", hovering a `th` shows "Abrir acciones de columna"; leaving the table hides it; moving the pointer from the cell onto the trigger (`mouseout` with `relatedTarget` = trigger) keeps it visible
- [X] T005 [US1] In `tests/MarkdownEditor/table-cell-trigger.test.tsx`: clicking the trigger of a `th` opens menu "Acciones de columna" and of a `td` opens "Acciones de fila", each with the 5 actions in the existing order; trigger has `aria-haspopup="menu"` and `aria-expanded` `"true"` while open, `"false"` otherwise; trigger stays visible while its menu is open
- [X] T006 [US1] In `tests/MarkdownEditor/table-cell-trigger.test.tsx`: with a table of 2 data rows and no prior click, hover a cell in the *second* data row, click its trigger, choose "Añadir fila abajo" → the new row appears directly below the second row (not the first); same check for "Añadir columna a la derecha" from the second header
- [X] T007 [US1] In `tests/MarkdownEditor/table-cell-trigger.test.tsx`: no trigger appears with `onlyView`, nor in Markdown source view; after hovering/opening, the `onChange` Markdown never contains trigger text ("Abrir acciones") and a cell edit round-trips to the expected table Markdown
- [X] T008 [US1] In `tests/MarkdownEditor/table-cell-trigger.test.tsx`: with the caret in a data cell, `Shift+F10` and the `ContextMenu` key open "Acciones de fila" with the first item focused (header cell → column menu); with the caret outside any table neither key opens a menu
- [X] T009 [P] [US1] Update `tests/MarkdownEditor/table-column-menu.test.tsx`: tests that open the menu via two clicks switch to `openTableMenuViaTrigger` (action tests and Escape test); keep their assertions unchanged
- [X] T010 [P] [US1] Update `tests/MarkdownEditor/table-row-menu.test.tsx`: same switch to `openTableMenuViaTrigger` for the action tests
- [X] T011 [P] [US1] Update the table-menu test in `tests/MarkdownEditor/accessibility.test.tsx` to open the menu via `openTableMenuViaTrigger` and keep its menu-role/first-item-focus assertions

### Implementation for User Story 1

- [X] T012 [US1] Create `src/components/MarkdownEditor/views/TableCellTrigger.tsx`: named export; props `{ cell: HTMLElement; container: HTMLElement; expanded: boolean; onActivate: () => void }`; renders `<button type="button" tabIndex={-1}>` with `className={styles["tableMenuTrigger"]}`, `aria-label` "Abrir acciones de columna" for `TH` / "Abrir acciones de fila" otherwise, `aria-haspopup="menu"`, `aria-expanded`; computes `top`/`left` in `container` coordinates (`cellRect − containerRect + scrollTop/Left`, aligned to the cell's top-right corner inset by 1px border) in a layout effect; `onMouseDown` prevents default so the click does not disturb the selection; strict types, no `any`
- [X] T013 [US1] In `src/components/MarkdownEditor/MarkdownEditor.tsx`: add `hoveredCell` state (`HTMLElement | null`) driven by `onMouseOver`/`onMouseOut` on the `.content` div — set when `event.target.closest("th, td")` is inside `.ProseMirror`; on `mouseout` ignore when `relatedTarget` is the trigger button, otherwise clear
- [X] T014 [US1] In `src/components/MarkdownEditor/MarkdownEditor.tsx`: add `openTableMenuForCell(cell)` that dispatches `TextSelection.near(doc.resolve(view.posAtDOM(cell, 0) + 1))` (same anchoring as the current second-click code) then `setTableMenu({ kind: cell.tagName === "TH" ? "column" : "row", anchor: cell })`; render `<TableCellTrigger>` for `tableMenu?.anchor ?? hoveredCell` only when `effectiveViewMode === "wysiwyg"`, `!onlyView` and `editor !== null`, with `onActivate={() => openTableMenuForCell(cell)}`
- [X] T015 [US1] In `src/components/MarkdownEditor/MarkdownEditor.tsx`: add `onKeyDown` on the `.content` div — for `ContextMenu` or `Shift+F10`, find the cell from `window.getSelection()?.anchorNode` (`closest("th, td")`, inside `.ProseMirror`), `preventDefault()` and call `openTableMenuForCell`
- [X] T016 [US1] In `src/components/MarkdownEditor/MarkdownEditor.tsx` / `TableCellTrigger.tsx`: clear `hoveredCell` when the cell is no longer `isConnected` or the view/`onlyView` changes; re-measure placement on editor `update` and window `resize`; while verifying in the playground, confirm Tiptap's non-resizable table renders no scrolling `tableWrapper` (research §8) and clamp/hide the trigger if one exists

**Checkpoint**: US1 fully functional and testable on its own (second click still also works until US2).

---

## Phase 4: User Story 2 - Second click no longer opens the menu (Priority: P1)

**Goal**: Remove the old gesture: clicking an active cell again just moves the caret.

**Independent Test**: Click in a cell, click again → no menu, caret moves; double-click selects a word, no menu.

### Tests for User Story 2 ⚠️ (write first, must fail)

- [X] T017 [US2] In `tests/MarkdownEditor/table-cell-trigger.test.tsx`: clicking the same `th` twice and the same `td` twice opens no menu; double-click on cell text opens no menu and keeps the selection
- [X] T018 [US2] In `tests/MarkdownEditor/table-cell-trigger.test.tsx`: clicking a link inside a table cell opens the link popover (documented side effect of removing the cell branch from the click handler, research §7)
- [X] T019 [US2] Remove obsolete second-click tests from `tests/MarkdownEditor/table-column-menu.test.tsx` and `tests/MarkdownEditor/table-row-menu.test.tsx` ("primer clic no abre", "segundo clic abre…", "con contenido seleccionado…", "clic en otra parte… primer clic nuevo"); keep the "5 actions in order" assertion by moving it onto the trigger path if not already covered by T005

### Implementation for User Story 2

- [X] T020 [US2] In `src/components/MarkdownEditor/MarkdownEditor.tsx`: delete `lastFocusedCellPosRef` and the whole `th, td` branch (plus the "clic fuera de cualquier celda" reset) from the `click` handler so link handling runs for cell clicks; remove now-unused code/imports

**Checkpoint**: US1 + US2 complete (core behavior change done).

---

## Phase 5: User Story 3 - Triangle affordance: size and pointer feedback (Priority: P2)

**Goal**: Right-angled triangle, legs ≈ half the caret height, link pointer on hover, themeable.

**Independent Test**: Hover a cell, compare legs to the caret (≈ 50%), hover the triangle → hand pointer.

### Tests for User Story 3 ⚠️ (write first, must fail)

- [X] T021 [P] [US3] In `tests/MarkdownEditor/extended-theming.test.tsx`: add `["--mdw-table-menu-trigger-size", "0.7em"]` and `["--mdw-table-menu-trigger-color", "var(--mdw-scrollbar-thumb)"]` to `NEW_VARIABLES`; add a case showing a host override of `--mdw-scrollbar-thumb` changes the trigger's resolved colour and an override of `--mdw-table-menu-trigger-color` is applied on the root
- [X] T022 [US3] In `tests/MarkdownEditor/table-cell-trigger.test.tsx`: assert the trigger's computed `cursor` is `pointer` and its `clip-path` is the triangle polygon, only if jsdom applies the CSS-module styles in this suite (as `extended-theming` already relies on); otherwise skip these assertions and rely on the manual check in T029

### Implementation for User Story 3

- [X] T023 [US3] In `src/components/MarkdownEditor/MarkdownEditor.module.css` `.tableMenuTrigger`: `width`/`height: var(--mdw-table-menu-trigger-size)`, `background: var(--mdw-table-menu-trigger-color)`, `clip-path: polygon(0 0, 100% 0, 100% 100%)` (right angle at top-right), `cursor: pointer`, visible focus style for the keyboard-opened case; verify the colour is visible on header and body backgrounds in light and dark playground themes (FR-012)

**Checkpoint**: All stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T024 [P] Update `src/components/MarkdownEditor/README.md`: rewrite "Tablas" (lines ~98–111) for the hover triangle, keyboard shortcut and removal of the second click; add the two new custom properties to the theming table (near line 196)
- [X] T025 [P] Add an "Unreleased" entry to `CHANGELOG.md`: Changed — table menu opens from a hover corner triangle (second click removed); Fixed/Changed — links inside table cells now open the link popover
- [X] T026 [P] Mention the new theming properties in `llms.txt` (theming list near line 63)
- [X] T027 [P] In `playground/main.tsx`: confirm presets that override `--mdw-scrollbar-thumb` also recolour the trigger; add `--mdw-table-menu-trigger-color` to the variable list only if a preset needs a distinct value
- [X] T028 Run `npm run typecheck && npm test && npm run build && npm run verify:dist`; all must pass (class map must include `tableMenuTrigger`)
- [ ] T029 Run the manual checks in `specs/008-table-cell-menu-trigger/quickstart.md` in `npm run dev` (hover, both menus, second click, size ≈ half caret → SC-005, link pointer, read-only, keyboard, dark theme, touch tap)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)** → **Foundational (2)** → **US1 (3)** → **US2 (4)** → **US3 (5)** (US3 is CSS-only on top of US1 and can run in parallel with US2) → **Polish (6)**.

### User Story Dependencies

- **US1**: needs Foundational only.
- **US2**: needs US1 (the trigger must exist before the old gesture is removed). Both touch `MarkdownEditor.tsx` and the table-cell-trigger test file, so keep them sequential.
- **US3**: needs T002 and T012; touches only the CSS module and its tests, so it can proceed in parallel with US2.

### Within Each Story

- Tests first, confirm failing; then implementation.
- `MarkdownEditor.tsx` tasks (T013–T016, T020) are sequential: same file.

### Parallel Opportunities

- T002 ∥ T003 (CSS vs test helper).
- T009 ∥ T010 ∥ T011 (three different test files, after T003).
- T021 ∥ T022 (different files), and US3 ∥ US2.
- T024 ∥ T025 ∥ T026 ∥ T027.

---

## Parallel Example: User Story 1 tests

```text
Task: "Update table-column-menu.test.tsx to open via trigger helper"        (T009)
Task: "Update table-row-menu.test.tsx to open via trigger helper"           (T010)
Task: "Update accessibility.test.tsx table-menu test to use trigger helper" (T011)
```

---

## Implementation Strategy

### MVP First (US1)

1. T001 → Phase 2 → US1 tests (fail) → US1 implementation.
2. **Stop and validate**: hover + click opens the right menu, action targets the clicked cell, no Markdown leak, keyboard path works.

### Incremental Delivery

1. US1 → trigger works (second click still works too).
2. US2 → old gesture removed; feature behavior complete.
3. US3 → final shape/pointer/theming polish (can be done alongside US2).
4. Polish → docs, changelog, playground, full verification.

---

## Notes

- [P] = different files, no dependencies.
- Menu contents/actions are untouched; only the way the menu opens changes (FR-005, SC-004).
- No new dependencies and no public API/type changes (contract: `contracts/table-cell-trigger.md`).
- Commit after each task or logical group.

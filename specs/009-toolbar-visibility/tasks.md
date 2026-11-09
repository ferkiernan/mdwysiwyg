---

description: "Task list for Toolbar Visibility Control"
---

# Tasks: Toolbar Visibility Control

**Input**: Design documents from `/specs/009-toolbar-visibility/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/MarkdownEditor.showToolbar.md, quickstart.md

**Tests**: Included (constitution Principles IX, XIV). Write each story's tests first and confirm they fail.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependencies)
- **[Story]**: US1, US2, US3 (maps to spec.md)

## Path Conventions

Single project: `src/components/MarkdownEditor/`, `tests/MarkdownEditor/`.

---

## Phase 1: Setup

- [X] T001 Run `npm run typecheck` and `npm test`; record the green baseline before changes

---

## Phase 2: Foundational

- [X] T002 [P] In `src/components/MarkdownEditor/types.ts` add `showToolbar?: boolean` to `MarkdownEditorProps` with the doc comment from `contracts/MarkdownEditor.showToolbar.md` (default true)
- [X] T003 [P] In `src/components/MarkdownEditor/MarkdownEditor.module.css` add `.toolbarSlot { display: contents; }`

---

## Phase 3: User Story 1 - Hide and show the toolbar from the host app (Priority: P1) 🎯 MVP

**Goal**: `showToolbar` hides/shows the toolbar; default is shown.

**Independent Test**: render with `showToolbar` false → no toolbar; true/omitted → toolbar.

### Tests ⚠️ (write first)

- [X] T004 [US1] Create `tests/MarkdownEditor/toolbar-visibility.test.tsx`: omitted and `true` → `role="toolbar"` present; `false` → absent and no toolbar controls (e.g. no "Ver código Markdown" button, no heading select); with `onlyView` + `false` → reduced bar absent, with `onlyView` + omitted → present; the editor textbox is always present
- [X] T005 [US1] In the same file: with `showToolbar={false}` the component keeps its configured `width`/`height` (root element style) and the content area is still rendered

### Implementation

- [X] T006 [US1] In `src/components/MarkdownEditor/MarkdownEditor.tsx` destructure `showToolbar = true` and render `<Toolbar …/>` only when it is true

**Checkpoint**: US1 works.

---

## Phase 4: User Story 2 - Change visibility in real time without losing work (Priority: P1)

**Goal**: toggling never remounts the editor, loses state, notifies `onChange`, leaves floating UI behind or loses focus.

### Tests ⚠️ (write first)

- [X] T007 [US2] In `tests/MarkdownEditor/toolbar-visibility.test.tsx`: `rerender` toggling `showToolbar` false→true→false: toolbar follows each time; the editor DOM node (`role="textbox"`) is the same element across toggles (no remount); content intact; `onChange` never called by toggling; 20 rapid toggles end in the state of the last value
- [X] T008 [US2] Same file: after typing and an edit, toggle off/on and Ctrl+Z (via `editor` shortcut `fireEvent.keyDown(pm, { key: "z", ctrlKey: true })`) still undoes the edit; the caret position (checked by inserting a marker character after the toggle) is unchanged
- [X] T009 [US2] Same file: in Markdown source view toggling keeps the source view (`Código fuente Markdown` textarea present) and the textarea's `selectionStart`
- [X] T010 [US2] Same file: open the table-size picker (toolbar "Tabla" button), set `showToolbar` false → picker/menu gone, no extra table inserted (`onChange` not called), and `showToolbar` true again shows the toolbar with the picker closed
- [X] T011 [US2] Same file: focus a toolbar button, set `showToolbar` false → `document.activeElement` is the editor textbox
- [X] T012 [US2] Same file: after re-showing, toolbar controls reflect current state (select text, apply bold via shortcut, hide, show → the Bold button reports pressed state, e.g. `aria-pressed="true"`)

### Implementation

- [X] T013 [US2] Create `src/components/MarkdownEditor/views/ToolbarSlot.tsx`: `ToolbarSlot({ children, onFocusLost })` renders `<div className={styles["toolbarSlot"]} ref>`; a `useLayoutEffect` cleanup (empty deps) calls `onFocusLost` when `ref.current` contains `document.activeElement`; callback kept in a ref
- [X] T014 [US2] In `MarkdownEditor.tsx` wrap `<Toolbar/>` in `<ToolbarSlot onFocusLost={() => editor?.commands.focus()}>`

**Checkpoint**: US1 + US2 complete.

---

## Phase 5: User Story 3 - Keep working with the toolbar hidden (Priority: P2)

### Tests ⚠️

- [X] T015 [US3] In `tests/MarkdownEditor/toolbar-visibility.test.tsx`: with `showToolbar={false}`: typing and `Ctrl+B` format text (`<strong>` appears); table cell menu opens via the hover trigger (helper `openTableMenuViaTrigger`); link popover opens on link click; the imperative `ref` (`insertMarkdown`, `setMarkdown`, `reset`, `isModified`) works

(Implementation requires no code beyond US1/US2.)

---

## Phase 6: Polish & Cross-Cutting

- [X] T016 [P] Update `src/components/MarkdownEditor/README.md` props table (new `showToolbar` row) and add a short "Mostrar/ocultar la barra" section with a runtime-toggle example and the note that the view toggle and Export are unavailable while hidden
- [X] T017 [P] Update `llms.txt` and root `README.md` (Modes/props mention) and add an "Unreleased" entry to `CHANGELOG.md`
- [X] T018 [P] In `playground/main.tsx` add a "Mostrar barra" checkbox bound to `showToolbar` on the first editor
- [X] T019 Run `npm run typecheck && npm test && npm run build && npm run verify:dist`; all green
- [X] T020 Manual check per `quickstart.md` in the playground (toggle, layout, focus)

---

## Dependencies & Execution Order

- Setup → Foundational → US1 → US2 → US3 → Polish. US2 builds on US1's conditional render (same file `MarkdownEditor.tsx`, same test file): sequential.
- T002 ∥ T003; T016 ∥ T017 ∥ T018.

## Implementation Strategy

MVP = US1 (T001–T006). Then US2 for real-time safety, US3 as regression coverage, then docs/playground and full verification.

---

description: "Task list for Compare Mode"
---

# Tasks: Compare Mode (original vs. new content)

**Input**: Design documents from `/specs/010-compare-mode/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/MarkdownEditor.compare.md, quickstart.md

**Tests**: Included (constitution Principles IX, XIV). Write each story's tests first and confirm they fail.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependencies)
- **[Story]**: US1â€¦US5 (maps to spec.md)

## Path Conventions

Single project: `src/components/MarkdownEditor/`, `tests/MarkdownEditor/`.

---

## Phase 1: Setup

- [X] T001 Run `npm run typecheck` and `npm test`; record the green baseline (233 tests) before changes

---

## Phase 2: Foundational (blocking)

**Purpose**: public types, the diff engine and the highlight extension that every story uses.

- [X] T002 [P] In `src/components/MarkdownEditor/types.ts` add `EditorMode`, `CompareOrientation`, `CompareDecision` and the props `mode`, `compareOrientation`, `compareContent`, `onCompareDecision` (doc comments per `contracts/MarkdownEditor.compare.md`); export the three types from `src/components/MarkdownEditor/index.ts` (and from `src/index.ts` if it re-exports types)
- [X] T003 [P] Create `tests/MarkdownEditor/diff-sequences.test.ts`: `matchSequences` returns strictly increasing pairs with equal keys, its length equals a brute-force LCS on random arrays, handles empty inputs / identical inputs / full replacement, and honours the edit budget (returns a valid partial matching)
- [X] T004 Create `src/components/MarkdownEditor/compare/diffSequences.ts` with `matchSequences(a, b, maxEdits = 1500): Array<[number, number]>` (prefix/suffix trim + Myers `O(ND)` with backtracking); make T003 pass
- [X] T005 [P] Create `src/components/MarkdownEditor/compare/textDiff.ts`: `diffText(original, current)` tokenizes into words/whitespace, returns `{ ranges: Array<[from, to]>, summary: { changed, count } }` for the words of `current` not matched in `original` (whitespace between two changed words joins the range; whitespace-only differences are not a change)
- [X] T006 Create `src/components/MarkdownEditor/compare/docDiff.ts`: `collectUnits(doc)` (text blocks and leaf blocks with key/context/tokens/containers; empty text blocks skipped) and `diffDocs(originalUnits, doc)` â†’ `{ marks, blocks, summary }` implementing the alignment of research Â§5 (exact Myers match, in-gap greedy pairing by same type + Dice â‰¥ 0.5, 40,000-pair cap, token word diff, line diff for code blocks, whole-container marking, attrs/context-only changes â†’ whole block)
- [X] T007 Create `src/components/MarkdownEditor/compare/compareHighlight.ts`: Tiptap extension `CompareHighlight.configure({ markClass, blockClass })` with a plugin key/state `{ original, decorations, summary }` (recompute on doc change or on meta; `Decoration.inline(..., { nodeName: "mark", class, "data-compare": "changed" })` and `Decoration.node(..., { class, "data-compare": "added" })`), exported `setCompareOriginal(editor, markdown | null)` (parses with `createDocument(markdownToEditorContent(md), editor.schema)`; meta-only transaction, no history, no `onUpdate`) and `getCompareSummary(editor)`

**Checkpoint**: diff engine unit tests green; extension compiles.

---

## Phase 3: User Story 1 - See original and new content together with differences highlighted (Priority: P1) ðŸŽ¯ MVP

**Goal**: compare mode renders two panes (right orientation) with the differences highlighted in the new pane.

**Independent Test**: compare mode with original "A B C" and new "A X C" in each orientation â†’ two panes in the right arrangement, only "X" highlighted.

### Tests âš ï¸ (write first)

- [X] T008 [US1] Create `tests/MarkdownEditor/compare-mode.test.tsx` helpers (`setupCompare`) and tests: both orientations render original/new panes (labelled groups, original read-only textbox, order in DOM and layout class), only changed words are `<mark>`, identical content â†’ no marks, added paragraph / list item / table row / code block highlighted as a whole, removed-only change â†’ no marks in the new pane, formatting-only change (word becomes bold) highlighted
- [X] T009 [US1] In the same file: default mode (omitted or `"default"`) â†’ single textbox, no compare bar, no `mark`; compare without orientation or without `compareContent` behaves as default; the description of the new pane states the number of highlighted differences ("Sin diferencias" / "N diferencias resaltadas")

### Implementation

- [X] T010 [P] [US1] Create `src/components/MarkdownEditor/compare/OriginalPane.tsx`: read-only Tiptap editor (`createEditorExtensions`, `editable: false`, textbox labelled "Texto original (solo lectura)", `aria-readonly`) in rendered view; `MarkdownSourceView readOnly` in Markdown view; recreated when the original Markdown changes
- [X] T011 [P] [US1] In `src/components/MarkdownEditor/views/MarkdownSourceView.tsx` add optional `ariaLabel` (default "CÃ³digo fuente Markdown")
- [X] T012 [P] [US1] In `src/components/MarkdownEditor/MarkdownEditor.module.css` add the wrapper (`.panes { display: contents }`, `.panesCompare`, `.sideToSide`, `.upAndDown`, 50/50 panes, separator border), `.compareMark`, `.compareBlock`, `--mdw-compare-highlight-bg` on `.root`, and a visually-hidden class for the description
- [X] T013 [US1] In `src/components/MarkdownEditor/MarkdownEditor.tsx` add the compare session state machine (research Â§3: derived during render, initial source = `compareContent` when mounted in compare), the load effect (`session.provided` â†’ editor/source, `providedCanonical`), the effect that sends the original to the highlight extension, add `CompareHighlight` to the extensions, render the panes wrapper with `OriginalPane` + the new pane (group role/label/description), and the summary hook (`useEditorState`) feeding the description
- [X] T014 [US1] Make T008â€“T009 pass; run the existing suite to confirm default mode is unchanged

**Checkpoint**: US1 works in the rendered view.

---

## Phase 4: User Story 2 - Edit only the new side and watch the highlights follow (Priority: P1)

**Goal**: only the new pane is editable; highlights follow edits in the rendered and Markdown views.

**Independent Test**: type in the new pane â†’ text changes and highlights update; try to type/format in the original â†’ nothing changes.

### Tests âš ï¸ (write first)

- [X] T015 [US2] Create `tests/MarkdownEditor/compare-editing.test.tsx`: typing in the new pane updates text, `onChange` reports the new pane's Markdown, highlights update (a passage made identical to the original loses its mark); the original textbox is not editable (`contenteditable="false"`), typing/paste do not change it; toolbar bold applies to the new pane; `onlyView` makes both panes read-only
- [X] T016 [US2] In the same file: toggling the view (`Ver cÃ³digo Markdown`) shows two read-only/editable textareas (original read-only), highlighted words appear in the new pane's highlight layer, editing the textarea updates the highlights, and toggling back keeps highlights in the rendered view

### Implementation

- [X] T017 [P] [US2] Create `src/components/MarkdownEditor/compare/HighlightedSource.tsx`: textarea + `aria-hidden` highlight layer (marks from `diffText`), scroll-synced, same metrics; reuses `MarkdownSourceView` classes; forwards the textarea ref and props
- [X] T018 [US2] Wire `HighlightedSource` into `MarkdownEditor.tsx` when compare is active in Markdown view (memoized `diffText(session.original, source)`); summary for the description/enabled state comes from the active view
- [X] T019 [US2] CSS for the highlight layer in `MarkdownEditor.module.css` (`.sourceWrap`, `.sourceLayer`, `scrollbar-gutter: stable`, transparent text, mark background)
- [X] T020 [US2] Make T015â€“T016 pass

**Checkpoint**: US1 + US2 work in both views.

---

## Phase 5: User Story 3 - Accept or reject the change (Priority: P1)

**Goal**: second bar with "Rechazar cambio" / "Aceptar cambio"; decision notifies the host and returns to default mode.

**Independent Test**: click Accept â†’ host notified with the new pane's Markdown and the control shows it in default mode; click Reject â†’ original.

### Tests âš ï¸ (write first)

- [X] T021 [US3] Create `tests/MarkdownEditor/compare-decision.test.tsx`: bar present below the toolbar with both buttons; Accept without edits â†’ `onCompareDecision({decision:"accepted", markdown: new})` once, then single pane / no marks / no bar; Accept after edits â†’ edited Markdown; Reject â†’ `{decision:"rejected", markdown: original}` and the original is shown, manual edits discarded; `onChange` receives the resulting content; both buttons disabled when there are no differences (also when the only difference is a removed paragraph â†’ enabled); after a decision the control stays in default while props still say compare; focus lands in the editor
- [X] T022 [US3] In the same file: `showToolbar={false}` hides the compare bar too (and the panes remain); `onlyView` keeps Accept/Reject and never shows Restaurar

### Implementation

- [X] T023 [P] [US3] Create `src/components/MarkdownEditor/compare/CompareBar.tsx` (`role="toolbar"`, `aria-label="Barra de comparaciÃ³n"`, buttons "Rechazar cambio", "Aceptar cambio", "Restaurar" (only when `modified`), disabled rules, reuses toolbar/button classes)
- [X] T024 [US3] In `MarkdownEditor.tsx` render `CompareBar` inside `ToolbarSlot` under the same `showToolbar` condition, implement `accept` / `reject` (research Â§8), end the session without changing `key`
- [X] T025 [US3] Make T021â€“T022 pass

**Checkpoint**: full review flow works.

---

## Phase 6: User Story 4 - Restore the new content after manual edits (Priority: P2)

**Goal**: "Restaurar" appears only when the new pane differs from `compareContent` and restores it.

### Tests âš ï¸ (write first)

- [X] T026 [US4] In `compare-decision.test.tsx`: hidden initially; appears after an edit; click â†’ new pane equals `compareContent`, highlights match it, button hides, `onChange` receives the restored Markdown, focus returns to the new pane; manual revert to the same content hides it; works in the Markdown view too
- [X] T027 [US4] In the same file: imperative API in compare mode â€” `reset()` behaves like the button (and notifies `onChange`), `isModified()` is true exactly when "Restaurar" is visible, `setMarkdown` makes it modified; in default mode `reset()`/`isModified()` keep their behavior

### Implementation

- [X] T028 [US4] In `MarkdownEditor.tsx` implement `restore` (load `session.provided`, notify, refocus the active pane), `modified` (`source !== provided && source !== providedCanonical`), and the compare-aware `reset()` / `isModified()`
- [X] T029 [US4] Make T026â€“T027 pass

---

## Phase 7: User Story 5 - Change mode, orientation or new content at runtime (Priority: P3)

### Tests âš ï¸ (write first)

- [X] T030 [US5] In `compare-mode.test.tsx` (rerender): flipping orientation keeps the new pane's content including manual edits and does not remount the editor; default â†’ compare makes the current content the original and shows `compareContent`; a different `compareContent` replaces the new pane (edits discarded) while the original is kept; compare â†’ default keeps the new pane's content; accept then same props â†’ stays default, different `compareContent` (or default â†’ compare) starts a new session whose original is the accepted content; no `onChange` is fired by these prop changes

### Implementation

- [X] T031 [US5] Fix whatever T030 reveals in the session logic; ensure the highlight original is re-sent when the editor is re-created (`onlyView` toggled in compare mode)

---

## Phase 8: Polish & cross-cutting

- [X] T032 [P] Accessibility checks in `compare-mode.test.tsx` / `accessibility.test.tsx`: groups labelled, original announced read-only, only one textbox named "Editor de texto enriquecido", bar buttons reachable by Tab with accessible names, `<mark>` semantics
- [X] T033 [P] Update `src/components/MarkdownEditor/README.md` (props table rows `mode`, `compareOrientation`, `compareContent`, `onCompareDecision`; section "Modo comparaciÃ³n" with example, behavior, theming `--mdw-compare-highlight-bg`, known limits), root `README.md` (features table row), `llms.txt`, `CHANGELOG.md` (Unreleased â†’ Added)
- [X] T034 [P] Update `playground/main.tsx`: mode select, orientation select, new-content textarea, decision log (works together with the existing "Mostrar barra" checkbox)
- [X] T035 Run `npm run typecheck`, `npm test`, `npm run build`, `npm run verify:dist`; fix any regression
- [X] T036 Manual check in the playground per `quickstart.md` (both orientations, both views, restore, accept/reject, bar hidden); note results
- [X] T037 Mark all tasks `[X]`, tick `checklists/requirements.md` if anything changed

---

## Dependencies & Execution Order

- Phase 1 â†’ Phase 2 (T002, T003, T005 parallel; T004 after T003; T006 after T004/T005; T007 after T006).
- US1 depends on Phase 2; US2 depends on US1 (pane + session); US3 depends on US1; US4 depends on US3 (bar) ; US5 depends on US1.
- Within each story: tests first (fail), then implementation.
- `MarkdownEditor.tsx` tasks (T013, T018, T024, T028) are sequential (same file).

## Implementation Strategy

MVP = Phases 1â€“3 (US1). Then US2 and US3 (all P1), then US4, US5, polish. Stop and validate after each checkpoint.

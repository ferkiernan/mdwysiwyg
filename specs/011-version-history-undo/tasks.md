---

description: "Task list for Version History with Undo / Redo"
---

# Tasks: Version History with Undo / Redo

**Input**: Design documents from `/specs/011-version-history-undo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/MarkdownEditor.history.md, quickstart.md

**Tests**: Included (constitution Principles IX, XIV). Write each story's tests first and confirm they fail. Timing tests use `vi.useFakeTimers()`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependencies)
- **[Story]**: US1...US5 (maps to spec.md)

## Path Conventions

Single project: `src/components/MarkdownEditor/`, `tests/MarkdownEditor/`.

---

## Phase 1: Setup

- [X] T001 Run `npm run typecheck` and `npm test`; record the green baseline (297 tests) before changes

---

## Phase 2: Foundational (blocking)

**Purpose**: public prop, pure history logic, hook and icon that every story uses.

- [X] T002 [P] In `src/components/MarkdownEditor/types.ts` add `historyUndo?: boolean` with its doc comment (default `false`, per `contracts/MarkdownEditor.history.md`); no new exported types
- [X] T003 [P] Create `tests/MarkdownEditor/version-history.test.ts` (pure unit tests of the reducer): `record` appends, ignores a value equal to the latest, drops the oldest beyond `MAX_VERSIONS` (200); `open` records the pending content then sets `viewed` to the last index and `entry`; `undo`/`redo` clamp at both ends; `close` clears `viewed`/`entry`; `confirm` closes and appends the viewed content only when it differs from the latest (older version becomes newest, newer ones kept); `reset` empties
- [X] T004 Create `src/components/MarkdownEditor/history/versionHistory.ts`: `Version { markdown; savedAt }`, `HistoryState`, `MAX_VERSIONS = 200`, `INACTIVITY_MS = 3000`, `historyReducer(state, action)` with the actions of data-model.md (all take explicit `now`); make T003 pass
- [X] T005 Create `src/components/MarkdownEditor/history/useVersionHistory.ts`: wraps the reducer; takes `{ recording, source }`; stores the baseline immediately when `recording` and there are no versions; effect on `[recording, source]` debounces a 3 s timer that dispatches `record` when `source` differs from the latest version and cancels it on every change, on `recording` false and on unmount; returns `{ state, dispatch }` (open/undo/redo/close/confirm/reset helpers); no timers at all when `recording` is false
- [X] T006 [P] In `src/components/MarkdownEditor/Toolbar/buttons/icons.tsx` add `IconHistory` (clock with a counter-clockwise arrow, same `base` props and stroke style as the other icons)
- [X] T007 [P] In `tests/MarkdownEditor/helpers.tsx` add `setupHistory(props?)` (render with `historyUndo`, fake timers helper `advanceIdle()` = 3000 ms inside `act`, `openHistory()` clicking the "Historial de versiones" button, `typeInEditor(text)` that types in the rendered view) and `formatTime(ms)` matching the list's `toLocaleTimeString` options

**Checkpoint**: reducer unit tests green; hook and icon compile.

---

## Phase 3: User Story 1 - Versions are saved automatically while editing (Priority: P1) MVP

**Goal**: with `historyUndo` on, one version per pause of 3 s, deduplicated; nothing happens when off.

**Independent Test**: type, wait 3 s, type, wait 3 s, open history (once US2 exists) / inspect via the list → 3 versions; a continuous burst yields one.

### Tests (write first)

- [X] T008 [US1] Create `tests/MarkdownEditor/history-recording.test.tsx`: the baseline version exists immediately; a change followed by 3 s creates exactly one new version with the current time; changes with gaps < 3 s create one version after the final pause; returning to the latest content before the timer fires creates none; edits in the Markdown view are recorded too; more than 200 changes keep only 200 versions. Versions are observed through a small test harness component that renders `useVersionHistory` and prints `versions.length` and the last entry (editor-level checks through the list are added in US2/US3 tests)
- [X] T009 [US1] In the same file: `historyUndo` false/omitted -> no icon, no list, `vi.getTimerCount()` stays 0 after edits (FR-016); turning the prop true later starts recording from the current content; turning it false discards versions (reopening after re-enabling shows one version)

### Implementation

- [X] T010 [US1] In `src/components/MarkdownEditor/MarkdownEditor.tsx` accept `historyUndo = false`; derive `historyAvailable = historyUndo && !onlyView && session === null`; call `useVersionHistory({ recording: historyAvailable && state.viewed === null, source })`; reset the hook when `historyUndo` turns false

**Checkpoint**: US1 tests green; default behavior unchanged.

---

## Phase 4: User Story 2 - Open history mode from a new icon (Priority: P1)

**Goal**: icon right after the HTML button (opt-in, default mode only); click opens history mode (bar under the toolbar, list on the right); click again closes.

**Independent Test**: with `historyUndo` the "Historial de versiones" button follows the HTML button; clicking it shows the bar and the list; without the prop / in `onlyView` / in compare it is absent.

### Tests (write first)

- [X] T011 [US2] Create `tests/MarkdownEditor/history-mode.test.tsx` (part 1): icon follows the "Insertar HTML" button of the "Barra de herramientas" toolbar and has `aria-pressed`; absent with `historyUndo` false, `onlyView`, compare mode and `showToolbar=false`; click opens the "Barra de historial" toolbar with "Undo", "Redo", "Confirm", "Cancel (back to last version)" and a "Historial de versiones" navigation list; second click closes with nothing applied; a change made < 3 s before opening is saved as a version first (list shows it)

### Implementation

- [X] T012 [P] [US2] Create `src/components/MarkdownEditor/history/HistoryBar.tsx`: `role="toolbar"` `aria-label="Barra de historial"`, buttons "Undo" (with left arrow), "Redo" (with right arrow), separator, "Confirm", "Cancel (back to last version)"; Undo/Redo use `aria-disabled` + click guard (research §7), reuse the `toolbar`/`button`/`textButton` classes (same `.filter(Boolean)` pattern as `CompareBar`)
- [X] T013 [P] [US2] Create `src/components/MarkdownEditor/history/VersionList.tsx`: `<nav aria-label="Historial de versiones"><ol>` newest first, each item a `<time dateTime>` with local `HH:MM:SS`, `aria-current="true"` plus a non-colour marker on the viewed one, scrolls the viewed item into view with `scrollIntoView?.({ block: "nearest" })`, own vertical scroll
- [X] T014 [US2] In `src/components/MarkdownEditor/Toolbar/Toolbar.tsx` add props `historyEnabled`, `historyOpen`, `onToggleHistory`, `locked`; render the `IconHistory` `ToolbarButton` (label "Historial de versiones", `pressed={historyOpen}`) after `ExportMenu` inside the end `spacer` div, never in the `onlyView` bar; `canFormat` also requires `!locked`
- [X] T015 [US2] In `src/components/MarkdownEditor/MarkdownEditor.module.css` add `.historyLayout` (`display: contents`; `.historyOpen` variant `flex: 1; min-height: 0; display: flex; flex-direction: row`), `.versionList` (fixed width ~160px, own scroll, border-right, toolbar-like palette via existing variables), item/current marker styles, `[aria-disabled="true"]` style for bar buttons, scrollbar colours from `--mdw-scrollbar-*`
- [X] T016 [US2] In `MarkdownEditor.tsx` compute `historyOpen = state.viewed !== null && historyAvailable && showToolbar`; wrap the panes in `<div className=historyLayout ...>`; render `VersionList` before the panes and `HistoryBar` in a `ToolbarSlot` (focus returns via `focusNewPane`) when open; icon handler opens (dispatch `open` with the current `source`) or closes; pass the new props to `Toolbar`

**Checkpoint**: US2 tests green; closed layout is DOM-identical for consumers (wrapper is `display: contents`).

---

## Phase 5: User Story 3 - Undo and redo through versions with their times (Priority: P1)

**Goal**: Undo/Redo move through versions; document shows the viewed version read-only; list highlights it; shortcuts work.

**Independent Test**: with four versions, Undo twice shows version 2 highlighted with its time; Redo once shows version 3; typing does nothing.

### Tests (write first)

- [X] T017 [US3] In `history-mode.test.tsx` (part 2): opening highlights the latest and Redo is `aria-disabled`; Undo shows the previous version's content and moves `aria-current`; Redo returns; Undo is `aria-disabled` on the first version and keeps keyboard focus there; list items show `formatTime(savedAt)`; `onChange` is never called while browsing; the live region reads "Versión n de m"
- [X] T018 [US3] Same file: while open, typing in the rendered view, typing in the Markdown textarea, toolbar formatting/lists/insert controls (disabled) and the table-cell trigger change nothing and fire no `onChange`; the link popover offers no edit; the view toggle still works and the viewed version shows in both views; Ctrl/Cmd+Z = Undo, Ctrl/Cmd+Shift+Z and Ctrl+Y = Redo while open (including with focus on the textarea), and outside history mode Ctrl+Z still edits text as before

### Implementation

- [X] T019 [US3] In `MarkdownEditor.tsx` add `undoVersion`/`redoVersion` handlers: dispatch the move and `loadContent(versions[next].markdown)` (`emitUpdate: false`, no `onChange`); add the polite live region (visually hidden) and a label/`aria-readonly` on the content group while open
- [X] T020 [US3] In `MarkdownEditor.tsx` make the document read-only while `historyOpen`: `editor.setEditable(false, false)` / restore in the open/close handlers (before the slot's focus callback) and in an effect for forced closes; `readOnly` on `HighlightedSource` (`onlyView || historyOpen`); `tableTriggerEnabled` requires `!historyOpen`; `LinkPopover` gets `onlyView={onlyView || historyOpen}`; pass `locked={historyOpen}` to `Toolbar`
- [X] T021 [US3] In `MarkdownEditor.tsx` add `onKeyDownCapture` on the root (active only when `historyOpen`): Ctrl/Cmd+Z -> Undo, Ctrl/Cmd+Shift+Z or Ctrl+Y -> Redo, with `preventDefault()` + `stopPropagation()`

**Checkpoint**: US3 tests green.

---

## Phase 6: User Story 4 - Confirm a version or go back to the default state (Priority: P1)

**Goal**: Confirm keeps the viewed version; Cancel (back to last version) restores the content at entry; forced closes restore without applying.

**Independent Test**: Undo twice + Confirm -> older content kept, `onChange` once, history closes; Undo twice + Cancel (back to last version) -> pre-history content, no `onChange`.

### Tests (write first)

- [X] T022 [US4] Create `tests/MarkdownEditor/history-decision.test.tsx`: Confirm on an older version -> content kept, `onChange` called once with that Markdown, bar and list gone, editing enabled and focus back in the document, reopening shows the confirmed content as the newest entry with the newer versions still listed; Confirm on the latest version -> no `onChange`, no new version; Cancel (back to last version) -> content equals the pre-history content byte for byte, `onChange` not called, closes; the icon click while open behaves like Cancel (back to last version)
- [X] T023 [US4] Same file, forced closes restore the pre-history content without `onChange` and keep/discard versions as specified: `historyUndo` -> false (versions discarded), `onlyView` -> true (editor recreated, content restored), compare mode starts (the compare original is the pre-history content), `showToolbar` -> false (and back to true: closed); imperative `setMarkdown`, `insertMarkdown` and `reset` while open close history first and then apply normally; `isModified()` while open compares the entry content

### Implementation

- [X] T024 [US4] In `MarkdownEditor.tsx` add `confirmVersion` (viewed content stays; `onChange` once if different from `entry`; `confirm` dispatch appends to the history; restore editable; `focusNewPane`) and `backToDefault`/`closeWithoutApplying` (`loadContent(entry)`, dispatch `close`, restore editable, no `onChange`)
- [X] T025 [US4] In `MarkdownEditor.tsx` add the forced-close layout effect (declared before the compare layout effects): when state is open but `historyOpen` is false, run `closeWithoutApplying()`; recompute it when the editor is recreated; make `nextCompareState` use `entry` as the current content while history mode is open; call `closeWithoutApplying()` at the start of `reset`, `setMarkdown` and `insertMarkdown`; make `isModified()` use `entry` while open

**Checkpoint**: US4 tests green; compare/009 suites unchanged.

---

## Phase 7: User Story 5 - Browse and jump through the version list on the right (Priority: P1)

**Goal**: long lists scroll independently and keep the viewed entry visible; new versions appear on reopening.

**Independent Test**: with many versions Undo repeatedly -> highlighted entry always visible.

### Tests (write first)

- [X] T026 [US5] In `history-mode.test.tsx` (part 3): with 30 versions `scrollIntoView` (mocked on `Element.prototype`) is called for the viewed item after every Undo/Redo and the list element is its own scroll container; a version saved while closed appears the next time history opens; order is newest first with same-second versions both listed

### Implementation

- [X] T027 [US5] Adjust `VersionList.tsx` / CSS if T026 shows gaps (viewed item effect keyed on `viewed`, `overflow-y: auto`, `min-height: 0` on the list)

**Checkpoint**: US5 tests green.

---

## Phase 8: Polish & Cross-Cutting

- [X] T028 [P] Update `src/components/MarkdownEditor/README.md`: `historyUndo` row in the props table and a "Historial de versiones" section (purpose, behavior, shortcuts, limits 3 s / 200 versions, not persisted, forced closes, a11y notes, examples)
- [X] T029 [P] Update root `README.md` (feature table row), `llms.txt` (bullet) and `CHANGELOG.md` (Unreleased > Added)
- [X] T030 [P] Update `playground/main.tsx`: `historyUndo` checkbox in the controls, wired to the existing demo editor
- [X] T031 Run `npm run typecheck`, `npm test` (all suites incl. the pre-existing ones unchanged), `npm run build` and `npm run verify:dist`; fix failures
- [X] T032 Manual validation per `quickstart.md` in the playground (all 7 steps), including a dark/focus check of the new bar and list; note any deviation

---

## Phase 9: Amendment 2026-11-09 (icon position, right-hand list, new label, click-to-jump)

- [X] T033 [US2] `Toolbar.tsx`: render the history `ToolbarButton` immediately after the "Insertar HTML" button, before the end `spacer` that holds only Export; update the icon-position test in `history-mode.test.tsx`
- [X] T034 [US2] `MarkdownEditor.tsx` / `MarkdownEditor.module.css`: render `VersionList` after the panes (right side) with `border-left`; update the layout-order test
- [X] T035 [US4] `HistoryBar.tsx`: rename the button to "Cancel (back to last version)"; update tests, docs and comments
- [X] T036 [US5] Add the `select` action to `versionHistory.ts` (+ unit test); make `VersionList` entries buttons with `aria-current`, `selectVersion` in `MarkdownEditor.tsx`, button styles in the CSS; tests for click/keyboard jump, no-op on the viewed entry, Undo/Redo from the jumped position, Confirm/Cancel after a jump
- [X] T037 Update README, component README, llms.txt, CHANGELOG, types doc comment and the 011 plan/research/data-model/contract/quickstart

## Dependencies & Execution Order

- Phase 1 -> Phase 2 -> user stories -> Phase 8.
- Phase 2: T003 before T004; T004 before T005; T002, T006, T007 independent of each other.
- US1 (T008-T010) needs T004/T005. US2 needs US1's wiring (T010) and T006. US3 needs US2 (open/close, list, bar). US4 needs US3 (read-only + loading content). US5 needs US2's list.
- `MarkdownEditor.tsx` and `Toolbar.tsx` are edited by several tasks: those tasks run sequentially (no [P]).

### Parallel opportunities

- Phase 2: T002, T003, T006, T007.
- US2: T012 and T013 (different files) before T014-T016.
- Polish: T028, T029, T030.

## Implementation Strategy

- **MVP**: Phases 1-4 give recording and the opening of the empty-feeling history mode; the first genuinely useful increment is US1-US3 (Phase 5) because Undo/Redo is the core value; US4 completes the loop (Confirm/Back) and should ship with it.
- Deliver incrementally: Foundational -> US1 -> US2 -> US3 -> US4 -> US5 -> Polish, running the full suite after each story.

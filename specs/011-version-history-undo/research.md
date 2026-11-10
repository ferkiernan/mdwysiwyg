# Research: Version History with Undo / Redo

No `NEEDS CLARIFICATION` items remained after `/speckit-clarify`; these are design decisions.

## 1. Public API shape

**Decision**: one flat, optional boolean prop `historyUndo?: boolean` (default `false`). No new callbacks, no exposed
history.

**Rationale**: the user asked for a true/false switch ("history-undo"); camelCase matches `onlyView` / `showToolbar`.
Everything else (3 s, cap, labels) is fixed to avoid speculative configuration (principle XV). The host already learns
about content through `onChange`, which Confirm calls exactly like any edit.

**Alternatives**: `history={{ enabled, delay, max }}` (speculative, new object identity each render); kebab-case
`history-undo` (not a valid React prop name); `onHistoryChange` callback (no use case yet).

## 2. What "a change" is, and where versions are recorded

**Decision**: observe the editor's existing `source` state (the Markdown string already maintained for both views,
updated by typing in either view, `setMarkdown`, `insertMarkdown`, `reset` and Tiptap's native undo). A hook effect keyed
on `[recording, paused, source]` schedules a 3 s timer when `source` differs from the latest version and cancels the
previous timer on every new change (debounce). When the timer fires it appends `{ markdown: source, savedAt }`.

**Rationale**: no new subscription to Tiptap; works identically in the rendered and Markdown views; dedupe is a plain
string comparison (FR-003); a burst of changes yields one version (FR-002/SC-001).

**Baseline**: when recording starts (mount with `historyUndo` true, or the prop turns true) and there are no versions,
the current `source` is stored immediately as version 1 (FR-003, US1-1).

**Alternatives**: Tiptap transaction listener (misses the Markdown view, needs serialization per keystroke); ProseMirror
history plugin state (its stack is per-keystroke grouped, not time-based, and cannot be navigated with timestamps).

## 3. Lifecycle of recording

`recording = historyUndo && !onlyView && session === null` (no compare session), and recording is also suspended while
history mode is open.

- `historyUndo` → false: versions are discarded (history starts over when re-enabled — spec edge case/US2-7).
- Suspended by `onlyView`, a compare session or history mode: the timer is cancelled and versions are **kept**; when
  recording resumes, a `source` that differs from the latest version simply schedules a new version after 3 s.
- Unmount: everything is discarded (not persisted).
- Cap: `MAX_VERSIONS = 200`; appending drops the oldest (FR-005, SC-008).

## 4. History mode state machine (pure reducer)

State: `{ versions: Version[]; viewed: number | null; entry: string | null }` — `viewed === null` means history mode is
closed; `entry` is the Markdown at the moment history mode opened.

Actions (all take explicit `now`, so the reducer is pure and unit-testable):
- `record(markdown, now)`: append unless equal to the latest; enforce the cap.
- `open(markdown, now)`: first `record`, then `viewed = last`, `entry = markdown` (flushes a pending change — FR-008).
- `undo` / `redo`: `viewed ± 1` clamped (FR-011).
- `close(appendMarkdown?, now)`: `viewed = null`, `entry = null`; when `appendMarkdown` is given (Confirm) it is
  appended through `record` so a confirmed older version becomes the newest while newer ones are kept (clarification Q2,
  FR-013).

The component, not the reducer, loads content into the editor (side effect): handlers read the next index and call
`loadContent(versions[next].markdown)`, which is the existing `emitUpdate: false` path used by compare mode.

## 5. Read-only while browsing

**Decision**: `editor.setEditable(false, false)` (second argument `false` is essential: Tiptap's default emits `update`,
which would fire `onChange`) and `readOnly` on the textarea in the Markdown view. Because ProseMirror commands still
dispatch on a non-editable editor, the toolbar receives `locked` and disables every editing control (headings,
formatting, lists, insert dialogs, indent) while keeping the view toggle, the history icon and Export; the table-cell
trigger is disabled and the link popover runs in its view-only variant (`onlyView={onlyView || historyOpen}`).

**Rationale**: FR-012/SC-003 require that nothing can modify the document; this closes every path (typing, toolbar,
table menu, link popover) without recreating the editor (recreating would lose focus/state).

**Alternatives**: recreate the editor with `editable: false` (heavy, loses caret); overlay that swallows pointer events
(does not stop keyboard or toolbar).

## 6. Keyboard shortcuts

**Decision** (clarification Q3): a **capture-phase** `onKeyDownCapture` on the root element, active only while history
mode is open: `Ctrl/Cmd+Z` → Undo; `Ctrl/Cmd+Shift+Z` or `Ctrl+Y` → Redo; each calls `preventDefault()` and
`stopPropagation()`.

**Rationale**: capture on the root runs before ProseMirror's own keymap (which would run Tiptap's text-level undo) and
before the textarea's native undo, whichever element holds focus (editor, textarea, bar button). Outside history mode the
handler is a no-op, so normal editing shortcuts are untouched.

## 7. Undo/Redo buttons keep focus at the limits

**Decision**: use `aria-disabled="true"` plus a guard in the click handler instead of the native `disabled` attribute on
Undo/Redo.

**Rationale**: with native `disabled`, a focused button that reaches the first/last version loses focus (focus falls to
`<body>`), breaking repeated keyboard use. `aria-disabled` keeps focus and is still announced as unavailable; styling
hooks on `[aria-disabled="true"]`. Confirm and Cancel (back to last version) are always enabled.

## 8. Layout

**Decision**: a wrapper `.historyLayout` around the existing `.panes` element. When closed it is `display: contents`
(no box, default layout identical); when open it is a `flex: 1; min-height: 0; display: flex; flex-direction: row`
container: `.panes` (`display: contents`, so `.content` becomes the flex item) followed by `VersionList` (fixed width, own
scroll, right). The `HistoryBar` is a second `role="toolbar"` rendered under the main toolbar, wrapped in the existing
`ToolbarSlot` so focus returns to the document when it unmounts (Confirm/Back).

**Rationale**: no change to the compare layout (history and compare are mutually exclusive); the editor DOM is never
moved or remounted.

## 9. Closing without applying (forced closes)

Triggers: `historyUndo` → false, `onlyView` → true, compare session starts, `showToolbar` → false, imperative
`setMarkdown` / `insertMarkdown` / `reset` (spec edge cases, FR-017).

**Decision**: a layout effect declared **before** the compare layout effects computes
`historyOpen = state.viewed !== null && historyUndo && !onlyView && session === null && showToolbar` and, when history
mode is open in state but the condition no longer holds, calls `loadContent(entry)` and dispatches `close`. The compare
session derivation uses `entry` instead of the viewed `source` as the original when history mode was open (so the
original is the pre-history content). Declaring the history effect first guarantees the restore runs before the compare
layout effect loads `provided`. Imperative methods call the same `closeWithoutApplying()` first.

When the editor is recreated by an `onlyView` change, the new editor is created from `sourceRef` (the viewed content);
the effect keyed on `[forcedClose, editor]` then reloads `entry` into it.

## 10. Time display

`new Date(savedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })` inside a
`<time dateTime=…>` element (local time with seconds, spec Assumptions). Two versions within the same second are both
listed; order is creation order.

## 11. Accessibility notes

- History icon: `ToolbarButton` with `label="Historial de versiones"`, `aria-pressed` = history open.
- Bar: `role="toolbar"`, `aria-label="Barra de historial"`.
- List: `<nav aria-label="Historial de versiones"><ol>`; each entry is a `<button>` (pointer, Enter, Space) that
  dispatches `select`; the viewed button has `aria-current="true"` and a visible
  non-colour marker (bold + "●"/left border) so it is not colour-only (FR-019); the viewed item is scrolled into view
  (`scrollIntoView?.({ block: "nearest" })`, guarded because jsdom lacks it).
- A visually-hidden `aria-live="polite"` region announces "Versión n de m — hh:mm:ss" on every move.
- The content group gets `aria-readonly="true"`/label "Historial: contenido en solo lectura" while open.
- Closing returns focus to the document (existing `ToolbarSlot` mechanism); the editor is made editable again **before**
  the slot's focus callback runs (imperatively in the close handler, not in a later effect).

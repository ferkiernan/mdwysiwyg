# Data Model: Version History

All state is in memory inside `MarkdownEditor`; nothing is persisted or exposed to the host.

## Version

| Field | Type | Notes |
|---|---|---|
| `markdown` | `string` | Whole-document snapshot (the editor's `source` at save time) |
| `savedAt` | `number` | `Date.now()` when saved (epoch ms); shown as local `HH:MM:SS` |

Identity is its position in `versions` (creation order, oldest first). Two versions never have equal `markdown` back to
back (dedupe against the latest).

## HistoryState

| Field | Type | Notes |
|---|---|---|
| `versions` | `Version[]` | Length ≤ `MAX_VERSIONS` (200); oldest dropped first |
| `viewed` | `number \| null` | Index being shown; `null` ⇒ history mode closed |
| `entry` | `string \| null` | Markdown at the moment history mode opened; `null` when closed |

### Invariants

- `viewed !== null` ⇒ `entry !== null` and `0 ≤ viewed < versions.length`.
- `versions` is empty only before the first baseline is recorded or after `historyUndo` is turned off.
- While `viewed !== null` no `record` happens from the timer (recording is suspended).

### Transitions

| Action | Effect |
|---|---|
| `record(md, now)` | if `md` ≠ latest: append `{md, now}`; if length > cap: drop oldest |
| `open(md, now)` | `record(md, now)`; `viewed = versions.length - 1`; `entry = md` |
| `undo` | `viewed = max(0, viewed - 1)` (no-op at 0) |
| `select(i)` | `viewed = i` when open and `0 ≤ i < length` and `i ≠ viewed` (list click; no-op otherwise) |
| `redo` | `viewed = min(last, viewed + 1)` (no-op at last) |
| `close()` | `viewed = null`, `entry = null` (Cancel (back to last version) / forced close; the component reloads `entry`) |
| `confirm(now)` | `md = versions[viewed].markdown`; `close()`; `record(md, now)` (appends only if ≠ latest) |
| `reset()` | `versions = []`, closed (when `historyUndo` turns false) |

## Derived values (in the component)

| Value | Definition |
|---|---|
| `recording` | `historyUndo && !onlyView && session === null && viewed === null` |
| `historyAvailable` | `historyUndo && !onlyView && session === null` |
| `historyOpen` | `viewed !== null && historyAvailable && showToolbar` |
| `canUndo` / `canRedo` | `viewed > 0` / `viewed < versions.length - 1` |
| `changedOnConfirm` | `versions[viewed].markdown !== entry` (decides whether `onChange` fires) |

## Relationship with existing state

- `source` (existing) is the single source of truth for content; browsing writes it through `loadContent`
  (`emitUpdate: false`), never through the editor's `onUpdate`.
- Tiptap's native undo stack is untouched and independent (spec Assumptions).
- `originalContentRef` / `isModified()` / `reset()` keep their meaning; while history mode is open `isModified()` compares
  `entry` with the original, and `reset()` closes history mode first.

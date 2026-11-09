# Data Model: Table Cell Menu Trigger

No persisted data and no document-schema change. Only transient UI state.

## HoveredCell

- **What**: the `th`/`td` DOM element currently under the pointer inside the editor content.
- **Type**: `HTMLElement | null`, component state in `MarkdownEditor`.
- **Set**: `mouseover` on a `th`/`td` that is inside `.ProseMirror`.
- **Cleared**: pointer leaves the cell to anything other than the trigger button; pointer leaves the
  content area; cell no longer `isConnected`; view switches to Markdown; `onlyView` is true.

## TableMenuState (existing, unchanged shape)

- **Fields**: `kind: "column" | "row"`, `anchor: HTMLElement` (the cell).
- **Derivation**: `kind = anchor.tagName === "TH" ? "column" : "row"`.
- **Change**: now set by trigger click or the keyboard shortcut instead of a second click.

## TriggerPlacement (derived, not stored)

- **Inputs**: displayed cell (`tableMenu?.anchor ?? hoveredCell`), `.content` rect and scroll offsets.
- **Output**: `{ top, left }` in `.content` coordinates; `kind` for the accessible label.
- **Size**: from CSS (`--mdw-table-menu-trigger-size`), not computed in JS.

## Removed state

- `lastFocusedCellPosRef` (`number | null`) — the "previously focused cell" used by the second-click
  gesture. Deleted.

## State transitions

```text
idle ──mouseover(cell)──▶ hovered(cell) ──click trigger──▶ menuOpen(cell)
  ▲                          │  ▲                              │
  └──mouseout(non-trigger)───┘  └──mouseover(other cell)       │
  ▲                                                            │
  └──────────── Escape / outside pointerdown / action ─────────┘
keyboard:  caret in cell + (ContextMenu | Shift+F10) ──▶ menuOpen(cell)
```

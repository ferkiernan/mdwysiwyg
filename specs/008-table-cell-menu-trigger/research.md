# Research: Table Cell Menu Trigger

No `NEEDS CLARIFICATION` items remained in the spec; the items below are design decisions.

## 1. How to render the triangle

**Decision**: One React-managed `<button>` overlay inside `.content` (the editor's scroll
container), absolutely positioned over the hovered cell's top-right corner.

**Rationale**:
- Lives outside ProseMirror's DOM → cannot be serialized, copied or mutated by the editor (FR-013) and
  ProseMirror's MutationObserver never sees it.
- A real button gives free keyboard focus, `aria-*`, and role-based tests in jsdom (Principles VI, IX).
- Single element regardless of table size.
- Scrolls with content for free: absolute child of a `position: relative` scroll container, with
  coordinates computed as `cellRect − contentRect + scrollTop/Left`.

**Alternatives considered**:
- *CSS `::after` on `th`/`td` + coordinate hit-test in the click handler*: no extra DOM, but the click
  target is the cell, so corner hit-testing relies on `getBoundingClientRect` (all zeros in jsdom →
  hard to test), `cursor: pointer` on a pseudo-element is inconsistent, and there is no focusable
  control for keyboard users.
- *ProseMirror widget decoration per cell*: lives inside the editable DOM, one node per cell,
  needs `contenteditable=false` handling and could affect caret/selection near the cell edge.
- *React portal into the cell element*: injecting foreign nodes into a ProseMirror-managed node
  risks the view re-rendering/removing them.

## 2. Hover tracking

**Decision**: Delegated `onMouseOver` / `onMouseLeave` on the `.content` wrapper. On `mouseover`,
`event.target.closest("th, td")` (must be inside `.ProseMirror`) sets `hoveredCell`. On `mouseout`
leaving the cell, keep the state if `relatedTarget` is the trigger button; clear otherwise. State is
also cleared when the cell is no longer connected (e.g. after "Eliminar fila").

**Rationale**: Trigger is a sibling (not a child) of the cell, so moving the pointer from cell to
trigger fires `mouseout` on the cell; the `relatedTarget` check avoids flicker without timers.

**Alternatives considered**: `pointermove` + rect math (more code, no testability); timers/grace delay
(non-deterministic).

**Visibility rule**: `displayedCell = tableMenu?.anchor ?? hoveredCell`. Keeps the triangle while its
menu is open (FR-009).

## 3. Size and affordance

**Decision**: Triangle = `clip-path: polygon(0 0, 100% 0, 100% 100%)` on a square button; side
`var(--mdw-table-menu-trigger-size, 0.7em)`. Pointer: `cursor: pointer` (CSS "link" pointer, FR-003).
Colour: `var(--mdw-table-menu-trigger-color)`, whose default is `var(--mdw-scrollbar-thumb)`
(`#c1c1c1`), so the triangle follows the same colour tokens as the scrollbar and every theme that
already recolours the scrollbar recolours the triangle with no extra work. Trade-off: the default grey
is light (≈ 1.7:1 against the white header/body backgrounds, below the 3:1 WCAG 1.4.11 guideline for
UI components); hosts can override `--mdw-table-menu-trigger-color` independently.

**Rationale**: The editor font is 14px. Measured in the playground (Segoe UI 14px) the text line/caret
box is 19.4px tall, so `0.6em` (8.4px) gave only 43%; `0.7em` (9.8px) gives ≈ 50% there and ≈ 58% on
fonts with a 1.2 × content area, inside SC-005's 40–60%. It scales if the host changes font size.
`clip-path` also clips hit-testing, so only the triangle itself is clickable, as requested. Both
properties follow Principle VII (theming via custom properties) and are documented as public theming
hooks.

**Accessibility note**: The target is intentionally tiny (user requirement). WCAG 2.2 SC 2.5.8 allows
this when an equivalent control exists; the keyboard path (§5) is that equivalent.

## 4. Opening the menu and targeting the correct cell

**Decision**: On trigger click: resolve the cell position with `view.posAtDOM(cellEl, 0)`, dispatch
`TextSelection.near(doc.resolve(cellPos + 1))` (same as today's second-click code), then
`setTableMenu({ kind: cellEl.tagName === "TH" ? "column" : "row", anchor: cellEl })`. Menu rendering,
labels, actions and `runTableAction` are unchanged (FR-005, FR-006). The button does not need prior
cell focus (FR-007).

**Notes**:
- `TableContextMenu` closes on any outside `pointerdown`; clicking the trigger while its own menu is
  open therefore closes then re-opens it. Acceptable; not worth special-casing.
- Menu anchor stays the cell (menu appears under the cell, as today).

## 5. Keyboard access (FR-011)

**Decision**: `ContextMenu` key or `Shift+F10`, with the caret inside a cell, opens that cell's menu
(`keydown` on the content wrapper; cell found from the ProseMirror selection via `view.domAtPos`).
Existing menu
focus handling (`FloatingPanel autoFocus`, Escape to close) is reused.

**Rationale**: These are the standard OS "open context menu" keys; no new UI, no new props.
Tab cannot be used: the table extension already uses it to move between cells.

**Alternatives considered**: always-focusable trigger in the tab order (conflicts with Tab-to-next-cell
and with caret-first editing flow).

## 6. Touch

**Decision**: No dedicated code. Browsers fire compatibility mouse events on tap (`mouseover` before
`click`), so tapping a cell sets `hoveredCell`, the triangle appears, and a second tap opens the menu.
Verify manually (listed in quickstart). If a target browser does not emit them, add a
`pointerType === "touch"` → "show on active cell" rule as a follow-up.

## 7. Removing the old gesture — side effects

- Delete `lastFocusedCellPosRef` and the table branch of the `click` handler in
  `MarkdownEditor.tsx` (including the "non-empty selection" guard, now irrelevant).
- That branch used to `return false` early for any click inside a cell, so **links inside table cells
  never opened the link popover**. With the branch gone, link handling runs for cell clicks too. This is
  consistent with the rest of the editor; call it out in the CHANGELOG.
- Update tests that open the menu with two clicks (`table-column-menu`, `table-row-menu`,
  `accessibility`) and the README "Tablas" section.

## 8. Layout risks to verify during implementation

- **Resolved**: Tiptap's table does render a `div.tableWrapper` around the `<table>` (also with
  `resizable: false`), but this package's CSS gives it no `overflow`, so it never scrolls on its own;
  `.content` remains the only scroll container and the trigger coordinates are correct.
- Re-measure the trigger when the Markdown source changes (typing can widen a cell), on window
  `resize` and when the hovered cell changes. No `ResizeObserver` (jsdom lacks it; not needed so far).
- Dark theme: default colour must stay distinguishable on both `--mdw-table-header-bg` and the body
  background (FR-012).

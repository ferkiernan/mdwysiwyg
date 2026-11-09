# Research: Toolbar Visibility Control

No `NEEDS CLARIFICATION` items remained; these are design decisions.

## 1. Prop name and shape

**Decision**: `showToolbar?: boolean`, default `true`.

**Rationale**: matches the existing optional boolean props (`onlyView`, `resizable`); positive naming with a `true`
default means omitted = current behavior (FR-002). Spanish docs describe it as "mostrar/ocultar la barra".

**Alternatives**: `hideToolbar` (negative default), `toolbar: "shown" | "hidden"` (string union is overkill for two
states).

## 2. Hiding mechanism

**Decision**: conditional rendering (un-mount) of `<Toolbar>`.

**Rationale**:
- FR-008: dropdown/dialog state (`openDialog`, `anchor`) is local to `Toolbar`, and its floating panels are
  rendered by `Toolbar` itself, so un-mounting closes everything with no leftover portal.
- FR-010: an un-mounted toolbar is out of the tab order and the accessibility tree by construction.
- FR-011: on re-mount `Toolbar` subscribes to editor `transaction` again and reads current editor state, so active
  formatting and disabled states are correct.
- No flash on initial hidden render (never mounted).

**Alternatives**: `display: none` / `hidden` attribute (keeps open panels' state alive, needs extra close logic);
`visibility: hidden` (keeps layout space, violates FR-004).

**Not affected** (they live in `MarkdownEditor`, not in the toolbar): table cell menu, link popover, keyboard shortcuts,
imperative API, view mode state (FR-006, FR-012).

## 3. Layout (FR-004)

`.root` is a flex column and `.content` is `flex: 1; min-height: 0`; removing the toolbar element lets `.content`
grow into the freed space while the root keeps its fixed `width`/`height`. No CSS change needed for that.

## 4. Focus return (FR-009)

**Decision**: wrap the toolbar in a small `ToolbarSlot` (`display: contents`, so it does not alter the flex layout).
A `useLayoutEffect` cleanup runs when the slot unmounts; if `document.activeElement` is inside the slot, it calls an
`onFocusLost` callback that focuses the editor synchronously (`editor.view.focus()`; Tiptap's `commands.focus()` defers to
`requestAnimationFrame`, which is too late to be observable right after the toggle).

**Rationale**: React runs a function component's layout-effect cleanup before the host nodes below it are removed,
so `document.activeElement` is still valid; checking after removal would already see `body`. Verified by a test.

**Alternatives**: track focus with `focusin`/`focusout` listeners (blur is not reliably fired when the focused node is
removed); focus the editor unconditionally on hide (steals focus from wherever the user was).

## 5. No change notification (FR-007)

The editor instance is not recreated (its dependency list is `[sanitizeEmbeddedHtml, onlyView]`) and no document
transaction is dispatched on toggle, so `onChange` is not called. Focusing the editor for FR-009 does not modify the
document. Covered by a test that counts `onChange` calls across toggles.

## 6. Interaction with the compare bar (feature 010)

Per 010 clarifications, the compare bar also respects this setting. It will read the same `showToolbar` value; no work
here beyond keeping the prop general ("bars").

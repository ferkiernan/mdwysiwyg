# Changelog

All notable changes to this project are documented in this file.

## Unreleased

### Added

- **`showToolbar` prop** (default `true`): shows or hides the toolbar (editing bar, or the reduced `onlyView`
  bar) and can be changed at any time. Toggling never remounts the editor, never fires `onChange`, and keeps
  content, caret, undo history and the rendered/Markdown view; open toolbar panels close without applying
  anything and focus returns to the editor if it was on a toolbar control. While hidden, the view toggle and
  Export are not available from the UI.

- **Compare mode** (`mode="compare"`, `compareOrientation`, `compareContent`, `onCompareDecision`): shows the
  original content (read-only) and a new content (editable) side by side or one above the other, with
  new/changed words highlighted in yellow in both the rendered and Markdown views (whole-element highlight for
  new paragraphs, list items, table rows and code blocks; changed lines in code/Mermaid blocks). A second bar
  offers "Rechazar cambio", "Aceptar cambio" and "Restaurar" (visible only when the new pane differs from
  `compareContent`). Accept/reject call `onChange` and `onCompareDecision({ decision, markdown })` and return
  the control to default mode. The compare bar follows `showToolbar`. `reset()` acts as "Restaurar" and
  `isModified()` is true exactly when it is visible. New types `EditorMode`, `CompareOrientation`,
  `CompareDecision`; new custom property `--mdw-compare-highlight-bg`. No new dependencies; default mode is
  unchanged.

### Changed

- **Table column/row menu now opens from a corner triangle.** Hovering a table cell shows a small
  right-angled triangle in its top-right corner (link pointer on hover); a single click on it opens the same
  column (header) / row (data) menu as before, for that cell. The "second click on the active cell" gesture
  is removed: it now just moves the caret. The menu is also reachable from the keyboard
  (`ContextMenu` key or `Shift+F10` with the caret in a cell). The triangle is not shown with `onlyView` or in
  the Markdown view and is never part of the Markdown output.
- New theming custom properties: `--mdw-table-menu-trigger-color` (default `var(--mdw-scrollbar-thumb)`) and
  `--mdw-table-menu-trigger-size` (default `0.7em`).
- Links inside table cells now open the link popover on click (the removed second-click handler used to
  swallow those clicks).

## 0.3.1

### Fixed

- **The published package rendered unstyled.** `tsup` bundled `*.module.css` as global CSS and exported an
  empty class map (`styles["root"]` was `undefined`), so no element received its class: bare toolbar buttons,
  no icons or gradient, no table/code styles. The demo looked fine only because it builds from source. The
  build now uses the `local-css` loader (hashed names such as `MarkdownEditor_root` plus the matching JS
  map); `:global(...)` selectors and `--mdw-*` custom properties are unchanged. No API changes.

### Added

- `npm run verify:dist`: checks the built artifact (non-empty CSS Module class maps, every mapped class present
  in `dist/index.css`, ESM and CJS in agreement). It runs as part of `prepublishOnly` together with typecheck,
  tests and build, and a test renders the component from `dist/` so this cannot ship broken again.

## 0.3.0

### Added

- `resolveImageSrc(src) => string` prop: maps an image `src` to the URL used to **display** it (e.g. a
  relative path to a servable URL in desktop apps). The document keeps the original `src`, so the
  serialized Markdown never contains the resolved URL.
- `insertMarkdown(markdown)` on the imperative handle: inserts Markdown at the cursor (or replaces the
  selection) in the rendered view, or at the textarea selection in the Markdown view. Notifies `onChange`.
- `setMarkdown(markdown)` on the imperative handle: replaces the whole content as an **undoable** change in the
  rendered view (Ctrl+Z restores the previous content). Does not change the `isModified()` baseline. Notifies
  `onChange`.

### Fixed

- The cursor could not be placed between a table and the block that follows it, nor after a
  trailing table/code block/Mermaid diagram/quote/list/rule/image: a click to the right of a table
  (or in its margin, or in the gap between two blocks) landed inside a cell or the next block, and
  a document ending in a block had no line after it. Now such clicks put a gap cursor at that
  point (or move into an adjacent empty line); Enter inserts a blank line there and typing writes
  there. A click above a table writes before it, and a document ending in a block always keeps an
  empty line after it. Helper lines do not fire `onChange` on creation, are not added to undo
  history and are not serialized to Markdown; they are skipped in `onlyView`.

## 0.2.1

### Security

- Upgraded `@tiptap/*` from v2.27.3 to v3.31.3, fixing
  [GHSA-cp6q-959q-f8rh](https://github.com/advisories/GHSA-cp6q-959q-f8rh) (moderate): the entire
  Tiptap v2.x line had a prototype-pollution bug in `mergeAttributes()` where an own `__proto__`
  key could become an inherited, executable DOM attribute once rendered by ProseMirror's
  `DOMSerializer` — a potential XSS vector for untrusted document/extension attribute objects.
  Fixed upstream starting in `3.30.4`. No public API or behavior changes; two internal call sites
  updated for v3's `setContent()` options-object signature and `@tiptap/extension-table`'s named
  export.
- Pinned the `lodash-es` transitive dependency (via `mermaid` → `chevrotain`) to `^4.18.1` through
  an `overrides` entry, fixing
  [GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc) (code injection via
  `_.template`) and
  [GHSA-f23m-r3pf-42rh](https://github.com/advisories/GHSA-f23m-r3pf-42rh) (prototype pollution
  via `_.unset`/`_.omit`), both high severity.

## 0.2.0

### Added

- `--mdw-table-header-bg` CSS custom property: background of table header (`th`) cells in the
  rendered view.
- `--mdw-code-block-bg` CSS custom property: background of fenced code blocks in the rendered
  view.
- `--mdw-mermaid-bg` CSS custom property: background of the container a Mermaid diagram renders
  into.
- The toolbar's own horizontal auto-scroll (when it's wider than its container) now respects
  `--mdw-scrollbar-thumb` / `--mdw-scrollbar-track`, matching the content area's scrollbars.

### Changed

- The indent/outdent toolbar buttons are now hidden entirely (not just disabled) when the action
  isn't available for the current cursor position, instead of showing a disabled button.

### Fixed

- Clicking a table cell while a text selection is active (e.g. after dragging to select text) no
  longer opens the column/row context menu; it only opens on a genuine second click on an
  already-focused, non-selected cell.

## 0.1.0

Initial public release.

- Dual synchronized views (WYSIWYG and raw Markdown), GFM support.
- Toolbar with formatting, lists, code blocks with syntax highlighting, insert menus (image,
  link, table, horizontal rule, embedded HTML).
- Visual table size picker and table context menus (add/move/delete columns and rows).
- Mermaid diagram rendering, with auto-detection on HTML insert.
- Cursor position preserved when toggling between views.
- `onlyView` read-only mode with configurable notice text.
- Native resizing (`resizable` prop).
- Imperative API via `ref`: `reset()` and `isModified()`.
- Theming via CSS Custom Properties (toolbar colors/gradient/font, content area colors/fonts per
  view, scrollbar colors, content background).

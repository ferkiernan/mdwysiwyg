# Changelog

All notable changes to this project are documented in this file.

## Unreleased

### Added

- `resolveImageSrc(src) => string` prop: maps an image `src` to the URL used to **display** it (e.g. a
  relative path to a servable URL in desktop apps). The document keeps the original `src`, so the
  serialized Markdown never contains the resolved URL.
- `insertMarkdown(markdown)` on the imperative handle: inserts Markdown at the cursor (or replaces the
  selection) in the rendered view, or at the textarea selection in the Markdown view. Notifies `onChange`.
- `setMarkdown(markdown)` on the imperative handle: replaces the whole content as an **undoable** change in the
  rendered view (Ctrl+Z restores the previous content). Does not change the `isModified()` baseline. Notifies
  `onChange`.

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

# Changelog

All notable changes to this project are documented in this file.

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

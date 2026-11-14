# Changelog

All notable changes to this project are documented in this file.

## 0.7.0

### Added

- **`allowContentZoom` prop** (default `false`): the user zooms the content (text, images, tables, code, diagrams) with
  Ctrl/Cmd + wheel over it or Ctrl/Cmd + `+`/`-`/`0`, 50–300 % in 10 % steps, without resizing the control or the toolbar
  and without triggering the browser's page zoom. No on-screen controls; changes are announced to screen readers. The
  level is reflected in `--mdw-content-zoom` on the component's root (the host sets the starting zoom via CSS and can
  read it back).
- **Theming variables** `--mdw-content-zoom` (1), `--mdw-content-wysiwyg-font-size` (14px),
  `--mdw-content-markdown-font-size` (13px) — the content's base text size per view, multiplied by the zoom — and
  `--mdw-toolbar-scale` (1), which scales the toolbar, the compare/history bars and the floating menus independently.

- **«Copiar como TXT»** in the Export menu (after «Copiar como HTML»): copies the document as plain text to the
  clipboard, without Markdown symbols or HTML tags. Blocks are separated by a blank line, list items use `-`, `1.` or
  `[ ]`/`[x]` with two-space indentation per level, table cells are tab-separated (pastes as columns in spreadsheets),
  links become `text (address)`, images their alt text, code blocks and diagrams their raw content.
- **`--mdw-content-padding`** theming variable (default `12px 16px`, today's spacing): the inner padding of the content
  area, as 1 to 4 lengths. Applies to the rendered and Markdown views and to both compare panes (the Markdown-view
  highlight stays aligned); declare it on the control's class, a wrapper or `:root` like the other variables. Also
  editable in the playground's theme section.

### Changed

- **Compare highlight rule per sentence.** A sentence of the new content is painted whole only when it differs from
  its original sentence by more than 50% ((words added + removed) ÷ (words of both versions)); otherwise only its new
  or changed words are painted. Each sentence of a paragraph is judged on its own (a paragraph with one untouched
  sentence is no longer painted whole), and the rendered and Markdown views now follow the same rule (Markdown syntax
  does not count). Code blocks and diagrams keep line-based highlighting; new elements and type/level changes are still
  painted whole.

## 0.6.0

### Fixed

- **Compare mode no longer overwrites the original without a decision.** When the comparison ended without the
  user accepting (the host switched to `mode="default"` or removed `compareContent`, e.g. because the proposal was
  cleared), the editor kept the new content and the next comparison used it as the original. Now the editor returns
  to the original (`onChange` reports it if the new pane differed) and only «Aceptar cambio» changes it. The
  playground no longer drops an empty `compareContent`.

### Changed

- **`compareOrientation` defaults to `"side-to-side"`**: `mode="compare"` plus `compareContent` is now enough to
  start a comparison; before, a missing orientation kept the control in default mode.

## 0.5.0

### Added

- **`autoHeight` prop** (default `false`): the control grows downward with its content so the content area never shows
  a vertical scrollbar, and shrinks back when content is removed. `height` becomes the minimum height and the resize
  handle is not offered while it is on. Works in the rendered and Markdown views (the textareas size to their wrapped
  lines), in compare mode (taller pane side by side, both panes stacked) and in history mode (the version list scrolls
  on its own). Horizontal scrolling of wide content is kept. Can change at any time.
- **`autoHideBar` prop** (default `false`): the toolbar is visible only while the focus is inside the component
  (its menus, dialogs and popovers count as inside) and is removed from the layout and the tab order when the focus
  leaves. `showToolbar={false}` wins; the compare and history bars are not affected. Can change at any time.
- **20 new theming variables** for values that were fixed: syntax highlighting (`--mdw-code-keyword`, `-string`,
  `-comment`, `-number`, `-title`), quotes (`--mdw-blockquote-fg`, `-border`), controls (`--mdw-control-border`,
  `-highlight`, `-shadow`, `-pressed-shadow`, `--mdw-separator-color`), floating panels (`--mdw-popover-bg`,
  `-shadow`, `--mdw-menu-hover-bg`, `--mdw-danger-fg`, `-hover-fg`) `--mdw-table-picker-selected-bg` and links (`--mdw-link-fg`, `--mdw-link-visited-fg`, defaults = the browser's). Defaults are
  today's values; a full dark theme no longer leaves light-colored parts.
- **Theming guide** `docs/THEMING.md` (Spanish, shipped in the package): every variable with its default, where to
  declare them, recipes (dark theme, OS preference, light/dark switch, brand color, fonts, flat toolbar, backgrounds),
  supported vs. unsupported, CSS strategies and troubleshooting.
- **Self-documented API**: every prop, callback, `ref` method and exported type has JSDoc with values, `@default`,
  runtime behavior, relationships and examples, available in editors from the installed package.
- **Playground configuration builder**: a section «Seleccioná los atributos de tu control» (every prop, generated from
  the JSDoc, with defaults, summaries and dependency notes) and a reworked «Theming» section (all 47 variables, presets,
  scope: this control / a section / the whole page, OS dark variant) drive one shared sticky preview. «Copiar
  atributos» copies the non-default props as JSX or a props object; «Crear CSS» copies the final CSS shown live in the
  output panel, with instructions. Choices are remembered in the browser. Links «Cómo implementar estilos en tu host»
  open the theming guide.
- `npm run check:docs`: non-blocking documentation checks (undocumented props, props missing from the docs, theming
  variables missing from the guide); also printed at the end of `prepublishOnly`.

### Changed

- **Theming variables can be declared on any ancestor** (a wrapper or `:root`), not only on the control's class, and
  work in any stylesheet load order without `!important`: the component no longer declares the public `--mdw-*`
  variables; its defaults are fallbacks. Priority: control class > nearest ancestor > default. Default appearance is
  unchanged. Menus, dialogs and popovers (rendered in `document.body`) now receive per-control and wrapper themes too.
- Documentation refreshed: component README, README and `llms.txt` list every prop with its default and link the
  theming guide.

## 0.4.0

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

- **Version history** (`historyUndo`, default `false`): saves a version of the document after 3 s without
  changes (deduplicated, max 200, in memory) and adds a clock icon right after the HTML button of the toolbar (default
  mode only). It opens a history mode with a bar under the toolbar ("← Undo", "Redo →", "Confirm", "Back to
  default") and a right-hand list of versions with their time; clicking an entry jumps to that version. The document is read-only while browsing and
  `onChange` is not called; Confirm keeps the shown version (one `onChange` if it differs from the content at
  entry, appended as the newest version) and Cancel (back to last version) restores the content at entry.
  `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` / `Ctrl+Y` act as Undo / Redo while it is open. It closes without applying
  anything when the prop turns off, `onlyView` or compare mode starts, or the toolbar is hidden. No new
  dependencies; with the prop off nothing changes.

- **Compare scroll sync** (`compareSyncScroll`, default `true`): in `mode="compare"` scrolling either pane
  scrolls the other to the matching content, so added or removed blocks before the viewed passage no longer
  misalign them. The pane scrolled last leads (wheel, scrollbar, keyboard or caret-follow); the top edge of
  the viewport is the matched point. Matching reuses the compare diff (paired blocks in the rendered view,
  identical lines measured with wrapping in the Markdown view); passages present on one side only are crossed
  proportionally, with a proportional fallback when nothing is shared and top/bottom mapped to top/bottom.
  Works in both orientations and views, vertical only, no animation, and re-aligns when content, view,
  orientation or layout change. Typing in the new pane never moves it. `compareSyncScroll={false}` keeps the
  panes independent; turning it on aligns them again. No new dependencies; outside compare mode nothing
  changes.

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

# UI Contract: Table Cell Menu Trigger

The package exposes no new props, types or exports for this feature. This contract covers the
observable UI surface that consumers (theming, tests, assistive tech) can rely on.

## Behavior

| Situation | Result |
|---|---|
| Pointer over a `th`/`td` (editable editor, WYSIWYG view) | Trigger shown at the cell's top-right corner |
| Pointer moves cell → trigger | Trigger stays |
| Pointer leaves cell and trigger, no menu open | Trigger hidden |
| Click on trigger (header cell) | `role="menu"` named **"Acciones de columna"** opens, anchored to the cell |
| Click on trigger (data cell) | `role="menu"` named **"Acciones de fila"** opens, anchored to the cell |
| Menu action chosen | Applied to the cell whose trigger was clicked; menu closes |
| Second click on the active cell (not on trigger) | No menu; normal caret placement |
| `onlyView`, or Markdown source view | No trigger |
| Caret in a cell + `ContextMenu` key or `Shift+F10` | Same menu as the trigger for that cell, first item focused |

Menu items, labels and order are **unchanged** from feature 005.

## Accessibility

- Element: `<button type="button">` outside the ProseMirror content (`tabindex="-1"`: reachable by
  pointer and by the keyboard shortcut above, not part of the Tab sequence, which the table extension
  uses to move between cells).
- Accessible name: **"Abrir acciones de columna"** (header) / **"Abrir acciones de fila"** (data).
- `aria-haspopup="menu"`, `aria-expanded="true"` while its menu is open, otherwise `"false"`.
- Menu keeps the existing contract: first item focused on open, Escape closes without applying.

## Visual / theming

| Custom property | Default | Meaning |
|---|---|---|
| `--mdw-table-menu-trigger-size` | `0.7em` | Length of each leg (≈ 50% of the text-caret height at the default font) |
| `--mdw-table-menu-trigger-color` | `var(--mdw-scrollbar-thumb)` | Triangle fill; follows the scrollbar colour unless overridden |

- Shape: right-angled triangle, right angle at the cell's top-right corner.
- Pointer over the triangle: `cursor: pointer` (link pointer).
- Only the triangle area is clickable.

## Non-goals / invariants

- The trigger is never part of the document: absent from `onChange` Markdown, `getMarkdown`-style
  exports, and clipboard content.
- No change to `MarkdownEditorProps`, `MarkdownEditorHandle`, or the package exports.

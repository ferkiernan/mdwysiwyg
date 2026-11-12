# Contract: public theming tokens

All tokens are optional CSS custom properties. The control **reads** them; it never declares them. Declare them on the class
passed in `className`, on any ancestor, or on `:root`.

**Precedence**: control's class > nearest ancestor > built-in default. Independent of stylesheet load order; no `!important`.

## Base (existing, previously undocumented)

| Token | Default | Affects |
|---|---|---|
| `--mdw-border` | `#d0d4da` | Borders of the control, tables, panes |
| `--mdw-bg` | `#ffffff` | Control background; base of content and popover backgrounds |
| `--mdw-fg` | `#1f2328` | Text color; base of content text |
| `--mdw-muted` | `#f6f7f9` | Soft backgrounds (table header, code, Mermaid) |
| `--mdw-accent` | `#3d6fd8` | Focus rings, selected states |

## Existing (documented today, unchanged)

Toolbar (9), content (5), tables and code (6 incl. `--mdw-compare-highlight-bg`), scroll (2): names and defaults as in the
current component README theming section (27 tokens + `--mdw-compare-highlight-bg`).

## New (FR-025) — defaults identical to today

| Token | Default | Affects |
|---|---|---|
| `--mdw-code-keyword` | `#a626a4` | Syntax highlighting: keywords, tags, literals |
| `--mdw-code-string` | `#50a14f` | Strings, attributes |
| `--mdw-code-comment` | `#a0a1a7` | Comments, quotes |
| `--mdw-code-number` | `#986801` | Numbers, built-ins |
| `--mdw-code-title` | `#4078f2` | Titles, function and class names |
| `--mdw-blockquote-fg` | `#57606a` | Blockquote text |
| `--mdw-blockquote-border` | `var(--mdw-border)` | Blockquote left rule |
| `--mdw-control-border` | `#999` | Borders of toolbar/bar buttons, selects, inputs, menus |
| `--mdw-control-highlight` | `#fff` | Light inner edge of buttons and bars |
| `--mdw-control-shadow` | `rgba(0, 0, 0, 0.15)` | Drop shadow of buttons |
| `--mdw-control-pressed-shadow` | `rgba(0, 0, 0, 0.25)` | Inner shadow of a pressed button |
| `--mdw-separator-color` | `#aaa` | Toolbar separators |
| `--mdw-popover-bg` | `var(--mdw-bg)` | Background of menus, dialogs, popovers, pickers |
| `--mdw-popover-shadow` | `0 4px 12px rgba(0, 0, 0, 0.12)` | Shadow of floating panels |
| `--mdw-menu-hover-bg` | `#e4e7eb` | Hover/focus background of menu items |
| `--mdw-danger-fg` | `#b42318` | Destructive actions (delete row/column, remove link) |
| `--mdw-danger-hover-fg` | `#8c1c11` | Same, hover |
| `--mdw-table-picker-selected-bg` | `#dbe4f8` | Selected cells in the table-size picker |
| `--mdw-link-fg` | `#0000ee` | Links in the rendered view (browser default blue) |
| `--mdw-link-visited-fg` | `#551a8b` | Visited links (browser default) |

Final list confirmed by the CSS inventory task (any remaining fixed color a theme needs is added here with its current value;
values that only encode geometry stay private).

## Not public

Internal class names (generated, unstable), private tokens `--_mdw-*`, spacing, sizes, layout.

# Quickstart: Table Cell Menu Trigger

**Feature**: [spec.md](./spec.md) | **Contract**: [contracts/table-cell-trigger.md](./contracts/table-cell-trigger.md) | **Data model**: [data-model.md](./data-model.md)

## Prerequisites

```bash
npm install
```

## Automated checks

```bash
npm run typecheck
npm test
npm run build && npm run verify:dist
```

Expected: all green. New/updated suites: `table-cell-trigger`, `table-column-menu`,
`table-row-menu`, `accessibility`. `verify:dist` confirms the new CSS-module class is in the class map
(feature 007).

## Manual validation (playground)

```bash
npm run dev
```

Insert a table (toolbar table picker), then:

1. **Hover (US1)** — move the pointer over any cell: a small gray triangle appears in its top-right
   corner (as in the reference image, row 1 / Col C). Moving to another cell moves it; leaving the
   table hides it.
2. **Header menu (US1)** — hover a header cell, click the triangle once: "Acciones de columna" opens
   (5 items). Pick "Añadir columna a la derecha": a column is added next to that header.
3. **Row menu (US1)** — hover a body cell in the *second* data row without clicking it first, click
   the triangle: "Acciones de fila" opens; "Añadir fila abajo" inserts the row right below *that* row.
4. **Second click (US2)** — click inside a cell, click again in the same cell: no menu; caret moves.
   Double-click a word: it is selected, no menu.
5. **Size and pointer (US3)** — compare the triangle's legs with the text caret in an active cell
   (≈ half its height). Hover the triangle: pointer becomes the hand/link pointer; leaving it restores
   the text pointer.
6. **Read-only** — load with `onlyView`: no triangle on hover.
7. **Keyboard** — put the caret in a cell, press `Shift+F10` (or the `ContextMenu` key): the same menu
   opens with the first item focused; Escape closes it.
8. **Markdown output** — edit a cell while hovering it; the Markdown view/`onChange` output contains
   no trigger artifacts.
9. **Themes** — switch to a dark host theme: triangle remains visible on header and body cells.
10. **Touch** — on a touch device/emulator, tap a cell: the triangle appears; tapping it opens the menu.

## Expected outcomes

Maps to success criteria: SC-001 (steps 1–3), SC-003 (step 4), SC-004 (steps 2–3 + existing menu
tests), SC-005 (step 5), SC-006 (step 8).

# Implementation Plan: Resize a Column by Dragging Its Header Border

**Branch**: `023-column-resize-drag` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

## Summary

Explicit column widths live in the Tiptap cell attribute `colwidth` (px). The Table node view already renders it as a
`<colgroup>`. A small ProseMirror plugin handles the drag. The Markdown pipeline translates `colwidth` ↔ the dashes of
the separator row.

## Technical Context

TypeScript 5.9 strict, React 18, Tiptap 3 (`@tiptap/pm/tables` `TableMap`), unified/remark/rehype, Vitest + RTL
(jsdom). No new dependencies.

## Design

- **`markdown/columnWidths.ts`**
  - **`DASH_PX = 8`, `MIN_COLUMN_PX = 40`**, plus the `pxToDashes` / `dashesToPx` conversions.
  - **`splitRow`:** splits a table row into cells, respecting `\|`.
  - **`explicitWidths(table, source)`:** reads the separator line from the source, using the table's position (and its
    container prefix such as `> `). A column is explicit when it has more than 3 dashes and the count differs from
    max(3, longest cell).
  - **`remarkColumnWidths`:** a plugin on the Markdown → editor path. It sets `hProperties.colwidth` on every cell of an
    explicit column.
  - **`rehypeCollectColumnWidths`:** a plugin on the editor → Markdown path. It collects the widths per table, in
    document order, from the first row; tables inside raw HTML blocks are skipped.
  - **`applyColumnWidths(markdown, widths)`:**
    - re-parses the generated Markdown;
    - rewrites the separator cells of explicit columns, keeping the colons;
    - adds one dash when the count equals the automatic padding;
    - pads the content cells of those columns so the pipes line up.
- **`markdown/columnResize.ts`**: the `ColumnResize` extension, with priority 1000 so it runs before `tableEditing`.
  - **`mousemove`:** toggles `.mdw-column-resize` on the editor when the pointer is within 6 px of a header's right
    border, in its lower half, and the editor is editable.
  - **`mousedown`:** locates the cell position at once (the table can be re-rendered while dragging), then tracks the
    document's `mousemove` and `mouseup` events.
  - **During the drag:** live feedback on the `<col>` and the `th`.
  - **On release:** the width is snapped to 8 px, and one transaction sets `colwidth` on every cell of the column
    through `TableMap`.
- **CSS:** `col-resize` cursor on `.ProseMirror.mdw-column-resize` and on `body.mdw-column-resize` (while dragging).
- **Pipeline:** `markdownToEditorHtml` adds `remarkColumnWidths`. `editorHtmlToMarkdown` collects the widths and applies
  them after stringify.

## Constitution Check

The change stays inside the component. It has public behavior and no new props, and it is covered by tests and docs.
Pass.

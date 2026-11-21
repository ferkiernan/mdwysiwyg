# Implementation Plan: Turn a Multi-Block Selection into a Single Code Block

**Branch**: `027-selection-to-codeblock` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

## Design

`markdown/codeBlockSelection.ts` provides `selectionToCodeBlock(language)`, a ProseMirror command. It does the
following, in order:

1. **Collect the lines.** It walks the selected range in document order:
   - each textblock gives its visible text, with hard breaks as new lines;
   - code blocks give their own lines;
   - tables give one `cell | cell` line per row;
   - atoms give nothing.

   It also records the first and last "anchor" (a textblock, or a whole table). Fewer than two anchors means a single
   line, so it returns `false` and the button falls back to `toggleCodeBlock`. It also returns `false` when an end of
   the selection is inside a table cell.
2. **Keep the unselected parts.** It finds the top-level blocks that hold the first and the last anchor. With
   `Node.cut`, it keeps what lies before the first anchor and after the last one.
3. **Clean the leftovers.** The cut parts are cleaned:
   - empty items, lists and quotes are dropped;
   - an item that lost its first line moves its sub-items up one level.
4. **Replace.** It replaces the affected top-level range with `[before, codeBlock, after]` in one `replaceWith`, which
   is one undo step and one `onChange`. The cursor ends at the end of the block.
   - Every new node is validated with `check()`. If one is invalid, it returns `false` (the default behavior).
5. **Toolbar.** In the language picker's `onSelect`, it runs `selectionToCodeBlock` first. Otherwise it changes the
   language of the active block or toggles the code block, as today.

## Constitution Check

The change stays in the component. The behavior is documented and tested, and single-line cases keep their current
behavior. Pass.

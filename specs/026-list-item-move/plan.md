# Implementation Plan: Move a List Item Up or Down with the Keyboard

**Branch**: `026-list-item-move` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

## Design

- **`markdown/listEditing.ts`: `moveListItem(direction)`.** A ProseMirror command.
  - It takes the `blockRange` of the selection whose parent is a list. That range is the item, or the consecutive
    sibling items, containing the selection, in the innermost list.
  - It swaps the range with the neighbouring sibling through one `replaceWith`, so the subtrees move intact.
  - It shifts the text selection by the neighbour's size.
  - At the first or last position it returns `true` without dispatching, so the browser does not extend the selection
    instead.
- **`ListEditing` extension:** it adds the shortcuts `Ctrl-Shift-ArrowUp` and `Ctrl-Shift-ArrowDown`, with the physical
  Ctrl key (not `Mod`), and only when the editor is editable.
- **Not affected:** the Markdown view is a textarea, so the shortcuts never reach it. Read-only and compare panes are
  not editable, so the shortcuts do nothing there.

## Constitution Check

The change is additive (new shortcuts), documented and tested. Pass.

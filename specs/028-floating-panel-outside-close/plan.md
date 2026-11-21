# Implementation Plan: Close Toolbar Mini-Dialogs on an Outside Click

**Branch**: `028-floating-panel-outside-close` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

## Design

- **`FloatingPanel`:** a new optional `onDismiss` prop. While the panel is open, it listens for `pointerdown` on the
  anchor's document, in the capture phase:
  - a press outside the panel and outside its anchor calls `onDismiss`;
  - the event is not prevented, so the click keeps its normal effect.
  - The anchor is excluded, so its own click toggles the panel.
- **`Toolbar`:**
  - the table, code language and insert (image, link, HTML) panels pass `onDismiss={closeDialog}`;
  - `openDialogAt` closes the panel when the same button that opened it is pressed again.
- **`ExportMenu`:** `onDismiss` closes the menu without moving the focus back to the button. Escape keeps refocusing
  the button.
- **Not changed:** `LinkPopover` and `TableContextMenu` keep their own outside-click handling.

## Constitution Check

The change stays in the component and adds no new props or dependencies. It is tested and documented. Pass.

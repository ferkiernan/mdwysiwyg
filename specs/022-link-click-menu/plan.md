# Implementation Plan: Clicking a Link Never Opens It Directly

**Branch**: `022-link-click-menu` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

## Summary

One capture-phase listener set on the control's root (always on, no prop):

- `click` on an anchor inside a content pane: `preventDefault` always (covers Ctrl/Cmd/Shift). Links the main editor
  handles (inside its document, not inside an embedded HTML block) keep the existing full menu; any other link (compare
  original pane, embedded HTML) opens the existing link popover in its read-only variant (`readOnly` flag on the popover
  state, combined with `onlyView`/history).
- `auxclick` (middle button) on an anchor: `preventDefault`, no menu.
- `keydown` Enter on a focused anchor: read-only menu instead of navigation.
- `contextmenu` untouched.

No new dependencies, props or CSS. Tests in `tests/MarkdownEditor/link-click-menu.test.tsx`; docs in the component README
(links) and CHANGELOG (0.8.1, Fixed).

## Constitution Check

All PASS: behavior fix, accessible (keyboard path), tested, documented.

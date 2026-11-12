# Implementation Plan: Auto-Hide Toolbar on Focus Loss

**Branch**: `014-auto-hide-bar` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

## Summary

New prop `autoHideBar?: boolean` (default `false`). `MarkdownEditor` tracks whether the focus is inside the component with
React `onFocus` / `onBlur` on the root (React focus events bubble through portals, so floating menus, dialogs and popovers
count as inside — FR-004). A blur schedules "outside" on the next task and a focus cancels it, so moving between parts never
hides the bar (FR-006, SC-002). The main toolbar renders only when `showToolbar && (!autoHideBar || focusInside)`: hidden =
unmounted, so not focusable or announced (FR-007); `showToolbar={false}` wins (FR-009). Compare and history bars keep their own
conditions (FR-011). The initial state is read from `document.activeElement` on mount (FR-005). See [research.md](./research.md).

## Technical Context

TypeScript 5.9 strict, React 18; no new dependencies. Tests: Vitest + RTL + user-event (focus in/out with Tab and clicks,
fake timers not needed — `waitFor`).

## Constitution Check

| Principio | Estado |
|---|---|
| I–V: one boolean prop, documented | PASS |
| VI: hidden bar unmounted (not a hidden tab stop); focus order preserved (ToolbarSlot only refocuses when focus was inside) | PASS |
| VII–VIII: no CSS/dependency change | PASS |
| IX–X: tests + docs | PASS |
| XI–XV: minimal mechanism | PASS |

## Project Structure

```text
src/components/MarkdownEditor/types.ts          # autoHideBar
src/components/MarkdownEditor/MarkdownEditor.tsx # focus tracking, toolbar condition
tests/MarkdownEditor/auto-hide-bar.test.tsx
```

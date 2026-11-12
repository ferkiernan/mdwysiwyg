# Implementation Plan: Auto-Height

**Branch**: `013-auto-height` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

## Summary

New prop `autoHeight?: boolean` (default `false`). When on, the root gets the class `.autoHeight`, `height` is applied as
`min-height` (FR-006), the resize handle class is not applied (FR-011), and CSS lets the content areas size to their content
(`flex: 1 0 auto`, no inner vertical scroll). The Markdown textareas, which never grow by themselves, are auto-sized
(`height = scrollHeight`) on value changes and width changes (`ResizeObserver`). The version list uses `contain: size` so it
never makes the control taller. With the prop off nothing changes (FR-002/017). See [research.md](./research.md).

## Technical Context

TypeScript 5.9 strict, React 18, CSS Modules; no new dependencies. Tests: Vitest + RTL (class/style assertions, textarea
auto-size with stubbed `scrollHeight`); real layout verified in the playground.

## Constitution Check

| Principio | Estado |
|---|---|
| I–V: one boolean prop, documented (types JSDoc, README, llms.txt) | PASS |
| VI: no focus/selection change; no animation | PASS |
| VII: CSS Module class only | PASS |
| VIII: no dependency | PASS |
| IX–X: tests + docs in tasks | PASS |
| XI–XV: no packaging change; minimal mechanism | PASS |

## Project Structure

```text
src/components/MarkdownEditor/
├── types.ts                      # autoHeight
├── MarkdownEditor.tsx            # class, min-height, resizable off, pass autoSize to source views
├── MarkdownEditor.module.css     # .autoHeight rules
├── views/MarkdownSourceView.tsx  # autoSize prop (scrollHeight sizing + ResizeObserver)
├── compare/HighlightedSource.tsx # forward autoSize
└── compare/OriginalPane.tsx      # autoSize for the original textarea
tests/MarkdownEditor/auto-height.test.tsx
```

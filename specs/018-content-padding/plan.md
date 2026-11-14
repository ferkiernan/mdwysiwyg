# Implementation Plan: Adjustable Content Padding (CSS customization point)

**Branch**: `018-content-padding` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

## Summary

New public theming token `--mdw-content-padding` (default `12px 16px`), following the 015 model: private token
`--_mdw-content-padding: var(--mdw-content-padding, 12px 16px)` on `.root`, read by the three places that pad the content
today: `.ProseMirror` (rendered view), `.source` (Markdown textarea) and `.sourceLayer` (compare highlight layer, must match
the textarea exactly). No attribute (Clarification). Everything that measures text position already reads computed styles
(scroll-sync mirror copies computed padding; auto-height uses `scrollHeight`; table trigger/gap cursor use element rects), so
no code beyond CSS and the token list is needed.

## Technical Context

CSS Modules + TypeScript; no new dependencies. New token kind `padding` (validated with `CSS.supports("padding", …)` in the
playground). Tests: token contract test (existing, data-driven), CSS reads the token in the three rules, playground generator
emits it. Real layout checked in the browser.

## Constitution Check

| Principio | Estado |
|---|---|
| I–V: no new prop; public styling API extended by one documented token | PASS |
| VI: no a11y impact | PASS |
| VII: token-based styling | PASS |
| VIII–XV: no deps, tests + docs, minimal change | PASS |

## Project Structure

```text
src/components/MarkdownEditor/MarkdownEditor.module.css   # token + 3 rules
src/components/MarkdownEditor/theme/themeTokens.ts       # token entry, kind "padding"
playground/builder/validation.ts                         # padding kind
docs/THEMING.md, README (component), llms.txt, CHANGELOG
tests/MarkdownEditor/theming-tokens.test.tsx             # padding rules read the token
```

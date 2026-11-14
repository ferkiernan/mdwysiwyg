# Implementation Plan: Content Zoom and Toolbar Size

**Branch**: `021-content-zoom` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

## Summary

- **Prop** `allowContentZoom?: boolean` (default `false`).
- **CSS tokens** (015 model, private fallbacks): `--mdw-content-zoom` (factor, default `1`),
  `--mdw-content-wysiwyg-font-size` (`14px`), `--mdw-content-markdown-font-size` (`13px`), `--mdw-toolbar-scale` (`1`).
  - Rendered view: `.ProseMirror` font-size = base × zoom; code blocks keep their 13/14 ratio; images and diagrams scale
    with `zoom` (atomic, no caret inside).
  - Markdown view: textarea and highlight layer font-size = base × zoom (identical metrics keep the highlight aligned;
    scroll-sync mirror copies computed fonts).
  - Toolbar, compare bar, history bar and floating panels: `zoom: var(--_mdw-toolbar-scale)`; `1` is a no-op.
- **Interaction** (only with the prop on): one `wheel` listener (non-passive) on the root — Ctrl/Cmd + wheel inside a
  content pane steps zoom (pixel deltas accumulated per 100 px, line deltas one step); a capture `keydown` for
  Ctrl/Cmd + `+`/`=`/`-`/`0` with focus inside a content pane. Both `preventDefault` (no page zoom).
- **Reflection**: the user's zoom is written inline on the root as `--mdw-content-zoom`; the starting value is the host's
  computed `--mdw-content-zoom` (class, ancestor or root; default 1); Ctrl/Cmd + `0` removes the inline value (back to the
  host's); turning the prop off removes it too. Range 0.5–3, steps 0.1. A polite live region announces «Zoom 120 %».
- Markdown textareas with `autoHeight` re-fit when the zoom changes.

## Constitution Check

All PASS: one boolean prop + documented tokens; no dependency; keyboard alternative and announcement for accessibility;
defaults identical.

## Project Structure

```text
src/components/MarkdownEditor/types.ts, MarkdownEditor.tsx, MarkdownEditor.module.css
src/components/MarkdownEditor/theme/themeTokens.ts         # 4 tokens, kind "number"
src/components/MarkdownEditor/views/MarkdownSourceView.tsx, compare/HighlightedSource.tsx, compare/OriginalPane.tsx (refit)
src/components/MarkdownEditor/Toolbar/buttons/FloatingPanel.tsx (data attribute for toolbar scale)
playground/builder/validation.ts (kind number)
tests/MarkdownEditor/content-zoom.test.tsx
docs/THEMING.md, READMEs, llms.txt, CHANGELOG
```

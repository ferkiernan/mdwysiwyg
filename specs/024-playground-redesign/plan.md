# Implementation Plan: Playground Redesign and Black Text Cursor by Default

**Branch**: `024-playground-redesign` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

## Summary

Two independent changes:

1. **Black text cursor.** The default of `--mdw-content-cursor` goes back to the 11 × 20 black I-beam SVG (1 px white
   outline, hotspot 5 10, `text` as the fallback).
2. **Playground redesign.** A playground stylesheet, a header with tab navigation, grouped attributes, and a
   three-column builder at 1500 px and wider. The builder logic and the generators are not changed.

## Technical Context

TypeScript 5.9 strict, React 18, Vite (playground), Vitest + RTL. No new dependencies.

## Design

- **Cursor:**
  - `MarkdownEditor.module.css`: the private token defaults to the SVG.
  - `themeTokens.ts`: the default is the same string, so the token contract test keeps matching.
  - `docs/THEMING.md`: the reference row and the recipe (now "use `text` for the system cursor") are updated.
  - The cursor test is updated to match.
- **`playground/playground.css`** (new, imported only from `main.tsx`):
  - **Tokens:** `--pg-*` custom properties (neutral palette, one accent, sans-serif type scale, spacing scale).
  - **Header (`.pg-header`):** sticky, with the brand, the version (from `package.json`), the tabs, and links to the
    repository and the styling guide.
  - **Container:** `.pg-main`, with `max-width: 1760px`, centered.
  - **Controls:** element styles are scoped to `.pg-controls`, so they never reach the editor's own buttons or fields.
  - **Builder:** `.mdw-builder` uses three columns (attributes | theming | preview) from 1500 px, two columns from
    900 px, and one column below that. The preview is sticky under the header.
- **Navigation (`main.tsx`):**
  - Tabs for the configurator and for each demo; one action reaches any demo.
  - The active tab lives in the URL hash (`#demo-compare` and so on), so it can be linked to and survives a reload.
  - Only the active panel renders.
- **`ConfigBuilder.tsx`:**
  - Inline styles are replaced with classes.
  - Attributes are grouped by purpose through an `ATTRIBUTE_GROUPS` map, with an «Otros» group as the fallback for new
    attributes.
  - Each attribute row shows its name and control, then the default and the help text as secondary text.
  - The accessible names the tests use are kept.
- **Kept as is:** storage key and state shape, generators, presets, preview theming.

## Constitution Check

- **Component change:** only the cursor default token changes in the component. It is documented, tested and opt-out
  with `text`.
- **Playground:** presentation only.

Pass.

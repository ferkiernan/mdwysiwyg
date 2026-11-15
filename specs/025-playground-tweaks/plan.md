# Implementation Plan: Playground Tweaks

**Branch**: `025-playground-tweaks` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

## Design

- **`playground/sample.ts`** (new): exports `DEMO`, the shared sample document, ending with the requested block
  verbatim.
- **`playground/main.tsx`:**
  - imports `DEMO`;
  - puts `demo-editor` first in `TABS` and makes it the `HOME` tab;
  - Solo lectura gets two checkboxes (state in `App`), passed as `autoHideBar` and `autoHeight`.
- **`playground/builder/ConfigBuilder.tsx`:** `PREVIEW_CONTENT = DEMO`.
- **Tests:** the builder test that checks the compare original now expects "Demo mdwysiwyg".

## Constitution Check

Playground only, no component change. Pass.

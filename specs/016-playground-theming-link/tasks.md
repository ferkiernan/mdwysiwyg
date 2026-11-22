# Tasks: Playground Link to the Host Styling Guide

- [X] T001 [US1] Create `playground/builder/StylingGuideLink.tsx` (label «Cómo implementar estilos en tu host», `GUIDE_URL` = GitHub `docs/THEMING.md`, new tab, `rel="noopener noreferrer"`, hidden "(se abre en una pestaña nueva)")
- [X] T002 [US1] Place it in the top intro line of `playground/main.tsx` and next to the theming heading and «Crear CSS» (017 builder)
- [X] T003 [US1] Test link attributes and accessible name in `tests/playground/config-builder.test.tsx`
- [X] T004 CHANGELOG line
- [X] T005 Manual check on the published live demo after the next deploy (`npm run build:demo` + Pages).
  - Checked on 2026-11-22 against the live demo, v0.10.0.
  - The header link and the builder links point to `docs/THEMING.md`, with `target="_blank"` and
    `rel="noopener noreferrer"`.

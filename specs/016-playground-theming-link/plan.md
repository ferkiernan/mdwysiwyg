# Implementation Plan: Playground Link to the Host Styling Guide

**Branch**: `016-playground-theming-link` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-playground-theming-link/spec.md`

## Summary

Add a small `StylingGuideLink` element to `playground/main.tsx`, rendered twice: next to the theming section heading
("Theming: 5 estilos + edición en vivo…") and in a new short intro line at the top of the page. Both point to one constant
`STYLING_GUIDE_URL`: the GitHub page of `docs/THEMING.md` (from 015) on `master`, or — while that file does not exist — the
component README's theming section anchor (FR-006). Opens in a new tab with `rel="noopener noreferrer"` and an accessible
"(se abre en una pestaña nueva)" hint. See [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.9, React 18 — unchanged.

**Primary Dependencies**: none new.

**Storage**: N/A.

**Testing**: manual check in local demo and the published live demo (quickstart); the playground has no automated tests and
this does not touch the package. 015's `check:docs` can include the URL target in its link checks (optional).

**Target Platform**: local Vite playground and the GitHub Pages live demo.

**Project Type**: component library — change limited to the demo app.

**Performance Goals**: N/A.

**Constraints**: absolute URL (works under the Pages sub-path); no change to `src/` or the published package (FR-007).

**Scale/Scope**: `playground/main.tsx` (one constant, one small component, two placements), `CHANGELOG.md` (one line).

## Constitution Check

| Principio | Evaluación | Estado |
|---|---|---|
| I–V (Reusabilidad, TS, React, Composición, API) | Demo-only change; no public API change | PASS |
| VI. Accesibilidad | Real `<a>`, keyboard focusable, new-tab hint in the accessible name | PASS |
| VII. Styling Encapsulado | Inline demo styles only | PASS |
| VIII. Dependencias | None | PASS |
| IX. Testing | Demo app untested by design; manual quickstart check | PASS |
| X. Documentación | Improves discoverability of the guide; CHANGELOG line | PASS |
| XI–XIV | Package untouched; `verify:dist` unaffected | PASS |
| XV. Simplicidad | One constant + one element | PASS |

No violations. Re-check after design: unchanged, PASS.

## Project Structure

### Documentation (this feature)

```text
specs/016-playground-theming-link/
├── plan.md
├── research.md
├── quickstart.md
├── contracts/playground-link.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

No `data-model.md`: the only entity (the link) is fully described in the contract.

### Source Code (repository root)

```text
playground/main.tsx   # edit: STYLING_GUIDE_URL, StylingGuideLink, top intro line, link next to the theming <h2>
CHANGELOG.md          # edit: one line under the unreleased section
```

**Structure Decision**: demo-only change; can be implemented as part of 015's tasks or on its own.

## Complexity Tracking

> Not applicable — no Constitution violations.

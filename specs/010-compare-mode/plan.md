# Implementation Plan: Compare Mode (original vs. new content)

**Branch**: `010-compare-mode` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-compare-mode/spec.md`

## Summary

Add a `mode` prop (`"default" | "compare"`) plus `compareOrientation`, `compareContent` and an `onCompareDecision`
callback. In compare mode the **existing editor becomes the new (editable) pane** and a second, read-only Tiptap
editor renders the original next to / above it. Differences are computed by a small in-repo diff engine (Myers
`O(ND)` on string tokens, no new dependency): a structure-aware block diff over the ProseMirror documents for the
rendered view (decorations: `<mark>` for changed words, a block class for entirely new elements) and a word diff over
the raw text for the Markdown view (a highlight layer behind the textarea). A second toolbar (`CompareBar`) offers
"Rechazar cambio", "Aceptar cambio" and, only when the working content differs from the provided one, "Restaurar".
Accept/Reject report through `onChange` + `onCompareDecision` and return the control to default mode. The compare bar
follows `showToolbar` (feature 009). See [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 18 — unchanged.

**Primary Dependencies**: none new (diff engine implemented in-repo; `createDocument`/`Decoration` come from the
already-installed `@tiptap/core` / `@tiptap/pm`).

**Storage**: N/A (nothing persisted).

**Testing**: Vitest + React Testing Library + user-event; pure unit tests for the diff engine.

**Target Platform**: modern browsers, npm package — unchanged.

**Project Type**: component library (`mdwysiwyg`).

**Performance Goals**: highlight recomputation after an edit ≤ 300 ms for documents up to 5,000 words (SC-002):
block alignment is `O(ND)`, word diffs run only on paired changed blocks and are capped.

**Constraints**: default mode must not change (FR-017, SC-007): the highlight extension is idle (empty decoration set)
unless an original is set; the extra wrapper element uses `display: contents` outside compare mode; the editor is not
recreated when entering/leaving compare mode.

**Scale/Scope**: `types.ts`, `index.ts`, `MarkdownEditor.tsx`, `MarkdownEditor.module.css`, `MarkdownSourceView.tsx`
(label), new `compare/` folder (diff engine, highlight extension, bar, original pane, highlighted source), docs
(component README, README, llms.txt, CHANGELOG), playground controls, new tests.

## Constitution Check

| Principio | Evaluación | Estado |
|---|---|---|
| I. Reusabilidad | Generic prop/callback API; no business logic | PASS |
| II. TypeScript Estricto | Typed unions and result type, no `any` | PASS |
| III. React Moderno | Function components, hooks | PASS |
| IV. Composición | New props are needed: composition cannot add a second pane, diff or decision flow. Kept to 4 flat props | PASS (justified in research §1) |
| V. API Pública | Names follow `onlyView`/`showToolbar`/`onChange` conventions; types exported from the entry point | PASS |
| VI. Accesibilidad | Panes are labelled groups; original announced read-only; highlights use `<mark>` + count description; bar is a labelled toolbar with real buttons; focus returned after decision/restore | PASS (verify in tests) |
| VII. Styling Encapsulado | CSS Module classes; one new themable custom property `--mdw-compare-highlight-bg` | PASS |
| VIII. Dependencias | None added; diff engine in-repo (~100 lines) instead of `diff`/`diff-match-patch` (research §4) | PASS |
| IX. Testing | Behavior tests per user story + unit tests for the diff engine | PASS (verify in tasks) |
| X. Documentación | README props + section, llms.txt, CHANGELOG, contract | PASS (verify in tasks) |
| XI–XIII. Paquete/Tree shaking/Build | No packaging change; `verify:dist` re-run | PASS |
| XIV. Calidad | Enforced at merge | PASS |
| XV. Simplicidad | Reuses the main editor as the new pane; whole-change accept/reject; no sync scroll / per-difference actions | PASS |

No violations. Re-check after Phase 1 design: unchanged, PASS.

## Project Structure

### Documentation (this feature)

```text
specs/010-compare-mode/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── MarkdownEditor.compare.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
src/components/MarkdownEditor/
├── types.ts                         # edit: EditorMode, CompareOrientation, CompareDecision; 4 props
├── index.ts                         # edit: export the new types
├── MarkdownEditor.tsx               # edit: compare session state, panes, bar, accept/reject/restore, reset/isModified
├── MarkdownEditor.module.css        # edit: panes layout, mark/block highlight, compare bar, --mdw-compare-highlight-bg
├── views/MarkdownSourceView.tsx     # edit: optional ariaLabel
├── compare/
│   ├── diffSequences.ts             # new: Myers matching on string[]
│   ├── textDiff.ts                  # new: word diff over raw Markdown → ranges + summary
│   ├── docDiff.ts                   # new: block/word diff over ProseMirror docs → ranges, blocks + summary
│   ├── compareHighlight.ts          # new: Tiptap extension (plugin state: decorations + summary) + setCompareOriginal()
│   ├── CompareBar.tsx               # new: second bar
│   ├── OriginalPane.tsx             # new: read-only editor / read-only source for the original
│   └── HighlightedSource.tsx        # new: textarea + highlight layer for the new pane in Markdown view
└── README.md                        # edit: props table + "Modo comparación"

tests/MarkdownEditor/
├── diff-sequences.test.ts           # new (unit)
├── compare-mode.test.tsx            # new (US1, US5, default-mode regression)
├── compare-editing.test.tsx         # new (US2, highlights, views)
└── compare-decision.test.tsx        # new (US3, US4, imperative API, showToolbar, onlyView)

playground/main.tsx                  # edit: mode / orientation / new content / decision log controls
CHANGELOG.md, llms.txt, README.md    # edit
```

**Structure Decision**: single package; compare logic lives in a `compare/` folder so default-mode code paths stay
untouched and tree-shaking/readability are preserved.

## Complexity Tracking

> Not applicable — no Constitution violations.

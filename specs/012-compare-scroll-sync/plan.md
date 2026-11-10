# Implementation Plan: Content-Matched Scrolling in Compare Mode

**Branch**: `012-compare-scroll-sync` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-compare-scroll-sync/spec.md`

## Summary

Add one opt-in-by-default prop, `compareSyncScroll` (boolean, default `true`). While a compare session is active and the
prop is on, a `useCompareScrollSync` hook links the scrolling of the two panes. It builds an **alignment**: a sorted list of
anchor pairs `(yOriginal, yNew)` — the pixel offset of the top of the same passage in each pane — plus the two ends
`(0,0)` and `(maxOriginal, maxNew)`. A scroll in the pane that scrolled last (the **leader**) is translated into the
other pane's `scrollTop` by piecewise-linear interpolation between the neighbouring anchors, so gaps (content that exists
on one side only) are crossed proportionally and the next matching passage is reached exactly (FR-003). Anchors come from
the correspondence the compare mode already computes: `diffDocs` pairing of document units in the rendered view
(positions → DOM tops) and a Myers line match (`matchSequences`) of the two Markdown texts in the Markdown view (line tops
measured with an off-screen mirror, because the textarea wraps). With no usable anchors the mapping degrades to
proportional scroll progress (FR-004). A programmatic-scroll guard prevents feedback loops (FR-008); anchors are rebuilt
lazily when content or layout changes and the follower is re-aligned (FR-009). Everything is torn down when the prop is off
or compare mode ends (FR-010/014). See [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict, `noUncheckedIndexedAccess`), React 18 — unchanged.

**Primary Dependencies**: none new (reuses `matchSequences`, `collectUnits`/`diffDocs` pairing, ProseMirror `view.nodeDOM`,
`ResizeObserver`).

**Storage**: N/A.

**Testing**: Vitest + React Testing Library on jsdom, which has no layout: pure unit tests for the interpolation and
anchor-building functions; component tests stub geometry (`scrollHeight`, `clientHeight`, `offsetTop`,
`getBoundingClientRect`) per element and drive scrolling with `el.scrollTop = n` + `fireEvent.scroll`.

**Target Platform**: modern browsers, npm package — unchanged.

**Project Type**: component library (`mdwysiwyg`).

**Performance Goals**: follower updated within the same scroll event (≤ 100 ms, SC-004) for documents up to 5,000 words.
Anchors are measured once per invalidation (one batched layout read), never per scroll event; a scroll costs a binary search
and one assignment.

**Constraints**: outside compare mode nothing is registered (FR-010, SC-006); with the prop off in compare mode only a passive
per-pane `scroll` listener remembers which pane scrolled last (no writes, observers, mirror nodes or measurements). Syncing never modifies content, fires `onChange`, or touches selection/focus (FR-011): only `scrollTop`
of the two scrollers is written. Horizontal scroll is never read or written (FR-016).

**Scale/Scope**: `types.ts` (1 prop), `MarkdownEditor.tsx` (hook wiring, refs), `compare/OriginalPane.tsx` (forward root
ref + expose its editor), `compare/docDiff.ts` (export the pairing step), new `compare/scrollSync/` folder (3 files),
docs (component README, README, llms.txt, CHANGELOG), playground checkbox, new tests.

## Constitution Check

| Principio | Evaluación | Estado |
|---|---|---|
| I. Reusabilidad | Generic prop; no host/business coupling | PASS |
| II. TypeScript Estricto | Typed `Anchor`, `Alignment`, hook options; no `any` | PASS |
| III. React Moderno | One custom hook + effects; no class components | PASS |
| IV. Composición | One boolean is needed: the behavior is internal to the two panes and cannot be composed from outside. No new callbacks | PASS (research §1) |
| V. API Pública | `compareSyncScroll` follows the `compare*` prefix; on by default; documented in the contract | PASS |
| VI. Accesibilidad | Only `scrollTop` changes; no focus/selection change, no animation (honours reduced motion); keyboard and screen-reader scrolling are mirrored like pointer scrolling; nothing new in the DOM tree of the panes | PASS (verify in tests) |
| VII. Styling Encapsulado | Mirror element is styled inline and removed after use; no global CSS, no new custom property | PASS |
| VIII. Dependencias | None added | PASS |
| IX. Testing | Pure-function tests + component tests per user story with stubbed geometry; real-browser check in the playground | PASS (verify in tasks) |
| X. Documentación | README props row + section, llms.txt, CHANGELOG, contract | PASS (verify in tasks) |
| XI–XIII. Paquete/Tree shaking/Build | No packaging change; `verify:dist` re-run | PASS |
| XIV. Calidad | Enforced at merge | PASS |
| XV. Simplicidad | Reuses the existing diff; interpolation over anchors, no new comparison rules, no end-user toggle, no animation | PASS |

No violations. Re-check after Phase 1 design: unchanged, PASS.

## Project Structure

### Documentation (this feature)

```text
specs/012-compare-scroll-sync/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── MarkdownEditor.compare-scroll.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
src/components/MarkdownEditor/
├── types.ts                         # edit: `compareSyncScroll?: boolean`
├── MarkdownEditor.tsx               # edit: call useCompareScrollSync, pass pane refs / editors
├── compare/
│   ├── docDiff.ts                   # edit: export `pairUnits` (the exact+similarity pairing already inside diffDocs); no behavior change
│   ├── OriginalPane.tsx             # edit: forward ref to its root element, `onEditor` callback
│   └── scrollSync/
│       ├── scrollMap.ts             # new: Anchor/Alignment types, normalize (monotonic + ends), mapScroll (binary search + lerp), proportional fallback
│       ├── anchors.ts               # new: unit anchors (rendered view), line anchors (Markdown view, mirror measurement)
│       └── useCompareScrollSync.ts  # new: listeners, leader, guard, lazy anchors, ResizeObserver, re-sync
└── README.md                        # edit: prop row + "Desplazamiento sincronizado" section

tests/MarkdownEditor/
├── scroll-map.test.ts               # new (unit: interpolation, ends, gaps, fallback, monotonic cleanup)
├── scroll-anchors.test.ts           # new (unit: line/unit anchors with stubbed measurements)
└── compare-scroll-sync.test.tsx     # new (US1–US4: both views, orientations, leader, guard, edits, setting on/off, teardown)

playground/main.tsx                  # edit: compareSyncScroll checkbox (default on)
CHANGELOG.md, llms.txt, README.md    # edit
```

**Structure Decision**: single package; the sync logic is isolated in `compare/scrollSync/` with the pure math
(`scrollMap.ts`) separate from DOM measurement (`anchors.ts`) and React wiring (`useCompareScrollSync.ts`) so each layer is
testable on jsdom. Default-mode code paths are untouched.

## Complexity Tracking

> Not applicable — no Constitution violations.

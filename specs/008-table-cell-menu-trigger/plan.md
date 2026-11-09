# Implementation Plan: Table Cell Menu Trigger (corner triangle)

**Branch**: `008-table-cell-menu-trigger` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-table-cell-menu-trigger/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Replace the "second click on the active cell opens the column/row menu" gesture (feature 005) with a
visible trigger: a small right-angled triangle in the top-right corner of the hovered cell. Clicking
it opens the **same** `TableContextMenu` (column menu for `th`, row menu for `td`).

Approach (see [research.md](./research.md)): a single React-managed `<button>` overlay rendered
inside the editor's scroll container (`.content`), positioned over the hovered cell's corner. It is
**outside** the ProseMirror document, so it never reaches the Markdown output (FR-013) and needs no
schema/decoration changes. Hover tracking uses delegated mouse events on the content wrapper.
The triangle is drawn with `clip-path`; `cursor: pointer` gives the "link" pointer. The old
`lastFocusedCellPosRef` / second-click branch is deleted. A keyboard path (`ContextMenu` /
`Shift+F10` while the caret is in a cell) keeps the menu reachable without a mouse (FR-011).
No new dependencies, no public prop/type changes.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 18 — unchanged.

**Primary Dependencies**: none new. Reuses `@tiptap/react`/`@tiptap/pm/state` (already used to anchor
the selection in the clicked cell) and the existing `FloatingPanel` + `TableContextMenu`.

**Storage**: N/A.

**Testing**: Vitest + React Testing Library + user-event (existing). jsdom has no layout, so tests
assert behavior via roles/labels (trigger present/absent, menu kind, action effect, Markdown output);
pixel size/position (SC-005) is verified through the CSS contract and manually via the playground
([quickstart.md](./quickstart.md)).

**Target Platform**: Modern browsers, npm package — unchanged.

**Project Type**: Component library (`mdwysiwyg`).

**Performance Goals**: One overlay element total (not one per cell); hover handler does a single
`closest("th, td")` per `mouseover`. Re-measure only when hover target, selection/doc, or window size
changes.

**Constraints**: Menu contents/labels/behavior unchanged (FR-005, SC-004). No change to
`MarkdownEditorProps`. Styles stay inside the CSS Module with `--mdw-*` custom properties
(Principle VII). Trigger must not affect serialized Markdown, clipboard content or text selection
(FR-013, FR-014).

**Scale/Scope**: `MarkdownEditor.tsx` (remove second-click logic, add hover state, keyboard open,
render trigger), new `views/TableCellTrigger.tsx`, `MarkdownEditor.module.css` (trigger style,
`position: relative` on `.content`, 2 new custom properties), README (Tablas section), CHANGELOG, and
updates to `table-column-menu`/`table-row-menu`/`accessibility` tests plus a new
`table-cell-trigger` test file.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Evaluation | Status |
|---|---|---|
| I. Reusabilidad | Generic editor behavior, no app logic | PASS |
| II. TypeScript Estricto | New component and state fully typed; no `any` | PASS |
| III. React Moderno | Function component + hooks only | PASS |
| IV. Composición | Zero new props; trigger is an internal view piece | PASS |
| V. API Pública | No public API change; only 2 new documented CSS custom properties | PASS |
| VI. Accesibilidad | Real `<button>` with `aria-label`, `aria-haspopup="menu"`, `aria-expanded`; keyboard path via `ContextMenu`/`Shift+F10`; tiny target (user-mandated) mitigated by the keyboard-equivalent control | PASS (verify in tests) |
| VII. Styling Encapsulado | Styles in the existing CSS Module; theme via `--mdw-*` properties | PASS |
| VIII. Dependencias | None added | PASS |
| IX. Testing | Behavior tests: hover show/hide, menu kind, action target, no second-click, no Markdown leak, read-only, keyboard | PASS (to verify in tasks) |
| X. Documentación | Update component README (Tablas), CHANGELOG, theming docs | PASS (to verify in tasks) |
| XI. Compatibilidad | No packaging change | PASS |
| XII. Tree Shaking | Named export, no side effects added | PASS |
| XIII. Build Distribuible | Build unchanged; CSS-module class map must still be emitted (feature 007) — new class names go through the same map | PASS (verify with `verify:dist`) |
| XIV. Calidad | Enforced at merge | PASS |
| XV. Simplicidad | One overlay button vs per-cell widgets/decorations or a pseudo-element plus coordinate hit-testing | PASS |

No violations. No "Complexity Tracking" needed. Re-check after Phase 1: unchanged, PASS.

## Project Structure

### Documentation (this feature)

```text
specs/008-table-cell-menu-trigger/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── table-cell-trigger.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/components/MarkdownEditor/
├── MarkdownEditor.tsx                 # edit: drop second-click branch + lastFocusedCellPosRef;
│                                      #       hover state; keyboard open; render <TableCellTrigger>
├── MarkdownEditor.module.css          # edit: .content position:relative; .tableMenuTrigger;
│                                      #       --mdw-table-menu-trigger-{color,size}
├── README.md                          # edit: "Tablas" section
└── views/
    └── TableCellTrigger.tsx           # new: overlay button (placement + a11y)

tests/MarkdownEditor/
├── table-cell-trigger.test.tsx        # new
├── table-column-menu.test.tsx         # edit: open via trigger instead of second click
├── table-row-menu.test.tsx            # edit: same
└── accessibility.test.tsx             # edit: table-menu test opens via trigger

CHANGELOG.md                           # edit: Unreleased entry
```

**Structure Decision**: Keep the single-package layout. The trigger is a view-layer component next to
`RenderedView`; menu rendering and table commands stay where they are, so only the *way the menu is
opened* changes.

## Complexity Tracking

> Not applicable — Constitution Check has no violations.

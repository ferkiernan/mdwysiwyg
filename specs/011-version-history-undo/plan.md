# Implementation Plan: Version History with Undo / Redo

**Branch**: `011-version-history-undo` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-version-history-undo/spec.md`

## Summary

Add one opt-in prop, `historyUndo` (default `false`). When on, a `useVersionHistory` hook records whole-document Markdown
snapshots: a baseline when recording starts, then one snapshot after 3 s without changes (debounced on the editor's
`source` state, deduplicated against the latest version, capped at 200). A new `IconHistory` button, right after the "insert HTML" button
(default mode only), opens **history mode**: the editor becomes read-only, a `HistoryBar` (← Undo, Redo →, Confirm, Back
to default) appears under the toolbar and a `VersionList` (newest first, time `HH:MM:SS`, viewed version highlighted)
appears on the right (each entry is a button that jumps to that version). Undo/Redo move a viewed index and load that snapshot into the same editor/textarea without
notifying `onChange`. Confirm keeps the viewed content (notifies once if it differs from the content at entry, appends
it as a new latest version if it differs from the latest); Cancel (back to last version) reloads the content at entry and notifies
nothing. Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z / Ctrl+Y map to Undo/Redo while history mode is open. History mode closes
without applying anything when the prop turns false, `onlyView` or compare mode starts, or the toolbar is hidden. See
[research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict, `noUncheckedIndexedAccess`), React 18 — unchanged.

**Primary Dependencies**: none new (state is a plain hook; no history library — Tiptap's own undo stack is unrelated and
unchanged).

**Storage**: N/A — in-memory only, lost on unmount (spec Assumptions).

**Testing**: Vitest + React Testing Library + user-event with fake timers (`vi.useFakeTimers`) for the 3 s rule; pure
unit tests for the reducer/helpers.

**Target Platform**: modern browsers, npm package — unchanged.

**Project Type**: component library (`mdwysiwyg`).

**Performance Goals**: Undo/Redo reflected in ≤ 200 ms for documents up to 5,000 words (SC-002) — one `setContent`
call, same cost as switching views; no per-keystroke work beyond resetting a timer.

**Constraints**: with `historyUndo` false/omitted nothing changes (FR-016, SC-006): no timers, no state beyond an empty
hook, no icon, no extra DOM (the layout wrapper uses `display: contents` when history mode is closed). Browsing must
never fire `onChange` and never touch Tiptap's undo stack (`emitUpdate: false`, `setEditable(…, false)`).

**Scale/Scope**: `types.ts` (1 prop), `MarkdownEditor.tsx`, `Toolbar/Toolbar.tsx` (icon + `locked` state),
`Toolbar/buttons/icons.tsx` (`IconHistory`), new `history/` folder (hook, bar, list), `MarkdownEditor.module.css`,
docs (component README, README, llms.txt, CHANGELOG), playground control, new tests.

## Constitution Check

| Principio | Evaluación | Estado |
|---|---|---|
| I. Reusabilidad | Generic prop; no business logic; no persistence coupling | PASS |
| II. TypeScript Estricto | Typed reducer actions / `Version`; no `any` | PASS |
| III. React Moderno | Function components + hooks only | PASS |
| IV. Composición | One boolean prop is needed: composition cannot add recording or a mode switch. No new callbacks | PASS (research §1) |
| V. API Pública | `historyUndo` follows `onlyView`/`showToolbar` naming; documented in the contract | PASS |
| VI. Accesibilidad | Real `<button>`s; `aria-pressed` on the icon; labelled toolbar; `aria-disabled` (keeps focus) on Undo/Redo; list is a labelled `<ol>` with `aria-current`; polite live region announces "Versión n de m, hora"; document read-only announced; shortcuts | PASS (verify in tests) |
| VII. Styling Encapsulado | CSS Module classes only; reuses existing toolbar/button/theme variables, no new custom property | PASS |
| VIII. Dependencias | None added | PASS |
| IX. Testing | Behavior tests per user story (fake timers) + hook unit tests | PASS (verify in tasks) |
| X. Documentación | README props + section, llms.txt, CHANGELOG, contract | PASS (verify in tasks) |
| XI–XIII. Paquete/Tree shaking/Build | No packaging change; `verify:dist` re-run | PASS |
| XIV. Calidad | Enforced at merge | PASS |
| XV. Simplicidad | In-memory, fixed 3 s and cap, no persistence, no host-visible history API | PASS |

No violations. Re-check after Phase 1 design: unchanged, PASS.

## Project Structure

### Documentation (this feature)

```text
specs/011-version-history-undo/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── MarkdownEditor.history.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
src/components/MarkdownEditor/
├── types.ts                         # edit: `historyUndo?: boolean`
├── MarkdownEditor.tsx               # edit: hook wiring, open/close/undo/redo/confirm/back, read-only, shortcuts, layout
├── MarkdownEditor.module.css        # edit: .historyLayout, .versionList*, reuse .toolbar for the bar
├── Toolbar/
│   ├── Toolbar.tsx                  # edit: history icon (last), `locked` disables editing controls
│   └── buttons/icons.tsx            # edit: IconHistory (clock + counter-clockwise arrow)
├── history/
│   ├── versionHistory.ts            # new: Version type, pure reducer + helpers (record/open/move/close, cap, dedupe)
│   ├── useVersionHistory.ts         # new: hook (debounce timer, baseline, state) over the reducer
│   ├── HistoryBar.tsx               # new: "← Undo", "Redo →", "Confirm", "Cancel (back to last version)"
│   └── VersionList.tsx              # new: right panel, newest first, entries are buttons (jump), aria-current, scroll into view
└── README.md                        # edit: prop row + "Historial de versiones" section

tests/MarkdownEditor/
├── version-history.test.ts          # new (unit: reducer, dedupe, cap)
├── history-recording.test.tsx       # new (US1, FR-016 regression)
├── history-mode.test.tsx            # new (US2, US3, US5: icon, bar, list, undo/redo, read-only, shortcuts)
└── history-decision.test.tsx        # new (US4: confirm/back, forced closes, imperative API, showToolbar/onlyView/compare)

playground/main.tsx                  # edit: historyUndo checkbox
CHANGELOG.md, llms.txt, README.md    # edit
```

**Structure Decision**: single package; history logic lives in a `history/` folder (pure reducer separate from React
timer code so it is unit-testable), default-mode code paths stay untouched.

## Complexity Tracking

> Not applicable — no Constitution violations.

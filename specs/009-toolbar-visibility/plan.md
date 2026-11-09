# Implementation Plan: Toolbar Visibility Control

**Branch**: `009-toolbar-visibility` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-toolbar-visibility/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add one optional boolean prop, `showToolbar` (default `true`), to `MarkdownEditor`. When `false`, the toolbar
(editing bar, or the reduced `onlyView` bar) is not rendered; the content area, already `flex: 1`, takes the freed
height. Because the toolbar is a self-contained subtree (its dropdown/dialog state lives inside `Toolbar`), un-mounting
it closes anything open without side effects, removes it from the tab order/accessibility tree, and leaves the editor,
view mode, undo history and `onChange` untouched. A small wrapper returns focus to the editor if a toolbar control
had focus at the moment it is removed. No new dependencies. See [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 18 — unchanged.

**Primary Dependencies**: none new.

**Storage**: N/A (presentation-only prop; not persisted).

**Testing**: Vitest + React Testing Library + user-event (existing).

**Target Platform**: modern browsers, npm package — unchanged.

**Project Type**: component library (`mdwysiwyg`).

**Performance Goals**: toggle takes effect in one render; no editor re-creation (editor deps stay `[sanitizeEmbeddedHtml, onlyView]`).

**Constraints**: default `true` keeps all existing behavior (FR-002, SC-003). Toggle must not emit `onChange`.

**Scale/Scope**: `types.ts` (1 prop), `MarkdownEditor.tsx` (conditional render + focus-return wrapper), `MarkdownEditor.module.css`
(wrapper `display: contents`), README / llms.txt / CHANGELOG, new test file, playground control.

## Constitution Check

| Principio | Evaluación | Estado |
|---|---|---|
| I. Reusabilidad | Generic presentation prop | PASS |
| II. TypeScript Estricto | Typed prop, no `any` | PASS |
| III. React Moderno | Function components/hooks | PASS |
| IV. Composición | One boolean prop; justified because composition cannot remove the built-in toolbar | PASS |
| V. API Pública | Consistent with `onlyView`/`resizable` (optional boolean, documented, exported via `MarkdownEditorProps`) | PASS |
| VI. Accesibilidad | Hidden toolbar leaves tab order and a11y tree; focus returned to the editor | PASS (verify in tests) |
| VII. Styling Encapsulado | Wrapper style lives in the CSS Module | PASS |
| VIII. Dependencias | None | PASS |
| IX. Testing | Behavior tests for each story/FR | PASS (to verify in tasks) |
| X. Documentación | README props table, llms.txt, CHANGELOG | PASS (to verify in tasks) |
| XI–XIII. Paquete/Tree shaking/Build | No packaging change | PASS |
| XIV. Calidad | Enforced at merge | PASS |
| XV. Simplicidad | Conditional render instead of CSS hiding or a visibility state machine | PASS |

No violations. Re-check after Phase 1: unchanged, PASS.

## Project Structure

### Documentation (this feature)

```text
specs/009-toolbar-visibility/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── MarkdownEditor.showToolbar.md
└── tasks.md             # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
src/components/MarkdownEditor/
├── types.ts                      # edit: showToolbar?: boolean
├── MarkdownEditor.tsx            # edit: prop (default true); conditional <ToolbarSlot><Toolbar/></ToolbarSlot>
├── MarkdownEditor.module.css     # edit: .toolbarSlot { display: contents }
├── views/ToolbarSlot.tsx         # new: wrapper that returns focus to the editor when unmounted while holding focus
└── README.md                     # edit: props table + section

tests/MarkdownEditor/toolbar-visibility.test.tsx   # new
playground/main.tsx                                 # edit: show/hide toggle for manual checks
CHANGELOG.md, llms.txt, README.md                   # edit: document the prop
```

**Structure Decision**: single package; the toolbar stays a self-contained child, only its mounting becomes conditional.

## Complexity Tracking

> Not applicable — no Constitution violations.

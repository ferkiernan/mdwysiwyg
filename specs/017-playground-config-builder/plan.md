# Implementation Plan: Playground Configuration Builder (attributes and final CSS)

**Branch**: `017-playground-config-builder` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-playground-config-builder/spec.md`

## Summary

A new "builder" area at the top of the playground: section **"Seleccioná los atributos de tu control"** then the reworked
**theming** section, both driving **one sticky shared preview** of `<MarkdownEditor>`. Attributes come from a generated
`attributes.json` (built from `types.ts` JSDoc by 015's analyzer) so the list never drifts; theme tokens come from 015's
`themeTokens` list. Pure generators produce the outputs: `buildAttributesSnippet(choices, "jsx" | "object")` and
`buildThemeCss(values, scope, darkValues?)` (changed values only by default, CSS comments with instructions). An
always-visible CSS output panel updates live; **"Crear CSS"** and **"Copiar atributos"** copy with confirmation and fall back
to a selected textarea. Choices persist in `localStorage` with "Empezar de nuevo". Package untouched. See
[research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.9, React 18 — unchanged.

**Primary Dependencies**: none new (`typescript` compiler API, already a devDependency, used only in the generator script).

**Storage**: browser `localStorage` (key `mdwysiwyg-playground-builder`, versioned) — demo only.

**Testing**: Vitest unit tests for the pure generators, validators and dependency notes (`tests/playground/*.test.ts`);
RTL smoke test of the builder sections (render, change one attribute, copy calls clipboard / fallback). Manual end-to-end
"paste into a minimal host" check (quickstart).

**Target Platform**: local Vite playground and GitHub Pages live demo.

**Project Type**: component library — change limited to the demo app plus a dev script.

**Performance Goals**: preview updates within one frame of an input change (single `MarkdownEditor` re-render; CSS applied via one
`<style>` element).

**Constraints**: package `src/` unchanged (FR-020); Spanish UI (FR-019); outputs must work in a host with no edits (SC-004/005).

**Scale/Scope**: `playground/main.tsx` (compose new sections, keep existing demos), new `playground/builder/` (≈7 files),
`scripts/gen-playground-attributes.mjs`, `playground/generated/attributes.json` (generated, committed), `package.json` scripts
(`gen:playground`, run by `predev` / `prebuild:demo`), tests, CHANGELOG line.

**Dependencies**: 015 (tokens list, fallback CSS, JSDoc + analyzer), 016 (guide link component). If 015 is not in place, the
builder uses the current tokens and a hand-written attribute list; the generator is added with 015.

## Constitution Check

| Principio | Evaluación | Estado |
|---|---|---|
| I–V | Demo-only; no public API change | PASS |
| VI. Accesibilidad | Labeled inputs, keyboard operable, `aria-live` confirmations, sticky preview not trapping focus | PASS |
| VII. Styling Encapsulado | Preview themed only through public tokens on a class (dogfoods 015) | PASS |
| VIII. Dependencias | None added | PASS |
| IX. Testing | Generators/validators unit-tested; builder smoke test | PASS |
| X. Documentación | Builder points to the guide; CHANGELOG | PASS |
| XI–XIII | Package and `verify:dist` unaffected | PASS |
| XIV. Calidad | Tests + typecheck include the playground files | PASS |
| XV. Simplicidad | Pure functions + plain React state; no form/state library | PASS |

No violations. Re-check after design: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/017-playground-config-builder/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/builder-outputs.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
playground/
├── main.tsx                         # edit: render <ConfigBuilder/> first; existing demos unchanged below
├── generated/attributes.json        # new (generated): name, kind, options, default, summary, dependsOn
└── builder/
    ├── ConfigBuilder.tsx            # new: layout (two sections + sticky preview), state, persistence
    ├── AttributesSection.tsx        # new: inputs per attribute, dependency notes, format selector, "Copiar atributos"
    ├── ThemeSection.tsx             # new: grouped token inputs, presets, scope, dark option, output panel, "Crear CSS", guide link
    ├── generators.ts                # new: buildAttributesSnippet, buildThemeCss (pure)
    ├── validation.ts                # new: isValidCssValue (CSS.supports), isValidClassName, dependency notes
    ├── presets.ts                   # new: default, dark, brand, flat (moved/extended from main.tsx)
    └── clipboard.ts                 # new: copy with fallback
scripts/gen-playground-attributes.mjs # new: types.ts → attributes.json (reuses 015 analyzer)
tests/playground/
├── generators.test.ts               # new
├── validation.test.ts               # new
└── config-builder.test.tsx          # new (smoke)
package.json                         # edit: gen:playground, predev, prebuild:demo
CHANGELOG.md                         # edit
```

**Structure Decision**: move the builder out of the 670-line `main.tsx` into `playground/builder/` with pure modules separated
from UI so they are unit-testable; the existing theming demo is replaced by the new theme section.

## Complexity Tracking

> Not applicable — no Constitution violations.

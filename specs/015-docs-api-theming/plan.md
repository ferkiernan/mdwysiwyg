# Implementation Plan: Self-Documented API, Complete Documentation and Clear CSS Customization

**Branch**: `015-docs-api-theming` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-docs-api-theming/spec.md`

## Summary

Three strands, no runtime behavior change:

1. **Self-documented API**: every prop, callback, `ref` method and exported type in `types.ts` gets a complete Spanish JSDoc
   block (purpose, values, `@default`, runtime-change note, relationships, `@example` where useful, `@see` to the guide
   section). tsup's `dts` output keeps JSDoc, so the descriptions ship in `dist/index.d.ts`.
2. **Theming that works at any level**: the control stops *declaring* public `--mdw-*` properties. Defaults move to private
   tokens (`--_mdw-*`) computed on `.root` as `var(--mdw-x, <default>)`, and every rule reads the private token. Host values
   declared on the control's class **or any ancestor** therefore always win, in any stylesheet load order, without
   `!important` (FR-018). Fixed colors a theme needs (syntax highlighting, blockquote, menus/popovers/dialogs, bars, controls,
   danger links, table picker) become new public points with identical defaults (FR-025). Portaled floating panels receive a
   snapshot of the resolved public values so per-instance and wrapper themes reach them.
3. **Documentation set refresh + checks**: a dedicated Spanish guide `docs/THEMING.md` (full token table, three declaration
   levels, recipes incl. dark theme / OS preference, supported vs. unsupported, troubleshooting, CSS strategies); props
   reference, root README, `llms.txt`, CHANGELOG and playground brought up to date; a non-blocking `scripts/check-docs.mjs`
   (warnings only, run by `npm run check:docs` and inside `prepublishOnly`) reports undocumented props, props missing from docs
   and tokens missing from / unknown to the guide.

See [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 18, CSS Modules — unchanged.

**Primary Dependencies**: none new. The check script uses the `typescript` compiler API already in devDependencies.

**Storage**: N/A.

**Testing**: Vitest + RTL on jsdom. New tests: token fallback/precedence (computed custom properties in jsdom are resolved
by string — tests assert the CSS text rules and the inline snapshot on floating panels), recipe smoke tests, a unit test of the
check script's analyzer (pure functions). Visual equality of defaults verified in the playground (manual) and by a static
comparison of every default value before/after (scripted in the check).

**Target Platform**: modern browsers (custom properties with fallbacks), npm package.

**Project Type**: component library (`mdwysiwyg`).

**Performance Goals**: no measurable change; the floating-panel snapshot reads ≤ 60 computed properties once per open.

**Constraints**: default appearance identical (FR-028, SC-006); no prop/token removed or renamed; checks never fail the
build (Clarification Q4); each document keeps its language (Q3).

**Scale/Scope**: `types.ts` (JSDoc only), `MarkdownEditor.module.css` (token restructure + new tokens),
`Toolbar/buttons/FloatingPanel.tsx` (theme snapshot), new `docs/THEMING.md`, `src/components/MarkdownEditor/README.md`,
`README.md`, `llms.txt`, `CHANGELOG.md`, `playground/main.tsx` (all props + full theme panel, drop the `!important` hack),
`package.json` (`files` += `docs`, `check:docs`, `prepublishOnly`), new `scripts/check-docs.mjs`, new tests.

**Dependency on 013/014**: `autoHeight` and `autoHideBar` are not implemented yet. This plan documents them once they exist;
if 015 lands first, the check script will warn about them when they are added. Recommended order: implement 013 and 014,
then 015.

## Constitution Check

| Principio | Evaluación | Estado |
|---|---|---|
| I. Reusabilidad | Theming made host-agnostic (any level, any CSS strategy) | PASS |
| II. TypeScript Estricto | JSDoc only; no type changes | PASS |
| III. React Moderno | Only `FloatingPanel` gains a small effect | PASS |
| IV. Composición | No new props; customization stays CSS | PASS |
| V. API Pública | API documented in the types themselves; tokens are the public styling API, listed and checked | PASS |
| VI. Accesibilidad | No behavior change; guide covers forced-colors and contrast notes | PASS |
| VII. Styling Encapsulado | Public tokens `--mdw-*`, private `--_mdw-*`; internal class names stay non-public | PASS |
| VIII. Dependencias | None added | PASS |
| IX. Testing | Fallback/precedence/snapshot tests, analyzer unit tests, recipe smoke tests | PASS (verify in tasks) |
| X. Documentación | This feature's core | PASS |
| XI–XIII. Paquete/Tree shaking/Build | `files` adds `docs/`; `verify:dist` re-run; d.ts carries JSDoc | PASS |
| XIV. Calidad | Checks warn (by decision) — release review confirms 0 warnings | PASS (justified by Clarification Q4) |
| XV. Simplicidad | One private-token layer; no theme provider, no new props | PASS |

No violations. Re-check after Phase 1 design: unchanged, PASS.

## Project Structure

### Documentation (this feature)

```text
specs/015-docs-api-theming/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── theming-tokens.md        # public token list (existing + new), defaults, precedence
│   └── jsdoc-and-checks.md      # JSDoc block format per item kind + check script output contract
├── checklists/requirements.md
└── tasks.md                     # /speckit-tasks
```

### Source Code (repository root)

```text
src/components/MarkdownEditor/
├── types.ts                          # edit: full JSDoc on every prop/callback/method/type
├── MarkdownEditor.module.css         # edit: private tokens, fallbacks, new public tokens
├── Toolbar/buttons/FloatingPanel.tsx # edit: snapshot of resolved public tokens on the portal wrapper
└── README.md                         # edit: props reference complete, link to docs/THEMING.md, theming section shortened

docs/THEMING.md                       # new: customization guide (Spanish)
scripts/check-docs.mjs                # new: non-blocking documentation checks
README.md, llms.txt, CHANGELOG.md     # edit
playground/main.tsx                   # edit: control per prop, full theme panel, no !important
package.json                          # edit: files += docs, check:docs, prepublishOnly

tests/MarkdownEditor/
├── theming-tokens.test.tsx           # new: fallbacks, precedence, floating snapshot, recipes smoke
└── check-docs.test.ts                # new: analyzer functions (never fails the suite on real warnings)
```

**Structure Decision**: single package. The guide lives in `docs/` (shipped in the npm tarball and linked from the root README
by repository URL) so it is reachable from npm, GitHub and an installed copy.

## Complexity Tracking

> Not applicable — no Constitution violations.

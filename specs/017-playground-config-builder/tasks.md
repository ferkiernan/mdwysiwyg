# Tasks: Playground Configuration Builder

**Tests**: included.

## Phase 1: Setup

- [X] T001 Create `scripts/gen-playground-attributes.mjs` (+ `.d.mts`) generating `playground/generated/attributes.json` from `types.ts`; `gen:playground`, `predev`, `prebuild:demo` in `package.json`
- [X] T002 [P] `playground/builder/types.ts`, `presets.ts` (the 7 previous playground presets kept as they were + control default, full dark, brand, flat), `clipboard.ts`

## Phase 2: Foundational (pure modules)

- [X] T003 `playground/builder/generators.ts`: `buildAttributesSnippet` (JSX / object, non-defaults, placeholders, className), `buildThemeCss` (scope, changed/all, dark block, instructions, invalid comments)
- [X] T004 `playground/builder/validation.ts`: `isValidCssValue`, `isValidClassName`, `dependencyNotes`
- [X] T005 Tests `tests/playground/generators.test.ts` (generators, validation, generated list = `types.ts`)

## Phase 3: US2 — Attributes section (P1)

- [X] T006 [US2] «Seleccioná los atributos de tu control» in `playground/builder/ConfigBuilder.tsx`: input per attribute, default, summary, dependency notes, format selector, «Copiar atributos», visible snippet, clipboard fallback

## Phase 4: US1 — Theming section (P1)

- [X] T007 [US1] Theming section: presets, Restablecer, scope (control / section / page) with class name validation, include-all, OS dark variant, grouped token inputs (45) with invalid flagging, always-visible CSS panel, «Crear CSS», guide link

## Phase 5: US3 — Shared preview and flow (P2)

- [X] T008 [US3] One sticky preview driven by both sections (same CSS text, page scope confined to the preview), stacked on narrow screens; persistence in `localStorage` + «Empezar de nuevo»
- [X] T009 [US3] Replace the old theming demo in `playground/main.tsx` with the builder (other demos unchanged)
- [X] T010 Smoke tests `tests/playground/config-builder.test.tsx`

## Phase 6: Polish

- [X] T011 CHANGELOG line
- [X] T012 Browser check: builder layout, live CSS, preview theming, autoHeight, autoHideBar
- [ ] T013 Paste both outputs into a separate minimal host app; timed flow (SC-002, SC-003)

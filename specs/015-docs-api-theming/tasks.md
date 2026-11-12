# Tasks: Self-Documented API, Complete Documentation and Clear CSS Customization

**Tests**: included (constitution IX, XIV).

## Phase 1: Foundational (theming model)

- [X] T001 Inventory fixed colors in `src/components/MarkdownEditor/MarkdownEditor.module.css` and fix the new token list (20) in `contracts/theming-tokens.md`
- [X] T002 Restructure `MarkdownEditor.module.css`: private `--_mdw-*` tokens as `var(--mdw-*, default)`, no public declarations, every rule reads private tokens, fixed colors replaced by new tokens
- [X] T003 [P] Create `src/components/MarkdownEditor/theme/themeTokens.ts` (47 tokens: name, group, kind, default, description) and `copyThemeTokens`
- [X] T004 Copy resolved public tokens onto the portal wrapper in `src/components/MarkdownEditor/Toolbar/buttons/FloatingPanel.tsx`
- [X] T005 Update `tests/MarkdownEditor/extended-theming.test.tsx` and `toolbar-theming.test.tsx` to the fallback model (effective value helper)
- [X] T006 Create `tests/MarkdownEditor/theming-tokens.test.tsx`: no public declarations, private tokens match the contract, class and ancestor levels, class beats ancestor, panel copy

## Phase 2: US1 — Self-documented API

- [X] T007 [US1] Full Spanish JSDoc (`@default`, runtime notes, relationships, `@example`, `@see`) for every prop, callback, ref method and exported type in `src/components/MarkdownEditor/types.ts`
- [X] T008 [US1] Verify JSDoc ships in `dist/index.d.ts` after `npm run build` (21 `@default`)

## Phase 3: US3 — Customization guide

- [X] T009 [US3] Write `docs/THEMING.md` (levels and priority, full token tables generated from `themeTokens.ts`, recipes, CSS strategies, supported/unsupported, troubleshooting, print/forced colors)
- [X] T010 [US3] Ship `docs/` in the package (`package.json` `files`)

## Phase 4: US2 / US4 — Documentation set and checks

- [X] T011 [US2] Component README: props table complete (`autoHeight`, `autoHideBar`), sections «Ocultar la barra al perder el foco» and «Alto automático», theming summary linking the guide, exported types
- [X] T012 [US2] [US4] Root README: links to props reference, guide and playground; theming snippet; feature rows (sizing, toolbar, theming, imperative API)
- [X] T013 [US2] `llms.txt`: exports, every prop with default, `autoHeight`, `autoHideBar`, theming model and guide link
- [X] T014 [US2] CHANGELOG «Unreleased» entries for 013, 014, 015
- [X] T015 [US2] `scripts/check-docs.mjs` (+ `.d.mts`), `npm run check:docs`, appended to `prepublishOnly`; analyzer tests in `tests/docs/check-docs.test.ts`; output 0 warnings
- [X] T016 Playground: every prop and full theme panel — delivered by feature 017 (config builder)

## Phase 5: Validation

- [X] T017 `npm test`, `npm run typecheck`, `npm run build`, `npm run verify:dist` green
- [X] T018 Browser check: default appearance unchanged, dark recipe at three levels and both load orders (with 017's builder)

# Tasks: Playground Redesign and Black Text Cursor by Default

## Phase 1: User Story 2 (P1), black cursor

- [X] T001 [US2] Make the SVG I-beam the default of `--_mdw-content-cursor` in
  `src/components/MarkdownEditor/MarkdownEditor.module.css`
- [X] T002 [US2] Use the same default and description for the token in
  `src/components/MarkdownEditor/theme/themeTokens.ts`
- [X] T003 [US2] Update the cursor test in `tests/MarkdownEditor/theming-tokens.test.tsx`
- [X] T004 [US2] Update the reference row and the recipe in `docs/THEMING.md`

## Phase 2: User Story 1 (P1), playground redesign

- [X] T005 [US1] Write the playground stylesheet `playground/playground.css`:
  - tokens;
  - header and tabs;
  - cards and controls;
  - builder grid (1500 / 900 breakpoints);
  - demo layouts.
- [X] T006 [US1] Header, tab navigation (hash) and demo panels in `playground/main.tsx`
- [X] T007 [US1] Grouped attributes, classes instead of inline styles, and a sticky preview in
  `playground/builder/ConfigBuilder.tsx`
- [X] T008 [P] [US1] Inherit the page style in `playground/builder/StylingGuideLink.tsx`
- [X] T009 [US1] Test: every attribute appears exactly once in the grouped list, in
  `tests/playground/config-builder.test.tsx`

## Phase 3: Polish

- [X] T010 Add the `CHANGELOG.md` entry (Unreleased): cursor default, playground redesign
- [X] T011 Run typecheck, tests, `check:docs`, `build` and `build:demo`
- [X] T012 Browser check at 1500, 1920 and 2560:
  - no horizontal scroll;
  - the preview stays visible;
  - the tabs work;
  - the cursor is the black I-beam.

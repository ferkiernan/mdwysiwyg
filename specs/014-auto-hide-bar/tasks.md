# Tasks: Auto-Hide Toolbar on Focus Loss

- [X] T001 [P] Add `autoHideBar?: boolean` with JSDoc (default false; precedence of `showToolbar`; compare/history bars not affected) in `src/components/MarkdownEditor/types.ts`
- [X] T002 [US1] In `src/components/MarkdownEditor/MarkdownEditor.tsx`: `autoHideBar = false`; `focusInside` state with onFocus/onBlur on the root (timer on blur, cancel on focus), initial check on mount; render the toolbar only when `showToolbar && (!autoHideBar || focusInside)`
- [X] T003 [US1] [US2] [US3] [US4] Create `tests/MarkdownEditor/auto-hide-bar.test.tsx`: default always visible; hidden initially; shown on focus (click/Tab); hidden after focus leaves; stays while moving content ↔ toolbar ↔ dialog; showToolbar=false wins; onlyView reduced bar; compare bar stays; toggling prop at runtime; hidden bar not focusable; no onChange
- [X] T004 Docs: component README, README, llms.txt, CHANGELOG; playground checkbox
- [X] T005 Run tests, typecheck, build, verify:dist; browser check

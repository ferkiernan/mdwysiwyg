# Tasks: Close Toolbar Mini-Dialogs on an Outside Click

- [X] T001 [US1] Add `onDismiss` (outside `pointerdown`, anchor excluded) in
  `src/components/MarkdownEditor/Toolbar/buttons/FloatingPanel.tsx`
- [X] T002 [US1] Wire the toolbar panels and add the same-button toggle in
  `src/components/MarkdownEditor/Toolbar/Toolbar.tsx`
- [X] T003 [US1] Wire the Export menu in `src/components/MarkdownEditor/Toolbar/buttons/ExportMenu.tsx`
- [X] T004 [US1] [US2] Add tests in `tests/MarkdownEditor/floating-panel-dismiss.test.tsx`:
  - each of the 6 panels;
  - the click still places the cursor;
  - another button;
  - the same button;
  - Escape.
- [X] T005 Update the component README and the `CHANGELOG.md`
- [X] T006 Run tests, typecheck and the build, then check in the browser with real clicks

# Tasks: Move a List Item Up or Down with the Keyboard

- [X] T001 [US1] [US2] Add the `moveListItem` command and the Ctrl-Shift-ArrowUp/Down shortcuts in
  `src/components/MarkdownEditor/markdown/listEditing.ts`
- [X] T002 [US1] [US2] Add tests in `tests/MarkdownEditor/list-editing.test.ts`:
  - up and down, with the cursor kept;
  - an item with children (subtree);
  - first and last positions;
  - checked state and numbered lists;
  - several selected items;
  - outside a list and in read-only mode;
  - undo;
  - Shift+Up without Ctrl.
- [X] T003 Add the «Mover ítems de lista» section to `src/components/MarkdownEditor/README.md`
- [X] T004 Add the `CHANGELOG.md` entry (Unreleased › Added)
- [X] T005 Run tests, typecheck, `check:docs` and the build, then check in the browser with real keys

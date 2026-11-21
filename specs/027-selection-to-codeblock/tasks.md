# Tasks: Turn a Multi-Block Selection into a Single Code Block

- [X] T001 [US1] Add the `selectionToCodeBlock` command in
  `src/components/MarkdownEditor/markdown/codeBlockSelection.ts`
- [X] T002 [US1] [US2] Wire it into the language picker in `src/components/MarkdownEditor/Toolbar/Toolbar.tsx`
- [X] T003 [US1] [US2] Add tests in `tests/MarkdownEditor/selection-to-codeblock.test.tsx`:
  - paragraphs;
  - a mix of headings, paragraphs and nested lists;
  - partial lines;
  - a partial list;
  - an item with children;
  - quotes, tables, code, images and rules;
  - a single line and table cells;
  - undo and the cursor;
  - the toolbar flow with one `onChange`.
- [X] T004 Update the component README (Bloques) and the `CHANGELOG.md`
- [X] T005 Run tests, typecheck and the build, then check in the browser

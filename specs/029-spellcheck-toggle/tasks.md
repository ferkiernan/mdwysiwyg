# Tasks: Attribute to Turn Spell Checking On and Off

- [X] T001 [US1] Add the `spellCheck` prop with JSDoc in `src/components/MarkdownEditor/types.ts`
- [X] T002 [US1] Add the `spellcheck` attribute and the live update in `src/components/MarkdownEditor/MarkdownEditor.tsx`
- [X] T003 [US1] Add tests in `tests/MarkdownEditor/spellcheck.test.tsx`:
  - the default;
  - `false`;
  - a live change that keeps the editor, content, selection and undo;
  - the Markdown view always off.
- [X] T004 Update the docs:
  - `src/components/MarkdownEditor/README.md` (props table and section);
  - `README.md`;
  - `llms.txt`;
  - `CHANGELOG.md`.
- [X] T005 Update the playground: group entry in `playground/builder/ConfigBuilder.tsx`, regenerate
  `playground/generated/attributes.json`
- [X] T006 Run typecheck, tests, build, `verify:dist` and `check:docs`, then check in the browser

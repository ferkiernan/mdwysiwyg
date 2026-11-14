# Tasks: Adjustable Content Padding

- [X] T001 [US1] Add `--_mdw-content-padding: var(--mdw-content-padding, 12px 16px)` and use it in `.ProseMirror`, `.source` and `.sourceLayer` in `src/components/MarkdownEditor/MarkdownEditor.module.css`
- [X] T002 [US1] Add the token (group content, kind `padding`) to `src/components/MarkdownEditor/theme/themeTokens.ts`; add kind `padding` to `playground/builder/validation.ts`
- [X] T003 [US2] Test in `tests/MarkdownEditor/theming-tokens.test.tsx`: the three content padding rules read the private token; class and ancestor declarations reach the control
- [X] T004 Docs: `docs/THEMING.md` table (regenerated) + recipe line, component README theming summary, `llms.txt`, CHANGELOG
- [X] T005 Validate (tests, typecheck, build, verify:dist, check:docs) and browser check (both views, compare highlight alignment, autoHeight)

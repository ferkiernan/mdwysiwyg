# Tasks: Auto-Height

- [X] T001 [P] Add `autoHeight?: boolean` with JSDoc (default false, height = minimum, no resize handle) in `src/components/MarkdownEditor/types.ts`
- [X] T002 [P] Add `autoSize` to `src/components/MarkdownEditor/views/MarkdownSourceView.tsx` (scrollHeight sizing on value change + ResizeObserver) and forward it from `compare/HighlightedSource.tsx` and `compare/OriginalPane.tsx`
- [X] T003 [US1] [US4] In `src/components/MarkdownEditor/MarkdownEditor.tsx`: `autoHeight = false`; root class `.autoHeight`, `minHeight` instead of `height`, no `.resizable`; pass `autoSize` to both source views
- [X] T004 [US1] [US3] Add `.autoHeight` rules in `src/components/MarkdownEditor/MarkdownEditor.module.css` (content/panes/history flex `1 0 auto`, textarea `flex: 1 0 auto`, version list `contain: size`)
- [X] T005 [US1] [US2] [US3] [US4] Create `tests/MarkdownEditor/auto-height.test.tsx`: default unchanged (height, resizable); on → min-height, no resizable, class; textarea auto-size in both panes with stubbed scrollHeight; toggling keeps content and does not call onChange
- [X] T006 Docs: component README (prop row + section), README feature row, llms.txt, CHANGELOG; playground checkbox
- [X] T007 Run tests, typecheck, build, verify:dist; check in the browser

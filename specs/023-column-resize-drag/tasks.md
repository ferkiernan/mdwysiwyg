# Tasks: Resize a Column by Dragging Its Header Border

## Phase 1: Foundational

- [X] T001 Markdown ↔ width helpers (`splitRow`, `explicitWidths`, `remarkColumnWidths`, `rehypeCollectColumnWidths`,
  `applyColumnWidths`) in `src/components/MarkdownEditor/markdown/columnWidths.ts`
- [X] T002 Wire the helpers into `markdownToEditorHtml` / `editorHtmlToMarkdown` in
  `src/components/MarkdownEditor/markdown/pipeline.ts`

## Phase 2: User Story 1 (P1), drag to resize

- [X] T003 [US1] `ColumnResize` extension in `src/components/MarkdownEditor/markdown/columnResize.ts`:
  - hit test on the lower half of the header's right border;
  - drag with live feedback;
  - commit in one transaction.
- [X] T004 [US1] Register the extension in `src/components/MarkdownEditor/markdown/tiptapMarkdownBridge.ts`
- [X] T005 [US1] `col-resize` cursor rules in `src/components/MarkdownEditor/MarkdownEditor.module.css`
- [X] T006 [P] [US1] Tests in `tests/MarkdownEditor/column-resize.test.tsx`:
  - round-trip and automatic tables;
  - alignment colons;
  - quotes and escaped pipes;
  - hover area;
  - one change per drag.

## Phase 3: User Story 2 (P2), limits

- [X] T007 [US2] Minimum width (40 px) and read-only checks, with tests in `tests/MarkdownEditor/column-resize.test.tsx`

## Phase 4: Polish

- [X] T008 Docs:
  - tables section of `src/components/MarkdownEditor/README.md`;
  - `CHANGELOG.md` (Unreleased);
  - `llms.txt`.
- [X] T009 Browser check in the playground with real drags: widen, narrow to the minimum, Markdown view round-trip.

# Tasks: Sentence-Level Highlight Rule in Compare Mode

- [X] T001 [P] Create `src/components/MarkdownEditor/compare/sentences.ts` (`sentenceIndexes`, `wholeSentences`)
- [X] T002 [US1] [US3] Per-sentence marks in `markPaired` and share-a-sentence pairing in `src/components/MarkdownEditor/compare/docDiff.ts` (code blocks unchanged)
- [X] T003 [US2] Syntax-aware words and per-sentence ranges in `src/components/MarkdownEditor/compare/textDiff.ts`
- [X] T004 Tests `tests/MarkdownEditor/compare-sentences.test.tsx`: ratios, mixed paragraph, shortened/lengthened, code, new paragraph, structural change, same result in both views; update existing compare tests only where the new rule intentionally changes the expected paint
- [X] T005 Docs: component README compare section, CHANGELOG
- [X] T006 Validate (tests, typecheck, build, verify:dist, check:docs), merge to master, push

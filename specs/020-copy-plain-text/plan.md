# Implementation Plan: "Copy as TXT" Export Option

**Branch**: `020-copy-plain-text` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

## Summary

New pure module `markdown/plainText.ts` (`markdownToPlainText`) parses the document's Markdown with the existing
`remark-parse` + `remark-gfm` and walks the tree to plain text (rules in FR-004/005). `ExportMenu.tsx` gets a third
`menuitem` «Copiar como TXT» that copies `markdownToPlainText(source)` with the same close/focus behavior. Because the
input is the Markdown source, the result is identical from both views, compare and history mode.

## Technical Context

TypeScript strict; reuses existing unified/remark deps (no new dependency). Tests: unit tests of the converter per element
type and a menu test (order, clipboard, close + focus, onlyView).

## Constitution Check

All principles PASS: no new props or dependencies; accessible `menuitem`; tests and docs included.

## Project Structure

```text
src/components/MarkdownEditor/markdown/plainText.ts        # new
src/components/MarkdownEditor/Toolbar/buttons/ExportMenu.tsx # third option
tests/MarkdownEditor/export-plain-text.test.tsx            # new
README.md, src/components/MarkdownEditor/README.md, llms.txt, CHANGELOG.md
```

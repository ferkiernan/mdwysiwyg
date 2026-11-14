# Implementation Plan: Sentence-Level Highlight Rule in Compare Mode

**Branch**: `019-compare-sentence-highlight` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

## Summary

A shared pure module `compare/sentences.ts` segments a word list into sentences (end punctuation followed by a capital /
digit / opening mark, or a hard break) and decides, from the word matches already computed, which new sentences are painted
whole: for each new sentence its counterpart is the original sentence that receives most of its matched words; difference =
(added + removed) ÷ (original + new words) (Clarification); whole when > 0.5.

- **Rendered view** (`docDiff.ts`): inside paired text blocks the word marks are now built per sentence (whole-sentence mark
  or changed-word runs that never cross a sentence). Code blocks keep line marks; unpaired / structurally changed blocks keep
  the block highlight. Pairing also accepts two same-type blocks that share an identical sentence (≥ 3 words), so a
  multi-sentence paragraph with one untouched sentence is no longer painted whole (SC-002).
- **Markdown view** (`textDiff.ts`): Markdown syntax tokens (heading/list/quote/task markers, table pipes, fences) are
  excluded from matching and counting; table pipes and line breaks end sentences; the same sentence decision builds the
  ranges.

## Technical Context

TypeScript strict; no new dependencies; existing Myers matcher. Tests: unit tests for segmentation and the decision
(ratios 0/25/50/51/75/100 %), `diffText` and `diffDocs` cases (mixed paragraph, shortened/lengthened sentence, code block,
new paragraph, heading level change), component test that both views paint the same sentence whole.

## Constitution Check

| Principio | Estado |
|---|---|
| I–V: no API change | PASS |
| VI: summary still counts passages (whole sentence = 1) | PASS |
| VII–VIII: no CSS/dependency change | PASS |
| IX: unit + component tests | PASS |
| X: README compare section + CHANGELOG | PASS |
| XI–XV: pure, local change | PASS |

## Project Structure

```text
src/components/MarkdownEditor/compare/sentences.ts   # new: segmentation + whole-sentence decision
src/components/MarkdownEditor/compare/docDiff.ts     # per-sentence marks; share-a-sentence pairing
src/components/MarkdownEditor/compare/textDiff.ts    # syntax-aware words; per-sentence ranges
tests/MarkdownEditor/compare-sentences.test.ts(x)    # new
src/components/MarkdownEditor/README.md, CHANGELOG.md
```

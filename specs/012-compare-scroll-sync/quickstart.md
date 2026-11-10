# Quickstart: validating Compare Scroll Sync

## Prerequisites

```bash
npm install
npm run typecheck
npm test
```

## Automated validation

```bash
npx vitest run tests/MarkdownEditor/scroll-map.test.ts tests/MarkdownEditor/scroll-anchors.test.ts tests/MarkdownEditor/compare-scroll-sync.test.tsx
npm test && npm run typecheck && npm run build && npm run verify:dist
```

Expected: all green; pre-existing suites (compare, history, etc.) pass unchanged (SC-006). jsdom has no layout, so geometry is
stubbed per element; real wrapping/images are covered by the manual checks below.

## Manual validation (playground)

```bash
npm run dev
```

Open the playground, choose `mode: compare`, a long Markdown in `markdown`, and a `compareContent` that adds ~10 paragraphs near
the top, changes some words further down and removes a few paragraphs near the end. Then:

1. Scroll the **original** pane to a paragraph far down: the new pane shows that same paragraph at its top, not the one at the
   same percentage (US1-1, US1-3, SC-002).
2. Scroll the **new** pane: the original follows (US1-2).
3. Scroll through an added section: the original moves smoothly (no freeze/jump) and lands on the next shared paragraph
   (US1-4, SC-008). Go to the very top / bottom of one pane: the other goes to its top / bottom (FR-005).
4. Switch orientation (side-to-side ↔ up-and-down) and view (rendered ↔ Markdown): panes stay aligned (US2).
5. Type several lines in the new pane so it scrolls to follow the caret: the original follows; the new pane never jumps
   by itself; no jitter (US3-1, US3-4, SC-005). Delete a paragraph above the viewed spot: panes re-align (US3-2).
6. Use a mouse wheel, scrollbar drag and keyboard (PageDown, arrows): same result in both panes (FR-007).
7. Untick **compareSyncScroll**: panes scroll independently. Scroll the original, tick it again: the new pane aligns with the
   original (last scrolled) and nothing else changes (US4, FR-017).
8. Accept/Reject/Restore: single pane, no leftover behavior (FR-010).

## Acceptance map

| Check | Story / FR |
|---|---|
| Follow by content in both directions, insertions don't misalign | US1, FR-001/002, SC-001/002 |
| Gap interpolation, fallback, ends | US1-4, FR-003/004/005, SC-008 |
| Orientations and views | US2, FR-006 |
| Editing, caret scroll, content/layout change, no loop | US3, FR-007/008/009, SC-005 |
| Host setting on/off, re-align on enable | US4, FR-014/015/017, SC-007 |
| No change outside compare / off | FR-010/011, SC-006 |
| Vertical only | FR-016 |

## Validation record (2026-11-09)

- Automated: 400 tests, typecheck, build and `verify:dist` green.
- Playground (real layout, built-in browser): rendered view — scrolling the original or the new pane to a filler paragraph
  leaves that paragraph at the same offset (±1 px) in the other pane despite inserted blocks; top/bottom map to top/bottom;
  crossing the added section moves the original monotonically. Markdown view (wrapped lines) — same, ±1 px.
- Limitation of the check: scrolls were driven by assigning `scrollTop`. The rendered-view checks received native `scroll`
  events; the Browser pane then became hidden and stopped dispatching them, so the Markdown-view checks dispatched `scroll`
  by hand. Wheel/scrollbar/keyboard gestures and orientation switching with real events were not exercised by hand.

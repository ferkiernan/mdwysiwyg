---

description: "Task list for Content-Matched Scrolling in Compare Mode"
---

# Tasks: Content-Matched Scrolling in Compare Mode

**Input**: Design documents from `/specs/012-compare-scroll-sync/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/MarkdownEditor.compare-scroll.md, quickstart.md

**Tests**: Included (constitution Principles IX, XIV). Write each story's tests first and confirm they fail. jsdom has no layout: geometry is stubbed per element (`scrollHeight`, `clientHeight`, `offsetTop`, `getBoundingClientRect`) and scrolling is simulated with `el.scrollTop = n` + `fireEvent.scroll(el)`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependencies)
- **[Story]**: US1...US4 (maps to spec.md)

## Path Conventions

Single project: `src/components/MarkdownEditor/`, `tests/MarkdownEditor/`.

---

## Phase 1: Setup

- [X] T001 Run `npm run typecheck` and `npm test`; record the green baseline (349 tests) before changes

---

## Phase 2: Foundational (blocking)

**Purpose**: public prop, pure scroll mapping, anchor extraction and the pane plumbing every story uses.

- [X] T002 [P] In `src/components/MarkdownEditor/types.ts` add `compareSyncScroll?: boolean` with its doc comment (default `true`, per `contracts/MarkdownEditor.compare-scroll.md`); no new exported types
- [X] T003 [P] Create `tests/MarkdownEditor/scroll-map.test.ts` (pure unit tests): `normalizeAlignment` adds the `(0,0)` and `(maxOriginal,maxCurrent)` end anchors, sorts by `original`, drops anchors that are non-monotonic in `current` or outside `[0,max]`; `mapScroll` returns the exact `current` at an anchor, interpolates linearly inside a segment (both axes), crosses a gap proportionally and monotonically (no step larger than the segment), returns the other pane's start/end at `0`/`max` (FR-005), handles zero-length segments and zero max (nothing to scroll), clamps to the target range, and with only the end anchors behaves as proportional progress (FR-004); inverse mapping ≈ identity on non-degenerate segments
- [X] T004 Create `src/components/MarkdownEditor/compare/scrollSync/scrollMap.ts`: `Anchor { original; current }`, `Alignment`, `normalizeAlignment(anchors, maxOriginal, maxCurrent)`, `mapScroll(alignment, axis, scrollTop)` (binary search + lerp) per data-model.md; make T003 pass
- [X] T005 [P] Create `tests/MarkdownEditor/scroll-anchors.test.ts`: `pairUnits` returns order-preserving `[originalIndex, currentIndex]` pairs — exact matches, similar-unit pairing inside gaps (Dice ≥ 0.5), repeated identical units paired in order, nothing for unrelated units; `lineAnchors` (with injected line-top measurements) pairs identical lines in order, maps indices to the measured tops, skips unmeasurable lines; `unitAnchors` (with injected `measureTop`) skips units without a DOM element or zero size; a smoke test of the real mirror measurement under stubbed `offsetTop` (mirror removed from the DOM afterwards)
- [X] T006 In `src/components/MarkdownEditor/compare/docDiff.ts` extract the exact-match + in-gap similarity pairing out of `diffDocs` into an exported `pairUnits(originalUnits, currentUnits)` and have `diffDocs` call it; behavior unchanged — all existing compare tests must stay green
- [X] T007 [P] In `src/components/MarkdownEditor/compare/OriginalPane.tsx` forward a ref to the root `div` (`forwardRef`) and add an optional `onEditor?: (editor: Editor | null) => void` called when the pane's editor is created/recreated/destroyed
- [X] T008 Create `src/components/MarkdownEditor/compare/scrollSync/anchors.ts`: `unitAnchors({ pairs, originalUnits, currentUnits, measureTop })`, `lineAnchors({ originalText, currentText, measureLineTops })` (uses `matchSequences` on lines), and `measureLineTops(textarea, text)` using an off-screen mirror (copies computed font, padding, letter-spacing, tab-size, white-space, word-break; width = `clientWidth`; one block per line, empty lines get a zero-width space; attached, read, removed in the same call); make T005 pass
- [X] T009 [P] In `tests/MarkdownEditor/helpers.tsx` add `setupCompareScroll(props?)` (renders compare mode with a long original and a new content with insertions/deletions, view mode and orientation options), `stubScroller(el, { scrollHeight, clientHeight, tops? })` defining per-element geometry, `scrollPane(el, top)` (assign `scrollTop` + `fireEvent.scroll`) and `expectScrollTop(el, value)`

**Checkpoint**: scroll-map and anchors unit tests green; `OriginalPane` exposes its root and editor; existing compare tests still green.

---

## Phase 3: User Story 1 - Scrolling one pane keeps the other on the same content (Priority: P1) MVP

**Goal**: in the rendered view, scrolling either pane moves the other to the matching content; gaps are crossed proportionally; ends match; no feedback loop; nothing outside compare mode.

**Independent Test**: compare a long document with extra paragraphs near the top: scroll the original far down — the new pane shows the same paragraph at its top, not the same percentage.

### Tests (write first)

- [X] T010 [US1] Create `tests/MarkdownEditor/compare-scroll-sync.test.tsx` (rendered view, side-to-side): scrolling the original to a paragraph far down puts the new pane at that paragraph's offset despite earlier insertions (FR-001/002, SC-002); scrolling the new pane moves the original (US1-2); inside an added passage the follower moves proportionally and monotonically and lands exactly on the next shared paragraph (FR-003, SC-008); top ↔ top and bottom ↔ bottom (FR-005); almost no shared content → proportional progress (FR-004)
- [X] T011 [US1] In the same file: no feedback loop — after the follower is moved, its own scroll event does not write back to the leader (spy on the leader's `scrollTop` setter, FR-008); a genuine user scroll of the follower right afterwards becomes the new leader; a pane with nothing to scroll does not throw; default mode and a single pane (no session) add no `scroll` listeners (spy on `addEventListener`, FR-010)

### Implementation

- [X] T012 [US1] Create `src/components/MarkdownEditor/compare/scrollSync/useCompareScrollSync.ts`: options `{ active, viewMode, originalRoot, currentRoot, originalEditor, currentEditor, originalMarkdown, source, orientation }`; resolves each pane's scroller for the view; registers `scroll` listeners (only when `active`); keeps `leader` (initial `"current"`), `guard`, cached `alignment`, `dirty`; on a non-echo scroll sets the leader, rebuilds the alignment if dirty (rendered view: `pairUnits` → `unitAnchors` with `view.nodeDOM(pos)` tops relative to the scroller; ends from `scrollHeight − clientHeight`), maps `scrollTop`, writes the other scroller and arms the guard only if its value changed; only `scrollTop` is read/written (FR-011/016); cleans up listeners on inactive/unmount
- [X] T013 [US1] In `src/components/MarkdownEditor/MarkdownEditor.tsx` accept `compareSyncScroll = true`, keep refs to the original pane root and its editor (`OriginalPane` `ref`/`onEditor`) and to `contentRef`, and call `useCompareScrollSync({ active: session !== null && compareSyncScroll, … })`; make T010–T011 pass

**Checkpoint**: US1 independently testable — rendered view, side-to-side.

---

## Phase 4: User Story 2 - Works in both orientations and both views (Priority: P1)

**Goal**: same behavior in up-and-down, in the Markdown view, and when switching view or orientation.

**Independent Test**: repeat the US1 check for each combination of orientation × view.

### Tests (write first)

- [X] T014 [US2] In `tests/MarkdownEditor/compare-scroll-sync.test.tsx`: up-and-down orientation behaves like side-to-side (each pane still scrolls independently within its area, US2-2); Markdown view: scrolling either textarea moves the other by matching lines, with wrapped lines measured through the mirror stub (US2-3); switching rendered ↔ Markdown and changing `compareOrientation` re-aligns the panes without a scroll (US2-4); the new textarea's highlight layer still follows its `scrollTop` (existing behavior preserved)

### Implementation

- [X] T015 [US2] In `useCompareScrollSync.ts` add the Markdown-view alignment (`lineAnchors` over `originalMarkdown` / `source` with `measureLineTops` on each pane's textarea; scroller = the textarea) and mark the alignment dirty and re-align the follower from the leader when `viewMode`, `orientation` or the resolved scrollers change; orientation needs no other code (research §8); make T014 pass

**Checkpoint**: US1 + US2 — all four view/orientation combinations.

---

## Phase 5: User Story 3 - Stays matched while editing and when content changes (Priority: P2)

**Goal**: typing, caret-follow scrolling, host content changes and late layout changes keep the panes aligned without loops or the edited pane jumping.

**Independent Test**: type several lines in the new pane so it scrolls: the original follows to the matching content, with no back-and-forth.

### Tests (write first)

- [X] T016 [US3] In `tests/MarkdownEditor/compare-scroll-sync.test.tsx`: a caret-follow scroll of the new pane (scroll event while typing) moves the original (US3-1, FR-007); an edit in the new pane (rendered `update` / textarea `input`) makes it the leader and re-aligns only the original — the new pane's `scrollTop` is never written, even if the original was the last scrolled (research §6); removing/adding text above the viewed spot re-aligns without a scroll (US3-2); changing `compareContent` re-aligns with the leader kept (US3-3); a `ResizeObserver` callback (stubbed) marks the alignment dirty and re-aligns the follower (late image/diagram sizing, FR-009); after a burst of scrolls no write is issued once both panes rest (SC-005)

### Implementation

- [X] T017 [US3] In `useCompareScrollSync.ts`: subscribe to the new editor's `update` event and to the new textarea's `input` to set `leader = "current"`, mark dirty and re-align the original; mark dirty and re-align on `source`, `originalMarkdown` and editor-instance changes (leader unchanged for host-driven changes); observe both scrollers and their first child with `ResizeObserver` (guard for environments without it) to mark dirty and re-align; disconnect on cleanup; make T016 pass

**Checkpoint**: US1–US3.

---

## Phase 6: User Story 4 - The host can turn the synchronization off (Priority: P2)

**Goal**: `compareSyncScroll` off ⇒ independent panes at zero cost; toggling at runtime is safe.

**Independent Test**: with the prop off scroll one pane — the other does not move; turn it on — the panes align; turn it off — they stop following.

### Tests (write first)

- [X] T018 [US4] In `tests/MarkdownEditor/compare-scroll-sync.test.tsx`: omitted prop = on (US4-1); `compareSyncScroll={false}` → scrolling either pane leaves the other at 0 px and no `scroll` listener / `ResizeObserver` / mirror node is created (US4-2, SC-006/007); false → true re-aligns the other pane to the last-scrolled pane (new pane if none) without moving the leader (US4-3, FR-017); true → false moves nothing at that moment and later scrolls are independent (US4-4); toggling does not change content, caret, selection, highlight or `onChange` calls (US4-5, FR-011); accept / reject / restore ending compare mode leaves no listeners and no behavior change (edge case); `onlyView` and `showToolbar={false}` compare variants still sync

### Implementation

- [X] T019 [US4] In `useCompareScrollSync.ts` make the effect depend on `active` so an off→on transition runs one re-sync from the current leader (leader pane untouched) and an on→off transition only removes listeners/observers/guard/alignment; confirm the `MarkdownEditor.tsx` wiring from T013 passes the prop on every render; make T018 pass

**Checkpoint**: all four user stories independently functional.

---

## Phase 7: Polish & Cross-Cutting

- [X] T020 [P] Update `src/components/MarkdownEditor/README.md`: `compareSyncScroll` row in the props table and a short "Desplazamiento sincronizado en comparación" section (what is matched, top-edge reference, proportional gaps, fallback, vertical only, no animation, how to turn it off)
- [X] T021 [P] Update root `README.md` props table and `llms.txt` with `compareSyncScroll`
- [X] T022 [P] Add an "Added" entry to `CHANGELOG.md` (`compareSyncScroll`, default on)
- [X] T023 [P] In `playground/main.tsx` add a `compareSyncScroll` checkbox (default on) next to the other compare controls
- [X] T024 Run `npm test`, `npm run typecheck`, `npm run build` and `npm run verify:dist`; all green with the pre-existing suites unchanged (SC-006)
- [X] T025 Manual validation in the playground per `quickstart.md` (both views, both orientations, wrapping, typing, setting on/off, accept/reject); record any deviation in `quickstart.md`
- [X] T026 Re-check `checklists/requirements.md` and tick this file's tasks

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → stories. Within Phase 2: T003 → T004; T005 → T006 and T008; T007 and T009 independent; T008 needs T004 only for types (`Anchor`).
- US1 (T010–T013) needs Phase 2. US2 (T014–T015) builds on the hook from T012. US3 (T016–T017) and US4 (T018–T019) build on the same hook file, so run them after US1 and sequentially with each other (same file).
- Polish (T020–T023) after the behavior is stable; T024–T026 last.

### Parallel opportunities

- T002, T003, T005, T007, T009 can start together (different files).
- T020, T021, T022, T023 can run together.
- Test tasks within `compare-scroll-sync.test.tsx` (T010/T011/T014/T016/T018) share one file: write them per story, sequentially.

## Implementation Strategy

- **MVP**: Phase 1–3 (US1): content-matched scrolling in the rendered view, side by side.
- **Increments**: US2 (Markdown view, orientation) → US3 (editing, resizes) → US4 (setting) → polish; each story ends with its tests green and the full suite unchanged.

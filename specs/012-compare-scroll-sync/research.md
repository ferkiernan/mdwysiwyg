# Research: Content-Matched Scrolling in Compare Mode

No `NEEDS CLARIFICATION` items remained after `/speckit-clarify`; these are design decisions.

## 1. Public API shape

**Decision**: one optional boolean prop `compareSyncScroll?: boolean`, default `true`. No callbacks, no handle methods.

**Rationale**: the spec asks for a host-level on/off (FR-014) that can change at any time. The `compare*` prefix matches
`compareOrientation` / `compareContent`. Anything else (smoothing, anchor granularity) stays internal (principle XV).

**Alternatives**: `syncScroll` (loses the "compare" scope); `compareScroll="sync" | "off"` (a string union for two states);
a `{ enabled, mode }` object (speculative, unstable identity).

## 2. Mapping model: anchors + piecewise-linear interpolation

**Decision**: an *alignment* is a list of anchors `{ original: number, current: number }` (pixel offsets of the top of the
same passage in each pane's scroll content), normalized to be non-decreasing in both coordinates and bracketed by
`(0, 0)` and `(maxOriginal, maxCurrent)` where `max = scrollHeight − clientHeight`. `mapScroll(alignment, from, scrollTop)`:
binary-search the segment containing `scrollTop` on the leader's axis and linearly interpolate on the follower's axis
(zero-length segments return the segment start).

**Rationale**:
- The clarified reference point is the **top edge** of the viewport (spec Q5), which is exactly `scrollTop`.
- Interpolating between neighbouring anchors gives FR-003 for free: inside a gap the follower moves in proportion and lands
  exactly on the next anchor (monotonic, no single jump larger than the segment, SC-008).
- Ends are anchors, so FR-005 (top/bottom ↔ top/bottom) holds and the mapping is total.
- The same function serves both directions (swap the axes) and the proportional fallback (an alignment that only contains the
  two end anchors), covering FR-004.

**Alternatives**: percentage-only sync (violates FR-002); mapping the viewport centre (rejected in clarification); snapping to
the nearest anchor (freezes inside gaps, violates FR-003).

**Cleanup rule**: sort by `original`; keep an anchor only if `current ≥` the last kept `current` and both lie inside
`[0, max]`. Greedy keep is enough because the pairs come from an order-preserving match.

## 3. Where anchors come from (reuse of compare mode's diff)

### Rendered view

Compare mode already pairs document *units* between the original and the new doc (`collectUnits`, then exact matches via
`matchSequences` on unit keys, then similarity pairing ≥ 0.5 inside gaps — `diffDocs`). Plan: export the pairing step as
`pairUnits(originalUnits, currentUnits): Array<[originalIndex, currentIndex]>` and have `diffDocs` call it (pure refactor,
existing compare tests must stay green). Each paired unit gives an anchor: top offset of the unit's DOM node in each editor
(`view.nodeDOM(unit.pos)` → `getBoundingClientRect().top − scroller.top + scroller.scrollTop`). Units without a DOM element
(or zero-sized) are skipped.

Both editors are needed: the new one is already available in `MarkdownEditor`; `OriginalPane` gets an `onEditor` callback so
the original's editor can be read (it is recreated when `markdown` or the extensions change, so the callback fires again).

### Markdown view

There are no units; the two texts are matched **by line**: `matchSequences(originalLines, currentLines)` gives matched
line pairs (Myers, exact lines; order-preserving, so repeated lines pair in document order). Line tops cannot be derived from
`line × lineHeight` because the textareas use `white-space: pre-wrap` and wrap long lines. They are measured with an
**off-screen mirror**: a `div` with the textarea's computed font, padding, letter-spacing, tab-size, white-space and
word-break, width = textarea `clientWidth`, containing one block `div` per line (empty lines get a zero-width space). The
mirror is attached, `offsetTop` of each line read, and it is removed in the same task (single layout). Only matched lines are
read, but the mirror must contain every line to get correct wrapping.

**Large documents**: Myers has the existing `maxEdits` cap; if it is exceeded `matchSequences` already degrades to a coarse
match, and with no anchors the mapping is proportional (FR-004). Measurement cost is linear in lines.

**Alternatives**: `textarea.scrollHeight` proportional per line count (wrong with wrapping); reusing `HighlightedSource`'s
highlight layer for measurement (it only exists for the new pane, and not in default mode); character-level mapping through
the diff words (needs per-character coordinates, far costlier).

## 4. Which element scrolls

- Rendered view: the pane root `.content` div (`overflow: auto`) — `contentRef` for the new pane, the `OriginalPane` root for
  the original.
- Markdown view: the `<textarea>` itself (`.source` is `overflow-y: auto`; in the new pane it sits in `.sourceWrap`, whose
  highlight layer follows through the existing `onScrollCapture` handler when we assign `scrollTop`, so no extra work).

The hook resolves the scroller from the pane root and the current view (`viewMode === "markdown" ? root.querySelector("textarea") : root`)
so it re-resolves on every view switch.

## 5. Leader and loop prevention

**Decision**: a `leader: "original" | "current"` ref, initial `"current"` (the editable pane — FR-017 "or the editable pane if
none"). Each scroller has a `scroll` listener. On event from pane P:
1. If a guard says this event is the echo of our own write to P (`guard.el === P && Math.abs(P.scrollTop − guard.value) < 1`), clear the guard and return — it neither changes the leader nor scrolls the other pane.
2. Otherwise `leader = P`, compute the target for the other pane Q, and, if `Q.scrollTop` would change, set the guard
   `{ el: Q, value: clampedTarget }` *after* assigning and reading back `Q.scrollTop` (the browser clamps it), then assign.

**Rationale**: no timers (a time window could swallow a genuine user scroll); the guard is value-based and only armed when a
write actually changed `scrollTop` (otherwise no event fires and a stale guard would linger). The mapping is applied
synchronously in the event handler — scroll events are already delivered once per frame, so a `requestAnimationFrame` hop
would only add a frame of lag (SC-004) and make tests async for no gain.

**Whatever caused the scroll** (wheel, scrollbar, keyboard, caret-follow while typing) fires the same `scroll` event, which is
why FR-007/FR-015 need no special cases.

## 6. When the alignment is rebuilt (FR-009)

The alignment is **lazy**: a `dirty` flag; the next scroll (or a re-sync) rebuilds it. Invalidated by:
- change of the new content (`source`), the original markdown (`session.original`), the view mode, the orientation, or the
  new/original editor instance;
- a `ResizeObserver` on both scrollers and their first child (image/diagram loading, pane resize, orientation change);
- `compareSyncScroll` turning on.

After invalidation caused by a *layout/content* change the follower is **re-aligned** immediately (rebuild, then map the
leader's current `scrollTop` to the follower). Mapping is never applied to the leader.

**Edits and the leader**: an edit in the new pane (Tiptap `update` event, or `input` on the textarea) makes the **new pane the
leader** before re-aligning, so typing can never move the pane being typed in (a stale "original is leader" would otherwise
yank the editing pane). Host-driven changes (`compareContent`, imperative methods) emit no `update`, so the leader is kept. This
refines FR-015 for edits without changing it for scrolls.

## 7. Setting on / off and teardown

The hook takes two flags: `active = session !== null` and `enabled = compareSyncScroll`. Without `active` the effect returns
early: nothing is registered (FR-010, SC-006). With `active` but not `enabled` (setting off) it only keeps a passive `scroll`
listener per pane that records **which pane scrolled last**; it never writes, measures, observes or builds a mirror, so the
panes behave exactly as before this feature (FR-014, SC-007). That passive record is what lets FR-017 align to "the pane scrolled
last" when the setting is turned on later (the editable pane if none scrolled). Turning it **off** removes the observer, the edit
listeners, the guard and the cached alignment (neither pane moves). Turning it **on** runs one re-sync from the current leader
(FR-017). Ending compare mode unmounts the original pane and the effect cleanup removes everything.

## 8. Orientation

Both orientations use the same elements; only layout differs. The `ResizeObserver` covers the pane-size change when the host
switches orientation, so no orientation-specific code exists (FR-006).

## 9. Horizontal scroll

Only `scrollTop` is ever read or written; `scrollLeft` is untouched (FR-016). The existing highlight-layer sync of the new
textarea (`scrollTop`/`scrollLeft`) keeps working because assigning `scrollTop` raises a normal `scroll` event on it.

## 10. Testing without layout (jsdom)

- `scrollMap.ts`: pure; exhaustive unit tests (ends, inside gap, exact anchor, zero-length segments, non-monotonic cleanup,
  fallback, symmetric inverse).
- `anchors.ts`: take the measuring functions as parameters (`measureUnitTop(unit)`, `measureLineTops(text, textarea)`) so tests
  pass deterministic numbers; one smoke test with the real mirror under stubbed `offsetTop`.
- Component tests (`compare-scroll-sync.test.tsx`): per-element geometry stubs (`Object.defineProperty` on `scrollHeight`,
  `clientHeight`, `offsetTop`; `getBoundingClientRect` for rendered units) and `scrollTop` assignments followed by
  `fireEvent.scroll`. Assertions: follower `scrollTop` value, no counter-scroll (spy on the leader's `scrollTop` setter), leader
  switching, setting on/off, edit keeps the new pane stationary, 0 listeners/observers when off (spy on `addEventListener`).
- Real layout (wrapping, images, ResizeObserver) is verified manually in the playground (see quickstart).

## 11. Documentation

Component README: new prop row and a short section ("what is matched, fallback, limits": vertical only, instant, top edge,
gaps proportional). Root README prop table, `llms.txt` prop line, CHANGELOG "Added".

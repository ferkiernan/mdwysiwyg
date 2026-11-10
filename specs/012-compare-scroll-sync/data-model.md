# Data Model: Content-Matched Scrolling in Compare Mode

All structures are internal and in memory; nothing is exported from the package and nothing is persisted.

## Pane

| Field | Type | Notes |
|---|---|---|
| `id` | `"original" \| "current"` | which side |
| `root` | `HTMLElement` | `.content` div of the pane |
| `scroller` | `HTMLElement` | `root` in the rendered view, the pane's `<textarea>` in the Markdown view (resolved per view) |
| `editor` | `Editor \| null` | Tiptap editor (rendered view only) |

## Anchor

`{ original: number; current: number }` — pixel offsets (from the top of each scroller's scrollable content) of the top of
the same passage.

Rules:
- Both values `≥ 0` and `≤` the pane's max scroll (`scrollHeight − clientHeight`) after clamping.
- Within an `Alignment`, anchors are sorted by `original` and **non-decreasing in both** fields (greedy cleanup drops violators).

Sources:
- Rendered view: one per paired unit `(i, j)` from `pairUnits` → tops of `nodeDOM(original[i].pos)` and `nodeDOM(current[j].pos)`.
- Markdown view: one per matched line pair `(i, j)` from `matchSequences(originalLines, currentLines)` → mirror tops of lines `i`, `j`.

## Alignment

`readonly Anchor[]` always starting with `{0, 0}` and ending with `{maxOriginal, maxCurrent}` (the end anchors are always
present, so the mapping is total; with no other anchors it is the proportional fallback).

Function: `mapScroll(alignment, axis: "original" | "current", scrollTop): number` → other pane's `scrollTop`,
piecewise linear, clamped to the target range. `mapScroll(a, "current", mapScroll(a, "original", s)) ≈ s` on non-degenerate
segments.

## SyncState (hook-internal refs)

| Field | Type | Notes |
|---|---|---|
| `leader` | `"original" \| "current"` | last pane that scrolled; initial `"current"`; set to `"current"` on an edit |
| `guard` | `{ el: HTMLElement; value: number } \| null` | echo of our own write; cleared when matched |
| `alignment` | `Alignment \| null` | cached |
| `dirty` | `boolean` | set by content/layout/view/orientation/editor changes and by `ResizeObserver`; rebuilt lazily |

State transitions:

```text
inactive ──(session && compareSyncScroll)──▶ active[dirty]
active ──scroll(P, not guard echo)──▶ leader=P; rebuild if dirty; write other pane (guard armed if changed)
active ──scroll(P, guard echo)──▶ guard cleared (no other effect)
active ──content/layout change──▶ dirty; re-align follower from leader
active ──edit in new pane──▶ leader="current"; dirty; re-align original
active ──(prop off)──▶ passive (only `leader` is recorded on scroll; observers/edit listeners/guard/alignment dropped)
passive ──(prop on)──▶ active[dirty]; follower re-aligned to `leader`
active|passive ──(compare ends)──▶ inactive (everything dropped, leader reset)
```

## Validation rules (from the spec)

| Rule | Where |
|---|---|
| FR-003 / SC-008 gap interpolation, monotonic | `mapScroll` (anchors non-decreasing) |
| FR-004 fallback | alignment with only end anchors |
| FR-005 ends | end anchors |
| FR-008 no loop | guard |
| FR-010 / SC-006 zero cost off | `active` false ⇒ no effect body |
| FR-011 no content change | only `scrollTop` writes |
| FR-016 vertical only | `scrollLeft` never touched |

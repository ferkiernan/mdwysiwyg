# Contract: `MarkdownEditor` — compare-mode scroll sync

## Props

```ts
interface MarkdownEditorProps {
  /**
   * In `mode="compare"`, keeps both panes on matching content while scrolling (either pane leads; the other follows by
   * content, crossing added/removed passages proportionally). Vertical scroll only. Can change at any time.
   * Default: true.
   */
  compareSyncScroll?: boolean;
}
```

No new exported types, callbacks or handle methods. No end-user control in the UI.

## Behavior

| Situation | Result |
|---|---|
| Compare mode active, `compareSyncScroll` omitted/true | Scrolling a pane scrolls the other to the matching content (top edge ↔ top edge) |
| `compareSyncScroll={false}` | Panes scroll independently; nothing is written, measured or observed (only the last-scrolled pane is remembered, to align on enabling) |
| Prop false → true (compare active) | Other pane aligns to the pane scrolled last (new pane if none); the leader does not move; content, caret, selection and `onChange` untouched |
| Prop true → false | Nothing moves at that moment; independent from then on |
| Not in compare mode / after accept, reject, restore | No synchronization, no change from the previous release |
| Content only on one side | Follower moves proportionally across the passage and lands on the next matching content |
| Almost no common content / no match | Proportional to scroll progress; top ↔ top and bottom ↔ bottom always hold |
| Rendered ↔ Markdown view, orientation change | Panes re-align on matching content |
| Typing in the new pane / caret-follow scroll | New pane never moved by the sync; original follows it |
| `compareContent` changes | Panes re-align (leader unchanged, follower moves) |
| Late image/diagram sizing, pane resize | Follower re-aligned |
| Horizontal scroll | Never synchronized |
| `onlyView` / `showToolbar={false}` compare variants | Sync still applies |

## Matching rules

- Rendered view: paired document units (same pairing used to highlight differences); position = top of the unit's element.
- Markdown view: identical lines matched in order; position = top of the wrapped line.
- Between matches: linear interpolation; no animation (instant), so reduced-motion preferences are respected.

## Limits

- Vertical only; top edge of the viewport is the reference point.
- Quality is best-effort for documents with long unmatched stretches (proportional there).

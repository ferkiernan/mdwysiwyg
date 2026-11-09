# Contract: compare mode

```ts
type EditorMode = "default" | "compare";
type CompareOrientation = "side-to-side" | "up-and-down";
interface CompareDecision {
  decision: "accepted" | "rejected";
  /** Markdown that is now the content of the control. */
  markdown: string;
}

interface MarkdownEditorProps {
  /** "default" (current behavior) or "compare". Default: "default". */
  mode?: EditorMode;
  /** Layout of the two panes in compare mode. Required for compare to activate. */
  compareOrientation?: CompareOrientation;
  /** New (proposed) Markdown shown in the editable pane. Required for compare to activate. */
  compareContent?: string;
  /** Called once when the user accepts or rejects the change. */
  onCompareDecision?: (result: CompareDecision) => void;
}
```

## Activation

Compare is active only when `mode === "compare"` **and** `compareOrientation` **and** `compareContent` are defined.
Otherwise the control behaves exactly as in default mode (single pane, no compare bar, no error).

## Panes

| Orientation | Original (read-only) | New (editable) |
|---|---|---|
| `side-to-side` | left | right |
| `up-and-down` | top | bottom |

Each pane takes half of the space. With `onlyView`, both are read-only. The rendered/Markdown view toggle switches both
panes; differences are highlighted in either view. Original content = the content the control held when compare started
(for a fresh mount, `initialContent`).

## Compare bar (below the toolbar; hidden when `showToolbar` is `false`)

| Button | Visible | Enabled | Effect |
|---|---|---|---|
| Rechazar cambio | always | new content differs from original | Keeps the original; `onChange(original)`, then `onCompareDecision({decision:"rejected", markdown: original})`; back to default mode |
| Aceptar cambio | always | new content differs from original | Keeps the new pane's current Markdown (including manual edits); `onChange(markdown)`, then `onCompareDecision({decision:"accepted", markdown})`; back to default mode |
| Restaurar | only when the new pane differs from `compareContent` | yes | New pane returns to `compareContent`; `onChange(compareContent)` |

## Runtime behavior

- Changing `mode`, `compareOrientation` or `compareContent` while mounted updates immediately without remounting.
  Orientation changes keep the new pane's content (including manual edits).
- A different `compareContent` during compare replaces the new pane (manual edits discarded); the original is kept.
- Switching to default mode shows the new pane's current content in the single editor.
- After accept/reject the control stays in default mode until the host leaves compare (`mode: "default"`) and sets it
  again, or passes a different `compareContent`.
- `onChange` in compare mode reports the Markdown of the new pane. It is not called when compare starts or when the host
  replaces `compareContent`.
- Imperative API in compare mode: `reset()` = "Restaurar"; `isModified()` is true exactly when "Restaurar" is visible;
  `insertMarkdown` / `setMarkdown` act on the new pane.

## Highlighting

- Rendered view: changed or added words get a yellow `<mark>` background (`--mdw-compare-highlight-bg`); entirely new
  paragraphs, list items, table rows and code blocks are highlighted as a whole; changed lines inside code / Mermaid
  blocks are highlighted. Removed content is not marked (it is visible in the original pane).
- Markdown view: changed or added words of the source are highlighted.
- Accessibility: panes are labelled groups; the original pane is announced read-only; the new pane is described with
  the number of highlighted differences; the compare bar is a labelled toolbar.

## Out of scope

Synchronized scrolling, per-difference accept/reject, navigation between differences, marking removed text in the
original pane.

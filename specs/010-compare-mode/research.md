# Research: Compare Mode

No `NEEDS CLARIFICATION` items remained after `/speckit-clarify`; these are design decisions.

## 1. Public API shape

**Decision**: four flat, optional props:

```ts
mode?: "default" | "compare";                         // default "default"
compareOrientation?: "side-to-side" | "up-and-down";
compareContent?: string;                              // the new Markdown
onCompareDecision?: (result: { decision: "accepted" | "rejected"; markdown: string }) => void;
```

**Rationale**: matches the style of `onlyView` / `showToolbar` / `onChange` (flat props, callbacks prefixed `on`). The
`compare` prefix keeps the props self-describing at the top level (a bare `orientation` would be ambiguous). A single
decision callback with a discriminated `decision` is simpler for hosts than two callbacks and carries the Markdown
(FR-011/FR-012). Compare is active only when `mode === "compare"` **and** both `compareOrientation` and
`compareContent` are defined (FR-002); otherwise the control is exactly in default mode.

**Alternatives**: one `compare={{ orientation, content }}` object (new identity every render, awkward change
detection); `onAccept` + `onReject` (two callbacks for one decision); reuse `onChange` only (host cannot tell accept
from reject).

## 2. Architecture: the existing editor is the new pane

**Decision**: the current editor/source/toolbar/table menu/link popover stay exactly as they are and become the
**new** pane. Compare adds a second, read-only Tiptap editor (same extensions, `editable: false`) for the original
(`OriginalPane`) and a layout wrapper.

**Rationale**: FR-014 (all editing features apply to the new pane) is satisfied by construction, the main editor is
never recreated, and Mermaid, code highlighting, tables, images and HTML blocks render identically in both panes.

**Alternatives**: two full `MarkdownEditor` instances (duplicates toolbars and state); rendering the original as
static HTML (loses node views such as Mermaid/code highlighting).

## 3. Compare session lifecycle

State: `{ key, session }` where `key` is the last `compareContent` seen while requested (`null` when not requested) and
`session = { original, provided } | null`.

- Requested and `key` differs from the requested content (derived during render, no flash):
  - an active session keeps its `original` and takes the new `provided` (FR-016, US5-3);
  - no active session → new session whose `original` is the content the control holds right now (spec assumption), and
    `provided` is the requested content.
- Not requested → `session = null` (back to default, content preserved, US5-4).
- Accept/Reject → `session = null` but `key` is kept, so compare does **not** restart until the host sets the mode again
  (goes through default) or supplies different `compareContent` (spec FR-021).
- Orientation changes only affect layout.
- An effect loads `session.provided` into the editor when a session starts or its `provided` changes (never fires
  `onChange`, like `setContent` elsewhere) and re-sends the original to the highlight extension when the editor is
  re-created (`onlyView` change).
- A mount with compare requested starts directly in compare: the initial source is `compareContent`, the original is
  `initialContent`.

## 4. Diff engine (no new dependency)

**Decision**: implement Myers' `O(ND)` shortest-edit-script matching in `compare/diffSequences.ts` over `string[]`
keys (returns the matched index pairs). Prefix/suffix trimming first; a maximum edit budget (default 1,500) bounds time
and memory — if exceeded, the unmatched middle is reported as fully changed (safe for highlighting).

**Rationale**: constitution VIII — the need is small (one matching function reused at three levels), whereas `diff` /
`diff-match-patch` add bundle weight to every consumer. Unit tests compare it against a brute-force LCS.

**Alternatives**: `diff` package (+~20 kB, general purpose); `jsdiff`; LCS dynamic programming (`O(N·M)` memory, too
slow for 5,000-word documents).

## 5. Rendered-view highlighting (ProseMirror)

**Decision**: a Tiptap extension `CompareHighlight` whose plugin state holds `{ original, decorations, summary }`.
`setCompareOriginal(editor, markdown | null)` parses the Markdown with `createDocument(markdownToEditorContent(md),
editor.schema)` and stores its unit list via transaction meta. On every document change (or new original) the plugin
recomputes:

1. **Units**: every text block (paragraph, heading, code block) and every leaf block (image, rule, HTML block) with a
   key = node type + attrs + ancestor context (list kind, task `checked`, table position) + token keys. Empty text blocks
   are ignored (they are Markdown-invisible helper lines).
2. **Alignment**: Myers on unit keys finds identical units; inside each gap between anchors, remaining units of the same
   type are paired greedily in order when word similarity ≥ 0.5 (Dice over non-space tokens), bounded to 40,000 pair
   checks per gap; unpaired new units are **added**, unpaired old units are **deleted**.
3. **Marks**:
   - paired units → word diff (tokens = words/whitespace/inline nodes with mark signature, so a word becoming bold is a
     difference); unmatched new words get `<mark>`; code blocks (incl. Mermaid sources) diff by **lines**;
   - added units → `<mark>` over the whole content plus a block class on the node;
   - a table row / list item / task item whose units are all added gets the block class on the whole element.
4. **Summary** `{ changed, count }`: `changed` is true if anything was added, deleted or modified (so removed-only
   changes still enable Accept/Reject); `count` = number of highlighted passages.

Inline highlights use `Decoration.inline(..., { nodeName: "mark" })` so assistive tech sees real `<mark>` elements
(FR-007); the pane also references a visually-hidden description with the count.

**Alternatives**: diff the Markdown strings and map offsets to ProseMirror positions (the existing mapping is
best-effort, would misplace marks in tables/lists); re-render an HTML diff (not editable).

## 6. Markdown-view highlighting

**Decision**: `HighlightedSource` renders a `div` highlight layer behind a transparent `textarea` with identical
typography/padding/wrapping (`pre-wrap`, `scrollbar-gutter: stable` on both), scroll-synced, `aria-hidden`. The layer
contains the textarea text with `<mark>` around the words from `diffText(original, source)`.

**Rationale**: a textarea cannot style substrings; the overlay is the standard dependency-free technique. Only the new
pane is editable so only one overlay is needed. The original pane in Markdown view is a plain read-only textarea.

**Known limit**: if the host's Markdown is non-canonical (e.g. `* a` vs `- a`), the Markdown view compares raw text
while the rendered view compares parsed content, so the two views can disagree about whether such a passage differs.

## 7. "Restaurar" visibility and `isModified()`

`modified = source !== provided && source !== providedCanonical`, where `providedCanonical` is the serialization of
the editor right after `provided` is loaded (computed once per session). This keeps "Restaurar" hidden when the user
edits and then reverts by hand to the same content even if the serializer normalizes the Markdown (US4-4). `reset()` in
compare mode runs the same restore as the button (and notifies `onChange`, FR-015); `isModified()` returns `modified`
(FR-022). Default-mode semantics are untouched.

## 8. Accept / Reject

- Accept: markdown = current content of the new pane (`sourceRef`). Calls `onChange(markdown)` then
  `onCompareDecision({ decision: "accepted", markdown })`, ends the session.
- Reject: loads `session.original` into the editor (no automatic notify), calls `onChange(original)` then
  `onCompareDecision({ decision: "rejected", markdown: original })`, ends the session.
- Both buttons are disabled while `summary.changed` is false (rendered view) / the non-whitespace tokens are equal
  (Markdown view). Focus returns to the editor when the bar disappears (`ToolbarSlot`, feature 009).

## 9. Interaction with `showToolbar` (009) and `onlyView`

The compare bar is rendered inside the same condition as the toolbar (`showToolbar`), so a host that hides the bars
hides it too (clarification). With `onlyView` both panes are read-only (the main editor is already `editable: false`);
Accept/Reject remain, Restaurar never appears.

## 10. Layout and styling

A wrapper around the panes uses `display: contents` outside compare mode (no layout change, FR-017) and a flex row /
column inside it, each pane `flex: 1 1 0` (50/50, FR-003). Highlight colour is the themable custom property
`--mdw-compare-highlight-bg` (default a soft highlighter yellow). The compare bar reuses the toolbar and button
classes. The new pane is a `role="group"` labelled "Contenido nuevo (editable)", the original a group labelled
"Contenido original (solo lectura)" containing a read-only textbox.

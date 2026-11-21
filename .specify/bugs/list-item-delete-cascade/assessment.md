# Bug Assessment: Triple-click on a list selects the whole list (or item subtree), so deleting one item deletes the rest

- **Slug**: list-item-delete-cascade
- **Created**: 2026-11-21
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim)

> Al borrar un elemento de una lista, borra tambien todos los elementos inferiores. Busca variantes de este bug y
> arreglalos.

The user added during the investigation:

> fijate cuando está en arbol.

## Symptom

**Observed.** The user triple-clicks a list line to select it, then presses Backspace or Delete. The editor deletes much
more than that line:

- every item of that list level, including the items below and above;
- each item's nested children;
- for a top-level list, the whole list.

**Expected.** A triple-click selects only that line's text, as it does in a paragraph. Deleting it removes only that
text; the other items and the children stay.

## Reproduction

Checked in the playground's Editor tab, in the built-in browser, with real mouse and keyboard events. The document was:

```markdown
antes

- uno
  - uno.a
  - uno.b
    - uno.b.x
  - uno.c
- dos
- tres

despues
```

1. Triple-click the 8 px vertical gap between "uno.a" and "uno.b". The bottom or top edge of a line works too: the
   click lands on the `<ul>`, not on the `<p>`.
2. The selection becomes a `NodeSelection` of the nested list (anchor 14). Its text is
   `uno.a|uno.b|uno.b.x|uno.c`.
3. Press Backspace. "uno.a", "uno.b", "uno.b.x" and "uno.c" are all deleted, and only `uno`, `dos` and `tres` remain.

Variants confirmed the same way:

| Where the triple-click lands | Selection created | What Backspace deletes |
|---|---|---|
| Gap between two top-level items ("dos" and "tres") | `NodeSelection` of the whole top-level list | The whole list, every level; only `antes` and `despues` remain |
| Task list, on the item's content wrapper (`div`) | `NodeSelection` of that `taskItem` | The item with all its nested children |
| Blockquote with several paragraphs, gap between paragraphs | `NodeSelection` of the whole blockquote | Every paragraph of the quote |

Triple-clicking on the text of a line works correctly (it gives a `TextSelection` of that line). So does a flat list
when the click hits the `<p>`.

Keyboard deletions do not delete items in the trees I tested. Those were Backspace and Delete at the start or end of an
item, deleting an item's text followed by Backspace, and selections across levels.

They do restructure the tree, which is ProseMirror's standard lift behavior: Backspace on an empty or non-empty nested
item lifts it one level, and the siblings below become its children. I found no data loss there. Switching to the
Markdown view and back then flattens an empty parent item: its children become siblings. That is a separate,
lower-impact issue (see Open Questions).

### Variant B: deleting a nested item with the keyboard loses the hierarchy of the items below

The user reported this one on 2026-11-21. Case: `otro` > `item 1`, `item 2`, `item 3`. Deleting `item 2` should move
`item 3` into its place, at the same level.

Observed, with real keys:

1. Select the text of `item 2`, then press Backspace. The item stays, empty.
2. Press Backspace again. The empty item is lifted one level, and `item 3`, the sibling below it, becomes the empty
   item's child.
3. Press Backspace again. The empty item becomes a paragraph, and `item 3` moves to the top level.

`item 3` changes parent and level at every step, so the user loses the hierarchy. No text is lost.

The same happens with Backspace at the start of a non-empty nested item: it is lifted and drags the siblings below it
as its children.

- **Expected:** Backspace on an empty list item that has a previous sibling deletes that item and puts the cursor at the
  end of the previous item. The items below keep their parent and level.
- **Also expected:** Delete at the end of an item whose next sibling is empty removes that empty sibling.

### Variant C: the Delete key (Suprimir) moves structure instead of joining the next line's text

The user asked for this check on 2026-11-21. I ran it with real Delete key presses, on bullet and task lists.

| Cursor position | Result today | Correct? |
|---|---|---|
| End of `item 1`, next sibling empty | Empty item removed, `item 3` keeps its level | ✅ |
| Inside the empty item | Empty item removed, `item 3` keeps its level | ✅ |
| End of `item 1`, next `item 2` | Text joined into `item 1item 2`, `item 3` keeps its level | ✅ |
| End of `item 1`, next `item 2` has children | Text joined, the children are kept | ✅ |
| End of a parent item (`otro`, its first child is `item 1`) | `item 1` loses its bullet and becomes a second paragraph inside `otro` | ❌ |
| End of an item with children (`item 2` > `item 2.a`) | `item 2.a` loses its bullet and becomes a second paragraph inside `item 2` | ❌ |
| End of the last nested item (`item 3`), next is the top-level `fin` | `fin` moves into the nested list, one level deeper | ❌ |
| End of the last list item, next is the paragraph `despues` | `despues` becomes a list item | ❌ |
| End of the paragraph `antes`, next is the list's first item `uno` | `uno` leaves the list and becomes a paragraph, with no text joined | ❌ |

Task lists behave the same in the parent and last-nested cases.

**Expected.** Delete at the end of a line joins the next line's text into the current line, like a word processor.
Every other block keeps its parent and level. If the joined line's item had children, the item that receives the text
adopts them.

## Suspected Code Paths

- **`node_modules/prosemirror-view/dist/index.js:3323` `defaultTripleClick` / `selectionForTripleClick`:**
  - It walks from the node the click is `inside` up to the root.
  - When that node has no inline content (for example `bulletList`, `orderedList`, `taskList`, `taskItem` or
    `blockquote`), it returns a `NodeSelection` of the container.
- **`src/components/MarkdownEditor/MarkdownEditor.tsx`, around line 265:**
  - The editor's `editorProps` define `handleDOMEvents.mousedown` (the blank-area handling) but no `handleTripleClick`.
  - Nothing overrides the default for container nodes.
- **CSS (`MarkdownEditor.module.css`):** the vertical spacing between list items and between quote paragraphs leaves
  gaps, about 8 px, where the hit target is the container instead of a line.

## Root Cause Hypothesis

**Confidence: high.**

When a click lands on a container's own box (a gap or a line edge) instead of on a textblock, ProseMirror's default
triple-click selects that container as a node.

- **Lists:** the container is the list, with all its items, or the `taskItem`, with its subtree.
- **Delete:** with that selection, Backspace or Delete removes the whole node.
- **Why it looks like the report:** to the user it is "selecting a line". The result is that the items below (and above)
  and the children disappear.

## Proposed Remediation

**Preferred.** Add an `editorProps.handleTripleClick` in `MarkdownEditor.tsx`, in a small helper module:

- **Container hit:** when the triple-click is inside a container block (a list, list item, task item or blockquote, i.e.
  `!node.inlineContent && !node.isAtom`), pick the textblock nearest to the click:
  1. the textblock at `posAtCoords(...).pos`, if there is one;
  2. otherwise the textblock descendant whose DOM box is closest to `clientY`.
- **Selection:** select that textblock's content with a `TextSelection`, and return `true`.
- **Defaults kept:**
  - atoms (image, Mermaid, HTML block) keep their `NodeSelection`;
  - textblocks keep their current selection;
  - table cells are left to `tableEditing`.
- **Editable only:** apply it only when the editor is editable.

**Variant B.** Add a Backspace keyboard shortcut for `listItem` and `taskItem`, at a higher priority than the default
list keymap:

- **Empty item with a previous sibling:** when the cursor is in an empty item that has a previous sibling, delete the
  item and place the cursor at the end of the previous item's last textblock. If the empty item has children of its
  own, they move to the end of the previous sibling's children, so nothing is lost or re-levelled.
- **Delete key:** do the same for Delete at the end of an item whose next sibling is empty.
- **Everything else stays the default:**
  - the first item of a list, which is lifted out of the list as today;
  - an empty top-level item without a previous sibling;
  - Backspace at the start of a non-empty item.

**Variant C.** Add a Delete keyboard shortcut, at the same high priority, for an empty selection at the end of a
textblock whose next textblock is in a different list item, or crosses the boundary of a list:

- **Join:** move the next textblock's inline content into the current textblock, then delete that textblock.
- **Emptied item:** if the next textblock's list item ends up with no blocks, remove the item. The current line's item
  adopts that item's child list.
- **Everything else stays the default:**
  - text inside one textblock;
  - two sibling items without a crossing;
  - tables, code blocks and atom nodes.
- **Shared code:** the empty-item rule from variant B reuses the same helper.

**Alternatives:**

- **Remove the gaps with CSS:** turn item margins into padding on the `<p>` so the hit target is always the
  textblock.
  - It is fragile: line edges, task wrappers and the marker area still hit containers.
  - It changes the visual spacing.
- **Block container `NodeSelection`s:** filter transactions that create a `NodeSelection` of a list or blockquote.
  - It is broader.
  - It could break legitimate node selections, such as the keyboard (`selectParentNode`) or drag handles.

**Files likely to change:**

- `src/components/MarkdownEditor/markdown/tripleClick.ts` (new helper)
- `src/components/MarkdownEditor/MarkdownEditor.tsx` (register `handleTripleClick`)
- `tests/MarkdownEditor/triple-click.test.tsx` (new)
- `CHANGELOG.md`

**Tests to add or update:**

- **Top-level list:** with the "inside" position on the list (simulated through `view.someProp("handleTripleClick")`),
  the selection is a `TextSelection` of the nearest item's paragraph, not a `NodeSelection`. Deleting it keeps the other
  items.
- **Nested list:** the same check. The siblings and children of the clicked line survive a delete.
- **Task item wrapper:** a triple-click there selects that item's text only, and its nested items survive.
- **Blockquote:** a triple-click in the gap selects one paragraph, not the whole quote.
- **Defaults kept:** an image or Mermaid atom still gets a `NodeSelection`. Read-only mode is unchanged.

## Risks & Considerations

- **Tables:** `tableEditing` has its own cell selection, which must not be affected. Triple-clicks inside cells already
  hit textblocks.
- **Hit testing in jsdom:** jsdom has no layout, so `getBoundingClientRect` returns zeros. Unit tests must call the
  handler with an explicit `inside` position. A browser check with real triple-clicks is still needed.
- **Dragging after a triple-click:** ProseMirror's `TripleClickDrag` (drag to extend by lines) only starts in the
  default path, so the custom handler loses it for container clicks. It is acceptable; returning a `TextSelection`
  keeps normal typing and dragging.
- **Not covered here:** keyboard select-all (`Ctrl+A`) and `selectParentNode` (`Escape`).

## Open Questions

- **Exact gesture:** the report does not say which gesture the user used to "delete an element". The triple-click path
  is the only one I found that deletes items, so it is assumed to be the reported bug. If the user deletes some other
  way (context menu, cut, a touch device), I need that gesture.
- **Fix the related issue here?** Also: after a nested item is lifted, an empty parent item with children serializes as
  `- - child` and re-parses flattened (its children become siblings) when switching to the Markdown view and back. No
  item is lost, but the tree changes.

# Bug Fix: Deleting in lists wipes out or re-levels other items

- **Slug**: list-item-delete-cascade
- **Fixed**: 2026-11-21
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

A new `ListEditing` extension (priority 1000, ahead of the StarterKit list keymap and table editing) fixes three
paths:

- **Triple-click:** a triple-click on a container (list, list item, task item, blockquote) selects the nearest line.
- **Backspace:** Backspace in an empty item that has an item above removes it, and the items below keep their place.
- **Delete:** Delete at the end of a line joins the next line's text when a list boundary lies between the two lines.

## Changes

| File | Change | Notes |
|---|---|---|
| `src/components/MarkdownEditor/markdown/listEditing.ts` | added | `deleteEmptyListItem`, `joinNextLineAcrossList`, `tripleClickLineSelection`, `ListEditing` extension |
| `src/components/MarkdownEditor/markdown/tiptapMarkdownBridge.ts` | modified | registers `ListEditing` after `TaskItem` |
| `tests/MarkdownEditor/list-editing.test.ts` | added test | 21 tests: variants A, B and C, task lists, defaults kept, single undo step |
| `CHANGELOG.md` | modified | Unreleased › Fixed |

## Tests Added or Updated

- **Variant B (Backspace):**
  - the item below keeps its parent and level;
  - the cursor ends up at the end of the line above;
  - the children move to the item above, and are appended to its sublist when it has one;
  - task lists behave the same;
  - the first item and items with text keep the default behavior;
  - one undo step.
- **Variant C (Delete):**
  - at the end of a parent item, of an item with a child, of the last nested item, and between siblings;
  - a list followed by a paragraph, and a paragraph followed by a list;
  - a single-item list disappears once it is emptied;
  - task lists behave the same;
  - no list boundary, and the middle of a line, keep the default behavior;
  - one undo step.
- **Variant A (triple-click):**
  - on a nested list, a task item or a quote, one line is selected, and deleting it keeps the other items;
  - on a line, an image, or with no container, the default behavior is kept.

## Local Verification

- **Commands:**
  - `npx vitest run`: 53 files and 532 tests passed.
  - `npm run typecheck`: passed.
  - The first full run had one timeout in `tests/playground/config-builder.test.tsx`, a test unrelated to this change.
    It passes alone and on a re-run.
- **Manual checks**, in the playground's built-in browser with real keys and a real triple-click:
  - the user's case (`otro` > `item 1`, `item 2`, `item 3`): deleting `item 2` gives `item 1`, `item 3` at the same level,
    with the cursor at the end of `item 1`;
  - every Delete case of the assessment's table;
  - a triple-click in the gap between `item 1` and `item 2` selects `item 1` only, and Backspace keeps the list.

## Deviations from Assessment

- **Hit testing in jsdom:** jsdom has no layout, so the unit tests call `tripleClickLineSelection` with an explicit
  `inside` position. In a real browser the nearest line comes from the DOM rectangles.
- **Children of a joined item can rise one level:** when Delete joins an item's first line into the line above, that
  item's children move to the receiving item, so they can end up one level higher. This is documented in the changelog
  and intended.

## Follow-ups

- **Markdown round-trip:** an empty parent item with children is still flattened when switching to the Markdown view
  and back (Open Questions in the assessment). This fix does not change it.
- **Backspace at the start of a non-empty nested item:** it keeps ProseMirror's default lift, which drags the items
  below it as its children.

# Feature Specification: Move a List Item Up or Down with the Keyboard

**Feature Branch**: `026-list-item-move`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "quiero que en todo lo que es listas, checklist, si aprieto shift+up, el item suba un rengalon y shift+down que baje una posicion en la lista."

## Context

Today:

- **No way to move items:** there is no way to reorder list items with the keyboard. The only way is to cut and paste.
- **Shift+Up / Shift+Down:** the component does not define these shortcuts (checked 2026-11-21). They have the
  standard text-editing meaning: extend the selection one line up or down. This is how users select several list lines
  with the keyboard.
- **Lists:** this covers bullet lists, numbered lists and checklists (task lists). Any of them can be nested (a tree).

## Clarifications

### Session 2026-11-21

- **Q:** Which shortcut moves the item, given that Shift+Up and Shift+Down already extend the text selection?
  - **A:** Ctrl+Shift+Up / Ctrl+Shift+Down (chosen by the user). Shift+Up/Down keeps extending the selection by
    lines.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Move an item one position up or down (Priority: P1)

The user has the cursor in a list item (bullet, numbered or checklist) and presses the move-up shortcut. The item swaps
places with the item above it. The move-down shortcut swaps it with the item below. The cursor stays in the moved item,
at the same position in its text.

**Why this priority**: This is the whole request: reordering items without cut and paste.

**Independent Test**:

- **Move up:** in a list `a, b, c`, with the cursor in `b`, press move-up. The list becomes `b, a, c` and the cursor is
  still in `b`.
- **Move down:** press move-down twice. The list becomes `a, c, b`.

**Acceptance Scenarios**:

1. **Given** the cursor in an item that has an item above it at the same level, **When** the user presses move-up,
   **Then** the two items swap places, and the cursor stays in the moved item at the same offset.
2. **Given** the cursor in an item that has an item below it at the same level, **When** the user presses move-down,
   **Then** the two items swap places.
3. **Given** a checklist item, **When** it is moved, **Then** its checked state moves with it.
4. **Given** a numbered list, **When** an item is moved, **Then** the numbering shows the new order (the numbers are
   positions, not part of the item).
5. **Given** a move, **When** the user presses undo once, **Then** the list returns to its previous order. The Markdown
   reflects the new order, and the change notification fires once per move.

---

### User Story 2 - Items with children move with their subtree (Priority: P1)

In a nested list, moving an item moves its whole subtree (its children and their children) as a block. The item swaps
with its neighbour at the same level, and the neighbour's subtree stays attached to the neighbour.

**Why this priority**: The user asked for this to work "en todo lo que es listas", and earlier feedback stressed that
items must not lose their hierarchy.

**Independent Test**: in `otro > [item 1 > [x], item 2]`, with the cursor in `item 1`, press move-down. The result is
`otro > [item 2, item 1 > [x]]`.

**Acceptance Scenarios**:

1. **Given** an item with children, **When** it moves up or down, **Then** its children move with it and keep their
   level. The neighbour's children stay with the neighbour.
2. **Given** a nested item, **When** it moves, **Then** it stays at its level and under the same parent. It swaps only
   with siblings.

---

### Edge Cases

- **First and last items:** move-up on the first item of its list, or move-down on the last, does nothing. The item
  does not jump to another list or another level, and the document does not change.
- **Selection inside one item:** if the selection is entirely inside one item (one or more characters), the item still
  moves, and the selection keeps its relative position.
- **Selection over several items:** if the selection spans consecutive sibling items, the whole selected block moves
  one position. If the selected items are not siblings, nothing happens.
- **Outside a list:** in paragraphs, headings, tables and code blocks, the shortcut keeps its current behavior.
- **Read-only:** in read-only mode, the compare panes and history, items cannot be moved.
- **Markdown view:** no change; the shortcut keeps its plain-text behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001: move up.** With the cursor or selection in a list item (bullet, numbered or checklist), the move-up
  shortcut MUST swap the item with the sibling directly above it.
- **FR-002: move down.** The move-down shortcut MUST swap the item with the sibling directly below it.
- **FR-003: whole item.** An item MUST move with its whole content (all its lines and its nested children), its checked
  state (for checklist items), and its formatting.
- **FR-004: level unchanged.** Moving MUST NOT change any item's level or parent. At the first or last position, the
  shortcut MUST do nothing.
- **FR-005: selection kept.** After a move, the cursor or selection MUST stay on the same text inside the moved item.
- **FR-006: one change per move.** Each move MUST be one undo step and fire one change notification. The Markdown MUST
  show the new order.
- **FR-007: no effect elsewhere.** Outside list items, in read-only contexts and in the Markdown view, the shortcut MUST
  keep its current behavior.
- **FR-008: shortcut.** Move-up MUST be Ctrl+Shift+Up and move-down Ctrl+Shift+Down, using the physical Ctrl key on
  every platform.
  - Inside list items, this replaces the browser's paragraph-wise selection extension for that combination.
  - Shift+Up/Down keeps extending the selection by lines.
- **FR-009: documentation.** The component guide MUST list the shortcut, and the change log MUST record it.

### Key Entities

- **List item:** a bullet, numbered or checklist entry, with its text, checked state and nested children. It moves as
  one unit among its siblings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001: one press, one move.** In 100 % of tests, one press of the shortcut moves the item exactly one position,
  with its subtree, in all three list types.
- **SC-002: nothing else changes.** After any move, every item's text, checked state, level and parent are the same
  as before; only the order of the two swapped siblings changes.
- **SC-003: clean undo.** One undo fully restores the previous order in 100 % of tests.
- **SC-004: no regressions.** Existing editing, selection and list tests keep passing.

## Assumptions

- **Moves between siblings:** an item swaps with its sibling at the same level; it never changes level. Changing level
  remains Tab and Shift+Tab, as today.
- **Several items:** moving several selected sibling items at once is supported when they are consecutive siblings.
- **Platforms:** the shortcut is the same on Windows, macOS and Linux.
  - On macOS, Ctrl+Up/Down are system shortcuts (Mission Control and App Exposé) by default.
  - Whether the system also captures Ctrl+Shift+Up/Down there has not been verified. If it does, macOS users would
    need to free the combination in System Settings.

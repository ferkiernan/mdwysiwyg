# Feature Specification: Resize a Column by Dragging Its Header Border

**Feature Branch**: `023-column-resize-drag`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "al pasar el cursor por la parte inferior de la linea derecha de una celda de un titulo de columna, (area marcada en rojo para tu interpretación), debe cambiar el cursor a double arrow y permitir cambiar el ANCHO de la columna al hacer un drag (añadiendo el caracter menos (-) en el markdown)."

## Context

The user's image shows a table with a header row ("Columna", "Valor", and a third empty column). On the right border of
each header cell, the lower part (below the table menu's triangular trigger in the top-right corner) is marked in red.

Today:

- **Column widths:** they depend only on the content. The user cannot change them.
- **Separator row dashes:** in the Markdown, the number of dashes in each column of the separator row (`| --- | --- |`)
  is recalculated on every edit to match the widest cell.
- **Dash counts are lost:** if the document arrives with other counts, they are lost the first time it is edited.

## Clarifications

### Session 2026-11-15

The user said «avanza hasta push» without answering, so the recommended options were applied:

- **Q: How do dashes translate to a width?**
  - **A:** an absolute unit: 1 dash = 8 px (at 100 % zoom), rounded on release.
- **Q: When do dashes count as a width?**
  - **A:** only when there are more than 3 and they differ from the automatic padding (the widest cell). Existing tables
    don't change.
  - If a dragged width happens to equal the automatic padding, one more dash is written so it isn't lost.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Widen or narrow a column by dragging (Priority: P1)

The user points at the lower part of the right border of a header cell. The cursor becomes a horizontal double arrow.
The user presses, drags left or right, and releases.

- **While dragging:** the column visibly follows the pointer.
- **On release:** the new width is kept, and the Markdown records it as the number of dashes in that column of the
  separator row.

**Why this priority**: This is the whole request. Without it, columns with little content cannot be widened and wide
columns cannot be narrowed.

**Independent Test**: Hover over the lower part of the right border of "Columna": the cursor is a horizontal double
arrow. Drag 100 px to the right and release: the column is wider, the Markdown view shows more dashes in that column,
and the change notification fires once.

**Acceptance Scenarios**:

1. **Given** an editable table, **When** the pointer is over the resize area (lower part of the right border of a
   header cell), **Then** the cursor is a horizontal double arrow (resize).
2. **Given** the pointer anywhere else in the cell, including the upper part of the border where the table menu trigger
   sits, **When** the user hovers, **Then** the cursor is the usual one and the table menu trigger keeps working.
3. **Given** the pointer on the resize area, **When** the user drags right or left and releases, **Then** the column
   becomes wider or narrower, following the pointer while dragging.
4. **Given** a completed drag, **When** the Markdown is read (Markdown view, change notification, export), **Then** the
   separator row has a number of dashes in that column that represents the new width.
5. **Given** a resized table, **When** the document is reloaded from that Markdown, **Then** the column shows the same
   width.
6. **Given** a resized table, **When** the user edits any other part of the document, **Then** the column keeps its
   width and its dash count; it is not recalculated.
7. **Given** a drag, **When** it ends, **Then** it can be undone with a single undo, and the change notification fires
   once (not on every pointer movement).

---

### User Story 2 - Limits and the last column (Priority: P2)

A column cannot be dragged narrower than a readable minimum.

**Why this priority**: It prevents broken or unusable tables. Less frequent than the basic resize.

**Independent Test**: Drag a column far to the left: it stops at the minimum width. Resize the last column: it works
the same.

**Acceptance Scenarios**:

1. **Given** a drag to the left, **When** the width reaches the minimum, **Then** it does not shrink further.
2. **Given** the last column, **When** its right border is dragged, **Then** it resizes like the others.
3. **Given** a column wider than the visible area, **When** the table overflows, **Then** horizontal scrolling works as
   today.

---

### Edge Cases

- **Read-only, compare panes, history:** in read-only mode, in both panes of compare mode and while history is open,
  there is no resize area and the cursor does not change.
- **Markdown view:** there are no cells; the user can edit the dashes by hand, and the rendered view reflects them.
- **Table operations:**
  - adding a column: the new column gets the width of a column without an explicit width;
  - removing a column: the others keep their widths;
  - adding or removing rows: widths do not change.
- **Content zoom:** explicit widths are fixed pixels and do not scale with the content zoom (the text does).
- **Separator alignment markers:** `:---`, `---:` and `:---:` are kept; the colons are not counted as dashes.
- **Touch devices:** dragging with a finger is not required in this version.
- **Keyboard access:** not required in this version (no on-screen control). [Assumption, see Assumptions.]

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001: resize area.** In editable content, the lower part of the right border of each header cell MUST act as a
  resize area. Over it, the cursor MUST be a horizontal double arrow.
- **FR-002: table menu trigger.** The resize area MUST NOT overlap the table menu trigger (top-right corner of the cell)
  or interfere with selecting text in the cell.
- **FR-003: drag.** Dragging from the resize area MUST change the width of that column, following the pointer, with a
  minimum width (the current minimum cell width).
- **FR-004: one undo step.** A completed drag MUST produce one content change, undoable with a single undo, and fire the
  change notification once.
- **FR-005: width in the Markdown.** The column's width MUST be recorded in the Markdown as the number of dashes in that
  column of the separator row. 1 dash = 8 px. The width is rounded to whole dashes on
  release. Alignment colons are kept and are not counted.
- **FR-006: when dashes mean a width.** Dashes count as an explicit width only when there are more than 3 and they
  differ from the automatic padding (the length of the widest cell in the column). Otherwise the column is automatic.
- **FR-007: widths are kept.** Explicit widths MUST survive any later edit, the switch between views and a reload. The
  automatic padding MUST NOT overwrite them.
- **FR-008: no resize area in read-only contexts.** Read-only mode, the compare panes and history MUST NOT offer the
  resize area.
- **FR-009: column operations.** Adding or removing columns MUST keep the widths of the remaining columns.
- **FR-010: documentation.** The behavior MUST be documented in the component guide (tables section) and the change
  log.

### Key Entities

- **Column width**: per column. Either explicit (set by a drag or by hand-written dashes) or automatic (by content).
- **Table separator row**: the GFM line `| --- | :---: |` that carries alignment and, with this feature, width.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of tests, hovering the resize area shows the resize cursor, and hovering the rest of the cell
  does not.
- **SC-002**: A drag of N px changes the rendered column width by N px, rounded to 8 px, unless the minimum (or the
  column's longest word) is reached.
- **SC-003**: After a resize, reloading the produced Markdown restores the same column widths in 100% of tests.
- **SC-004**: Editing text elsewhere after a resize leaves the separator row of that table byte-identical.
- **SC-005**: Existing table tests (insertion, menu, row and column operations, round-trip) keep passing.

## Assumptions

- **Resize area:** "Parte inferior de la línea derecha" means the right border of the header cell below the table menu
  trigger, roughly the lower half of the cell. The area extends a few pixels to each side of the border so it is easy
  to hit.
- **Cursor:** "Double arrow" is the standard horizontal resize cursor (`↔`).
- **Header only:** only header cells offer the resize area, as requested; body cells do not.
- **Minimum width:** 40 px (5 dashes, ≈ 3 characters). A column never gets narrower than its longest word.
- **Out of scope for this version:** keyboard and touch resizing.
- **Other renderers:** they will ignore the widths (GFM gives the dashes no meaning). Some, such as Pandoc, interpret
  them as relative widths.

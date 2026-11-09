# Feature Specification: Table Cell Menu Trigger (corner triangle)

**Feature Branch**: `008-table-cell-menu-trigger`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "Vamos a cambiar una funcionalidad: ahora, en una tabla, cuando haga mouse over en una celda, aparecerá un pequeño boton en la esquina superior derecha de la celda: ejemplo en la imagen (fila 1, Col C). Antes, al hacer un segundo click sobre una celda 'activa' donde estaba el cursor se activaba el menu de 'opciones' para la celda o el titulo (añadir celda, columnas, etc...), ahora esa acción se dispara cuando hagamos click en el pequeño triangulo de la celda, ya no más con el segundo click. el cateto del triangulo debe ser aproximadamente al mitad del tamaño del cursor. Al posicionarse encima del triangulo, el cursor debe cambiar a modo 'link' y con un simple click sobre el triangulo se debe desplegar el menu de opciones que ya tenia."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open cell options from a corner triangle (Priority: P1)

While editing a table, the user hovers a cell and a small right-angled triangle appears in the cell's top-right corner (as in the reference image: row 1, column "Col C"). Clicking the triangle opens the same options menu that used to open on a second click: the **column** menu when the cell is a header cell, the **row** menu when it is a body cell.

**Why this priority**: This is the whole feature. It replaces the hidden, easy-to-trigger-by-accident "second click" gesture with a visible, discoverable control.

**Independent Test**: Hover any cell of a table → triangle appears in its top-right corner; click it → the options menu for that cell's kind (column for header, row for body) opens with the same actions as before.

**Acceptance Scenarios**:

1. **Given** an editable table and the pointer outside it, **When** the user moves the pointer over a body cell, **Then** a small triangle is shown in that cell's top-right corner.
2. **Given** the triangle is visible in a body cell, **When** the user clicks it once, **Then** the row options menu opens, anchored to that cell, with the same actions as before this change.
3. **Given** the triangle is visible in a header cell, **When** the user clicks it once, **Then** the column options menu opens, anchored to that cell, with the same actions as before this change.
4. **Given** the options menu was opened from a cell's triangle, **When** the user picks an action (e.g. add row below), **Then** the action is applied relative to that cell, not to a different previously-focused cell.
5. **Given** the pointer leaves the cell (and is not over the triangle or the open menu), **When** no menu is open for it, **Then** the triangle is hidden again.

---

### User Story 2 - Second click no longer opens the menu (Priority: P1)

Clicking an already-active cell (where the text cursor is) a second time no longer opens the options menu. It behaves like a normal click inside a cell: places/moves the text cursor.

**Why this priority**: The old gesture must be removed, otherwise users get two competing ways to open the menu and accidental menu pop-ups while simply repositioning the cursor.

**Independent Test**: Click inside a cell to put the cursor there, click again in the same cell → no menu appears and the cursor moves to the clicked position.

**Acceptance Scenarios**:

1. **Given** the text cursor is in a cell, **When** the user clicks the same cell again (not on the triangle), **Then** no menu opens and the caret is placed where the user clicked.
2. **Given** the user double/triple-clicks text in a cell to select a word or line, **When** the click sequence completes, **Then** no menu opens and the selection is preserved.

---

### User Story 3 - Triangle affordance: size and pointer feedback (Priority: P2)

The triangle is visually discreet but clearly clickable: its legs are approximately half the height of the text cursor, and when the pointer is over it the mouse pointer changes to the "link" (hand) style.

**Why this priority**: Visual polish and affordance; the feature works without it but is far less discoverable.

**Independent Test**: Hover a cell, compare the triangle's legs to the text cursor height in an active cell (≈ 50%), then hover the triangle and observe the pointer switching to the hand/link pointer.

**Acceptance Scenarios**:

1. **Given** the triangle is visible, **When** its dimensions are compared with the text cursor height, **Then** each leg is approximately half the cursor height.
2. **Given** the triangle is visible, **When** the pointer moves onto it, **Then** the pointer changes to the link style; **When** it moves off, **Then** it returns to the normal text pointer.
3. **Given** the triangle is visible, **When** the user clicks it, **Then** only one click is required to open the menu (no prior focus click needed).

---

### Edge Cases

- Read-only mode (`onlyView`): no triangle is shown and no menu can be opened.
- Hovering a different cell while a menu is open: the open menu stays until dismissed; the new cell may show its own triangle.
- Clicking the triangle of a cell that is not the currently active one: menu opens for the clicked cell and actions apply to it.
- Clicking the triangle while text is selected elsewhere in the table: the selection is replaced by the cursor in the clicked cell; menu opens for that cell.
- Click on the triangle must not move the text cursor within the cell's text or alter cell content.
- Very narrow cells or cells with long/wrapped content: the triangle stays at the top-right corner and does not overlap or hide cell text in a way that blocks editing (it is small and sits in the corner).
- Cells whose content is long enough to reach the top-right corner: triangle remains clickable and the text remains selectable.
- Keyboard users: the previous menu must remain reachable without a mouse (see FR-011).
- Touch devices (no hover): the triangle is available on the active cell so the menu is still reachable.
- Light and dark themes: the triangle is visible against both.
- Merged/unsupported cell structures not applicable (tables are plain Markdown tables).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the pointer hovers a table cell (header or body) in an editable editor, the system MUST show a small triangle in that cell's top-right corner.
- **FR-002**: The triangle MUST be a right-angled triangle whose two legs are each approximately half the height of the text cursor, anchored to the top-right corner of the cell.
- **FR-003**: When the pointer is over the triangle, the mouse pointer MUST change to the link style; it MUST revert when the pointer leaves the triangle.
- **FR-004**: A single click on the triangle MUST open the options menu for that cell: the column menu for header cells and the row menu for body cells.
- **FR-005**: The menu opened from the triangle MUST offer exactly the same actions, labels and behavior as the menu that previously opened on second click.
- **FR-006**: Actions chosen from the menu MUST apply to the cell whose triangle was clicked.
- **FR-007**: Clicking the triangle MUST NOT require the cell to be active/focused beforehand and MUST NOT insert text or otherwise modify cell content.
- **FR-008**: The previous behavior MUST be removed: a second click on an already-active cell MUST NOT open the options menu.
- **FR-009**: The triangle MUST be hidden when the pointer is not over its cell, except while its menu is open or (for touch devices) on the active cell.
- **FR-010**: In read-only mode the triangle MUST NOT be shown and the menu MUST NOT be reachable.
- **FR-011**: The options menu MUST remain reachable by keyboard (a keyboard-accessible way to open it for the active cell), preserving existing menu keyboard navigation and focus handling.
- **FR-012**: The triangle MUST be visible and distinguishable in both light and dark themes and MUST follow the editor's existing theming tokens.
- **FR-013**: The triangle MUST NOT be included in the document content: it MUST NOT appear in the Markdown output, copied text, or the document's content model.
- **FR-014**: Text selection by click or drag inside cells MUST continue to work unchanged, including when the selection reaches the cell's top-right area.

### Key Entities

- **Table cell**: header cell (opens the column menu) or body cell (opens the row menu); hosts the hover-revealed triangle.
- **Corner triangle (menu trigger)**: small visual control at the cell's top-right corner; no content value, only opens the cell's options menu.
- **Cell options menu**: the existing set of column/row actions (add, move, delete); unchanged by this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of table cells (header and body) show the triangle on hover and open the correct menu (column for header, row for body) with a single click.
- **SC-002**: A user who has never seen the feature can find and open the cell options menu on their first attempt within 10 seconds, without being told about the old second-click gesture.
- **SC-003**: Zero unintended menu openings when repositioning the text cursor with repeated clicks in the same cell.
- **SC-004**: Menu contents and results of every action are identical to the pre-change behavior (no regression in existing table menu tests).
- **SC-005**: Triangle legs measure between 40% and 60% of the text cursor height in the default theme.
- **SC-006**: The triangle never appears in exported/serialized Markdown (0 occurrences).

## Assumptions

- "Cursor" in the size requirement means the text caret; its height equals the editor's line height for the cell text, so legs ≈ 50% of that height.
- The triangle's default color is aligned with the editor's scrollbar colors (same theme token), so it follows any theme that recolors the scrollbar; hosts can still override it independently.
- Header cells open the column menu and body cells open the row menu, as in the previous behavior.
- Menu content, anchoring and keyboard navigation inside the menu are unchanged; only the way it is opened changes.
- A keyboard way to open the menu is retained or added (accessibility principle of the project constitution), since removing the click gesture would otherwise make it mouse-only through the triangle.
- Touch devices lack hover; showing the triangle on the active cell covers them.
- Scope is limited to tables; other blocks are unaffected.
- Existing table menu specs/tests (feature 005) are updated to the new trigger.

# Feature Specification: Compare Mode (original vs. new content)

**Feature Branch**: `010-compare-mode`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "quiero añadir un nuevo 'modo' a el control. el modo 'compare' a diferencia del modo 'default' que es el comportamiento actual. El modo compare, tiene ciertos atributos que requiere para activarse: especificar orientacion: (side-to-side) o (up-and-down), y se debe especificar un nuevo contenido markdown. La idea es poder ver lado a lado (o arriba y abajo) el contenido original, y el NUEVO contenido. Aquellas partes del markdown que sean distintas en 'la nueva versión' deberian tener un fondo de 'resaltador' amarillo, permitiendo identificarlas como distintas. Además, deberia aparecer una barra nueva, debajo de la barra actual que tenga los siguientes botones: Rechazar Cambio, Aceptar Cambio. Restaurar (oculto). En cualquier caso, se debería poder editar únicamente el lado 'nuevo' (el de la derecha o abajo). Si alguien edita, se verá el botón restaurar para quitar cambios manuales y volver al estado inicial."

## Clarifications

### Session 2026-11-09

- Q: What do "Aceptar cambio" and "Rechazar cambio" do? → A: Both notify the host and the control returns by itself to default mode, applying the decision: accept keeps the new content (including manual edits); reject keeps the original.
- Q: Does the toolbar visibility setting (feature 009) also hide the compare bar? → A: The compare bar is shown by default when entering compare mode, but if the host hides the bars through that setting, the decision is respected and the compare bar is hidden too (the host is then responsible for offering its own way to decide).
- Q: How do `reset()` and `isModified()` behave in compare mode? → A: They act on the new pane. `reset()` equals "Restaurar" (back to the host's new content); `isModified()` is true when the new pane differs from that content.
- Q: How fine-grained is the highlighting? → A: Word level inside text (paragraphs, headings, table cells, list items); elements that are entirely new (paragraph, list item, table row, code block) are highlighted as a whole.
- Q: Is the rendered/Markdown view toggle available in compare mode? → A: Yes. It switches both panes together and highlighting is shown in either view.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See original and new content together with differences highlighted (Priority: P1)

A host app (for example one showing an AI-proposed rewrite, or a pending revision) puts the control in "compare" mode, giving it an orientation (side-to-side or up-and-down) and the new Markdown. The control shows the original content and the new content in two panes, laid out as requested: the original on the left (side-to-side) or on top (up-and-down), the new content on the right or at the bottom. Every passage of the new content that differs from the original has a yellow highlighter-style background, so the user can see at a glance what changed.

**Why this priority**: This is the core of the feature: without the dual view and highlighting there is nothing to compare.

**Independent Test**: Mount the control in compare mode with original "A B C" and new "A X C" using each orientation → two panes in the right arrangement, and only "X" in the new pane is highlighted yellow.

**Acceptance Scenarios**:

1. **Given** compare mode with orientation side-to-side and a new content that differs from the original, **When** the control renders, **Then** the original appears on the left, the new content on the right, each taking half of the available width, and the differing passages in the new pane have a yellow highlighter background.
2. **Given** orientation up-and-down, **When** the control renders, **Then** the original appears on top and the new content below, each taking half of the available height.
3. **Given** a new content identical to the original, **When** the control renders, **Then** nothing is highlighted.
4. **Given** the new content adds a whole paragraph, list item, table row or code block, **When** the control renders, **Then** that added element is highlighted in the new pane.
5. **Given** the default mode (or the mode omitted), **When** the control renders, **Then** behavior is exactly the current one: a single pane, no compare bar.
6. **Given** compare mode is requested but orientation or new content is missing, **When** the control renders, **Then** it behaves as default mode (single pane, no compare bar) instead of showing a partial compare view.

---

### User Story 2 - Edit only the new side and watch the highlights follow (Priority: P1)

In compare mode the user can edit the new content (right or bottom pane) with the usual editing experience, including the toolbar. The original pane cannot be edited. As the user edits, the highlighting of differences updates to reflect the current new content.

**Why this priority**: Reviewing a proposal usually means tweaking it; the original must stay intact as the reference.

**Independent Test**: Type in the new pane → text changes and highlights update; try to type or change formatting in the original pane → nothing changes.

**Acceptance Scenarios**:

1. **Given** compare mode, **When** the user types in the new pane, **Then** the text is inserted and highlights update to match the new differences.
2. **Given** compare mode, **When** the user tries to type, paste, delete or apply formatting in the original pane, **Then** the original content does not change.
3. **Given** the user edits the new pane so that a passage becomes identical to the original, **When** the edit is made, **Then** that passage is no longer highlighted.
4. **Given** compare mode, **When** the user edits the new pane, **Then** the host's change notification reports the current Markdown of the new pane (the editable side).
5. **Given** the toolbar formatting buttons, **When** the user uses them, **Then** they apply to the new pane.

---

### User Story 3 - Accept or reject the change (Priority: P1)

A new action bar appears below the existing toolbar in compare mode with the buttons **Rechazar cambio** and **Aceptar cambio**. Accepting means the new content (including any manual edits) is kept; rejecting means the original is kept and the new content discarded. In both cases the control tells the host which was chosen and with which Markdown, and returns by itself to default mode, showing the resulting content in the single-pane editor.

**Why this priority**: Compare is only useful if the user can decide; accept/reject are the outcome of the whole flow.

**Independent Test**: In compare mode click "Aceptar cambio" → host is notified of acceptance with the new pane's current Markdown and the control shows that content in default mode; click "Rechazar cambio" → host is notified of rejection with the original Markdown and the control shows the original in default mode.

**Acceptance Scenarios**:

1. **Given** compare mode, **When** it renders, **Then** an action bar below the toolbar shows "Rechazar cambio" and "Aceptar cambio".
2. **Given** the user has not edited the new pane, **When** they click "Aceptar cambio", **Then** the host is notified that the change was accepted, with the new Markdown, and the control returns to default mode showing that Markdown.
3. **Given** the user edited the new pane, **When** they click "Aceptar cambio", **Then** the host is notified with the edited Markdown (not the initial new content) and the control returns to default mode showing the edited Markdown.
4. **Given** compare mode, **When** the user clicks "Rechazar cambio", **Then** the host is notified that the change was rejected, with the original Markdown, and the control returns to default mode showing the original content (manual edits to the new pane are discarded).
5. **Given** the user accepted or rejected, **When** the control updates, **Then** it shows a single pane with no highlights and no compare bar, exactly like default mode.
6. **Given** the new content has no differences from the original, **When** the bar renders, **Then** "Aceptar cambio" and "Rechazar cambio" are disabled.

---

### User Story 4 - Restore the new content after manual edits (Priority: P2)

The "Restaurar" button is hidden while the new pane matches the new content provided by the host. As soon as the user makes manual edits that make it differ, "Restaurar" becomes visible; clicking it discards the manual edits and returns the new pane to the initial new content, after which the button hides again.

**Why this priority**: Safety net for experimentation; the main flow works without it.

**Independent Test**: Edit the new pane → "Restaurar" appears; click it → new pane returns to the initial new content and the button disappears.

**Acceptance Scenarios**:

1. **Given** compare mode with no manual edits, **When** the bar renders, **Then** "Restaurar" is not visible.
2. **Given** the user edits the new pane, **When** its content now differs from the provided new content, **Then** "Restaurar" becomes visible.
3. **Given** "Restaurar" is visible, **When** the user clicks it, **Then** the new pane returns to the initial new content, highlights match it, and "Restaurar" hides.
4. **Given** the user edits and then manually reverts to exactly the initial new content, **When** the content matches again, **Then** "Restaurar" hides.
5. **Given** the user clicks "Restaurar", **When** the host is notified of changes, **Then** it receives the restored Markdown.

---

### User Story 5 - Change mode, orientation or new content at runtime (Priority: P3)

The host can switch between default and compare mode, flip the orientation, or supply a different new content while the control is mounted, and the control updates accordingly.

**Why this priority**: Natural for hosts that offer a "review changes" toggle, but not needed for a first usable version.

**Independent Test**: Flip orientation from side-to-side to up-and-down while mounted → the layout changes and the new pane keeps its content.

**Acceptance Scenarios**:

1. **Given** compare mode, **When** the host changes orientation, **Then** the panes re-arrange immediately and the new pane's content (including manual edits) is preserved.
2. **Given** default mode, **When** the host switches to compare mode with a new content, **Then** the current content becomes the original and the compare view appears.
3. **Given** compare mode, **When** the host provides a different new content, **Then** the new pane is replaced by it, manual edits are discarded, and highlights are recomputed.
4. **Given** compare mode, **When** the host switches back to default mode, **Then** the single-pane editor shows the content of the new pane (the editable side), preserving it.

---

### Edge Cases

- Compare mode without orientation or without new content: treated as default mode (no compare UI); no error is thrown.
- Original and new content identical: no highlights; Accept and Reject disabled; Restore only appears after edits.
- Content removed in the new version: it exists only in the original pane, so nothing is highlighted for it in the new pane (highlights mark what is new or changed in the new version).
- Very large documents: highlighting must stay responsive while typing in the new pane.
- Changes inside formatting-only differences (e.g. a word becoming bold): treated as a difference and highlighted.
- Table, list, code block and Mermaid differences: changed words inside cells and items are highlighted at word level; an added table row or list item is highlighted as a whole; inside code blocks (and Mermaid sources) the changed or added lines are highlighted.
- Read-only mode (`onlyView`) combined with compare mode: both panes are read-only; the action bar still shows Accept/Reject (Restore never appears since no edits are possible).
- The user's edit leaves the new pane empty: everything in the original shows as removed (no highlights in the empty pane); Accept still reports the empty content.
- Scrolling of the two panes is independent (synchronized scrolling is out of scope).
- Resizing the component keeps the 50/50 split in the chosen orientation.
- The existing rendered/Markdown view toggle remains available and applies to both panes together; highlighting is shown in either view.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The control MUST support two modes: "default" (current behavior, used when no mode is given) and "compare".
- **FR-002**: Compare mode MUST require an orientation, either "side-to-side" or "up-and-down", and a new Markdown content; if either is missing, the control MUST behave as default mode.
- **FR-003**: In compare mode the control MUST show the original content and the new content in two panes: original left/new right for side-to-side; original top/new bottom for up-and-down; each pane taking half of the available space.
- **FR-004**: The original pane MUST be read-only; the new pane MUST be editable (unless the control is in read-only mode, in which case both are read-only).
- **FR-005**: Passages of the new content that differ from the original (changed or added) MUST be shown with a yellow highlighter-style background in the new pane: at word level inside existing text (paragraphs, headings, table cells, list items), and as a whole for elements that are entirely new (paragraph, list item, table row, code block).
- **FR-006**: Highlights MUST update as the new pane is edited, and unchanged passages MUST NOT be highlighted.
- **FR-007**: Highlighted passages MUST remain identifiable to assistive technology (not only by color).
- **FR-008**: In compare mode a second bar MUST appear directly below the existing toolbar with the buttons "Rechazar cambio", "Aceptar cambio" and "Restaurar", unless the host has hidden the bars through the toolbar visibility setting (feature 009), in which case the compare bar MUST be hidden as well.
- **FR-009**: "Restaurar" MUST be hidden unless the current content of the new pane differs from the new content provided by the host.
- **FR-010**: Clicking "Restaurar" MUST return the new pane to the provided new content, discarding manual edits.
- **FR-011**: Clicking "Aceptar cambio" MUST notify the host that the change was accepted, together with the current Markdown of the new pane, and the control MUST return to default mode showing that Markdown.
- **FR-012**: Clicking "Rechazar cambio" MUST notify the host that the change was rejected, together with the original Markdown, and the control MUST return to default mode showing the original content, discarding manual edits to the new pane.
- **FR-013**: "Aceptar cambio" and "Rechazar cambio" MUST be disabled while the new content has no differences from the original.
- **FR-020**: The existing rendered/Markdown view toggle MUST remain available in compare mode, switching both panes together, with highlights shown in either view.
- **FR-022**: In compare mode the imperative `reset()` MUST behave like "Restaurar" and `isModified()` MUST be true exactly when "Restaurar" is visible (new pane differs from the host's new content).
- **FR-021**: After an accept or reject the control MUST stay in default mode until the host requests compare mode again (setting the mode again or providing a new "new content"); the host's change notification MUST report the resulting content.
- **FR-014**: Existing editing features (toolbar formatting and insert controls, keyboard shortcuts, table menus, link popover, imperative API) MUST apply to the editable (new) pane in compare mode.
- **FR-015**: The host's change notification in compare mode MUST report the Markdown of the editable (new) pane, including when it changes because of "Restaurar".
- **FR-016**: Changing mode, orientation or new content while the control is mounted MUST update the control immediately without remounting; changing orientation MUST preserve the new pane's content, including manual edits.
- **FR-017**: Default mode MUST keep behaving exactly as it does today (no regression for existing consumers).
- **FR-018**: Both panes and the action bar MUST be keyboard-operable and labelled for assistive technology (the panes identified as original and new; the original announced as read-only).
- **FR-019**: The new mode and its properties MUST be documented (purpose, types, defaults, accept/reject notifications, examples).

### Key Entities

- **Mode**: "default" or "compare"; chosen by the host.
- **Orientation**: "side-to-side" or "up-and-down"; only meaningful in compare mode.
- **Original content**: the content the control holds when compare starts; shown read-only in the original pane.
- **New content (provided)**: the Markdown the host supplies as the proposed version; the reference for "Restaurar".
- **Working new content**: the current content of the editable pane (provided content plus manual edits); drives highlighting, Accept and notifications.
- **Difference**: a passage of the working new content that is changed or added relative to the original; shown highlighted.
- **Compare action bar**: the second bar with Reject, Accept and Restore.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a test set of paired documents, 100% of changed or added passages in the new pane are highlighted and 0% of unchanged passages are.
- **SC-002**: After each edit in the new pane, highlights reflect the new state within 300 ms for documents up to 5,000 words.
- **SC-003**: In 100% of attempts, the original pane content cannot be altered by typing, pasting, deleting or formatting.
- **SC-004**: "Restaurar" is visible if and only if the working new content differs from the provided new content (100% of states checked).
- **SC-005**: Clicking Accept or Reject notifies the host exactly once per click with the correct Markdown (edited new content for accept; original for reject), and the control shows that content in default mode (single pane, no highlights, no compare bar), in 100% of cases.
- **SC-006**: Switching orientation at runtime changes the layout within one render cycle and preserves 100% of the new pane's content including manual edits.
- **SC-007**: All pre-existing behavior tests for default mode keep passing (0 regressions).
- **SC-008**: A reviewer can identify every difference in a 20-paragraph document with 5 changes in under 30 seconds without reading the whole document.

## Assumptions

- Mode, orientation and new content are properties set by the host; exact names are decided at planning, consistent with the existing props.
- The content the control holds when entering compare mode is the "original" (for a fresh mount, the usual initial content).
- Accept and Reject apply to the whole change at once (not per individual difference).
- Accept and Reject notify the host and the control returns to default mode by itself (see Clarifications); the host's mode setting may still say "compare", so compare restarts only when the host sets it again or provides a new "new content".
- Highlighting marks only what is new or changed in the new pane; removed content is simply absent there and is visible in the original pane. Marking removed text in the original pane is out of scope.
- Both panes use the rendered (WYSIWYG) presentation by default; the existing view toggle switches both panes to Markdown source and back, with highlighting in either view (see Clarifications).
- Differences are detected on Markdown content at word level inside text and at element level for entirely new elements (see Clarifications).
- The compare action bar is shown by default in compare mode and follows the toolbar visibility setting of feature 009: when the host hides the bars, the compare bar is hidden too and its buttons are not reachable (see Clarifications).
- Synchronized scrolling, per-difference accept/reject, navigation between differences, and merge of non-overlapping edits are out of scope.
- Texts of the buttons are in Spanish as the rest of the control's UI ("Rechazar cambio", "Aceptar cambio", "Restaurar").

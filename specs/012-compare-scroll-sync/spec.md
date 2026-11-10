# Feature Specification: Content-Matched Scrolling in Compare Mode

**Feature Branch**: `012-compare-scroll-sync`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "al escrolear en modo 'compare' el scroll de cada sección deberia tratar de matchear el contenido que se está viendo."

## Clarifications

### Session 2026-11-09

- Q: Can the host or user turn the synchronization off? → A: Yes, the host can, through a new setting (boolean, on by default); there is no toggle for the end user
- Q: What does the other pane do while scrolling through content that exists only on one side? → A: It moves proportionally across that gap, from the preceding matching content to the next matching content, so it never freezes or jumps
- Q: Which pane leads when the new pane scrolls because of typing or caret movement? → A: The pane that scrolled last leads, whatever caused the scroll (wheel, scrollbar, keyboard or caret-driven); the other follows it
- Q: Should horizontal scrolling be synchronized too? → A: No; only vertical scrolling is matched and each pane keeps its own horizontal scroll
- Q: Which point of the viewport is kept matched? → A: The top edge of the viewport

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scrolling one pane keeps the other pane on the same content (Priority: P1)

In compare mode the original and the new content are shown in two panes. When the user scrolls one pane, the other pane scrolls too, so that it shows the content that corresponds to what is being viewed. If the user reads a paragraph in the original, the same paragraph (as it appears in the new content) is brought into view in the other pane, even when earlier additions or deletions have made the two documents different lengths.

**Why this priority**: This is the whole point of the request. Without it the user has to hunt for the corresponding passage manually in a long document.

**Independent Test**: Compare two long documents where the new one has several paragraphs added near the top. Scroll the original to a paragraph far down: the new pane shows that same paragraph at about the same height, not the paragraph that merely sits at the same scroll percentage.

**Acceptance Scenarios**:

1. **Given** compare mode with both panes taller than their viewports, **When** the user scrolls the original pane, **Then** the new pane scrolls so that the content matching the top of the original pane is visible near the top of the new pane.
2. **Given** compare mode, **When** the user scrolls the new pane, **Then** the original pane scrolls so that the content matching the top of the new pane is visible near the top of the original pane.
3. **Given** the new content has extra paragraphs before the viewed position, **When** the user scrolls the original to a given paragraph, **Then** the new pane shows that same paragraph (not an unrelated one at the same percentage).
4. **Given** the viewed content exists only in one pane (added or removed text), **When** the user scrolls through it, **Then** the other pane moves gradually, in proportion to the progress through that passage, from the matching content before it to the matching content after it, without freezing or jumping.
5. **Given** compare mode is not active (default mode, or only one pane), **When** the user scrolls, **Then** nothing is synchronized and behavior is unchanged.

---

### User Story 2 - Works in both orientations and both views (Priority: P1)

The synchronization applies whether the panes are side by side or one above the other, and whether the panes show the rendered view or the Markdown source view.

**Why this priority**: The compare mode has two orientations and two views; a sync that only works in one of them would feel broken.

**Independent Test**: Repeat the User Story 1 check with each combination of orientation (side-to-side, up-and-down) and view (rendered, Markdown).

**Acceptance Scenarios**:

1. **Given** the side-by-side orientation, **When** the user scrolls either pane, **Then** the other follows by matching content.
2. **Given** the up-and-down orientation, **When** the user scrolls either pane, **Then** the other follows by matching content, each pane still scrolling independently within its own area.
3. **Given** the Markdown view, **When** the user scrolls either pane, **Then** the other follows by matching the corresponding source lines.
4. **Given** the user switches between rendered and Markdown view or changes the orientation, **When** the panes are shown again, **Then** they remain aligned on the same content.

---

### User Story 3 - Stays matched while editing and when the content changes (Priority: P2)

While the user edits the new pane, or when the host changes the compared content, the panes stay coherent: moving the caret or typing in the new pane (which can scroll it) brings the original to the corresponding content, and edits that change heights do not leave the panes out of step.

**Why this priority**: Compare mode is editable; a sync that only works for mouse-wheel scrolling would break down as soon as the user types.

**Independent Test**: Type several lines in the new pane so that its content grows and scrolls: the original pane follows to the content matching the caret area, and no endless back-and-forth scrolling occurs.

**Acceptance Scenarios**:

1. **Given** the user types in the new pane and the pane scrolls to follow the caret, **When** the scroll happens, **Then** the original pane scrolls to the matching content.
2. **Given** the user adds or removes text before the viewed position, **When** the panes re-layout, **Then** the pair stays on matching content (re-aligned) without the user touching the scroll.
3. **Given** the host provides a different new content while in compare mode, **When** the panes update, **Then** both panes are aligned again on matching content.
4. **Given** one pane scrolls the other, **When** the other pane's scroll event fires, **Then** it does not scroll the first one back (no feedback loop, no jitter).

---

### User Story 4 - The host can turn the synchronization off (Priority: P2)

Some hosts or workflows prefer independent panes (for example to read two distant parts of the document side by side). The host can disable the synchronization with a setting that is on by default and can be changed while the control is running.

**Why this priority**: Content-matched scrolling is the desired default, but a way out avoids forcing the behavior on every consumer.

**Independent Test**: Render compare mode with the setting off, scroll one pane: the other does not move. Turn it on: the panes align. Turn it off again: they stop following.

**Acceptance Scenarios**:

1. **Given** the setting is not provided, **When** compare mode is active, **Then** the synchronization is on.
2. **Given** the setting is off, **When** the user scrolls either pane, **Then** the other pane does not move.
3. **Given** the setting is off, **When** the host turns it on, **Then** the other pane aligns with the pane scrolled last and later scrolls are synchronized.
4. **Given** the setting is on, **When** the host turns it off, **Then** neither pane moves at that moment and they scroll independently from then on.
5. **Given** the setting is toggled, **When** it changes, **Then** the content, caret, selection, change notifications and highlight are unaffected.

---

### Edge Cases

- Documents that fit in the viewport (nothing to scroll): nothing happens.
- Pane scrolled to the very top or very bottom: the other pane goes to its top / bottom, so both ends always correspond.
- Very different documents with almost no common content: the panes fall back to following each other proportionally to how far each has been scrolled.
- Repeated identical blocks (e.g. several equal list items or rules): the pairing follows document order, so the viewed occurrence corresponds to the occurrence in the same relative order.
- Large blocks taller than a pane (a long code block or table): while inside the block, the other pane follows proportionally inside the matching block.
- Fast scrolling or momentum scrolling: the other pane keeps up without visible lag or oscillation.
- Images or diagrams loading after the first layout and changing heights: the alignment is corrected when the layout changes.
- Accepting, rejecting or restoring ends compare mode (single pane): synchronization stops with no leftover behavior.
- Hidden toolbar or read-only (`onlyView`) variants of compare mode: synchronization still applies.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: In compare mode, scrolling either pane MUST scroll the other pane so that it shows the content corresponding to the content being viewed.
- **FR-002**: Correspondence MUST be determined by matching content (the same passage in both documents), not only by scroll percentage, so insertions and deletions earlier in the documents do not misalign the panes.
- **FR-003**: Where a viewed passage has no counterpart (added or removed content), the other pane MUST move in proportion to the progress through that passage, between the matching content before it and the matching content after it (or to the pane's start or end when there is none), so it neither freezes nor jumps, and it MUST arrive exactly at the next matching content when that is reached.
- **FR-004**: When the correspondence cannot be determined (almost no common content), the panes MUST follow each other proportionally to the scroll progress of the pane being scrolled.
- **FR-005**: Reaching the top (or bottom) of one pane MUST bring the other pane to its top (or bottom).
- **FR-006**: The synchronization MUST work in both orientations (side-to-side and up-and-down) and in both the rendered and the Markdown views.
- **FR-007**: The synchronization MUST apply when the new pane scrolls as a consequence of editing (typing, moving the caret) as well as for wheel, touch, scrollbar and keyboard scrolling of either pane.
- **FR-008**: The synchronization MUST NOT create feedback loops or oscillations: a scroll caused by the synchronization MUST NOT trigger a counter-scroll.
- **FR-009**: After the content or layout changes (edits, a new compared content, view or orientation change, late image or diagram sizing) the panes MUST be re-aligned on matching content.
- **FR-010**: Outside compare mode (default mode, after accept/reject, compare not requested) there MUST be no synchronization and no change in behavior or cost.
- **FR-011**: The synchronization MUST NOT modify the content, fire the host's change notification, or interfere with selection and focus.
- **FR-012**: The synchronization MUST respond without perceptible lag (the other pane follows within the same visual frame sequence as the scroll) for documents up to 5,000 words.
- **FR-013**: The behavior MUST be documented (what is matched, the fallback, the limits), and it MUST work out of the box without configuration (on by default).
- **FR-014**: The host MUST be able to turn the synchronization off and on through a boolean setting (on by default); with it off, the two panes scroll fully independently as they did before this feature. The setting can change at any time without remounting, changing the content or moving either pane's scroll position at that moment. There is no end-user toggle in the interface.
- **FR-015**: The pane that scrolled last MUST be the reference and the other pane MUST follow it, regardless of what caused the scroll (wheel, touch, scrollbar, keyboard, or the new pane scrolling to keep the caret in view while typing).
- **FR-016**: Only vertical scrolling MUST be synchronized; each pane MUST keep its own horizontal scroll position (a sideways scroll in one pane never moves the other).
- **FR-017**: When the setting is turned on while compare mode is active, the other pane MUST align with the pane that was scrolled last (or the editable pane if none was), without altering the pane being used as the reference.

### Key Entities

- **Pane**: one of the two scrollable areas (original, new) in compare mode.
- **Viewed position**: the content currently at the top of a pane's visible area.
- **Counterpart**: the passage in the other document that corresponds to a viewed passage, derived from the differences already computed for compare mode.
- **Alignment**: the mapping from a viewed position in one pane to the matching scroll position of the other pane.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For documents where at least 50% of the text is shared, after scrolling one pane to any position, the content at the top of that pane appears in the other pane within one paragraph of its top edge, in 95% of positions tested.
- **SC-002**: When the new content has up to 20 added or removed blocks before the viewed passage, the displayed counterpart is still the same passage (0 mismatches caused by length differences) in all tested cases.
- **SC-003**: A user can find the counterpart of any passage without scrolling the other pane manually (0 manual scroll actions needed in the comparison test tasks).
- **SC-004**: The other pane reflects a scroll within 100 ms of the scroll for documents up to 5,000 words.
- **SC-005**: No scroll oscillation: after a scroll gesture ends, both panes are at rest within 200 ms.
- **SC-006**: Outside compare mode, 0 scroll listeners or visible changes are introduced and all existing behavior and tests keep working.
- **SC-007**: With the setting off, scrolling one pane moves the other pane 0 px in 100% of tested interactions; turning it on or off never changes content, caret or notifications.
- **SC-008**: While scrolling steadily through a passage that exists on one side only, the other pane's position changes monotonically with no single jump larger than one viewport height, in 100% of tested scrolls.

## Assumptions

- Synchronization is on by default in compare mode and is controlled only by a host setting (boolean); the exact setting name follows the existing naming style and is decided at planning. It is two-way (either pane can lead).
- The correspondence reuses the content differences already computed to highlight changes in compare mode; no new comparison rules are introduced.
- "Matching what is being viewed" aligns the content at the top edge of the scrolled pane with its counterpart at the top edge of the other pane (see Clarifications).
- In the up-and-down orientation each pane keeps its own vertical scrolling and both follow the same rule.
- Horizontal scrolling is not synchronized (long lines scroll independently).
- Smooth-scroll animation is not required; the other pane may move instantly as long as it stays visually in step.
- The users' operating-system "reduce motion" setting is respected simply by not adding animation.
- No change is made to how differences are highlighted or to the accept / reject / restore flow.

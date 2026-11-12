# Feature Specification: Auto-Height

**Feature Branch**: `013-auto-height`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "añade atributo "auto-height"= false (default). En true que lo que hace es ampliar el alto del control para que la barra de desplazamiento desaparezca. (lo estira agranda hacia abajo)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The control grows to show all its content (Priority: P1)

A host that embeds the editor in a page that already scrolls (a form, a long document, a card) does not want a second scrollbar inside the control. With the new setting on, the control makes itself as tall as its content needs, so the content area never needs its own vertical scrollbar. It grows downward: its top edge stays where it is and its bottom edge moves down, pushing the rest of the page along.

**Why this priority**: This is the whole point of the request. Without it the user has to scroll inside a box inside a scrolling page.

**Independent Test**: Render the control with the setting on and a document longer than the default height: the control is taller than the default, the whole document is visible and no vertical scrollbar appears in the content area.

**Acceptance Scenarios**:

1. **Given** the setting is on and the content is taller than the control's current height, **When** the control is shown, **Then** its height increases (downward) until the whole content is visible and the content area has no vertical scrollbar.
2. **Given** the setting is on, **When** the user types, pastes or inserts content (a paragraph, a table, a code block, a diagram) so the content grows, **Then** the control keeps growing so that the caret and the new content stay visible without an inner scrollbar.
3. **Given** the setting is on and the content shrinks (text deleted, content replaced by a shorter one), **When** the content gets shorter, **Then** the control shrinks accordingly, down to its normal height but never below it (see Assumptions).
4. **Given** the setting is on and the content is shorter than the normal height, **When** the control is shown, **Then** it keeps its normal height (it does not collapse around a short text).
5. **Given** images, diagrams or other content that changes height after the first layout (loaded later), **When** their size becomes known, **Then** the control adjusts its height so there is still no inner scrollbar.

---

### User Story 2 - Off by default, nothing changes unless requested (Priority: P1)

Existing hosts keep today's behavior: a fixed-height control with an inner scrollbar when the content is taller. The new setting is off by default and can be changed at any time without losing content, caret, selection or history.

**Why this priority**: The control is a published package; turning the new behavior on by default would change every consumer's layout.

**Independent Test**: Render the control without the setting and with a long document: it keeps its configured height and scrolls internally, exactly as in the previous release. Turn the setting on and off while the control is mounted: the height follows, and content, caret, selection and change notifications are unaffected.

**Acceptance Scenarios**:

1. **Given** the setting is not provided (or is off), **When** the content is taller than the control, **Then** the control keeps its configured height and the content area scrolls as before.
2. **Given** the setting is off, **When** the host turns it on, **Then** the control grows to fit the content, without remounting and without moving the caret or selection.
3. **Given** the setting is on, **When** the host turns it off, **Then** the control returns to its configured height and the content area scrolls internally again.
4. **Given** the setting is toggled, **When** it changes, **Then** the content, caret, selection, undo history, change notifications and the rendered / Markdown view are unaffected.

---

### User Story 3 - Works in every view and mode (Priority: P2)

The growth applies wherever the control shows a scrollable content area: the rendered view and the Markdown source view, the read-only (`onlyView`) variant, with or without the toolbar, compare mode (both orientations) and the version-history mode.

**Why this priority**: A host that turns the setting on expects it to hold whatever the user is doing; a view where the scrollbar comes back would feel broken.

**Independent Test**: With the setting on and a long document, switch between the rendered and Markdown views, show / hide the toolbar, enable `onlyView`, open compare mode in both orientations and open the version history: in each case there is no inner vertical scrollbar and the control is as tall as needed.

**Acceptance Scenarios**:

1. **Given** the setting is on, **When** the user switches to the Markdown source view, **Then** the control is as tall as the source text needs (including wrapped lines) and the text area has no vertical scrollbar.
2. **Given** the setting is on and compare mode is active side by side, **When** the panes show content of different lengths, **Then** the control is as tall as the taller pane needs so neither pane has an inner scrollbar.
3. **Given** the setting is on and compare mode is active one above the other, **When** the panes are shown, **Then** the control is tall enough for both panes to show all their content with no inner scrollbar.
4. **Given** the setting is on and the version history is open, **When** the user browses versions of different lengths, **Then** the control adapts to the shown version and the version list stays reachable.
5. **Given** the setting is on, **When** the toolbar is shown or hidden or `onlyView` is toggled, **Then** the control still fits its content exactly (the toolbar's own height is accounted for).
6. **Given** the setting is on, **When** a panel opens over the content (table menu, link popover, pickers), **Then** those panels are not clipped and do not change the control's height.

---

### User Story 4 - Coexists with the other sizing options (Priority: P2)

The control already has a configurable height and an optional user resize handle. The new setting interacts with them in a predictable way: the configured height acts as the minimum, and manual resizing does not fight with automatic growth.

**Why this priority**: Without clear rules the sizing options would contradict each other.

**Independent Test**: With the setting on, a configured height of 300 and a short document the control is 300 tall; with a long document it is taller; changing the configured height to 500 makes the minimum 500. The resize handle is not offered while the setting is on.

**Acceptance Scenarios**:

1. **Given** the setting is on and a configured height, **When** the content is shorter than that height, **Then** the control keeps the configured height (the configured height is the minimum).
2. **Given** the setting is on and the content is taller than the configured height, **When** it is shown, **Then** the configured height is exceeded as needed (it does not cap the growth).
3. **Given** the setting is on and the control is user-resizable, **When** it is shown, **Then** the manual resize handle is not offered (the height is automatic) and it comes back when the setting is turned off.
4. **Given** the setting is on, **When** the configured width is changed or the container is resized horizontally and text re-wraps, **Then** the height re-adjusts to the new wrapping.

---

### Edge Cases

- Very long documents (thousands of lines): the control may become taller than the window; the page scrolls instead of the control (that is the intent). No hard height limit is applied by the control.
- Empty content: the control keeps its configured (minimum) height.
- The control sits inside a container with a fixed height or `overflow: hidden`: it cannot exceed the container; the container decides (documented limit).
- Hosts that give the control a percentage height of a parent without a defined height: the configured height remains the minimum; behavior is documented.
- Rapid typing or paste of large content: the height follows without visible flicker or jumping of the caret position.
- Compare mode accepted / rejected / restored (single pane again): the height re-adjusts to the single pane.
- Switching between rendered and Markdown view where the heights differ: the control adjusts at once and the page does not jump to another scroll position.
- Content area inside the control keeps its own horizontal scrolling where needed (wide tables, long code lines): only the vertical scrollbar is removed.
- Mermaid diagrams or images that fail to load or change size: the height follows their final size.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The control MUST offer a boolean setting, named "auto-height" (written in the camelCase style of the other settings, decided at planning), that is **off by default**.
- **FR-002**: With the setting off (or not provided), the control MUST behave exactly as in the previous release: configured height, inner vertical scrolling when the content is taller.
- **FR-003**: With the setting on, the control MUST make its height large enough for all of its content to be visible, so that the content area shows **no vertical scrollbar**.
- **FR-004**: The control MUST grow **downward**: its top edge and position stay fixed and its bottom edge moves, so the content that follows it on the page is pushed down.
- **FR-005**: With the setting on, the height MUST follow content changes in both directions: it grows as content is added (typing, paste, inserting elements, loading content, late-loading images or diagrams) and shrinks as content is removed, never going below the configured height (the minimum).
- **FR-006**: The configured height MUST act as the minimum height when the setting is on; it MUST NOT cap the growth. With short content the control keeps the configured height.
- **FR-007**: The behavior MUST apply to the rendered view and to the Markdown source view (wrapped lines included), and the height MUST re-adjust when the user switches between them.
- **FR-008**: The behavior MUST apply to the read-only variant, with the toolbar shown or hidden (the toolbar height is part of the control, so the content area fits exactly), and when the toolbar's visibility changes.
- **FR-009**: In compare mode the control MUST be tall enough for every pane to show its whole content without an inner vertical scrollbar: side by side, as tall as the taller pane; one above the other, tall enough for both. It MUST re-adjust when the orientation changes and when compare mode ends.
- **FR-010**: In the version-history mode the control MUST adapt its height to the version being shown, and the version list MUST remain usable.
- **FR-011**: While the setting is on, the manual resize handle MUST NOT be offered; it MUST be offered again (if resizing is enabled) when the setting is turned off.
- **FR-012**: The setting MUST be changeable at any time without remounting the control and without altering content, caret, selection, undo history, change notifications or the active view.
- **FR-013**: The height adjustment MUST NOT modify the content, fire the host's change notification, or take focus; floating panels (menus, popovers, pickers) MUST remain fully visible and MUST NOT influence the height.
- **FR-014**: The height MUST re-adjust when the width changes and text re-wraps (configured width changes, window or container resize).
- **FR-015**: The height MUST update within the same visual frame sequence as the content change (no perceptible lag, no flicker or caret jump) for documents up to 5,000 words.
- **FR-016**: Only the vertical scrollbar of the control MUST disappear; horizontal scrolling of wide content (tables, long code lines) MUST keep working.
- **FR-017**: With the setting off there MUST be no added cost or visible change (no measuring or observation of the content).
- **FR-018**: The behavior MUST be documented (what grows, minimum height, resize handle, limits when the container constrains the height) and MUST work with no further configuration.

### Key Entities

- **Control height**: the vertical size of the whole control (toolbar, bars and content area).
- **Minimum height**: the configured height; the floor of the control's height when the setting is on.
- **Content height**: the height the content area needs to show everything without scrolling (the larger pane's height in compare mode).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With the setting on, for documents from 1 to 5,000 words, 0 vertical scrollbars appear in the content area in the rendered view, the Markdown view, the read-only variant, compare mode (both orientations) and the version-history mode, in 100% of tested cases.
- **SC-002**: The control's height always equals the larger of the configured height and the height needed by the content, within 2 px, in 100% of tested cases.
- **SC-003**: After a content change (typing, paste, insertion, deletion, view or mode change) the height is correct within 100 ms and the caret never leaves the visible area.
- **SC-004**: With the setting off or omitted, 0 visible or behavioral changes compared with the previous release: all existing tests keep passing and the content area scrolls as before.
- **SC-005**: Turning the setting on and off any number of times leaves content, caret, selection, history and change notifications unchanged (0 differences), and never remounts the control.
- **SC-006**: The control's top edge stays in the same page position (0 px displacement) while its height changes.
- **SC-007**: A host can embed the control inside a scrolling page with the setting on and reach the whole document using only the page's scrollbar (0 inner scroll actions needed in the test tasks).

## Assumptions

- The setting is named "auto-height" in the request; following the existing naming style of the control's settings it is expected to be written in camelCase (`autoHeight`) and be a plain boolean, off by default. The exact name is decided at planning.
- "Grow downward" means the control's top edge stays put; the page below is pushed down. No upward growth and no animation are required (transitions are optional; none is assumed).
- The configured height is used as the minimum height when the setting is on (the control does not collapse below it). Shrinking back to that minimum when content is removed is expected.
- No maximum height is imposed by the control; a host that wants a cap can constrain a parent container (documented).
- The resize handle (user resizing) is not offered while the setting is on, since the height is automatic; width resizing behavior is not part of this request.
- In compare mode the control grows to fit the taller pane (side by side) or both panes together (one above the other); the compare scroll synchronization has nothing to scroll in that case and is unaffected.
- Panels that float over the content (table menu, link popover, pickers) are outside the content flow and are unaffected.
- Width behavior, theming, toolbar content and all other settings are unchanged.

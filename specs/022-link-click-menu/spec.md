# Feature Specification: Clicking a Link Never Opens It Directly

**Feature Branch**: `022-link-click-menu`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "al hacer click en un link, se está abriendo directamente la url, esa acion default debe estar desactivada, solo debe aparecer el menu de opciones."

## Context

Clicking a link in the content opens a small options menu (go to the address, copy it, edit or remove it; in read-only,
go and copy). In some places, however, the browser follows the link right away instead:

- in the **original pane of compare mode** (read-only), where the options menu is not offered;
- on links inside **embedded HTML blocks**;
- with **Ctrl/Cmd + click, Shift + click or middle click**, which open the address in a new tab or window.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A click on a link only shows the options menu (Priority: P1)

Whatever link the user clicks inside the control, the address is never opened by the click itself. The options menu appears next to the link and the user decides what to do; the address is only opened when they choose "go to" in that menu.

**Why this priority**: This is the whole request: opening addresses by accident takes the user away from what they were editing.

**Independent Test**: Click a link in the editable pane, in read-only mode, in the original pane of compare mode and inside an embedded HTML block, also with Ctrl/Cmd/Shift held and with the middle button: in every case no new tab or navigation happens; the options menu appears (or, for the middle button, nothing happens).

**Acceptance Scenarios**:

1. **Given** a link in the editable content, **When** the user clicks it, **Then** the options menu appears and no address is opened (as today).
2. **Given** read-only mode, **When** the user clicks a link, **Then** the read-only options menu appears (go to, copy) and no address is opened.
3. **Given** compare mode, **When** the user clicks a link in the original (read-only) pane, **Then** the read-only options menu appears for that link and no address is opened.
4. **Given** a link inside an embedded HTML block, **When** the user clicks it, **Then** no address is opened; the read-only options menu (go to, copy) appears for its address.
5. **Given** any link, **When** the user clicks it with Ctrl/Cmd or Shift held, **Then** no new tab or window opens; the options menu appears as for a plain click.
6. **Given** any link, **When** the user clicks it with the middle button, **Then** no new tab opens and nothing else happens.
7. **Given** the options menu is open, **When** the user chooses "go to", **Then** the address opens in a new tab (as today) — this is the only way to open it from the control.

---

### User Story 2 - Keyboard and other entry points behave the same (Priority: P2)

Pressing Enter on a focused link (where links can receive focus, such as embedded HTML), or using the browser's context menu, must not open the address through the control's own behavior either; keyboard users reach the same options menu.

**Why this priority**: Consistency and accessibility; less frequent than clicks.

**Independent Test**: Tab to a link inside an embedded HTML block and press Enter: the options menu appears; the address does not open.

**Acceptance Scenarios**:

1. **Given** a focusable link inside the control, **When** the user presses Enter on it, **Then** the options menu appears and the address is not opened.
2. **Given** a link, **When** the user opens the browser's context menu on it, **Then** the browser's own menu is shown unchanged (the control does not intercept right-click; choosing "open in new tab" there is the user's explicit choice).

---

### Edge Cases

- Links in the Markdown (source) view are plain text and are not clickable: unchanged.
- Images wrapped in links: clicking the image shows the link's options menu, not navigation.
- Mermaid diagrams with clickable nodes: the diagram is rendered in strict security mode and does not navigate; unchanged.
- Links with dangerous or empty addresses: never opened; the menu shows the address as text.
- A drag that starts on a link (to select text): selection works as today; no navigation.
- In the original pane of compare mode, the menu's edit and remove actions are not available (read-only).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A click on a link anywhere in the control's content (editable pane, read-only mode, the original pane of compare mode, embedded HTML blocks) MUST NOT open the address.
- **FR-002**: The click MUST show the options menu for that link: the full menu (go to, copy, edit/remove) where the content is editable, and the read-only menu (go to, copy) in read-only mode, in the original pane of compare mode and for links inside embedded HTML blocks.
- **FR-003**: Ctrl/Cmd + click and Shift + click MUST behave like a plain click (menu, no navigation); a middle-button click on a link MUST NOT open the address.
- **FR-004**: Enter on a focused link inside the control MUST show the options menu instead of opening the address.
- **FR-005**: The address MUST only be opened from the menu's "go to" action (new tab, safely, as today).
- **FR-006**: Right-click (the browser's context menu) MUST remain unchanged.
- **FR-007**: The change MUST NOT alter the content, fire the change notification, or move the caret beyond what a click on a link does today.
- **FR-008**: The behavior MUST be documented in the component guide (links section) and the change log.

### Key Entities

- **Link options menu**: the existing popover with "go to", "copy" and, when editable, "edit"/"remove".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of tested clicks (plain, Ctrl/Cmd, Shift, middle) on links in every place listed in FR-001, 0 navigations or new tabs occur.
- **SC-002**: In 100% of tested plain/modified clicks, the options menu appears for the clicked link with the variant listed in FR-002.
- **SC-003**: Choosing "go to" in the menu opens the address in 100% of tests.
- **SC-004**: Existing link tests (insertion, editing, popover actions) keep passing.

## Assumptions

- "Menú de opciones" is the existing link popover; no new options are added.
- Links in embedded HTML blocks and in the original compare pane get the read-only variant, since they cannot be edited there.
- Middle click is simply suppressed (no menu), because it is a "open in new tab" gesture, not a selection gesture.
- Right-click is left to the browser.

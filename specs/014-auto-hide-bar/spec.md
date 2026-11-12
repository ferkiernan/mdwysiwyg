# Feature Specification: Auto-Hide Toolbar on Focus Loss

**Feature Branch**: `014-auto-hide-bar`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "añade el atributo "auto-hide-bar" default:false. Lo que hace es al quitar el foco del componente, oculta la barra de edición."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The toolbar hides when the user leaves the component (Priority: P1)

A host that embeds the editor in a dense page (a form, a comment box, a card) wants a clean look while the user is doing something else. With the new setting on, the editing toolbar is visible only while the user is working in the component. When the focus leaves the component (the user clicks elsewhere in the page, tabs to another field, switches window), the toolbar disappears; when the user comes back (clicks into the content, tabs into it) the toolbar reappears.

**Why this priority**: This is the whole request: the toolbar follows the focus.

**Independent Test**: Render the control with the setting on, click inside the content (toolbar visible), then click outside the control: the toolbar is gone. Click into the content again: the toolbar is back.

**Acceptance Scenarios**:

1. **Given** the setting is on and the focus is inside the component, **When** the focus moves to something outside the component, **Then** the editing toolbar is hidden.
2. **Given** the setting is on and the toolbar is hidden, **When** the user puts the focus inside the component (click on the content, keyboard navigation into it), **Then** the toolbar is shown.
3. **Given** the setting is on, **When** the focus moves between the content and the toolbar's own controls (including a menu, picker or dialog opened from the toolbar), **Then** the toolbar stays visible: focus is still "inside the component".
4. **Given** the setting is on, **When** the component is first shown and the focus is not inside it, **Then** the toolbar starts hidden.
5. **Given** the setting is on and the component starts with the focus inside it (for example it was focused programmatically on load), **When** it is shown, **Then** the toolbar is visible.

---

### User Story 2 - Off by default, nothing changes unless requested (Priority: P1)

Existing hosts keep today's behavior: the toolbar is always visible (or hidden only through the existing show/hide setting). The new setting is off by default and can be changed at any time without losing content, caret, selection or history.

**Why this priority**: The control is a published package; changing the default would alter every consumer's UI.

**Independent Test**: Render the control without the setting and move the focus in and out: the toolbar never hides. Turn the setting on and off while mounted: the toolbar follows the rule, and content, caret, selection and change notifications are unaffected.

**Acceptance Scenarios**:

1. **Given** the setting is not provided (or is off), **When** the focus enters and leaves the component, **Then** the toolbar stays visible as in the previous release.
2. **Given** the setting is off and the focus is outside the component, **When** the host turns it on, **Then** the toolbar hides at once.
3. **Given** the setting is on and the toolbar is hidden, **When** the host turns it off, **Then** the toolbar is shown again at once.
4. **Given** the setting is toggled, **When** it changes, **Then** the content, caret, selection, undo history, change notifications and the active view are unaffected, and the component is not remounted.

---

### User Story 3 - Keyboard and assistive-technology users are not locked out (Priority: P2)

A user who navigates with the keyboard or a screen reader can reach the toolbar and is not surprised by it appearing or disappearing.

**Why this priority**: A toolbar that vanishes must not make its controls unreachable for people who do not use a pointer.

**Independent Test**: With the setting on, Tab into the component from the page: the toolbar becomes visible and its controls can be reached with Tab / Shift+Tab; Tab out of the component: the toolbar hides and the focus order of the page is not broken.

**Acceptance Scenarios**:

1. **Given** the setting is on and the toolbar is hidden, **When** the user tabs into the component, **Then** the toolbar appears and its controls are reachable by keyboard.
2. **Given** the toolbar is hidden, **When** the user navigates the page with the keyboard or a screen reader, **Then** the hidden toolbar's controls are not focusable and not announced (they are not an invisible tab stop).
3. **Given** the focus is on a toolbar control and the user tabs out of the component, **When** the focus leaves, **Then** the toolbar hides and the focus lands on the next element of the page, not on the page's start.
4. **Given** the toolbar appears or disappears, **When** it does, **Then** the change is announced no more than a normal focus change would be (no spurious announcement) and respects reduced-motion preferences (no animation is required).

---

### User Story 4 - Coexists with the other bars and settings (Priority: P2)

The control already has a show/hide setting for the toolbar, a read-only variant, a compare mode with its own decision bar and a version-history mode with its own bar. The new setting has a clear, limited scope.

**Why this priority**: Without clear rules the settings would contradict each other.

**Independent Test**: With the setting on and the focus outside, check each mode: the editing toolbar is hidden, while a bar that carries a pending decision (compare or history) is not hidden by the setting.

**Acceptance Scenarios**:

1. **Given** the toolbar is already hidden by the existing show/hide setting, **When** the new setting is on, **Then** the toolbar stays hidden (the show/hide setting wins; the new setting never forces it visible).
2. **Given** the read-only variant is active and the setting is on, **When** the focus leaves, **Then** its reduced toolbar hides and reappears with the focus, like the full one.
3. **Given** compare mode or the version-history mode is active, **When** the focus leaves the component, **Then** the editing toolbar hides but the compare bar and the history bar (which hold pending decisions) stay visible.
4. **Given** the setting is on, **When** the toolbar appears or disappears, **Then** the content area takes the freed space (or yields it) and the caret and selection are not lost or moved.

---

### Edge Cases

- The user clicks a toolbar button: the focus stays inside the component; the toolbar does not hide in between (including while a menu, picker, dialog or popover opened from it is open).
- A floating panel (table menu, link popover, pickers) holds the focus: it counts as inside the component.
- The window or tab loses focus (user switches application) while the focus was inside the component: the toolbar hides when the component stops being focused and shows again when the window regains focus with the focus still inside.
- Clicking on the empty area of the component (padding, between blocks, the scrollbar): counts as inside; the toolbar shows (or stays).
- Clicking a non-focusable page area: the focus leaves the component (it goes to the page body) and the toolbar hides.
- The component is disabled/read-only for history browsing: the focus rules still apply to the history bar's host component as above.
- Rapid focus changes (tabbing through several fields, clicking in and out): no flicker lasting longer than the change and no stuck state; the final state always matches the final focus.
- The page layout shifts when the toolbar disappears (the content area becomes taller): the caret and scroll position of the content stay where the user left them; hosts can reserve the space if they want no shift (documented).
- Print or screenshot of the page while unfocused: the toolbar is hidden, as designed.
- Hosts that call `focus`-related actions programmatically: the toolbar follows the resulting focus.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The control MUST offer a boolean setting, named "auto-hide-bar" (written in the camelCase style of the other settings, decided at planning), that is **off by default**.
- **FR-002**: With the setting off (or not provided), the toolbar MUST behave exactly as in the previous release (always visible unless hidden by the existing show/hide setting).
- **FR-003**: With the setting on, the editing toolbar MUST be hidden whenever the focus is **not** inside the component, and visible whenever the focus **is** inside it.
- **FR-004**: "Inside the component" MUST include the content area (rendered and Markdown views), the toolbar's own controls, and any menu, picker, dialog or popover opened from the component.
- **FR-005**: The toolbar MUST be hidden initially if the focus is not inside the component when it is first shown, and visible if it is.
- **FR-006**: Moving the focus between parts of the component MUST NOT hide or flicker the toolbar.
- **FR-007**: A hidden toolbar MUST NOT be reachable by keyboard or exposed to assistive technology (its controls are not focusable and not announced); when shown, its controls MUST be reachable in the normal order.
- **FR-008**: When the focus leaves the component from a toolbar control (for example by tabbing out), the toolbar MUST hide without sending the focus to the start of the page; focus MUST continue naturally in the page order.
- **FR-009**: The existing show/hide setting MUST take precedence: if it hides the toolbar, the new setting MUST NOT show it.
- **FR-010**: The setting MUST apply to the reduced toolbar of the read-only variant as well.
- **FR-011**: The setting MUST apply only to the editing toolbar; bars that carry a pending decision (the compare decision bar and the version-history bar) MUST stay visible according to their own rules.
- **FR-012**: The setting MUST be changeable at any time without remounting the control and without altering content, caret, selection, undo history, change notifications or the active view.
- **FR-013**: Showing or hiding the toolbar MUST NOT modify the content, fire the host's change notification, move the caret or selection, or steal the focus.
- **FR-014**: The toolbar MUST follow the focus without perceptible delay (within the same interaction, no later than 100 ms) and without leaving a stale state after rapid focus changes.
- **FR-015**: No animation is required; if one is used it MUST respect the user's reduced-motion preference.
- **FR-016**: With the setting off there MUST be no added cost or visible change.
- **FR-017**: The behavior MUST be documented (what counts as focus inside, the precedence over the show/hide setting, scope limited to the editing toolbar, the layout change when the toolbar toggles) and MUST work with no further configuration.

### Key Entities

- **Editing toolbar**: the main bar with formatting, insert, view-toggle, history-icon and export controls (full or reduced for read-only).
- **Component focus**: whether the keyboard focus is anywhere inside the control, including its floating panels.
- **Decision bars**: the compare bar and the version-history bar, outside the scope of this setting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With the setting on, in 100% of tested focus sequences (click in/out, Tab in/out, programmatic focus, switching window) the toolbar is visible if and only if the focus is inside the component, within 100 ms of the focus change.
- **SC-002**: With the setting on, moving the focus within the component (content ↔ toolbar ↔ menus/dialogs) produces 0 hide-and-show cycles of the toolbar.
- **SC-003**: With the setting off or omitted, 0 behavior or visual changes compared with the previous release: all existing tests keep passing.
- **SC-004**: Turning the setting on and off any number of times leaves content, caret, selection, history and change notifications unchanged (0 differences) and never remounts the control.
- **SC-005**: While the toolbar is hidden, 0 of its controls are focusable or announced; when it is shown, 100% of its controls are reachable by keyboard in the usual order.
- **SC-006**: With the existing show/hide setting off, the new setting never makes the toolbar appear (0 exceptions); the compare and history bars are never hidden by it (0 exceptions).
- **SC-007**: A user can format text in a single flow — click in, use a toolbar control, continue typing — without the toolbar disappearing at any step (0 unexpected hides in the test tasks).

## Assumptions

- The setting is named "auto-hide-bar" in the request; following the existing naming style of the control's settings it is expected to be written in camelCase (`autoHideBar`) and be a plain boolean, off by default. The exact name is decided at planning.
- "The editing bar" is the main toolbar. The compare decision bar and the version-history bar are separate bars with pending decisions and are not hidden by this setting.
- "Focus" means keyboard focus inside the component (including its floating panels), not pointer hover. Hovering does not show the toolbar.
- Hiding the toolbar removes it from the layout (the content area grows into the space). Hosts that want a constant layout can reserve the space themselves; an overlay or reserved-space variant is not part of this request.
- When the browser window itself loses focus, the toolbar hides as for any other focus loss and reappears when the window regains focus with the focus still inside the component.
- No animation is required. The existing show/hide setting keeps precedence over this one.
- Width, theming, toolbar content and all other settings are unchanged.

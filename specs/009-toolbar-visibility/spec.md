# Feature Specification: Toolbar Visibility Control

**Feature Branch**: `009-toolbar-visibility`

**Created**: 2026-11-09

**Status**: Draft

**Input**: User description: "deseo un nuevo atributo del control que permita 'mostrar' y 'esconder' la barra o barras de trabajo. tengo que poder hacerlo en tiempo real."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hide and show the toolbar from the host app (Priority: P1)

An application that embeds the editor sets a new optional property of the control to show or hide the toolbar. When hidden, the toolbar area disappears and the content area uses the freed space; when shown, the toolbar is back exactly as before. The property is optional and, when omitted, the toolbar is shown (current behavior).

**Why this priority**: This is the whole feature. Hosts need a clean, chrome-less editing surface in some contexts (compact layouts, embedded notes, distraction-free mode) and the full toolbar in others.

**Independent Test**: Render the editor with the property set to "hidden" → no toolbar; render with it "shown" or omitted → toolbar present as today.

**Acceptance Scenarios**:

1. **Given** the editor with the property omitted, **When** it renders, **Then** the toolbar is shown (no change from today).
2. **Given** the property set to "hidden", **When** the editor renders, **Then** no toolbar and none of its controls are visible or reachable, and the content area fills the vertical space the toolbar occupied.
3. **Given** the property set to "shown", **When** the editor renders, **Then** the toolbar is displayed.
4. **Given** the editor in read-only mode (`onlyView`), **When** the property is "hidden", **Then** the reduced read-only bar (notice and export) is hidden as well; when "shown", it appears as today.

---

### User Story 2 - Change visibility in real time without losing work (Priority: P1)

While the editor is mounted and in use, the host can flip the property at any moment (for example from its own button or setting) and the toolbar appears or disappears immediately, without remounting the editor or losing anything the user has done.

**Why this priority**: Explicitly required ("tengo que poder hacerlo en tiempo real"); a toggle that resets the editor would be unusable.

**Independent Test**: Type content, place the caret, make an edit, then toggle the property several times: content, caret/selection position and undo history are unchanged, and the toolbar follows the property each time.

**Acceptance Scenarios**:

1. **Given** an editor with content and the caret in the middle of a paragraph, **When** the property changes from "shown" to "hidden", **Then** the toolbar disappears at once and the content, caret position and focus are unchanged.
2. **Given** the toolbar is hidden, **When** the property changes to "shown", **Then** the toolbar appears at once with controls reflecting the current state (active formatting, current view).
3. **Given** the user has made edits, **When** the property is toggled any number of times, **Then** undo/redo history still works and the Markdown output and change notifications are unaffected (toggling alone never triggers a change notification).
4. **Given** the editor is in Markdown source view, **When** the property is toggled, **Then** the current view mode and the text cursor position are preserved.
5. **Given** a toolbar dropdown, dialog or menu is open, **When** the property becomes "hidden", **Then** it closes without applying any action and no leftover floating element remains.

---

### User Story 3 - Keep working with the toolbar hidden (Priority: P2)

With the toolbar hidden the user can still edit: typing, keyboard shortcuts, table cell menus, link popover and everything that is not part of the toolbar keep working.

**Why this priority**: Hiding the toolbar must not break editing; it is a presentation choice only.

**Independent Test**: With the toolbar hidden, type text, use formatting shortcuts, open a table cell menu and edit a link; all behave as with the toolbar shown.

**Acceptance Scenarios**:

1. **Given** the toolbar is hidden, **When** the user types and uses existing keyboard shortcuts, **Then** content is edited and formatted exactly as when the toolbar is shown.
2. **Given** the toolbar is hidden, **When** the user opens table cell menus or the link popover, **Then** they work as usual.
3. **Given** the toolbar is hidden, **When** the host reads or sets content through the existing imperative API, **Then** it works as usual.

---

### Edge Cases

- Toolbar hidden while the editor is in Markdown source view: the view toggle is part of the toolbar, so the user cannot switch back to the rendered view from the UI until the toolbar is shown again.
- Toolbar hidden in read-only mode: the read-only notice and the export control (both in the bar) are hidden too.
- Rapid repeated toggling must always leave the toolbar in the state of the latest value.
- Toggling visibility while the editor is being resized by the user: size is unaffected; only the content area height adjusts.
- Initial render with the property already set to "hidden": no flash of the toolbar.
- Focus: if focus was on a toolbar control when it is hidden, focus returns to the content area instead of being lost.
- Assistive technology: when hidden, the toolbar is not exposed to screen readers or reachable with Tab.
- The property does not alter the editor's fixed dimensions (width/height props): the toolbar space is reclaimed by the content area, not by shrinking the component.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The control MUST accept a new optional property that sets whether the toolbar is shown or hidden.
- **FR-002**: When the property is omitted, the toolbar MUST be shown (backward compatible with existing consumers).
- **FR-003**: When the property is "hidden", the control MUST NOT display the toolbar nor any of its controls, in both editing and read-only (`onlyView`) modes.
- **FR-004**: When the toolbar is hidden, the content area MUST expand to use the space the toolbar occupied; the component's own dimensions MUST NOT change.
- **FR-005**: Changing the property while the control is mounted MUST take effect immediately, without remounting the editor.
- **FR-006**: Toggling the property MUST NOT alter document content, caret/selection, undo/redo history, current view mode (rendered/Markdown), or the editor's resize state.
- **FR-007**: Toggling the property MUST NOT trigger a content-change notification.
- **FR-008**: When the toolbar becomes hidden, any open toolbar dropdown, dialog or popup MUST close without applying an action and leave no floating element behind.
- **FR-009**: When the toolbar becomes hidden while one of its controls has focus, focus MUST move to the content area.
- **FR-010**: When the toolbar is hidden, it MUST be removed from keyboard tab order and from the accessibility tree.
- **FR-011**: When the toolbar is shown again, its controls MUST reflect the current editor state (active formatting, current view mode, disabled states).
- **FR-012**: Hiding the toolbar MUST NOT disable editing capabilities that do not depend on it: typing, keyboard shortcuts, table cell menus, link popover, and the imperative API.
- **FR-013**: The new property MUST be documented (purpose, type, default, behavior when hidden, example of toggling at runtime) in the component documentation.

### Key Entities

- **Toolbar visibility setting**: a host-controlled value (shown / hidden, default shown) that determines whether the toolbar area is rendered. It is presentation-only state: not part of the document and not persisted by the control.
- **Toolbar**: the working bar(s) of the control — the formatting/insert toolbar in editing mode, the reduced bar (read-only notice and export) in `onlyView` mode, and the compare action bar when compare mode (feature 010) is active.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Toggling the setting shows or hides the toolbar within one render cycle (perceived as instant, under 100 ms) in 100% of toggles.
- **SC-002**: Across 20 consecutive toggles during an editing session, document content, caret position, undo history and view mode are unchanged in 100% of cases and zero change notifications are emitted by the toggles.
- **SC-003**: Existing consumers that do not use the new setting see no visual or behavioral change (all pre-existing behavior tests keep passing).
- **SC-004**: With the toolbar hidden, 100% of non-toolbar editing capabilities (typing, shortcuts, table menus, link popover, imperative API) behave identically to the toolbar-shown state.
- **SC-005**: With the toolbar hidden, the toolbar and its controls are absent from the accessibility tree and tab order (0 focusable toolbar controls).

## Assumptions

- "Barra o barras de trabajo" refers to the control's toolbar: the full editing toolbar and, in read-only mode, the reduced read-only bar. They share one on/off setting; separate toggles per bar are out of scope until a real need appears.
- Hiding the toolbar hides everything in it, including the Markdown/rendered view toggle and the export control; hosts that need those keep the toolbar shown. Keyboard shortcuts and the imperative API remain the way to act without it.
- The property is controlled by the host (like the other presentation props); the control does not store the value or offer its own show/hide button.
- The property name and exact type are decided at planning time, consistent with the existing boolean props of the control.
- The property is documented alongside the existing props; no new dependencies are expected.
- Scope is limited to toolbar visibility; reordering or customizing toolbar contents is out of scope.
- The compare action bar of feature 010 counts as one of the working bars for this setting: it is shown by default in compare mode, and hidden together with the toolbar when the host hides the bars (decided in 010 clarifications).

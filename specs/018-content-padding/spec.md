# Feature Specification: Adjustable Content Padding (CSS customization point)

**Feature Branch**: `018-content-padding`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "quiero que haya un atributo que me permita ajustar el tamaño del "padding" del area de contenido."

## Clarifications

### Session 2026-11-14

- Q: Attribute, CSS variable or both? → A: Only a CSS customization point (`--mdw-content-padding`, documented in the theming guide), no attribute; its default is today's spacing (12 px vertical, 16 px horizontal)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The host sets the inner spacing of the content area (Priority: P1)

A host embeds the editor in a layout with its own spacing rules: a compact sidebar needs little space between the text and the edges of the content area; a document page needs generous margins. Through a CSS customization point of the control (declared on the control's class, on a wrapper or on the page root, like the other theming values) the host chooses that inner spacing ("padding") and the text moves accordingly, in both the rendered and the Markdown views.

**Why this priority**: This is the whole request.

**Independent Test**: Render the control with a padding of 0 and with a large padding: the distance between the text and the edges of the content area changes as configured, in both views.

**Acceptance Scenarios**:

1. **Given** the value is not declared, **When** the control is shown, **Then** the content area keeps today's spacing (12 px top and bottom, 16 px left and right).
2. **Given** a single length (for example `24px`), **When** the control is shown, **Then** that spacing applies on all four sides of the content area.
3. **Given** a value with different sizes per side (vertical / horizontal, or each side), **When** the control is shown, **Then** each side uses its size.
4. **Given** a value of `0`, **When** the control is shown, **Then** the text touches the edges of the content area (no inner spacing).
5. **Given** a declared value, **When** the user switches between the rendered and the Markdown view, **Then** both views use the same spacing and the text does not jump horizontally between them.

---

### User Story 2 - Works everywhere the content area appears (Priority: P2)

The spacing applies consistently in every mode: compare mode (both panes), the version-history mode, read-only, with automatic height, and with the Markdown view's highlight of differences, without breaking anything that depends on the position of the text.

**Why this priority**: A customization that only works in one mode would look broken.

**Independent Test**: With a padding of 40 open compare mode in the Markdown view, the version history and automatic height: every pane uses 40, the yellow highlight of differences stays exactly under the changed words, the panes scroll in sync on matching content, and the automatic height includes the new spacing.

**Acceptance Scenarios**:

1. **Given** compare mode, **When** the panes are shown, **Then** both the original and the new pane use the configured spacing.
2. **Given** compare mode in the Markdown view, **When** differences are highlighted, **Then** the highlight stays aligned with the changed text for any spacing.
3. **Given** compare mode with synchronized scrolling, **When** the user scrolls, **Then** the panes still follow each other by matching content.
4. **Given** automatic height, **When** the content grows, **Then** the control's height includes the configured spacing and no inner scrollbar appears.
5. **Given** the value changes while the control is mounted (class change, live theme edit), **When** it changes, **Then** the spacing updates immediately without losing content, caret, selection, undo history or view, and without firing the change notification.
6. **Given** helper elements placed relative to the content (table menu trigger, gap cursor between blocks, clicking to the right of a table), **When** the spacing changes, **Then** they still appear and work in the right place.

---

### Edge Cases

- Invalid value (negative, unparsable text): standard CSS behavior for an invalid custom-property value (padding 0); documented in the guide's troubleshooting.
- Very large spacing that leaves little or no room for text in a narrow control: the text wraps in the remaining space; the content stays reachable by scrolling.
- Spacing given in relative units (for example `1em`, `2rem`, percentages): accepted as long as it is a valid length.
- Declared at several levels (control class, wrapper, page root): the usual theming precedence applies (closest wins).
- Horizontal scroll of wide content (tables, code) keeps working with any spacing.
- The toolbar, compare bar, history bar and version list are not affected (only the content area).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The control MUST offer a CSS customization point `--mdw-content-padding` to adjust the inner spacing (padding) of the content area, following the theming model (declared on the control's class, any ancestor or the page root; any stylesheet load order). No new attribute is added.
- **FR-002**: The value MUST accept the standard padding forms: one length for all sides (`24px`, `1rem`, `0`) and the two-to-four-value shorthand (`8px 24px`, `4px 8px 12px 16px`).
- **FR-003**: When not declared, the spacing MUST be today's (`12px 16px`) so existing hosts see no change.
- **FR-004**: The spacing MUST apply identically to the rendered view and the Markdown view, and to both panes in compare mode.
- **FR-005**: In compare mode's Markdown view, the highlight of differences MUST stay aligned with the text for any spacing.
- **FR-006**: Features that depend on the text position (synchronized scrolling in compare mode, automatic height, table menu trigger, gap cursor, click-to-place-caret beside blocks) MUST keep working with any spacing.
- **FR-007**: Changing the value at runtime MUST take effect immediately without remounting and without changing content, caret, selection, undo history, the active view or firing the change notification.
- **FR-008**: Invalid values follow the documented theming rule (an invalid custom-property value makes the padding invalid, i.e. 0); the guide states it.
- **FR-009**: Only the content area MUST be affected; bars, lists and floating panels keep their spacing.
- **FR-010**: The customization point MUST be listed in the theming guide (with its default and accepted values) and the change log, mentioned in the component guide and the assistant guide, and editable in the demo's theme section (which lists every customization point).
- **FR-011**: The project's documentation checks MUST include it (it is a public customization point like the others).

### Key Entities

- **Content padding**: the inner spacing between the content area's edges and its text, per side.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With the value not declared, the content area's spacing is identical to the previous release in 100% of views and modes; all existing tests keep passing.
- **SC-002**: For any valid value, the measured spacing on each side of the content area equals the configured value (±1 px) in the rendered view, the Markdown view and both compare panes.
- **SC-003**: In compare mode's Markdown view, highlighted differences sit exactly under the changed words (0 px offset) for spacings of 0, 12, 40 and 2rem.
- **SC-004**: Changing the value at runtime produces 0 content, caret or notification changes.
- **SC-005**: A host sets the spacing with one CSS declaration (e.g. `.mi-editor { --mdw-content-padding: 24px; }`).

## Assumptions

- Only a CSS customization point is provided (Clarification), consistent with the other visual customizations; no attribute.
- The value format is the standard CSS padding shorthand.
- Default stays 12 px / 16 px.
- Applies to the content area only; the toolbar and other bars are out of scope.
- The demo exposes it in the theme section of the configuration builder (017), which lists every customization point.

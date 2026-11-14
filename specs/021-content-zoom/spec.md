# Feature Specification: Content Zoom and Toolbar Size

**Feature Branch**: `021-content-zoom`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Necesito 1 nuevo atributo en el control: "permitir modificar tamaño viewport" true o false. Si está en true, deberia permitir agrander y reducir el tamaño del "Contenido". si el usuario usa ctrl + ruedita sobre el viewport deberia lograr lo mismo. Tambien se debe poder modificar (independientemente) el tamaño de la barra mediante algun atributo del css. por default que sea como está."

## Clarifications

### Session 2026-11-14

- Q: What does "enlarge and reduce the size of the Content" mean? → A: Zoom of the content (text and elements scale; the control keeps its size). In addition, the base text size must be settable through its own CSS customization point, independent of the zoom
- Q: How is zoom controlled besides Ctrl + wheel? → A: No visible controls: only Ctrl/Cmd + wheel over the content and the keyboard shortcuts Ctrl/Cmd + `+`, `-`, `0` with focus inside the content. The current zoom must be reflected in a CSS customization point of the component (`--mdw-content-zoom`): the host can set the starting zoom through it, and the user's zoom changes update it on the component

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The user zooms the content in and out (Priority: P1)

With the new setting on, a user who finds the text too small (or too big) can enlarge or reduce the size of the content area's text and elements — like zooming a document — without changing the size of the control, the toolbar or the rest of the page. They do it by holding Ctrl (Cmd on macOS) while turning the mouse wheel over the content, or with Ctrl/Cmd + `+`, `-` and `0` while the focus is in the content. There are no on-screen zoom controls; the current zoom is reflected in a CSS value of the component that the host can read and set.

**Why this priority**: This is the core of the request.

**Independent Test**: Render the control with the setting on: use Ctrl + wheel over the content and Ctrl + `+` / `-` / `0`; the text and elements of the content grow and shrink, the toolbar and the control's size stay the same, and the browser page itself does not zoom.

**Acceptance Scenarios**:

1. **Given** the setting is on and the focus is in the content, **When** the user presses Ctrl/Cmd + `+` or Ctrl/Cmd + `-`, **Then** the content's text and elements grow / shrink by one step, the browser's page zoom does not happen, and the component's zoom CSS value reflects the new level (e.g. `1.2`).
2. **Given** the setting is on and the pointer is over the content, **When** the user turns the wheel while holding Ctrl (or Cmd on macOS), **Then** the content zooms in (wheel up) or out (wheel down) by one step, and the browser's own page zoom does not happen.
3. **Given** the content is zoomed, **When** the user presses Ctrl/Cmd + `0` with the focus in the content, **Then** the content returns to the starting zoom (100 %, or the one the host set via CSS).
4. **Given** the zoom reaches its minimum or maximum, **When** the user tries to go further, **Then** nothing changes.
5. **Given** the setting is off (default), **When** the user uses Ctrl + wheel or the shortcuts, **Then** the control does nothing special (the browser behaves as usual).
6. **Given** the host declares a starting zoom through the component's zoom CSS value, **When** the control is shown, **Then** the content starts at that zoom, and the user's changes are written back to that value on the component (readable by the host).
7. **Given** the content is zoomed, **When** the user edits, selects, scrolls or uses the toolbar, **Then** everything works normally at that size (caret position, selection, clicks on links, table menus, image sizes scale with the content).

---

### User Story 2 - Zoom works everywhere the content is shown (Priority: P2)

The zoom applies consistently to the rendered and Markdown views, both panes of compare mode, read-only mode and the version-history mode, and keeps working with automatic height and scroll synchronization.

**Why this priority**: A zoom that only works in some views would be confusing.

**Independent Test**: Zoom to 150 %, then switch views, open compare mode and history mode: the content stays at 150 % everywhere; with automatic height the control grows accordingly; compare highlight stays aligned and the panes stay in sync.

**Acceptance Scenarios**:

1. **Given** a zoom level, **When** the user switches between the rendered and Markdown views, **Then** the same zoom level applies.
2. **Given** compare mode, **When** the user zooms, **Then** both panes zoom together, the highlight stays aligned with the text and synchronized scrolling keeps matching content.
3. **Given** automatic height is on, **When** the user zooms in, **Then** the control grows so there is still no inner scrollbar.
4. **Given** read-only mode, **When** the setting is on, **Then** the user can still zoom (zoom does not modify the content).
5. **Given** the zoom changes, **When** it does, **Then** the content, caret, selection, undo history and change notifications are unaffected.

---

### User Story 3 - The host sizes the toolbar and the base text independently via CSS (Priority: P2)

A host whose UI uses larger or smaller controls can change the size of the toolbar (buttons, icons, select, labels) through a CSS customization point, independently of the content zoom. Without it, the toolbar looks exactly as today.

**Why this priority**: Explicitly requested; complements the content zoom.

**Independent Test**: Declare the toolbar size value at 125 % on the control's class: the toolbar's buttons, icons and texts grow proportionally; the content is unchanged; removing it restores today's toolbar.

**Acceptance Scenarios**:

1. **Given** the toolbar size value is not declared, **When** the control is shown, **Then** the toolbar looks exactly as today.
2. **Given** a larger or smaller toolbar size, **When** the control is shown, **Then** the toolbar's buttons, icons, select and texts scale proportionally and remain aligned and usable; the content's size is unchanged.
3. **Given** a toolbar size, **When** the compare bar, history bar and toolbar menus/pickers are shown, **Then** they follow the same toolbar size.
4. **Given** the value is declared on the control's class, a wrapper or the page root, **When** shown, **Then** it applies following the usual theming precedence.
5. **Given** the host sets a base text size for the content (e.g. 16px), **When** the control is shown, **Then** the content text uses that size at 100 % zoom and the user's zoom scales from it; the toolbar is unaffected.

---

### Edge Cases

- Zoom limits: 50 % minimum, 300 % maximum, 10 % steps (assumption); repeated wheel ticks are applied one step per tick, without overshooting the limits.
- Fast wheel scrolling / trackpad pinch (which browsers report as Ctrl + wheel): handled as zoom with the same steps, smoothly.
- Ctrl + wheel outside the content (over the toolbar or the page): not intercepted.
- Wheel without Ctrl over the content: normal scrolling.
- Turning the setting off while zoomed: the content returns to the starting zoom and the shortcuts stop being intercepted.
- The zoom level is not stored by the control; the host can read it from the component's `--mdw-content-zoom` value and restore it by declaring it.
- Images, tables, code blocks and diagrams scale with the content; very wide content gets horizontal scroll as usual.
- Toolbar size very small or very large: controls stay operable (minimum size respected for usability) and the toolbar keeps its single-row overflow behavior.

## Requirements *(mandatory)*

### Functional Requirements

#### Content zoom

- **FR-001**: The control MUST offer a boolean setting to allow zooming the content (expected name `allowContentZoom`; decided at planning), **off by default**.
- **FR-002**: With the setting on, the user MUST be able to enlarge, reduce and reset the size of the content area's text and elements (zoom), without changing the control's dimensions, the toolbar, or the page.
- **FR-003**: With the setting on, Ctrl + mouse wheel (Cmd + wheel on macOS, including trackpad pinch) over the content area MUST zoom in/out by one step per tick and MUST NOT trigger the browser's page zoom.
- **FR-004**: With the setting on and the focus in the content, Ctrl/Cmd + `+` / `=` zooms in, Ctrl/Cmd + `-` zooms out and Ctrl/Cmd + `0` resets, without triggering the browser's page zoom. There are no on-screen zoom controls. Each change is announced politely to assistive technology (e.g. "Zoom 120 %").
- **FR-005**: Zoom MUST range from 50 % to 300 % in 10 % steps, starting at the host's starting zoom (default 100 %); at the limits further steps do nothing.
- **FR-006**: Zoom MUST apply equally to the rendered and Markdown views, both compare panes, read-only and history modes; compare highlight alignment, synchronized scrolling and automatic height MUST keep working.
- **FR-007**: Zoom MUST NOT modify the content, caret, selection, undo history or fire the change notification.
- **FR-008**: With the setting off, Ctrl + wheel and the zoom shortcuts MUST not be intercepted; turning it off returns the content to the starting zoom.
- **FR-009**: The current zoom MUST be reflected in a CSS customization point of the component (`--mdw-content-zoom`, a factor, default `1`): a value declared by the host (class, ancestor or page root) is the starting zoom; the user's changes are written on the component so the host can read them (e.g. to remember the preference) and the reset shortcut returns to the host's value.

#### Toolbar size

- **FR-010**: The control MUST offer a CSS customization point to set the toolbar's size (expected `--mdw-toolbar-scale`, a scale factor, default `1` = today's size), declared like the other theming values.
- **FR-011**: The toolbar size MUST scale the toolbar's buttons, icons, select, labels and the compare/history bars and toolbar menus/pickers proportionally, independently of the content zoom.

#### Base text size

- **FR-012**: The content's base text size MUST be settable through CSS customization points, one per view like the existing per-view font family values (expected `--mdw-content-wysiwyg-font-size`, default `14px`, and `--mdw-content-markdown-font-size`, default `13px` — today's sizes), declared like the other theming values.
- **FR-013**: The base text size and the zoom MUST be independent: the user's zoom multiplies whatever base size the host set (e.g. base 16px at 125 % shows 20px), and changing the base size never changes the zoom level.

#### General

- **FR-014**: The defaults MUST keep today's behavior and appearance (zoom off, toolbar at its current size).
- **FR-015**: Both MUST be self-documented and documented (component guide, theming guide for the CSS value, overview, assistant guide, change log) and available in the playground.

### Key Entities

- **Content zoom level**: a percentage (50–300 %, default 100 %) applied to the content area only.
- **Toolbar scale**: a factor applied to the toolbar and its bars and menus.
- **Base text size**: the content's text size at 100 % zoom, per view, set by the host via CSS.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With the setting on, each zoom step changes the content's text size by 10 % of the base size, and Ctrl + wheel over the content changes the zoom in 100 % of tested ticks without zooming the page.
- **SC-002**: With the setting off (default), 0 behavioral or visual changes compared with the previous release; existing tests keep passing.
- **SC-003**: At 50 %, 100 % and 300 % zoom, editing, selection, link clicks and table menus work correctly in both views and in compare mode (0 misplaced carets or clicks in the tested scenarios).
- **SC-004**: With the toolbar size undeclared, the toolbar is pixel-identical to the previous release; with 1.25, all toolbar controls scale by 25 % (±1 px) and remain on one row with the existing overflow behavior.
- **SC-005**: Zoom, base text size and toolbar size are independent: changing one leaves the others' values unchanged in 100 % of tested cases, and the displayed text size equals base size × zoom (±1 px).

## Assumptions

- "Tamaño del Contenido" means the zoom of the content area's text and elements (Clarification), not the control's width/height (those already have `width`, `height`, `resizable`, `autoHeight`). The base text size is a separate CSS customization point (FR-012).
- "Viewport" refers to the content area of the control.
- No on-screen zoom controls (Clarification); zoom works with Ctrl/Cmd + wheel and keyboard shortcuts, also when the toolbar is hidden.
- Range 50–300 %, step 10 %, default 100 %.
- The toolbar size is a CSS customization point (scale factor) following the theming model, default `1`.
- The zoom level is reflected in the CSS value `--mdw-content-zoom` on the component; it is not persisted by the control.

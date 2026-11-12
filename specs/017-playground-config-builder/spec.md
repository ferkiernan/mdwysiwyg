# Feature Specification: Playground Configuration Builder (attributes and final CSS)

**Feature Branch**: `017-playground-config-builder`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "en el playground, la seccion de "theming" debe tener todo lo necesario para crear el css final para implementar estilo propio cuando apretas "crear CSS" inclluso podria haber debajo una seccion arriba, que diga "seleciona los atributos de tu control" que permita cambiar los atributos personalizables y un boton "copiar atributos" para luego pegarlos en el host a la hora de configurar el control."

## Clarifications

### Session 2026-11-12

- Q: Format of the copied attributes? → A: Both, with a "JSX / objeto" selector next to the button, JSX by default: a ready-to-paste control element, or a props object to spread into the control
- Q: One shared preview or one per section? → A: One shared preview applying both the chosen attributes and the theme, kept in view (sticky) while scrolling both sections; the existing standalone demos below stay as they are
- Q: What does "Crear CSS" do? → A: An always-visible output panel shows the final CSS and its instructions, updated live; "Crear CSS" copies that content to the clipboard with a confirmation

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build the final CSS of my own look in the theming section (Priority: P1)

A developer adjusts the look of the control in the demo's theming section (preset, colors, fonts, backgrounds) while watching a live preview. When they press **"Crear CSS"**, they get the complete, ready-to-paste CSS for their host application: every value they changed, under the selector they chose, plus the short instructions needed to apply it (import the control's stylesheet, put the class on the control or declare it at page level). Nothing else has to be looked up.

**Why this priority**: It is the first and main request: the theming section must produce the final CSS, not a partial one.

**Independent Test**: In the demo, pick the dark preset, change two colors, press "Crear CSS", paste the result into a fresh host page with the control: it looks exactly like the demo preview.

**Acceptance Scenarios**:

1. **Given** the theming section, **When** the developer opens it, **Then** every customization point of the control can be edited there, grouped as in the customization guide (toolbar, content, tables and code, syntax, quotes, controls, floating panels, comparison, history, scroll, base colors), each showing its default.
2. **Given** the developer edits values, **When** they look at the preview, **Then** the change is visible immediately on a control that shows every themed part (toolbar, content with code, table, quote, compare highlight, an opened menu or popover on demand).
3. **Given** edited values, **When** the developer looks at the output panel (always visible), **Then** it shows the final CSS — only the values that differ from the defaults (option: all values), under the chosen scope — updated live; **When** they press "Crear CSS", **Then** that content is copied to the clipboard and a confirmation appears.
4. **Given** the scope choice, **When** the developer picks "this control" (a class name they can edit), "a section" (wrapper selector) or "the whole page" (page root), **Then** the generated CSS uses that selector, and the instructions shown next to it say where to put the class or the CSS.
5. **Given** the developer prefers following the operating system's light/dark preference, **When** they enable that option and set a dark variant, **Then** the CSS includes the light values plus the dark values for the dark preference.
6. **Given** the generated CSS, **When** it is pasted into a host page that imports the control's stylesheet, **Then** it works in any stylesheet load order and without `!important` (per 015).
7. **Given** a preset is selected, **When** the developer then edits values, **Then** the CSS reflects the preset plus the edits; a "reset to defaults" action restores the defaults.
8. **Given** the theming section, **When** the developer wants more detail, **Then** the link to the styling guide (016) is next to "Crear CSS".

---

### User Story 2 - Choose my control's attributes and copy them (Priority: P1)

Above the theming section, a new section **"Seleccioná los atributos de tu control"** lets the developer try every configurable attribute of the control (size, read-only, toolbar visibility, resize, modes and their companions, version history, scroll sync, automatic height, automatic toolbar hiding, notice text, embedded-HTML sanitizing…) on a live preview. A **"Copiar atributos"** button copies the attributes they chose, ready to paste into their host where they configure the control.

**Why this priority**: It is the second explicit request; together with the CSS it gives the developer everything to configure the control in their host.

**Independent Test**: In the demo, set height 400, turn on read-only and version history (read-only disables it — the section shows why), turn on automatic height, press "Copiar atributos", paste into a host: the control behaves like the demo preview.

**Acceptance Scenarios**:

1. **Given** the section, **When** the developer opens it, **Then** every configurable attribute of the control has an input of the right kind (switch, text, number/size, option list), shows its default, and a one-line explanation taken from the attribute's own documentation (015).
2. **Given** the developer changes an attribute, **When** the preview updates, **Then** it reflects the change at once, without losing the preview's content.
3. **Given** attributes that depend on others (compare mode needs orientation and new content; version history has no effect with read-only; the height setting is the minimum with automatic height), **When** a dependency is not met, **Then** the section shows a short note next to the affected attribute.
4. **Given** the chosen attributes, **When** the developer presses "Copiar atributos", **Then** the clipboard receives the attributes in the format selected next to the button — a ready-to-paste control element (JSX, default) or a props object to spread into the control — containing only the attributes that differ from the defaults, and a visible confirmation appears.
5. **Given** the copied attributes include the class for the custom look, **When** the developer also created CSS in the theming section with "this control" scope, **Then** the copied attributes include that class name, so the CSS and the attributes match.
6. **Given** attributes that are functions supplied by the host (change notification, compare decision, image resolver), **When** attributes are copied, **Then** they appear as clearly marked placeholders for the host to fill, not as working code from the demo.
7. **Given** a copy is not possible (clipboard blocked), **When** the button is pressed, **Then** the text is shown selected in a box so it can be copied by hand.

---

### User Story 3 - Configuration and look together, one flow (Priority: P2)

The developer goes top to bottom: choose attributes → adjust the look → copy attributes and CSS → paste into the host. Both outputs agree with each other and with what the preview shows.

**Why this priority**: It ties the two outputs together; each is useful alone.

**Independent Test**: Follow the flow end to end and paste both outputs into a minimal host: the control matches the demo preview in behavior and look.

**Acceptance Scenarios**:

1. **Given** both sections, **When** the developer uses them, **Then** one shared preview shows the combination of chosen attributes and look, and stays in view while scrolling through both sections.
2. **Given** the flow is complete, **When** both outputs are pasted into a minimal host, **Then** behavior and look match the preview (no missing step).
3. **Given** the developer reloads the demo, **When** it opens again, **Then** their last choices are restored (stored only in their browser), and a "start over" action clears them.

---

### Edge Cases

- A value entered is not valid CSS (typo in a color): the field is flagged, the preview keeps the last valid value, and the generated CSS excludes it with a note.
- Free-text values with special characters (notice text with quotes): the copied attributes are escaped correctly.
- No value changed: "Crear CSS" explains that the defaults are in use and offers the full list anyway; "Copiar atributos" copies an empty configuration plus the minimal usage.
- Class name typed with invalid characters: flagged and not used until valid.
- Attributes added in the future: the section lists them automatically from the control's attribute documentation, so it does not drift (non-blocking warning from 015's checks otherwise).
- Small screens: sections stack vertically; outputs remain copyable.
- The live demo and the local demo behave the same.

## Requirements *(mandatory)*

### Functional Requirements

#### Theming section ("Crear CSS")

- **FR-001**: The theming section MUST let the developer edit every customization point of the control (all points listed by 015), grouped by area, each showing its default and an appropriate input (color picker plus text for colors, text for fonts, free text for backgrounds/shadows).
- **FR-002**: Edits MUST apply live to a preview control that displays every themed part, including on-demand opened floating panels (menu, popover, dialog), comparison highlight and version list.
- **FR-003**: The section MUST offer presets (at least default, dark, brand, flat) and a "reset to defaults" action.
- **FR-004**: An always-visible output panel MUST show the final CSS, updated live: changed values only by default (option: all values), under the chosen scope selector (this control by class name, a section by wrapper selector, whole page). The **"Crear CSS"** button MUST copy that content (CSS plus instructions as CSS comments) to the clipboard and show a confirmation.
- **FR-005**: The output MUST include short instructions for the chosen scope: import the control's stylesheet, where to put the class or the CSS; and MUST show the class name to use when the scope is "this control".
- **FR-006**: An option MUST generate light and dark variants following the user's operating-system preference.
- **FR-007**: The generated CSS MUST work when pasted into a host, in any stylesheet load order, without `!important` (relies on 015's fallback restructuring).
- **FR-008**: The styling-guide link (016) MUST be placed next to "Crear CSS".

#### Attributes section ("Seleccioná los atributos de tu control")

- **FR-009**: A new section titled "Seleccioná los atributos de tu control" MUST be placed above the theming section.
- **FR-010**: It MUST list every configurable attribute of the control with a suitable input, its default and a one-line explanation from the attribute's documentation; the list MUST be derived from the control's attribute documentation so new attributes appear without editing the demo by hand.
- **FR-011**: Changes MUST apply live to the preview control without losing its content.
- **FR-012**: Dependencies and conflicts between attributes MUST be shown next to the affected attribute (compare companions, history vs. read-only, height vs. automatic height, toolbar visibility vs. automatic hiding).
- **FR-013**: A **"Copiar atributos"** button MUST copy the chosen attributes, only those different from the defaults, in the selected format (JSX element by default, or props object; selector next to the button), with correct escaping and a visible confirmation; host-supplied functions appear as marked placeholders.
- **FR-014**: If the theming scope is "this control", the copied attributes MUST include the class name used by the generated CSS.
- **FR-015**: If the clipboard is unavailable, both copy actions MUST fall back to a selected text box for manual copy.

#### Flow and persistence

- **FR-016**: Both sections MUST drive one shared preview control that applies the chosen attributes and the theme together and stays in view (sticky) while the developer scrolls through both sections; the existing standalone demos remain unchanged.
- **FR-017**: The demo MUST keep both sections' choices in the developer's own browser across reloads, with a "start over" action.
- **FR-018**: Both outputs together, pasted into a minimal host that imports the control's stylesheet, MUST reproduce the preview's behavior and look.
- **FR-019**: All texts of the new sections MUST be in Spanish, like the rest of the demo; inputs MUST be keyboard-accessible and labeled.
- **FR-020**: The control (package) itself MUST NOT change for this feature; only the demo and the change log.

### Key Entities

- **Attribute choice**: attribute name, value, default, kind (switch, text, size, option, host function), dependency notes.
- **Theme choice**: customization point, value, default, area; scope (control class / wrapper / page) and optional dark variant.
- **Generated outputs**: attributes snippet (JSX element or props object); final CSS with instructions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the control's configurable attributes and 100% of its customization points can be set from the demo.
- **SC-002**: Pasting the two outputs into a minimal host reproduces the preview's look and behavior in 100% of tested combinations (presets × scopes × a sample of attribute sets).
- **SC-003**: A developer goes from opening the demo to having both outputs copied in under 3 minutes for a typical customization (preset + 3 color changes + 3 attributes).
- **SC-004**: Generated CSS needs 0 manual edits to work in the host, in both stylesheet load orders.
- **SC-005**: Copied attributes contain 0 default-valued entries and 0 syntax errors when pasted into a host.
- **SC-006**: The package is unchanged: all existing tests keep passing and the published bundle is identical except for version metadata.

## Assumptions

- "Atributos personalizables" are the control's configurable settings (props), including callbacks shown as placeholders; "crear CSS" is the existing "Copiar CSS" action of the demo, renamed and completed.
- The phrase "debajo una sección arriba" is read as: the new attributes section goes **above** the theming section, in the same page.
- The demo already has a theme panel with presets and a copy-CSS button; this feature extends it rather than replacing the idea.
- The attribute explanations come from the attribute documentation written in 015 (single source); until 015 lands, a short local text is used.
- Depends on 015 (all customization points, fallback restructuring so CSS works at any level) and 016 (guide link); 013/014 attributes appear once implemented.
- Choices are stored only in the developer's browser; nothing is sent anywhere.

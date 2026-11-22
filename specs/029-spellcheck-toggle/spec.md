# Feature Specification: Attribute to Turn Spell Checking On and Off

**Feature Branch**: `029-spellcheck-toggle`

**Created**: 2026-11-22

**Status**: Draft

**Input**: User description: "añadir un atributo para activar y desactivar corrección ortografica."

## Context

I checked the code on 2026-11-22:

- **Rendered view (editable content):** the component does not set spell checking, so the browser's default applies.
  In common browsers that default is on: misspelled words are underlined.
- **Markdown view:** spell checking is always off, so Markdown symbols are not underlined.
- **No control for hosts:** a host cannot turn spell checking on or off.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host turns spell checking off or on (Priority: P1)

A host developer adds the attribute to the editor. With spell checking off, the user's misspelled words are no longer
underlined and no correction suggestions appear. With it on, they are.

**Why this priority**: This is the whole request. Typical uses are code-heavy or technical documents, or a language
different from the browser's.

**Independent Test**:

- **Off:** render the editor with spell checking off, type `holaa mundoo`. No underline appears and the content is
  marked as not spell-checked.
- **On:** turn it on. The underlines return, without reloading the page and without losing the text.

**Acceptance Scenarios**:

1. **Given** the attribute is not set, **When** the editor renders, **Then** spell checking behaves as today: it is
   on in the rendered view.
2. **Given** spell checking is off, **When** the user types in the rendered view, **Then** the browser does not mark
   misspellings or offer corrections.
3. **Given** spell checking is on, **When** the user types in the rendered view, **Then** the browser marks
   misspellings and offers its corrections.
4. **Given** the host changes the attribute while the editor is open, **When** the change applies, **Then** the new
   setting takes effect right away. The content, the cursor and the undo history are kept.

---

### Edge Cases

- **Markdown view:** spell checking stays off there in all cases, as today, so Markdown symbols are not underlined.
- **Compare mode:** the editable pane follows the attribute. The original pane is read-only and needs no spell
  checking.
- **Read-only content:** with `onlyView` or in history, the content cannot be edited, so the attribute has no visible
  effect.
- **Language:** the dictionary is the browser's or the operating system's. The attribute only turns checking on or
  off; it does not choose the language.
- **Dialogs:** text fields inside the toolbar dialogs (link URL, HTML, image) are not affected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001: the attribute.** The component MUST accept an optional boolean attribute that turns spell checking on
  (`true`) or off (`false`) for the editable content of the rendered view.
- **FR-002: default.** If the attribute is not set, the default MUST be on, the same as today's behavior.
- **FR-003: off.** When it is off, the content MUST tell the browser not to spell-check it.
- **FR-004: on.** When it is on, the content MUST tell the browser to spell-check it.
- **FR-005: live change.** Changing the attribute at runtime MUST apply immediately, without remounting the editor and
  without changing the content, the selection or the undo history.
- **FR-006: compare mode.** In compare mode, the editable pane MUST follow the attribute.
- **FR-007: Markdown view.** The Markdown view MUST keep spell checking off regardless of the attribute.
- **FR-008: documentation and playground.** The component guide (props table), the AI-facing summary and the change
  log MUST document the attribute. The playground's configurator MUST list it, so it can be tried and copied.

### Key Entities

- **Spell-check setting:** a per-editor on/off value; on by default.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001: correct setting.** In 100 % of tests, the editable content reports the expected setting: on by default and
  with `true`, off with `false`.
- **SC-002: live switch.** Toggling the attribute switches the setting without losing a single character of content or
  any undo step.
- **SC-003: nothing else changes.** The Markdown view never spell-checks, and existing tests keep passing.

## Assumptions

- **Name:** the attribute is called `spellCheck`, following the React and HTML naming that hosts already know.
- **Scope:** only on/off. Choosing a dictionary language is out of scope; the browser decides it, normally from the
  page's or the system's language.
- **Markdown view:** keeping it without spell checking avoids false alarms on Markdown syntax. This could be revisited
  later.

# Feature Specification: Close Toolbar Mini-Dialogs on an Outside Click

**Feature Branch**: `028-floating-panel-outside-close`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "Cuando se abre algun "modal" como el que aparece en el boton de "HTML" si hago click fuera del modal, se debe cerrar. lo mismo para todos esos mini modales del menú."

## Context

I checked the code on 2026-11-21. Some floating panels already close when the user clicks outside them, and others do
not.

| Panel | Opened from | Closes on an outside click today? |
|---|---|---|
| Embedded HTML dialog | Toolbar «HTML» button | ❌ only with Cancel, Escape or Apply |
| Image dialog | Toolbar «Imagen» button | ❌ |
| Link dialog | Toolbar «Enlace» button | ❌ |
| Table size picker | Toolbar «Tabla» button | ❌ |
| Code language picker | Toolbar «Bloque de código» button | ❌ |
| Export menu | Toolbar «Export» button | ❌ |
| Link options menu | Clicking a link in the content | ✅ |
| Table actions menu | Table cell trigger or context menu | ✅ |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Click outside to dismiss (Priority: P1)

The user opens one of the toolbar's mini-dialogs (HTML, image, link, table size, code language, export), then
clicks anywhere outside it: in the content, on the toolbar, or elsewhere on the page. The dialog closes without
applying anything, exactly as if the user had pressed Cancel or Escape.

**Why this priority**: This is the whole request. Today a dialog stays open until the user finds Cancel.

**Independent Test**: open the «HTML» dialog and click in the document text. The dialog disappears, nothing is
inserted, and the click places the cursor where it landed. Repeat with each toolbar panel.

**Acceptance Scenarios**:

1. **Given** any toolbar mini-dialog is open, **When** the user clicks outside it, **Then** it closes and nothing
   is applied. The document does not change and no change notification fires.
2. **Given** a dialog is open, **When** the outside click lands in the content, **Then** the click also does its
   normal job, such as placing the cursor or selecting. One click is enough.
3. **Given** a dialog is open, **When** the outside click lands on another toolbar button, **Then** the open dialog
   closes and that button performs its action. If the button opens another dialog, only the new one stays open.
4. **Given** a dialog is open, **When** the user clicks the same button that opened it, **Then** the dialog closes
   and does not reopen.
5. **Given** a dialog is open, **When** the user clicks inside it (fields, selects, the color of the table grid,
   buttons), **Then** it stays open.

---

### User Story 2 - Consistent with the existing menus (Priority: P2)

All floating panels behave the same: the link options menu and the table actions menu, which already close on an
outside click, keep doing so, and the toolbar dialogs now match them.

**Acceptance Scenarios**:

1. **Given** the link options menu or the table actions menu, **When** the user clicks outside, **Then** they close
   as today.
2. **Given** any floating panel closes because of an outside click, **When** the focus moves, **Then** it does not
   jump back to the toolbar button if the click went into the content. The focus follows the click.

---

### Edge Cases

- **Unsaved input:** text typed in a dialog that is closed by an outside click is discarded, as with Cancel. There is
  no confirmation.
- **Native lists:** options of a native select list (for example the code language) can open outside the panel's
  area. Choosing one must not count as an outside click.
- **Scrollbars:** a click on a page scrollbar or the toolbar's own horizontal scrollbar closes the dialog too, or it
  is at least harmless.
- **Several editors on the page:** a click inside one editor closes the dialogs of another editor on the page.
- **Read-only and compare:** the toolbar dialogs do not exist there, so nothing changes.
- **Keyboard:** Escape and Cancel keep working as today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001: close on outside click.** Every floating panel opened from the toolbar MUST close when the user presses
  the pointer anywhere outside it:
  - the image, link and embedded HTML dialogs;
  - the table size picker;
  - the code language picker;
  - the export menu.
- **FR-002: like Cancel.** Closing by an outside click MUST be equivalent to Cancel: nothing is applied, the
  document does not change, and no change notification fires.
- **FR-003: one click.** The outside click MUST NOT be swallowed. It keeps its normal effect (placing the cursor,
  pressing another button, following the page's own controls).
- **FR-004: same button.** Clicking the button that opened the panel MUST close it, not close and reopen it.
- **FR-005: inside clicks.** Clicks inside the panel, including its native select lists, MUST NOT close it.
- **FR-006: focus follows the click.** After an outside-click close, the focus MUST follow the click. It returns to
  the opening button only when the panel closes with Escape or Cancel, as today.
- **FR-007: existing menus unchanged.** The link options menu and the table actions menu MUST keep closing on an
  outside click as today.
- **FR-008: documentation.** The change log and the component guide MUST record the behavior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001: every panel closes.** In 100 % of tests, each of the six toolbar panels closes after one outside click,
  with no change to the document.
- **SC-002: the click still counts.** A single click in the content both closes the panel and places the cursor
  there.
- **SC-003: inside clicks are safe.** No panel closes because of an interaction inside it.
- **SC-004: no regressions.** Existing tests for dialogs, menus and keyboard handling keep passing.

## Assumptions

- **Which panels:** «Todos esos mini modales del menú» means the toolbar's floating panels listed in FR-001.
- **No backdrop:** there is no dimmed background; the panels stay non-modal popovers.
- **Discarded input:** discarding the typed input on an outside click is acceptable (same as Cancel), consistent with
  the link and table menus.

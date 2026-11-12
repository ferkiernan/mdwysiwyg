# Feature Specification: Playground Link to the Host Styling Guide

**Feature Branch**: `016-playground-theming-link`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "en el playground, añade un link a la documentación de "como implementar estilos en tu host""

## User Scenarios & Testing *(mandatory)*

### User Story 1 - From the demo to the styling guide in one click (Priority: P1)

A developer trying the control in the demo (playground, also published as the live demo) plays with the theme panel and wants to apply a custom look in their own application. Next to the theming section they find a clearly labeled link, "Cómo implementar estilos en tu host", that opens the customization guide.

**Why this priority**: It is the whole request; the demo is where developers decide to restyle the control, so the guide must be one click away.

**Independent Test**: Open the demo (locally and the published live demo), find the link in the theming section, click it: the customization guide opens in a new tab.

**Acceptance Scenarios**:

1. **Given** the demo is open, **When** the developer looks at the theming section, **Then** a link labeled "Cómo implementar estilos en tu host" is visible next to its heading, without scrolling inside the section.
2. **Given** the link, **When** it is activated (click, Enter), **Then** the customization guide opens in a new tab and the demo keeps its state in the original tab.
3. **Given** the published live demo, **When** the link is followed, **Then** it opens the guide's published page (not a local file path), and the page exists.
4. **Given** the demo's top area, **When** the developer opens the demo, **Then** a second, shorter link to the same guide is also visible near the top, so it is found without reaching the theming section.
5. **Given** a keyboard or screen-reader user, **When** they reach the link, **Then** it is announced with its purpose and that it opens in a new tab.

---

### Edge Cases

- The guide is renamed or moved: the link must be updated with it; the documentation checks of 015 report a broken link target (warning).
- The guide does not exist yet (this feature lands before 015): the link points to the theming section of the component guide, which exists today, and is switched to the dedicated guide when 015 lands.
- The live demo is served under a sub-path: the link is absolute, so it is unaffected.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The demo MUST show a link labeled "Cómo implementar estilos en tu host" next to the heading of its theming section.
- **FR-002**: The demo MUST also show a link to the same guide in its top area.
- **FR-003**: Both links MUST open the customization guide (`docs/THEMING.md` from 015) at its published location (the repository page), in a new tab, safely (the opened page has no access to the demo).
- **FR-004**: The links MUST work identically in the local demo and the published live demo.
- **FR-005**: The links MUST be keyboard-accessible and announce that they open in a new tab.
- **FR-006**: Until the dedicated guide exists, the links MUST point to the theming section of the component guide; once 015 lands they MUST point to the dedicated guide.
- **FR-007**: The control itself and its documentation are not changed by this feature, except for listing the link in the change log.

### Key Entities

- **Styling guide link**: label, target (published guide URL), location in the demo (theming section, top area).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From the demo, the styling guide is reached in 1 click from the top area and 1 click from the theming section.
- **SC-002**: In 100% of checks (local demo and live demo) the link opens an existing guide page in a new tab, with 0 broken links.
- **SC-003**: The link is reachable and correctly announced with keyboard only (0 pointer actions needed).

## Assumptions

- "La documentación de cómo implementar estilos en tu host" is the customization guide defined in 015 (`docs/THEMING.md`, Spanish); its published location is the repository page on GitHub.
- The label is in Spanish, like the rest of the demo.
- Opening in a new tab keeps the demo's state (theme panel edits) intact.
- Delivered together with or after 015; if before, FR-006 applies.

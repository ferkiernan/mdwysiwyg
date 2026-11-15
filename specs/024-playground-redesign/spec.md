# Feature Specification: Playground Redesign and Black Text Cursor by Default

**Feature Branch**: `024-playground-redesign`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "Deseo que rediseñes la UX de del playground, las opciones están bien, pero el diseño es feo. tiene que poder verse bien en resoluciones de 1500 de ancho en adelante. . Ademas por default se sigue viendo el cursor de "escritura" blanco. ponelo negro como default."

## Context

Checked in the browser at 1500 × 900:

- **Page styling:** the playground has no page styling of its own. It uses the browser defaults: Times New Roman, an
  unstyled background, native controls and no header.
- **Layout:**
  - At the top, a two-column builder: a long list of attributes and theming tokens on the left, and a sticky preview on
    the right.
  - Below the builder, five demos stacked one after another (normal, compare, read-only, imperative API, fixed size).
  - The page is about 4,800 px tall.
- **Attribute and token lists:** each attribute's help text is a dense line of small text, and the token groups are
  bare `<details>` elements.
- **Text cursor:** over the content, the cursor is the operating system's I-beam (`cursor: text`, the default since the
  `content-cursor-black` fix). Its color comes from the operating system's pointer scheme, and the page cannot change
  it. The user still sees it white.
  - Assumption, not verified: the user's Windows pointer style is white or inverted.
  - Only a custom cursor image can force black.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A playground that looks good on wide screens (Priority: P1)

A developer opens the playground on a screen 1500 px wide or wider. They see a clear, cohesive page:

- a header with the library name and links;
- the configuration grouped into readable sections;
- the preview always visible next to it;
- the demos arranged so they can be found without a long scroll.

**Why this priority**: This is the main request. The playground is the library's showcase, and it currently looks
unfinished.

**Independent Test**: Open the playground at 1500 × 900 and at 1920 × 1080. Check that:

- there is no horizontal scroll;
- the preview stays visible while configuring;
- every option that exists today is still present and works;
- the page has a consistent typography, spacing and color scheme.

**Acceptance Scenarios**:

1. **Given** a viewport 1500 px wide, **When** the playground loads, **Then** all content fits with no horizontal
   scroll, and the configuration and the preview are side by side.
2. **Given** viewports of 1920 px and 2560 px, **When** the playground loads, **Then** the content is centered or uses
   the space sensibly, with no line of text stretched across the whole screen.
3. **Given** the configuration area, **When** the user changes any attribute or token, **Then** the preview updates as
   today, and the preview stays in view without scrolling back to it.
4. **Given** the attribute list, **When** the user scans it, **Then** each option shows its name, control, default and
   help with a clear hierarchy (name prominent, help secondary), and related options are grouped.
5. **Given** the demos, **When** the user wants a specific demo, **Then** they can reach it directly (through
   navigation, tabs or an index) instead of scrolling past the rest.
6. **Given** any control on the page (buttons, selects, checkboxes, text fields, code panels), **When** it is shown,
   **Then** it follows the same visual style as the rest of the page.

---

### User Story 2 - Black text cursor by default (Priority: P1)

Over the editor content, the text cursor is a black I-beam, whatever the operating system's pointer scheme, and at the
standard I-beam size.

**Why this priority**: This is an explicit request. The white cursor is invisible on the white content.

**Independent Test**: Hover over the content (rich and Markdown views) with Windows set to the white pointer style. The
I-beam is black and at the standard size.

**Acceptance Scenarios**:

1. **Given** the default theme, **When** the pointer is over the content in either view, **Then** the I-beam is black
   (with a thin light outline so it stays visible on dark backgrounds) and about the size of the system I-beam.
2. **Given** a host that sets `--mdw-content-cursor: text`, **When** the pointer is over the content, **Then** the
   system cursor is used, as today.
3. **Given** a browser that cannot render the custom cursor image, **When** the pointer is over the content, **Then**
   the system I-beam is used as a fallback.

---

### Edge Cases

- **Narrower than 1500 px:** the page must stay usable (no broken overlaps, no lost options), even if it is less
  polished. Narrower layouts may stack into one column.
- **Builder settings:**
  - The builder's saved choices (browser storage) must keep loading after the redesign.
  - The theming CSS generated for the preview must apply only to the preview, not to the playground page.
- **Dark presets in the preview:** the playground page itself keeps its own look. Only the preview changes.
- **Deployed site:** the playground is deployed to GitHub Pages and must keep working from that sub-path.
- **Builder test suite:** existing playground tests (generators, validation, builder behavior) keep passing. Accessible
  names that the tests rely on are kept.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001: content kept.** The playground MUST keep every existing option, preset, copy action and demo. The redesign
  changes presentation and organization, not functionality.
- **FR-002: visual style.** The page MUST have a consistent visual style:
  - a sans-serif type scale;
  - spacing on a fixed scale;
  - a neutral color palette with one accent color;
  - styled form controls and code panels;
  - a header with the library name, version and links (repository, styling guide).
- **FR-003: wide screens.** At viewports 1500 px wide and wider, the page MUST:
  - show no horizontal scroll;
  - show the configuration and the preview side by side, with the preview always in view;
  - cap the content width or distribute it so text lines stay readable.
- **FR-004: configuration readability.**
  - Attributes MUST be shown with a clear hierarchy (name, control, default, help) and grouped by purpose.
  - Theming tokens MUST stay grouped as today and be easy to scan.
- **FR-005: demos are easy to reach.** The demos MUST be reachable without scrolling through the whole page (for
  example through tabs or in-page navigation).
- **FR-006: builder behavior.** Storage, generated snippets and the preview theming MUST behave as today.
- **FR-007: default cursor.** The default of `--mdw-content-cursor` MUST be a black I-beam at the standard size:
  - a 1 px black line with a 1 px light outline;
  - the hotspot centered;
  - the system `text` cursor as the fallback.
  - Hosts can still set `text` to get the system cursor.
- **FR-008: documentation.** The token reference, the theming recipe and the change log MUST describe the new cursor
  default. The change log MUST mention the playground redesign.

### Key Entities

- **Playground page**: the public demo site. It has three areas: a header, a builder (configuration and preview), and
  the demos.
- **Content cursor token** (`--mdw-content-cursor`): the cursor over the content. Its default changes from `text` to a
  black I-beam image.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001: layout at common widths.** At 1500, 1920 and 2560 px wide:
  - the page has no horizontal scroll;
  - the preview is visible at every scroll position of the configuration;
  - no paragraph line is longer than about 100 characters.
- **SC-002: nothing lost.** 100 % of today's options, presets, copy actions and demos are present and work after the
  redesign (checked against the current list).
- **SC-003: demos are quick to reach.** From the top of the page, any demo is reached in at most one action (one click
  or one keyboard selection).
- **SC-004: black cursor.** With the default theme, the cursor over the content renders black in both views, at most
  12 × 22 px.
- **SC-005: no regressions.** All existing tests pass, and the tests are updated where the cursor default is asserted.

## Assumptions

- **Scope:**
  - The redesign only touches the playground (the demo site), not the editor component, except for the cursor default.
  - The redesign is built with plain CSS, with no new UI library.
- **Text and theme:** the copy stays in Spanish. The playground page has a light theme only. A dark page theme is out
  of scope.
- **Earlier cursor request:** the earlier request «no sobreescribas el de Windows» is superseded by this one. The
  custom black I-beam becomes the default again, at the standard size of the 11 × 20 version that shipped briefly in
  commit dfdde7a.
- **Below 1500 px:** a single-column fallback is acceptable. Mobile polish is out of scope.

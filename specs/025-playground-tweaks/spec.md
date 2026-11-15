# Feature Specification: Playground Tweaks (Tab Order, Shared Sample, Read-Only Options)

**Feature Branch**: `025-playground-tweaks`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "Ajustes menores: en solo lectura añadir checks "autoHideBar" y "autoHeight". Pestaña "Editor" primera, Configurador 2da. Usa el ejemplo de código tanto para el editor como para el configurador. Añadi este markdown al final del ejemplo de código en todos los casos: (external image + closing text)"

## Context

Today, after spec 024:

- **Tabs and landing:** the tab order is Configurador, Editor, Comparación, Solo lectura, API imperativa, Tamaño fijo.
  Without a hash in the address, the page opens on Configurador.
- **Sample documents:**
  - The Editor and Solo lectura tabs use the full sample document: headings, formatting, tasks, link, quote, table,
    JavaScript code, Mermaid and embedded HTML.
  - The Configurador preview uses a different, shorter sample.
- **Solo lectura options:** the tab has no options of its own.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editor first, same sample everywhere (Priority: P1)

A visitor opens the playground and lands on the Editor tab, which now comes first. The Configurador tab comes second,
and its preview shows the same sample document as the Editor tab.

**Why this priority**: The editor is the first thing a visitor wants to try. A single sample makes the tabs consistent.

**Independent Test**: Open the playground with no hash in the address.

- The first tab is Editor, the second is Configurador, and Editor is selected.
- The Configurador preview shows the same sample document as the Editor.

**Acceptance Scenarios**:

1. **Given** the playground, **When** it loads, **Then** the tab order is Editor, Configurador, Comparación, Solo
   lectura, API imperativa, Tamaño fijo.
2. **Given** an address without a valid tab hash, **When** the page loads, **Then** the Editor tab is shown.
3. **Given** the Configurador tab, **When** the preview renders, **Then** it shows the same sample document as the
   Editor tab.
4. **Given** an existing link to a tab (e.g. `#configurador`), **When** it is opened, **Then** that tab is shown, as
   today.

---

### User Story 2 - Closing paragraph with an external image (Priority: P1)

Every place that shows the sample document (Editor, Configurador preview, Solo lectura) ends with this exact Markdown:

```markdown
Or may be an external image

![](https://thegithubshop.com/cdn/shop/files/1492987_1.jpg?v=1791831408\&width=200)

(I hope img link is still available).

I hope you like it, pelase send me your comments!
```

**Why this priority**: This is an explicit request. It shows that external images render.

**Independent Test**: Scroll to the end of the document in the Editor, Configurador and Solo lectura tabs. Each shows
the text "Or may be an external image", the image (when the URL is reachable) and the two closing lines.

**Acceptance Scenarios**:

1. **Given** any tab that shows the sample, **When** the user scrolls to the end, **Then** the closing paragraph, the
   image and the two lines appear, in that order.
2. **Given** that the image URL is unreachable, **When** the sample renders, **Then** the rest of the document still
   renders. A broken image is acceptable, and the text itself says the link may be gone.

---

### User Story 3 - Read-only options (Priority: P2)

The Solo lectura tab offers two checkboxes, `autoHideBar` and `autoHeight`. Each one turns that behavior on or off in
the read-only editor right away.

**Why this priority**: It lets visitors see how those two attributes behave in read-only mode.

**Independent Test**: In Solo lectura, check `autoHeight`: the editor grows to fit the whole document, with no inner
scroll. Check `autoHideBar`: the bar or notice hides when the focus leaves the editor.

**Acceptance Scenarios**:

1. **Given** the Solo lectura tab, **When** it loads, **Then** both checkboxes are shown unchecked, matching the
   attributes' defaults.
2. **Given** `autoHeight` is checked, **When** the editor renders, **Then** its height follows the content. Unchecking
   it restores the fixed height.
3. **Given** `autoHideBar` is checked, **When** the focus is outside the editor, **Then** the top bar hides the same way
   it does for that attribute elsewhere.

---

### Edge Cases

- **Saved builder settings:** they are not affected; only the preview's sample document changes.
- **Other tabs:** Comparación, API imperativa and Tamaño fijo keep their own purpose-specific content. "En todos los
  casos" applies to every place that shows the sample document.
- **Text kept verbatim:** the closing text is inserted exactly as given, including "pelase" and the `\&` in the image
  URL.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001: tab order and landing tab.** The tab order MUST be Editor, Configurador, Comparación, Solo lectura, API
  imperativa, Tamaño fijo. Without a valid tab hash, the playground MUST open on Editor.
- **FR-002: one sample document.** The Configurador preview MUST use the same sample document as the Editor tab. The
  shorter preview sample is removed.
- **FR-003: closing Markdown.** The sample document MUST end with the Markdown block in User Story 2, verbatim. Every
  place that shows the sample therefore shows it.
- **FR-004: read-only options.** The Solo lectura tab MUST offer two checkboxes, `autoHideBar` and `autoHeight`, both
  unchecked by default. Each one MUST apply to the read-only editor immediately.
- **FR-005: change log.** The change log MUST mention these playground tweaks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001: landing tab.** With no hash, the first tab and the selected tab are both "Editor" in 100 % of loads.
- **SC-002: same sample.** The Editor, Configurador preview and Solo lectura tabs show the same document, and it ends
  with the closing block.
- **SC-003: read-only options work.** Toggling each read-only checkbox changes the editor's behavior without reloading
  the page.
- **SC-004: no regressions.** Existing tests keep passing, with the builder preview tests adapted to the new sample
  document if needed.

## Assumptions

- **Wording:**
  - "Ejemplo de código" means the playground's sample document (the `DEMO` content), not a code block.
  - "Configurador 2da" means the second tab.
  - "Editor primera" also makes Editor the landing tab.
- **Image:** the external image is not proxied or cached. If the URL stops working, the image shows as broken.

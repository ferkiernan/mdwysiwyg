# Feature Specification: "Copy as TXT" Export Option

**Feature Branch**: `020-copy-plain-text`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "deseo que el boton "download" tenga una opcion más: "Copiar TXT""

## Context

The toolbar's Export button (download icon) opens a menu with two options today: «Copiar como Markdown» (the Markdown
source) and «Copiar como HTML». There is no way to copy the content as plain text, without Markdown symbols or HTML tags.

## Clarifications

### Session 2026-11-14

- Q: Copy to the clipboard or download a `.txt` file? → A: Copy the plain text to the clipboard («Copiar como TXT»), like the other two options; no file is downloaded

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Copy the document as plain text (Priority: P1)

A user wants to paste the document into a place that does not understand Markdown or HTML (a chat, a plain-text email, a
form field, a ticket). They open the Export menu and choose the new option: the clipboard receives the document as readable
plain text — the words, with paragraphs and list items on their own lines, and no `#`, `**`, `[]()`, `<tags>` or other
markup.

**Why this priority**: This is the whole request.

**Independent Test**: Write a document with a heading, bold text, a link, a list and a table, choose the new option and
paste into a plain-text editor: the text reads naturally with no Markdown or HTML symbols.

**Acceptance Scenarios**:

1. **Given** the Export menu is open, **When** the user looks at it, **Then** a third option «Copiar como TXT» appears after «Copiar como HTML».
2. **Given** the user activates «Copiar como TXT» (click, Enter or Space), **When** the copy completes, **Then** the clipboard holds the plain text of the current document and the menu closes, returning focus to the Export button, like the other options.
3. **Given** a document with headings, emphasis and links, **When** it is copied as TXT, **Then** headings keep only their text, emphasis marks disappear, and each link keeps its visible text followed by its address in parentheses when the address differs from the text.
4. **Given** paragraphs and lists, **When** copied as TXT, **Then** paragraphs are separated by a blank line, each list item is on its own line with a simple marker (`-` for bullets, `1.` for numbered, `[ ]` / `[x]` for tasks) and nested items are indented.
5. **Given** a table, **When** copied as TXT, **Then** each row is a line with its cells separated by tabs (so it pastes as columns into spreadsheets).
6. **Given** a code block or a diagram, **When** copied as TXT, **Then** its content is copied as-is, without the fence markers.
7. **Given** images, embedded HTML and horizontal rules, **When** copied as TXT, **Then** an image contributes its description (alternative text) if any, embedded HTML contributes only its visible text, and a horizontal rule becomes a blank line.

---

### User Story 2 - Available wherever Export is (Priority: P2)

The option behaves like the existing ones in every context where the Export button is shown: the read-only variant's reduced toolbar, the rendered and Markdown views, compare mode (it copies the new pane, as the other options do) and the version-history mode (it copies the version being shown).

**Why this priority**: Consistency with the existing export options.

**Independent Test**: In `onlyView`, in the Markdown view and in compare mode, open Export and choose «Copiar como TXT»: the copied text matches the content the other two options would copy, converted to plain text.

**Acceptance Scenarios**:

1. **Given** the read-only variant, **When** the Export menu is opened, **Then** «Copiar como TXT» is available and works.
2. **Given** the Markdown view, **When** the user copies as TXT, **Then** the result is the same as in the rendered view (plain text, no syntax).
3. **Given** compare mode or history mode, **When** the user copies as TXT, **Then** the copied content is the same document the Markdown and HTML options copy, as plain text.
4. **Given** copying is blocked by the browser, **When** the option is activated, **Then** it fails silently like the existing options (no error shown, content unchanged).

---

### Edge Cases

- Empty document: the clipboard receives an empty string.
- Markdown characters typed as literal text (e.g. an escaped `\*`): appear as the literal character (`*`), not as an escape.
- Line breaks inside a paragraph (hard breaks): kept as line breaks.
- Links whose text equals the address: the address is not repeated.
- Very long documents (5,000 words): copying is immediate (no perceptible delay).
- Non-Latin text, emoji and accents: preserved unchanged.
- Trailing blank lines: the copied text has no trailing whitespace beyond a single final newline (or none).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Export menu MUST offer a third option labeled «Copiar como TXT», placed after «Copiar como HTML».
- **FR-002**: Activating it MUST copy the current document to the clipboard as plain text and close the menu, returning focus to the Export button, exactly like the existing options (pointer and keyboard).
- **FR-003**: The plain text MUST contain no Markdown syntax and no HTML tags: headings, emphasis, strikethrough, inline code and quote markers are removed, keeping the text.
- **FR-004**: Structure MUST remain readable: one blank line between blocks; list items one per line with `-`, `1.` or `[ ]`/`[x]` markers and two-space indentation per nesting level; table rows one per line with tab-separated cells; hard line breaks kept.
- **FR-005**: Links MUST render as their text followed by ` (address)` when the address differs from the text; images as their alternative text (nothing if empty); embedded HTML as its visible text; code blocks and diagrams as their raw content; horizontal rules as a blank line.
- **FR-006**: The option MUST be available wherever the Export button is (full toolbar, read-only toolbar), in both views, compare mode and history mode, copying the same document as the other options.
- **FR-007**: The copied text MUST be the same regardless of the active view (rendered or Markdown).
- **FR-008**: Clipboard failures MUST behave like the existing options (no error surfaced, no content change).
- **FR-009**: The option MUST not change the content, fire the change notification or alter the undo history.
- **FR-010**: The option MUST be documented in the component guide (toolbar / export), the overview feature table, the assistant guide and the change log.

### Key Entities

- **Plain-text export**: the document's readable text with structural line breaks, derived from its Markdown content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For a reference document covering every element type, the copied TXT contains 0 Markdown syntax characters used as markup and 0 HTML tags.
- **SC-002**: 100% of the document's words appear in the copied TXT, in the same order.
- **SC-003**: A table copied as TXT pastes into a spreadsheet as the same number of rows and columns.
- **SC-004**: The copied TXT is identical when copied from the rendered view and from the Markdown view.
- **SC-005**: The option is reachable and usable with the keyboard alone, like the other two.
- **SC-006**: Existing export options behave exactly as before (existing tests keep passing).

## Assumptions

- The label follows the existing ones («Copiar como Markdown», «Copiar como HTML»): «Copiar como TXT».
- "TXT" means plain text in the clipboard; no file is downloaded (confirmed in Clarifications; the existing options also copy).
- Plain-text conventions (list markers, tab-separated tables, link address in parentheses) follow common practice so the text is readable and pastes well into spreadsheets.
- Embedded HTML sanitization rules do not apply (only visible text is kept, so no markup is emitted).

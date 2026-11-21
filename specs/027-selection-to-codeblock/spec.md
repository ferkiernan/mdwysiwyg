# Feature Specification: Turn a Multi-Block Selection into a Single Code Block

**Feature Branch**: `027-selection-to-codeblock`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "cuando elegimos la opción "código" en menu, si tengo una sección seleccionada, debo tratarla como un único bloque de código."

## Context

Today, with the "Bloque de código" toolbar button, the user picks a language and the selection is converted. I checked
the current behavior on 2026-11-21 with the editor:

| Selection | Result today |
|---|---|
| Three paragraphs: `uno`, `dos **b**`, `tres` | **Three separate code blocks**, one per paragraph |
| Heading + paragraph + list (`a`, `b`) + paragraph | A code block for the heading, the paragraph and the last paragraph each. **The list is left as is**, so the section ends up split. |
| Part of two paragraphs | Two code blocks, each with the **whole** paragraph |

The user expects the selected section to become **one** code block.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Several lines become one code block (Priority: P1)

The user selects several lines (paragraphs, headings, list items, quotes) and chooses "Bloque de código" plus a
language. The selection becomes a single code block, with one line per selected line, in the same order.

**Why this priority**: This is the whole request.

**Independent Test**: select `uno`, `dos`, `tres` (three paragraphs), then choose "Bloque de código" > JavaScript. The
result is one code block with three lines, `uno`, `dos` and `tres`. The Markdown has a single fenced block.

**Acceptance Scenarios**:

1. **Given** a selection spanning several paragraphs, **When** the user converts it to a code block, **Then** there is
   exactly one code block, with one line per paragraph, in the same order, using the chosen language.
2. **Given** a selection that includes headings, list items (any type, any level) or quote lines, **When** it is
   converted, **Then** all of them end up in the same single code block, one line each. No list or quote is left
   outside, and no empty list or quote remains.
3. **Given** a selection that starts or ends in the middle of a line, **When** it is converted, **Then** every line the
   selection touches is included whole, as today with a single line.
4. **Given** a conversion, **When** the user presses undo once, **Then** the original blocks come back intact,
   including their formatting.
5. **Given** a conversion, **When** it finishes, **Then** the cursor is inside the new code block and the change
   notification fires once.

---

### User Story 2 - What does not change (Priority: P2)

Converting a single line, and turning a code block back into normal text, work as today.

**Independent Test**: with the cursor on one line, choose "Bloque de código": that line becomes a code block, as
today. With the cursor inside a code block, the language picker changes its language, as today.

**Acceptance Scenarios**:

1. **Given** a cursor or a selection within one line, **When** it is converted, **Then** the behavior is unchanged.
2. **Given** the cursor or selection inside an existing code block, **When** the user picks a language, **Then** only
   the language changes, as today.

---

### Edge Cases

- **Inline formatting:** bold, italic, links and inline code are dropped, and only their visible text is kept. A code
  block cannot hold formatting.
- **Empty lines:** an empty paragraph inside the selection becomes an empty line in the code block.
- **Non-text blocks in the selection:**
  - **Tables:** each row becomes one line, with the cell texts separated by ` | `.
  - **Existing code blocks:** they keep their lines, without the fences.
  - **Images, diagrams and embedded HTML:** they produce no text, so they are dropped.
  - **Horizontal rules:** dropped.

  In every case, the result is still a single code block.
- **Selection inside a table cell:** the behavior is unchanged; a cell cannot contain a code block.
- **Whole document:** selecting everything (Ctrl+A) and converting gives one code block with the whole document's
  text.
- **Read-only:** in read-only mode, compare panes and history, the option is not available, as today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001: one code block.** When the selection spans more than one line or block, the "Bloque de código" option MUST
  replace all the lines the selection touches with exactly one code block in the chosen language.
- **FR-002: line content.** The code block MUST contain one line for each text line in the selection, in document
  order:
  - paragraphs, headings, list items of every type and level, and quote lines;
  - each table row, as `cell | cell`;
  - each line of a selected code block.
- **FR-003: whole lines.** Every line the selection touches MUST be included whole.
- **FR-004: plain text only.** Inline formatting MUST be dropped. Only the visible text is kept, with no Markdown markers
  such as `#`, `-`, `>` or `**`.
- **FR-005: no leftovers.** No empty list, quote or table may remain where the selection was. Blocks outside the
  selection MUST NOT change.
- **FR-006: one change.** The conversion MUST be one undo step and fire one change notification. The cursor MUST end
  up inside the new code block.
- **FR-007: unchanged cases.** Converting a single line, changing the language of an existing code block, and
  converting inside a table cell MUST keep their current behavior.
- **FR-008: documentation.** The component guide and the change log MUST describe the new behavior.

### Key Entities

- **Selection section:** the lines the selection touches, from the line containing its start to the line containing
  its end.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001: one block.** In 100 % of tests, converting a multi-block selection produces exactly one code block.
- **SC-002: nothing lost or added.** The code block's lines equal the visible text of the selected lines, in order,
  with nothing lost and nothing added.
- **SC-003: clean undo.** One undo restores the original content exactly in 100 % of tests.
- **SC-004: no regressions.** Existing code block tests (language picker, single-line conversion, Mermaid) keep
  passing.

## Assumptions

- **The "código" option:** «La opción "código" en menú» is the toolbar button "Bloque de código" with its language
  picker. There is no inline-code button in the toolbar.
- **Content is visible text:** the code block holds the visible text, one line per line, not the Markdown source. The
  user confirmed this on 2026-11-21.
- **Partial lists and quotes:** if the selection covers only some lines of a list or quote, only those lines move into
  the code block. The lines before and after stay as they were, in their own list or quote, above and below the code
  block.

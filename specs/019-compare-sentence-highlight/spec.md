# Feature Specification: Sentence-Level Highlight Rule in Compare Mode

**Feature Branch**: `019-compare-sentence-highlight`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "quiero que revises el tema de la "comparacion". Necesito ajustar la regla de pintado: pintar una frase entera, SOLO si el contenido es >50% de diferencia. Sino se pintan solo las palabras y cambios puntuales."

## Clarifications

### Session 2026-11-14

- Q: How is a sentence's "> 50% difference" measured? → A: Over both sentences: (words added + words removed) ÷ (words of the original sentence + words of the new sentence). Deleted words count too

## Context: how highlighting works today

- **Rendered view**: the new content is compared block by block (paragraph, heading, list item, table cell…). A block that
  has a similar counterpart in the original shows only its new or changed words; a block without one — including a
  paragraph whose text shares less than half of its words with the original — is painted **entirely**, even if it
  contains several sentences of which only one changed a lot.
- **Markdown view**: only words are painted, never a whole sentence, however much a sentence was rewritten.

So the two views follow different rules, and in the rendered view the "whole" unit is the block, not the sentence.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A heavily rewritten sentence is painted whole; a lightly edited one shows only its changes (Priority: P1)

A reviewer compares an original text with a proposed one. When a sentence was mostly rewritten, the whole sentence is painted so it reads as "this sentence is new". When a sentence only had a few words changed, only those words are painted, so the reviewer sees exactly what changed without the rest of the sentence being highlighted. The decision is made per sentence: other sentences of the same paragraph are judged on their own.

**Why this priority**: This is the requested rule.

**Independent Test**: Compare a paragraph of three sentences where sentence 1 is unchanged, sentence 2 has one word changed and sentence 3 is rewritten: sentence 1 has no paint, sentence 2 shows only the changed word, sentence 3 is painted whole.

**Acceptance Scenarios**:

1. **Given** a sentence of the new content whose difference with its counterpart is **more than 50%** (added + removed words over the words of both sentences), **When** compare mode shows it, **Then** the whole sentence is painted.
2. **Given** a sentence whose words differ in **50% or less**, **When** compare mode shows it, **Then** only the new or changed words (and short changed runs) are painted, not the whole sentence.
3. **Given** a paragraph with several sentences, **When** only one of them exceeds 50% difference, **Then** only that sentence is painted whole; the others follow their own result.
4. **Given** a sentence that is entirely new (no counterpart in the original), **When** compare mode shows it, **Then** it is painted whole.
5. **Given** a sentence identical to the original, **When** compare mode shows it, **Then** nothing in it is painted.
6. **Given** a sentence with exactly 50% difference, **When** compare mode shows it, **Then** only its words are painted (the threshold is strictly greater than 50%).

---

### User Story 2 - The same rule in both views (Priority: P1)

The rendered view and the Markdown view apply the same sentence rule, so switching views shows the same sentences painted whole and the same words painted individually (allowing for Markdown syntax characters that only exist in the Markdown view).

**Why this priority**: Today the views disagree; a single rule makes the comparison predictable.

**Independent Test**: Compare the same documents in both views: the set of sentences painted whole is the same in both.

**Acceptance Scenarios**:

1. **Given** a sentence painted whole in the rendered view, **When** the user switches to the Markdown view, **Then** the same sentence is painted whole there.
2. **Given** a sentence with only word-level paint in one view, **When** the user switches views, **Then** the other view also shows only word-level paint for it.
3. **Given** the user edits the new pane, **When** a sentence crosses the 50% threshold in either direction, **Then** its paint switches between whole and word-level immediately, in both views.

---

### User Story 3 - Elements that are not prose keep sensible rules (Priority: P2)

Headings, list items, table cells and quotes are treated as text: each is made of one or more sentences and follows the same rule. Code blocks and diagrams keep their line-based highlight (painting changed lines), since "sentences" do not apply to code. Elements that are entirely new (a new paragraph, list item, table row, image, rule, code block) are painted whole, as today.

**Why this priority**: The rule must not degrade highlighting of non-prose content.

**Independent Test**: Compare a list where one item has one word changed and another item was rewritten, a table with one changed cell, and a code block with one changed line: the list item with one word shows that word, the rewritten item is painted whole, the cell follows the sentence rule, the code block paints only the changed line.

**Acceptance Scenarios**:

1. **Given** a heading, list item, table cell or quote, **When** compared, **Then** each of its sentences follows the >50% rule.
2. **Given** a code block or diagram, **When** compared, **Then** only changed lines are painted (unchanged behavior).
3. **Given** an entirely new element (paragraph, list item, table row, image, horizontal rule, code block), **When** compared, **Then** it is painted whole (unchanged behavior).
4. **Given** a change of element type or level only (e.g. a paragraph that became a heading, a heading level change), **When** compared, **Then** the element is painted whole as today (a structural change is a whole-element change).

---

### Edge Cases

- Very short sentences: one changed word in a two-word sentence is (1 + 1) ÷ (2 + 2) = 50% → words only; both changed → 100% → whole sentence.
- Shortened sentences: a 10-word sentence reduced to its first 3 words (unchanged) is 7 ÷ 13 ≈ 54% → painted whole even though no visible word is new (the deletion counts).
- Lengthened sentences: a 4-word sentence that keeps its words and gains 6 more is 6 ÷ 14 ≈ 43% → only the 6 new words are painted.
- A sentence split into two, or two sentences merged: each resulting sentence is judged against its best counterpart; a merged sentence that keeps most of both originals shows only its changes.
- Sentence boundaries: a sentence ends at `.`, `!`, `?` or `…` followed by a space or line end, and at the end of its element (heading, list item, cell, paragraph). Abbreviations such as "p. ej." or numbers like "3.5" do not end a sentence when not followed by a space and capital letter/end of element.
- Formatting-only changes (a word turned bold, a link added): count as changed words, as today.
- Punctuation-only or whitespace-only changes: whitespace never counts; a punctuation change counts as a change of the word it is attached to.
- Deleted sentences: nothing to paint in the new pane (deletions are visible in the original pane, as today); a fully deleted sentence does not make the surrounding sentences "different" (words removed *within* a sentence do count for that sentence).
- The difference summary announced to screen readers keeps counting highlighted passages (a whole sentence counts as one passage).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: In compare mode, the highlight decision MUST be made per **sentence** of the new content (not per paragraph or block).
- **FR-002**: A sentence MUST be painted **whole** if more than 50% of its words are new or changed with respect to its counterpart in the original; otherwise only its new or changed words MUST be painted.
- **FR-003**: The difference of a sentence MUST be computed against the original sentence it best corresponds to as (words added in the new sentence + words removed from the original sentence) ÷ (words of the original sentence + words of the new sentence); a changed word counts as one removed and one added. A sentence with no counterpart counts as 100%.
- **FR-004**: The threshold MUST be strictly greater than 50% (exactly 50% paints words only).
- **FR-005**: The same rule MUST apply in the rendered view and in the Markdown view, producing the same set of whole-painted sentences (Markdown syntax characters excluded from the count).
- **FR-006**: Headings, list items, table cells and quotes MUST follow the sentence rule; code blocks and diagrams MUST keep line-based highlighting; entirely new elements and type/level changes MUST keep whole-element highlighting.
- **FR-007**: The highlight MUST update as the user edits the new pane, switching a sentence between whole and word-level paint as it crosses the threshold, without perceptible delay for documents up to 5,000 words.
- **FR-008**: The difference summary and its accessible description MUST count a whole-painted sentence as one highlighted passage.
- **FR-009**: Behavior outside the paint rule (accept/reject/restore, scroll synchronization, the highlight color customization point) MUST not change.
- **FR-010**: The rule MUST be documented in the component guide (compare mode section) and the change log.

### Key Entities

- **Sentence**: a run of text within an element ending at sentence punctuation followed by a space/line end, or at the element's end.
- **Counterpart**: the original sentence that best corresponds to a new sentence (same position in matching content or highest word overlap).
- **Difference ratio**: (added + removed words) ÷ (words of both sentences).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a test set of sentence pairs with known difference ratios (0%, 25%, 50%, 51%, 75%, 100%), 100% are painted as the rule prescribes (whole only above 50%).
- **SC-002**: In paragraphs with mixed sentences, 0 unchanged or lightly changed sentences are painted whole because another sentence of the same paragraph changed.
- **SC-003**: For the same documents, the set of whole-painted sentences is identical in the rendered and Markdown views in 100% of tested cases.
- **SC-004**: Code blocks, diagrams, new elements and structural changes are highlighted exactly as in the previous release (existing tests for them keep passing).
- **SC-005**: Highlight updates after an edit within 100 ms for documents up to 5,000 words.

## Assumptions

- "Frase" means sentence; the difference counts words added and removed over both versions of the sentence (Clarification).
- Word counting ignores whitespace; a word with a formatting change counts as changed (as today).
- Elements without sentence punctuation (titles, list items, cells) are a single sentence.
- The 50% threshold is fixed (not configurable).
- Only the new pane is painted (unchanged); deleted text remains visible in the original pane.

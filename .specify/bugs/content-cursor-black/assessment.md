# Bug Assessment: The content's text cursor replaces the Windows one

- **Slug**: content-cursor-black
- **Created**: 2026-11-15
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: low

## Report (verbatim or summarized)

> lo del cursor deja un cursor normal negro de escritura nomas. normal, pero de color negro. no sobreescribas el de windows.

Context: commits `6b783fd` and `dfdde7a` (not yet published to npm) added `--mdw-content-cursor`. Its default is our own
I-beam (inline SVG, black line with a white outline, 11×20). It answered an earlier complaint: in the playground the
text cursor looked white and was hard to see. The user now wants the normal text cursor, black, and does not want the
Windows cursor overridden.

## Symptom

- **Observed:** over the content, the cursor is an image drawn by the component (with a white outline) instead of the
  operating system's I-beam.
- **Expected:** the operating system's normal text cursor, which looks black over the control's light content area. No
  cursor drawn by the component.

## Reproduction

1. Open the playground on `master` (`npm run dev`) or the published demo after the `dfdde7a` deploy.
2. Hover over the text of the rendered view or of the Markdown view.
3. The cursor is the component's SVG I-beam, not the Windows one.

## Suspected Code Paths

- `src/components/MarkdownEditor/MarkdownEditor.module.css:23`: private token `--_mdw-content-cursor`. Its default is
  `url("data:image/svg+xml,…") 5 10, text`.
- `src/components/MarkdownEditor/MarkdownEditor.module.css:192` (`.ProseMirror`) and `:350` (`.source`): set
  `cursor: var(--_mdw-content-cursor)`.
- `src/components/MarkdownEditor/theme/themeTokens.ts:68`: the token's default (the same SVG) and its description.
- `tests/MarkdownEditor/theming-tokens.test.tsx:56-63`: requires the SVG default (`url(...) 5 10, text`).
- `docs/THEMING.md:97` and `CHANGELOG.md` (Unreleased): describe the custom I-beam as the default.

## Root Cause Hypothesis

**Confidence: high.** This is a design decision, not a failure. The `6b783fd` change replaced the system cursor with
an image so it would stay visible over any background.

- **Recoloring is not possible:** CSS cannot change the color of the system cursor. Any "black" I-beam other than the
  system one is necessarily an image, which means overriding the Windows cursor.
- **How the Windows I-beam gets its color:** Windows draws its I-beam by inverting the pixels underneath. Over the
  control's white content background (`--mdw-content-bg`, default `#ffffff`) it already looks black.
- **The earlier "white cursor" case is unexplained:** the white the user saw implies a dark background under the
  cursor, or a cursor scheme configured in Windows. It was never confirmed.

## Proposed Remediation

**Preferred**: go back to the system cursor by default and leave the token as opt-in.

- **Default:** `--_mdw-content-cursor: var(--mdw-content-cursor, text);`. With `text`, the browser uses the operating
  system's I-beam exactly as configured (size, scheme, accessibility), and over the white background it looks black.
- **The token stays:** a host with dark or mid-tone backgrounds can declare its own cursor.
- **Recipe for those hosts:** document the 11×20 SVG as an example in `docs/THEMING.md`.

**Alternatives**:

- **Remove `--mdw-content-cursor` entirely and drop the `cursor` rules.**
  - Same result for the user, and 52 tokens again.
  - Loses the escape hatch for dark backgrounds.
  - Since 0.9.0 was never published, it is not a breaking change.
- **Keep an image, black with no white outline.**
  - It still overrides the Windows cursor, which the report explicitly rejects.
  - It disappears over dark backgrounds.
  - Discarded.

**Files likely to change**:

- `src/components/MarkdownEditor/MarkdownEditor.module.css`
- `src/components/MarkdownEditor/theme/themeTokens.ts`
- `docs/THEMING.md`
- `CHANGELOG.md`
- `llms.txt`
- `tests/MarkdownEditor/theming-tokens.test.tsx`

**Tests to add or update**:

- **`theming-tokens`:** the token's default is `text`, and the CSS contains no `url(` in `--_mdw-content-cursor`.
- **Existing checks to keep:**
  - both views read `cursor: var(--_mdw-content-cursor)`;
  - the private token matches `themeTokens.ts`.
- **If the "remove" alternative is chosen:**
  - assert that no `cursor` rule exists over `.ProseMirror` or `.source`;
  - go back to 52 in `tests/playground/generators.test.ts`.

## Risks & Considerations

- **The earlier complaint could come back:** if the user's "white cursor" came from a mid-tone or dark background
  behind the content, it will show up again. The fix for that case is the token in the host (or in a playground
  preset), not the component's default.
- **No API breakage:** the token has not been published to npm (Unreleased).
- **Docs and changelog:** they must stop presenting the SVG as the default.

## Open Questions

- [NEEDS CLARIFICATION: keep `--mdw-content-cursor` as opt-in (default `text`) or remove it entirely?]
  - **Recommended:** keep it.
- [NEEDS CLARIFICATION: which background did the white cursor appear on? A dark preset in the playground, or a
  Windows cursor scheme?]
  - It only affects whether the playground should declare the token in some preset.

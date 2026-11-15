# Bug Fix: The content's text cursor replaces the Windows one

- **Slug**: content-cursor-black
- **Fixed**: 2026-11-15
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

The default of `--mdw-content-cursor` is now `text`: over the content the browser shows the operating system's I-beam
exactly as configured, and it looks black over the white background. The token stays opt-in. The guide includes the
recipe for the custom I-beam, for hosts with dark backgrounds.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `src/components/MarkdownEditor/MarkdownEditor.module.css` | modified | `--_mdw-content-cursor: var(--mdw-content-cursor, text)`; comment updated |
| `src/components/MarkdownEditor/theme/themeTokens.ts` | modified | default `text`, new description |
| `docs/THEMING.md` | modified | table row (default `text`) plus the «Cursor de texto sobre fondos oscuros» recipe with the 11×20 SVG |
| `CHANGELOG.md` | modified | Unreleased entry: default `text`, opt-in token |
| `llms.txt` | modified | token summary |
| `tests/MarkdownEditor/theming-tokens.test.tsx` | updated test | default `text`, no `url(` in any `cursor` rule |

## Diff Highlights

```css
--_mdw-content-cursor: var(--mdw-content-cursor, text);
```

## Tests Added or Updated

- `tests/MarkdownEditor/theming-tokens.test.tsx` › «el cursor del texto se lee del token en ambas vistas y por defecto
  es el del sistema». It pins down that:
  - both views read the token;
  - the default is `text`;
  - no `cursor` rule uses an image.

## Local Verification

- `npm run typecheck` → OK
- `npx vitest run` → 51 files, 499 tests passed
- `npm run check:docs` → 0 warnings
- `npm run build` → OK
- Manual check: not done. Screenshots don't capture the real mouse pointer; it has to be confirmed by hovering over the
  control.

## Deviations from Assessment

None.

## Follow-ups

- **The «white cursor» case is still unexplained.** If it was a dark preset in the playground, that preset could
  declare the token with the guide's recipe.
- **npm:** the token is still not published (Unreleased).

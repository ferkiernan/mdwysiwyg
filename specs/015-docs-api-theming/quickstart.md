# Quickstart: validating 015

## Automated

```bash
npm test && npm run typecheck && npm run build && npm run verify:dist
```

```bash
npm run check:docs
```

Expected: tests green (no behavior change, SC-006); `check:docs` prints `check-docs: 0 warning(s)` at release (SC-001..003)
and always exits 0. `dist/index.d.ts` contains the JSDoc (`grep -c "@default" dist/index.d.ts` ≥ number of props).

## Manual (real browser)

```bash
npm run dev
```

1. Default appearance: compare the playground with the previous release side by side — identical (SC-006).
2. Theme panel: change tokens, pick presets (dark, brand, flat), copy CSS; applied through a class without `!important` (FR-024).
3. Declaration levels: apply the dark recipe (a) on `className`, (b) on a wrapper, (c) on `:root`; then load the host style
   before and after the package CSS: identical result in all six cases; class beats wrapper beats default (SC-004).
4. Dark theme coverage: open code block, blockquote, table menu, link popover, insert dialogs, compare mode, history list —
   nothing remains in light colors (SC-008).
5. Editor hover: in a consumer project, hover each prop of `<MarkdownEditor>` — description, default and example shown (US1).
6. From the npm/GitHub README reach the props reference, `docs/THEMING.md` and the demo in ≤ 2 clicks (SC-005).

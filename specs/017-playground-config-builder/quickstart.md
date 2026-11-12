# Quickstart: validating 017

## Automated

```bash
npm test && npm run typecheck
```

Expected: generator/validation/builder tests green; package tests unchanged (SC-006). `npm run build && npm run verify:dist`
unchanged output.

## Manual

```bash
npm run dev
```

1. Top of the page: «Seleccioná los atributos de tu control», then «Theming», with one preview that stays in view while
   scrolling (FR-016).
2. Attributes: every prop has an input with default and summary (SC-001). Set `height` 400, `onlyView` on, `historyUndo` on →
   a note says history has no effect with `onlyView` (FR-012). Preview follows each change (FR-011).
3. «Copiar atributos» in JSX and in Objeto: paste into a scratch file — only non-defaults, valid syntax, placeholders for
   callbacks (SC-005).
4. Theming: preset «Oscuro», change 3 colors, scope «Este control», class `mi-editor`; the output panel updates live; «Crear
   CSS» copies it. Enable «Seguir preferencia del sistema» → dark block added (FR-006). Type an invalid color → flagged and
   omitted (edge case).
5. Minimal host: a page that imports `mdwysiwyg/styles.css`, pastes the CSS (before and after the import) and the JSX — same
   look and behavior as the preview (SC-002, SC-004).
6. Reload: choices restored; «Empezar de nuevo» clears them (FR-017).
7. Block clipboard permission → fallback textarea with selected text (FR-015).
8. Typical flow timed: preset + 3 colors + 3 attributes, both copied, < 3 min (SC-003).

## Validation record (2026-11-12)

- Automated: 443 tests, typecheck, build, `verify:dist` green; `check:docs` 0 warnings.
- Real browser (playground): default appearance unchanged (toolbar `#222`, links `#0000ee`); a `--mdw-*` value on the
  control class works with the host style loaded before and after the package CSS, and on `:root`; preset «Oscuro»
  themes the preview (content, toolbar, syntax, quote, links) and the floating table picker, while the demos below stay
  default; `autoHeight` grows the preview (no inner scroll, rendered and Markdown views, min = height); `autoHideBar`
  shows the bar on a real click inside and hides it on a click outside.
- Not done: pasting both outputs into a separate minimal host app, and the timed 3-minute flow (SC-003).

# Quickstart: validating 016

```bash
npm run dev
```

1. Top of the page: link "Cómo implementar estilos en tu host" visible without scrolling; click → guide opens in a new tab;
   the demo tab keeps its state (SC-001).
2. Theming section: same link next to the heading; same result.
3. Keyboard only: Tab to each link, Enter → opens; a screen reader announces "… (se abre en una pestaña nueva)" (SC-003).
4. Target exists: the URL returns the guide (or, before 015, the README theming section) (SC-002).
5. After the next live-demo deploy (`npm run build:demo` + Pages): repeat 1–4 on ferkiernan.github.io/mdwysiwyg (FR-004).

```bash
npm test && npm run typecheck
```

Expected: unchanged results (the package is not touched).

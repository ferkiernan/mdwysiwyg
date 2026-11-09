# Quickstart: validating Compare Mode

## Prerequisites

```bash
npm install
npm run typecheck
npm test
```

## Automated validation

```bash
npx vitest run tests/MarkdownEditor/diff-sequences.test.ts tests/MarkdownEditor/compare-mode.test.tsx tests/MarkdownEditor/compare-editing.test.tsx tests/MarkdownEditor/compare-decision.test.tsx
npm test && npm run typecheck && npm run build && npm run verify:dist
```

Expected: all green; the pre-existing suites pass unchanged (SC-007).

## Manual validation (playground)

```bash
npm run dev
```

Open the playground, then:

1. Set **Modo** = `compare`, **Orientación** = `side-to-side`, and type a new Markdown (e.g. change one word and add a
   paragraph). Expect two panes (original left, new right) with yellow highlights only on the changed word and the new
   paragraph (US1).
2. Switch **Orientación** to `up-and-down`: panes re-arrange, new pane keeps its content (US5).
3. Type in the new pane: highlights follow; typing in the original pane does nothing; "Restaurar" appears (US2, US4).
4. Click **Restaurar**: new pane returns to the provided content; the button hides (US4).
5. Toggle the Markdown view (`</>`): both panes show source, highlights remain (FR-020).
6. Click **Aceptar cambio** / **Rechazar cambio**: single-pane editor with the chosen content; the decision log shows the
   notification (US3).
7. Uncheck **Mostrar barra**: both bars disappear; compare panes remain.

## Acceptance map

| Check | Story / FR |
|---|---|
| Panes, orientation, 50/50 | US1, FR-003 |
| Only changed/added passages highlighted | US1, FR-005, SC-001 |
| Original pane read-only | US2, FR-004, SC-003 |
| Accept/Reject notify once and return to default | US3, FR-011/012/021, SC-005 |
| Restaurar visibility rule | US4, FR-009/010, SC-004 |
| Runtime mode/orientation/content changes | US5, FR-016, SC-006 |
| Bar hidden with `showToolbar=false` | FR-008 |

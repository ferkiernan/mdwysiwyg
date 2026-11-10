# Quickstart: validating Version History

## Prerequisites

```bash
npm install
npm run typecheck
npm test
```

## Automated validation

```bash
npx vitest run tests/MarkdownEditor/version-history.test.ts tests/MarkdownEditor/history-recording.test.tsx tests/MarkdownEditor/history-mode.test.tsx tests/MarkdownEditor/history-decision.test.tsx
npm test && npm run typecheck && npm run build && npm run verify:dist
```

Expected: all green; the pre-existing suites pass unchanged (SC-006). Timing tests use `vi.useFakeTimers()`.

## Manual validation (playground)

```bash
npm run dev
```

Open the playground, tick **historyUndo**, then:

1. Type a word, wait 3 s, type another, wait 3 s. Click the history icon (right after the HTML button, Export stays at the far right): the list on the right shows 3 entries
   with times, newest highlighted (US1, US2).
2. Click **← Undo** twice: document shows version 1; the highlighted entry and its time move; **Redo →** returns (US3).
   Click an entry of the list: that version's content is shown and Undo/Redo continue from it (US5, FR-022).
3. Try to type / use the toolbar: nothing changes; view toggle still works (FR-012, FR-018).
4. Undo once, press **Confirm**: document keeps that version, change notification logged once, bar and list disappear
   (US4). Reopen: the confirmed content is the newest entry and older ones are still there.
5. Reopen, Undo, press **Cancel (back to last version)**: original content back, no notification (US4).
6. With history open press `Ctrl+Z` / `Ctrl+Shift+Z`: same as Undo / Redo (FR-021).
7. Untick **historyUndo** (or tick **onlyView**, or hide the toolbar) while history is open: it closes, content is the
   pre-history content (FR-017).

## Acceptance map

| Check | Story / FR |
|---|---|
| One version per pause, none per keystroke, dedupe | US1, FR-002/003, SC-001 |
| Icon after the HTML button, only default mode + opt-in | US2, FR-006/016 |
| Undo/Redo, highlight, time, limits | US3, FR-010/011, SC-007 |
| Read-only while open, no `onChange` | US3, FR-012, SC-003 |
| Confirm / Cancel (back to last version) semantics | US4, FR-013/014, SC-004/005 |
| List scrolls, viewed stays visible, click jumps | US5, FR-015/022 |
| Forced closes | FR-017 |
| Shortcuts | FR-021 |
| Cap | FR-005, SC-008 |

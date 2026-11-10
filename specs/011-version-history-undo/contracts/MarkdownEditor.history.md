# Contract: `MarkdownEditor` — version history

## Props

```ts
interface MarkdownEditorProps {
  /**
   * Enables the version history: automatic versions after 3 s without changes, a history icon right after the HTML
   * button of the toolbar and a history mode with Undo / Redo / Confirm / Cancel (back to last version) and a version list.
   * Can change at any time. Default: false.
   */
  historyUndo?: boolean;
}
```

No new exported types, callbacks or handle methods.

## Behavior

| Situation | Result |
|---|---|
| `historyUndo` false / omitted | Identical to the previous release: no timers, icon, bars or recording (FR-016) |
| `historyUndo` true, default mode, toolbar visible, not `onlyView` | Recording on; history icon (`aria-label="Historial de versiones"`, `aria-pressed`) is placed **right after the "insert HTML" button** (Export stays alone at the right end) |
| First recording | Version 1 = current content, saved immediately |
| Change, then 3 s without changes | One new version `{ markdown, time }` unless equal to the latest |
| Icon click (closed) | Pending change saved as a version; history mode opens on the latest version: bar `role="toolbar" aria-label="Barra de historial"` under the toolbar, `<nav aria-label="Historial de versiones">` list on the right (newest first; each entry is a button) |
| Icon click (open) | Same as "Cancel (back to last version)" |
| Undo / Redo (buttons or shortcuts) | Document shows the previous / next version; list highlights it (`aria-current="true"`); `onChange` **not** called; Undo `aria-disabled` at the first, Redo at the last version |
| List entry click / Enter / Space | That version becomes the viewed one (content, highlight, limits updated); `onChange` not called; the viewed entry does nothing |
| Document while open | Read-only in both views; editing toolbar controls disabled; view toggle and Export keep working |
| Confirm | Viewed content stays; `onChange(markdown)` once **iff** it differs from the content at entry; confirmed content appended as latest version iff it differs from the latest; history mode closes, focus returns to the document |
| Cancel (back to last version) | Content at entry restored; `onChange` not called; closes; focus returns |
| `historyUndo` → false while open | Closes like Cancel (back to last version); versions discarded; icon removed |
| `onlyView` / compare mode / `showToolbar=false` while open | Closes like Cancel (back to last version) (versions kept) |
| `setMarkdown` / `insertMarkdown` / `reset` while open | Closes like Cancel (back to last version), then the call applies normally |

## Keyboard (only while history mode is open)

| Keys | Action |
|---|---|
| `Ctrl/Cmd+Z` | Undo (version) |
| `Ctrl/Cmd+Shift+Z`, `Ctrl+Y` | Redo (version) |

Outside history mode these keys keep their text-editing behavior.

## Limits (fixed)

- Inactivity before saving: 3 s.
- Max versions: 200 (oldest dropped).
- Not persisted; cleared on unmount.

## Labels

Icon `Historial de versiones`; bar buttons `← Undo`, `Redo →`, `Confirm`, `Cancel (back to last version)`; list label
`Historial de versiones`; live region `Versión n de m — hh:mm:ss`.

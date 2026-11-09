# Data Model: Compare Mode

All state is in-memory inside `MarkdownEditor`; nothing is persisted.

## Public types (`types.ts`)

| Type | Definition |
|---|---|
| `EditorMode` | `"default" \| "compare"` |
| `CompareOrientation` | `"side-to-side" \| "up-and-down"` |
| `CompareDecision` | `{ decision: "accepted" \| "rejected"; markdown: string }` |

## Internal entities

### CompareState (component state)

| Field | Type | Meaning |
|---|---|---|
| `key` | `string \| null` | Last `compareContent` seen while compare was requested; `null` when not requested |
| `session` | `CompareSession \| null` | Active compare session, or `null` (default mode, or after a decision) |

### CompareSession

| Field | Type | Meaning |
|---|---|---|
| `original` | `string` | Markdown the control held when compare started (read-only pane, reject result) |
| `provided` | `string` | Markdown from `compareContent` (reference for "Restaurar") |

Derived: `providedCanonical` (serialization of the editor after loading `provided`), `modified`, `summary`.

### State transitions

```text
requested = mode==="compare" && compareOrientation!==undefined && compareContent!==undefined

key ≠ requested content:
  requested = null                  → { key: null, session: null }
  requested ≠ null, session ≠ null  → { key: c, session: { original: kept, provided: c } }
  requested ≠ null, session = null  → { key: c, session: { original: current content, provided: c } }
Accept / Reject                     → { key unchanged, session: null }
Restaurar / reset()                 → content := session.provided (session unchanged)
```

### Diff units (`compare/docDiff.ts`)

| Field | Meaning |
|---|---|
| `pos`, `nodeSize` | Position of the node in its document |
| `typeName`, `attrsKey`, `context` | Node type, serialized attrs, ancestor context (list kind, task `checked`, table path) |
| `tokens` | Token keys (words / whitespace / inline nodes with mark signature; lines for code blocks) with their ranges |
| `key` | `typeName|attrsKey|context|tokens` — equality for exact matches |
| `containers` | Enclosing table rows / list items / task items (for whole-element highlight) |

### Summary

`{ changed: boolean; count: number }` — `changed`: any addition, deletion or modification; `count`: highlighted passages.
Used for the enabled state of Accept/Reject and the accessible description.

## Validation rules

- Compare requires `mode === "compare"`, `compareOrientation` and `compareContent` all defined (FR-002).
- `Restaurar` visible ⇔ `modified` (FR-009, FR-022).
- Accept/Reject enabled ⇔ `summary.changed` (FR-013).
- Empty text blocks never participate in the diff.

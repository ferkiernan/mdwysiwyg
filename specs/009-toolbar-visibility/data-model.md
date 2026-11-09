# Data Model: Toolbar Visibility Control

No persisted data and no document change.

## Toolbar visibility setting

- **What**: host-controlled boolean `showToolbar` (default `true`).
- **Where it lives**: prop of `MarkdownEditor`; not stored or mirrored in component state.
- **Effect**: `true` → toolbar subtree mounted; `false` → not mounted (and, with feature 010, the compare bar too).

## Transitions

```text
shown ──showToolbar=false──▶ hidden   (toolbar subtree unmounts: panels close, focus returns to editor if it was inside)
hidden ──showToolbar=true──▶ shown    (toolbar mounts and reads current editor state)
```

Unaffected by transitions: document content, selection, undo history, `viewMode`, table menu, link popover, resize state.

# Contract: `showToolbar` prop

```ts
interface MarkdownEditorProps {
  /** Muestra u oculta la barra de herramientas. Se puede cambiar en cualquier momento. Default: true. */
  showToolbar?: boolean;
}
```

| Value | Result |
|---|---|
| omitted / `true` | Toolbar shown (editing bar, or the reduced bar with `onlyView`) — current behavior |
| `false` | No toolbar rendered; content area uses the freed height; component size unchanged |

## Runtime behavior

- Changing the value while mounted applies immediately; the editor is not re-created.
- Unchanged by toggling: content, caret/selection, undo history, rendered/Markdown view, resize state.
- Toggling never calls `onChange`.
- Hiding closes any open toolbar dropdown, dialog or popup without applying an action.
- If a toolbar control had focus when it is hidden, focus moves to the editor.
- Hidden toolbar: not in tab order, not in the accessibility tree.
- Table cell menus, link popover, keyboard shortcuts and the imperative `ref` API keep working.
- While hidden, the rendered/Markdown view toggle and Export are not available from the UI.

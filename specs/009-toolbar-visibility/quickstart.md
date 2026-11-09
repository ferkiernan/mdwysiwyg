# Quickstart: Toolbar Visibility Control

**Feature**: [spec.md](./spec.md) | **Contract**: [contracts/MarkdownEditor.showToolbar.md](./contracts/MarkdownEditor.showToolbar.md)

## Automated checks

```bash
npm run typecheck
npm test
npm run build && npm run verify:dist
```

## Manual validation (playground)

```bash
npm run dev
```

1. **Default** — editors without `showToolbar` show their toolbar as before.
2. **Toggle** — use the playground "Mostrar barra" checkbox on the first editor: toolbar disappears at once, content
   grows into the space, component size is unchanged; check it again: toolbar returns reflecting current formatting.
3. **No loss** — type, select text, make an edit, toggle several times: content, caret, undo (Ctrl+Z) unchanged.
4. **Markdown view** — switch to Markdown source, toggle: the view stays; caret position preserved.
5. **Open panel** — open the table-size picker, then hide the bar: panel closes, nothing inserted.
6. **Focus** — focus a toolbar button (Tab/click), hide the bar: focus moves to the editor.
7. **Read-only** — `onlyView` editor with `showToolbar={false}`: reduced bar hidden too.
8. **Still editable** — with the bar hidden: type, Ctrl+B, table cell menu (hover triangle), link popover.

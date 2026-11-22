# Implementation Plan: Attribute to Turn Spell Checking On and Off

**Branch**: `029-spellcheck-toggle` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

## Design

- **`types.ts`:** a new optional prop `spellCheck?: boolean` (default `true`), with JSDoc. The playground generator reads
  this JSDoc.
- **`MarkdownEditor.tsx`:**
  - **Attributes:** `editorProps.attributes` becomes a function that adds `spellcheck: "true" | "false"` from a ref.
    ProseMirror re-evaluates `attributes` on every view update.
  - **Live change:** an effect on `spellCheck` calls `view.updateState(view.state)`, a view update with no transaction.
    It does not recreate the editor (`useEditor` deps are unchanged), and it does not touch the content, the selection
    or the history.
  - **Compare mode:** the editable pane is the same editor, so it follows the prop. The original pane is read-only and
    is not changed.
- **Markdown view:** unchanged; the textarea keeps `spellCheck={false}`.
- **Docs:**
  - component README (props table and a «Corrección ortográfica» section);
  - the root README feature table;
  - `llms.txt`;
  - the CHANGELOG.
- **Playground:** the attribute is listed in the «Barra y vista» group, and `attributes.json` is regenerated.

## Constitution Check

The prop is additive, optional and backwards compatible (the default keeps today's behavior), and it is tested and
documented. Pass.

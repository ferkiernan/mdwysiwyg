# Contract: builder outputs

## Attributes — JSX (default)

```tsx
<MarkdownEditor
  className="mi-editor"
  height={400}
  onlyView
  onlyViewNotice="Solo lectura"
  onChange={(markdown) => { /* TODO: tu código */ }}
/>
```

Rules: only non-default values; `true` → bare prop; `false` → `prop={false}`; strings quoted/escaped; numbers in braces;
host functions as `TODO` placeholders; `className` included when the theme scope is "este control"; props ordered as in
`types.ts`.

## Attributes — object

```ts
// import type { MarkdownEditorProps } from "mdwysiwyg";
const editorProps: MarkdownEditorProps = {
  className: "mi-editor",
  height: 400,
  onlyView: true,
};
// <MarkdownEditor {...editorProps} />
```

## Theme CSS

```css
/* mdwysiwyg — tema generado en el playground
   1. Importá los estilos del control: import "mdwysiwyg/styles.css";
   2. Poné className="mi-editor" en <MarkdownEditor>.
   Guía: https://github.com/ferkiernan/mdwysiwyg/blob/master/docs/THEMING.md */
.mi-editor {
  --mdw-toolbar-fg: #f8fafc;
  --mdw-content-bg: #0b1220;
}
```

Scope selector: `.<className>` | `<wrapperSelector>` | `:root`. Optional dark block:
`@media (prefers-color-scheme: dark) { <selector> { … } }`. No `!important`. Invalid values excluded with
`/* --mdw-x: valor inválido omitido */`.

## UI labels (Spanish)

Sections: «Seleccioná los atributos de tu control», «Theming». Buttons: «Copiar atributos», «Crear CSS», «Restablecer»,
«Empezar de nuevo». Format selector: «JSX» / «Objeto». Scope: «Este control» / «Una sección» / «Toda la página».
Confirmation: «¡Copiado!». Fallback: «No se pudo copiar automáticamente: seleccioná y copiá el texto».

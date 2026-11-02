# Data Model: Línea editable tras bloques al final del documento

Sin datos persistentes ni cambios de esquema. Solo invariantes del documento del editor.

## Entidades

- **Bloque final**: último hijo de nivel superior del documento cuando no es un párrafo
  (`table`, `codeBlock` incl. `language="mermaid"`, `blockquote`, lista, `horizontalRule`, imagen,
  `htmlBlock`).
- **Línea posterior**: párrafo vacío (`paragraph` sin contenido) como último hijo del documento.

## Invariantes

- **INV-1**: en un editor editable, el último hijo del documento es siempre un párrafo
  (garantizado al crear, por `ensureTrailingParagraph`, y tras cada edición por `trailingNode`).
- **INV-2**: la Línea posterior vacía no aparece en el Markdown generado (el pipeline la descarta).
- **INV-3**: insertar la Línea posterior en la creación no emite `onUpdate`/`onChange`, no genera
  entrada de historial y no altera `isModified()`.

## Transiciones

| Estado | Evento | Resultado |
|--------|--------|-----------|
| Último = bloque | creación del editor | se inserta párrafo vacío al final (INV-1) |
| Último = párrafo vacío tras bloque | `mousedown` en área libre | selección en ese párrafo |
| Selección en Línea posterior | Enter | nuevo párrafo vacío debajo; selección en él |
| Selección en Línea posterior | escribir | el texto queda tras el bloque |
| Último = párrafo con texto | `mousedown` en área libre | selección al final de ese párrafo (sin cambios) |

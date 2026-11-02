# Contract: comportamiento de edición — línea posterior al bloque final

Sin cambios de API pública (props, tipos, ref). Contrato observable de la vista renderizada:

| ID | Entrada | Salida observable |
|----|---------|-------------------|
| C-1 | Editor editable con `initialContent` terminado en bloque | El último hijo del área editable es un párrafo vacío; `onChange` no se invoca; el Markdown no cambia |
| C-2 | `mousedown` en área libre (derecha de la última tabla / debajo del último bloque) | Cursor en la Línea posterior; el bloque no se modifica |
| C-3 | Enter con cursor en la Línea posterior | Nuevo párrafo vacío debajo; cursor en él; el Markdown no cambia |
| C-4 | Escribir en la Línea posterior | Texto aparece tras el bloque; `onChange` recibe Markdown con el texto después del bloque |
| C-5 | `mousedown` dentro de celda / código / diagrama | Comportamiento previo (sin redirección) |
| C-6 | `onlyView` | Sin párrafo auxiliar ni redirección |
| C-7 | Documento terminado en párrafo con texto | Sin cambios; clic libre deja el cursor al final de ese párrafo |
| C-8 | Flecha abajo / Ctrl+Fin desde el último bloque | El cursor llega a la Línea posterior |
| C-9 | `mousedown` a la derecha de una tabla o en el hueco entre ella y el bloque siguiente (no final) | Cursor de hueco entre ambos (o dentro de la línea vacía si existe); Enter inserta una línea en blanco entre ambos |
| C-10 | `mousedown` en el margen superior de una tabla | Cursor de hueco antes de la tabla; Enter permite escribir antes |
| C-11 | `mousedown` en el hueco entre dos párrafos | Sin redirección (comportamiento previo) |

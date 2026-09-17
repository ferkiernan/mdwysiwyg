# Data Model: Toolbar Redesign & Insert Pickers

**Feature**: [spec.md](./spec.md) | **Date**: 2026-09-17

Sin cambios al modelo de datos de `001-markdown-editor` (`MarkdownDocument`, `ViewMode`). Esta
feature agrega únicamente estado de interacción efímero, local a los nuevos paneles, que nunca se
persiste ni forma parte del documento Markdown salvo en el momento en que se confirma.

## TableSize (estado efímero de `TableSizePicker`)

| Campo | Tipo | Descripción |
|---|---|---|
| `cols` | `number` | Columnas señaladas/confirmadas. Convención: primer valor del par. |
| `rows` | `number` | Filas señaladas/confirmadas. Convención: segundo valor del par. |

**Convención**: se expresa y se muestra siempre como "columnas × filas" (p. ej. "3 × 4" = 3
columnas, 4 filas). El estado interno del picker es `TableSize | null` — `null` representa
"ninguna celda resaltada todavía" (estado inicial, FR-007). Al confirmarse (clic o Enter), el par
se traduce en una llamada a `editor.chain().insertTable({ rows, cols, withHeaderRow: true })` y el
estado del picker se descarta junto con el panel.

## CodeLanguageValue (estado efímero de `CodeLanguagePicker`)

| Campo | Tipo | Descripción |
|---|---|---|
| `choice` | `"json" \| "sql" \| "typescript" \| "javascript" \| "java" \| "other"` | Selección en el `<select>` predefinido. |
| `otherValue` | `string` | Valor libre cuando `choice === "other"`. |

Al confirmarse, se resuelve a un único `string` (el lenguaje predefinido elegido, o el valor de
`otherValue`) que se persiste como atributo `language` del nodo `codeBlock` de Tiptap — el mismo
atributo estándar ya soportado por el pipeline Markdown de `001-markdown-editor` (fence info
string, p. ej. ` ```javascript `). No se introduce ningún campo nuevo en `MarkdownDocument`.

## Sin entidades nuevas persistentes

Ni `TableSize` ni `CodeLanguageValue` sobreviven al cierre del panel correspondiente: son estado
de UI transitorio, no entidades del dominio del editor.

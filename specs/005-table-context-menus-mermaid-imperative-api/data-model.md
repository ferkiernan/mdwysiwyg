# Data Model: Table Context Menus, Mermaid, Cursor Preservation, Extended Theming & Imperative API

**Feature**: [spec.md](./spec.md) | **Date**: 2026-09-18

Sin cambios al `MarkdownDocument` (sigue siendo el Markdown fuente como única fuente de verdad).
Esta feature añade estado de UI efímero y un tipo nuevo de API imperativa.

## Aviso de solo lectura (`onlyViewNotice`)

| Campo | Tipo | Default | Descripción |
|---|---|---|---|
| `onlyViewNotice` | `string` | `"Edición desactivada"` | Texto mostrado en la barra cuando `onlyView` está activo. |

## Estado de foco de celda de tabla (efímero)

| Campo | Tipo | Descripción |
|---|---|---|
| `lastFocusedCellPos` | `number \| null` | Posición ProseMirror de la última celda (`th`/`td`) sobre la que se hizo clic. `null` si el foco no está en ninguna celda. |
| `tableMenuOpen` | `{ kind: "column" \| "row"; anchor: HTMLElement; cellPos: number } \| null` | Estado del menú de columna/fila abierto, si lo hay. |

Se descarta al hacer clic fuera de una celda de tabla, o al cerrar el menú (con o sin acción
confirmada).

## Mapeo de posición entre vistas (efímero, calculado al alternar)

| Concepto | Descripción |
|---|---|
| Posición de origen (mdast) | `node.position.start.offset` / `end.offset` que `remark-parse` adjunta a cada nodo del AST al parsear el Markdown fuente. |
| Posición ProseMirror equivalente | Posición en el documento Tiptap que corresponde al mismo nodo lógico, calculada recorriendo el documento ProseMirror en el mismo orden que el AST. |

No se persiste: se recalcula en cada alternancia de vista, a partir del cursor/selección activa
en el momento de alternar.

## Bloque Mermaid

Reutiliza la entidad "Lenguaje de bloque de código" de `002`/`003` sin cambios de forma: un bloque
de código con `language === "mermaid"`. Estado adicional de renderizado (no persistido, vive en el
`NodeView`):

| Campo | Tipo | Descripción |
|---|---|---|
| `renderState` | `"pending" \| "rendered" \| "invalid"` | Estado de renderizado del diagrama para ese nodo. `"pending"` mientras `mermaid.render()` está en curso; `"rendered"` con el SVG mostrado; `"invalid"` con el texto de fallback legible. |
| `lastRenderedSource` | `string` | Último texto fuente renderizado con éxito, usado para evitar re-renderizar si el contenido del bloque no cambió entre transacciones. |

## Personalización visual extendida (CSS Custom Properties nuevas)

| Variable | Default | Controla |
|---|---|---|
| `--mdw-content-markdown-fg` | `var(--mdw-fg)` | Color de texto del área de contenido en vista Markdown |
| `--mdw-content-markdown-font-family` | `ui-monospace, Consolas, monospace` | Fuente del área de contenido en vista Markdown |
| `--mdw-content-wysiwyg-fg` | `var(--mdw-fg)` | Color de texto del área de contenido en vista renderizada |
| `--mdw-content-wysiwyg-font-family` | `inherit` (fuente del `.root`) | Fuente del área de contenido en vista renderizada |
| `--mdw-scrollbar-thumb` | `#c1c1c1` (aprox.) | Color del "thumb" de la barra de scroll, donde el navegador lo permita |
| `--mdw-scrollbar-track` | `transparent` | Color del track de la barra de scroll |
| `--mdw-toolbar-select-bg` | `var(--mdw-toolbar-gradient-from)` (o el valor actual del select) | Fondo del selector de nivel de encabezado |
| `--mdw-button-active-bg` | valor actual hardcodeado de `.button[aria-pressed="true"]`/`:active` | Fondo de un botón de la barra en estado presionado |
| `--mdw-button-hover-gradient-from` / `--mdw-button-hover-gradient-to` | valores actuales hardcodeados de `.button:hover` | Fondo (degradado) de un botón de la barra en hover |

Todas siguen el mismo patrón de `003`: declaradas en `.root` con su valor por defecto, no
agregan props nuevas, y una personalización parcial no afecta las variables no tocadas (FR-014).

## API imperativa (`MarkdownEditorHandle`)

```ts
export interface MarkdownEditorHandle {
  reset(): void;
  isModified(): boolean;
}
```

| Método | Comportamiento |
|---|---|
| `reset()` | Restablece el contenido del editor (ambas vistas) al "contenido original" (ver abajo). No dispara `onChange` con el valor previo a resetear, pero sí refleja el nuevo estado tras el reset según el mismo criterio ya usado para cambios de contenido. |
| `isModified()` | Devuelve `true` si el `source` actual difiere del "contenido original"; `false` en caso contrario. |

## Contenido original (referencia para `reset()`/`isModified()`)

| Campo | Tipo | Descripción |
|---|---|---|
| `originalContentRef` | `string` (en un `useRef`) | Valor de `initialContent` capturado al montar el componente. Es la referencia contra la que se compara `isModified()` y el valor al que vuelve `reset()`. |

## `documentId` / `fileName` (props pasivas)

| Campo | Tipo | Descripción |
|---|---|---|
| `documentId` | `string \| undefined` | Identificador de documento de uso libre de la aplicación consumidora; el componente no le da un uso propio obligatorio. |
| `fileName` | `string \| undefined` | Nombre de archivo de uso libre de la aplicación consumidora; el componente no lo usa automáticamente para `onlyViewNotice` (debe pasarse explícitamente si se desea). |

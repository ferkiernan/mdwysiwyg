# Data Model: Link Insertion UX & Floating Link Popover

**Feature**: [spec.md](./spec.md) | **Date**: 2026-09-17

Sin cambios al `MarkdownDocument` ni al `ViewMode` de `001-markdown-editor`. El enlace ya es una
marca (`mark`) estándar de la extensión `Link` de Tiptap sobre el texto, serializada como
`[texto](url)` en Markdown — esta feature no introduce un nuevo tipo de nodo/marca, solo nueva
interacción de UI alrededor de la marca `link` ya existente.

## Selección de texto activa (efímero, no persistido)

| Campo | Tipo | Descripción |
|---|---|---|
| `hasSelection` | `boolean` | Derivado de `editor.state.selection.empty` en el momento de abrir el diálogo de insertar enlace. Determina si el diálogo muestra 1 campo (URL) o 2 campos (URL + texto). |

No es un objeto de estado propio de esta feature: se lee directamente del estado de ProseMirror ya
gestionado por Tiptap.

## Popover de acciones de enlace (estado de UI efímero)

| Campo | Tipo | Descripción |
|---|---|---|
| `open` | `boolean` | Si el popover está visible. |
| `mode` | `"menu" \| "edit"` | `"menu"`: muestra "Ir a la url"/"Copiar url"/separador/"Editar url". `"edit"`: muestra input de URL, "Eliminar link", "Guardar". |
| `linkUrl` | `string` | URL actual del enlace sobre el que se hizo clic (leída de `editor.getAttributes('link').href` en el momento del clic). |
| `linkRange` | `{ from: number; to: number }` | Rango del documento ProseMirror ocupado por la marca `link`, obtenido vía `getMarkRange` en la posición del clic; necesario para aplicar `extendMarkRange('link')` al guardar/eliminar sin afectar texto adyacente no enlazado. |
| `anchorPosition` | `{ top: number; left: number }` (o un elemento DOM sintético) | Posición de pantalla donde anclar el `FloatingPanel`, derivada de las coordenadas del clic. |

Se descarta por completo al cerrarse el popover sin confirmar una acción (FR-014); no persiste
entre aperturas de distintos enlaces.

## `ensureProtocol` (función pura, no una entidad de estado)

| Entrada | Salida |
|---|---|
| URL sin `"://"` (p. ej. `"www.ejemplo.com"`, `"ejemplo.com"`) | `"http://" + entrada` |
| URL con `"://"` ya presente (p. ej. `"https://ejemplo.com"`, `"ftp://x"`) | Entrada sin modificar |

Reutilizada por el diálogo de inserción (`InsertDialogs.tsx`) y por el modo de edición del popover
(`LinkPopover.tsx`), garantizando FR-004/FR-005/FR-006 de forma consistente por construcción.

# Data Model: Markdown Editor

**Feature**: [spec.md](./spec.md) | **Date**: 2026-09-17

Este componente no tiene persistencia ni entidades de dominio en el sentido tradicional (no hay
base de datos). Las "entidades" son estructuras de estado y tipos públicos que atraviesan el
componente. Derivadas de la sección "Key Entities" de la spec y de los requisitos funcionales.

## MarkdownDocument (estado interno)

Representa el contenido gestionado por el componente en memoria.

| Campo | Tipo | Descripción | Regla |
|---|---|---|---|
| `source` | `string` | Texto Markdown (GFM) fuente — única fuente de verdad | FR-020: toda proyección se deriva de este valor |
| `doc` | `TiptapJSONContent` (derivado) | Representación interna de ProseMirror/Tiptap para la vista WYSIWYG | Se recalcula desde `source` al entrar en modo renderizado; no se persiste por separado |

**Transiciones**:
- Edición en vista renderizada → se serializa `doc` a Markdown → actualiza `source` → dispara notificación de cambio (FR-006, FR-018).
- Edición en vista Markdown → se parsea `source` con `remark-gfm` → se reconstruye `doc` al volver a vista renderizada (FR-007).
- No existe estado "sucio"/desincronizado persistente: `source` siempre es la verdad; `doc` es una proyección que se puede regenerar en cualquier momento (FR-004).

## ViewMode (estado interno)

| Valor | Descripción |
|---|---|
| `"wysiwyg"` | Vista renderizada (por defecto, FR-001) |
| `"markdown"` | Vista Markdown/texto plano (activada por el botón `</>`, FR-003) |

No forma parte del contenido persistente ni se expone como prop controlable en la v1 (la spec no
lo requiere); es estado interno del componente.

## InsertableElement (concepto, no una estructura de datos propia)

Cada elemento insertable (imagen, enlace, tabla, línea horizontal, bloque de código, HTML
embebido) se modela directamente como un nodo del esquema Tiptap/ProseMirror y su representación
GFM equivalente vía el pipeline `remark`. No se introduce un tipo de dominio adicional: reutilizar
el esquema de Tiptap evita duplicar modelado (Principio XV, Simplicidad).

## Tipos públicos (API del componente)

Ver [contracts/MarkdownEditor.md](./contracts/MarkdownEditor.md) para la firma completa de
`MarkdownEditorProps` y el contrato de comportamiento. Resumen de campos relevantes al modelo de
datos:

| Prop | Tipo | Relación con el modelo |
|---|---|---|
| `initialContent` | `string \| undefined` | Valor inicial de `source` (FR-014, FR-015) |
| `onChange` | `(markdown: string) => void` | Se invoca con el `source` actualizado tras cada modificación (FR-018) |
| `sanitizeEmbeddedHtml` | `boolean \| undefined` (default `true`) | Controla si el pipeline de sanitización (`rehype-sanitize`) se aplica al HTML embebido antes de renderizarlo en la vista WYSIWYG (FR-022, FR-023) |
| `width` / `height` | `string \| number \| undefined` | Tamaño del componente; default `700`/`500` (px) si no se especifican (FR-016, FR-017) |

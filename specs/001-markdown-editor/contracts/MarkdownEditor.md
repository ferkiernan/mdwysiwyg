# Contract: `MarkdownEditor` (API pública del componente)

**Feature**: [../spec.md](../spec.md) | **Date**: 2026-09-17

Este es el contrato de interfaz pública que expone el paquete para este componente (Principio V:
API pública simple y predecible; Principio XII: export individual para tree-shaking).

## Export

```ts
// src/components/MarkdownEditor/index.ts
export { MarkdownEditor } from "./MarkdownEditor";
export type { MarkdownEditorProps } from "./types";
```

## Props (`MarkdownEditorProps`)

| Prop | Tipo | Requerido | Default | Requisito(s) |
|---|---|---|---|---|
| `initialContent` | `string` | No | `""` (editor vacío) | FR-014, FR-015 |
| `onChange` | `(markdown: string) => void` | No | — | FR-018 |
| `width` | `number \| string` | No | `700` (px) | FR-016, FR-017 |
| `height` | `number \| string` | No | `500` (px) | FR-016, FR-017 |
| `sanitizeEmbeddedHtml` | `boolean` | No | `true` | FR-022, FR-023 |
| `className` | `string` | No | — | Permite a la app consumidora componer estilos externos sin romper el encapsulamiento (Principio VII) |

No se incluyen props especulativas (p. ej. temas, plugins, modos adicionales) sin un requisito
que las respalde, conforme al Principio XV.

## Comportamiento contractual

1. **Sin `initialContent`**: el componente MUST renderizarse en estado vacío, en vista WYSIWYG,
   con el tamaño por defecto 700×500px, sin lanzar errores (FR-015, SC-005).
2. **Con `initialContent`**: el componente MUST parsear el Markdown recibido como GFM y mostrarlo
   renderizado desde el primer render (FR-014, FR-021).
3. **`onChange`**: MUST invocarse con el Markdown (GFM) actualizado como único argumento, cada vez
   que el contenido cambie desde cualquiera de las dos vistas (FR-006, FR-007, FR-018). No se
   invoca por el mero cambio de `ViewMode` sin edición de contenido (consistente con FR-004: cambiar
   de vista no altera el contenido).
4. **Alternancia de vista (botón `</>`)**: MUST preservar el contenido exacto en cada alternancia;
   es responsabilidad interna del componente, no una prop controlable en esta versión (FR-003,
   FR-004, SC-002).
5. **`sanitizeEmbeddedHtml={true}` (default)**: todo bloque HTML embebido MUST sanitizarse antes de
   renderizarse en la vista WYSIWYG (FR-022).
6. **`sanitizeEmbeddedHtml={false}`**: el componente MUST omitir la sanitización, bajo
   responsabilidad explícita de la aplicación consumidora (FR-023).
7. **Exportación**: la funcionalidad de exportar como Markdown y como HTML (botón `Export`, FR-012,
   FR-013) es interna a la UI del componente (vía la toolbar) y no requiere una prop o método
   público adicional en esta versión — no hay requisito en la spec de exportación programática
   externa al margen de `onChange`.

## Fuera de contrato (explícitamente no expuesto)

- Ningún método imperativo (`ref`) es requerido por la spec; no se añade un `MarkdownEditorHandle`
  especulativo. Si una necesidad concreta aparece (p. ej. forzar foco desde la app consumidora), se
  añadirá en una iteración futura conforme al Principio XV.
- No se expone una prop para controlar `ViewMode` desde fuera — la spec no lo pide y añadirla sin
  un caso de uso real violaría el Principio XV.

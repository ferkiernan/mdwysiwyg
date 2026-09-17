# Quickstart: Markdown Editor

**Feature**: [spec.md](./spec.md) | **Contract**: [contracts/MarkdownEditor.md](./contracts/MarkdownEditor.md)

Guía de validación manual/automatizada end-to-end de que el componente cumple la spec. No
duplica el contrato ni el modelo de datos — referencia ambos.

## Prerequisitos

- Node.js LTS vigente, proyecto con React 18+ instalado como peer.
- Dependencias del paquete instaladas (`@tiptap/*`, `unified`/`remark`/`rehype`/`rehype-sanitize`
  — ver [research.md](./research.md)).

## Escenario 1 — Uso sin contenido inicial (US1, SC-005)

```tsx
import { MarkdownEditor } from "mdwysiwyg";

function Demo() {
  return <MarkdownEditor onChange={(md) => console.log(md)} />;
}
```

**Resultado esperado**: editor vacío, vista WYSIWYG activa, tamaño 700×500px. Escribir texto y
aplicar negrita desde la toolbar debe reflejarse visualmente de inmediato.

## Escenario 2 — Contenido inicial y alternancia de vista (US2, SC-002)

```tsx
<MarkdownEditor
  initialContent={"# Título\n\nUn párrafo con **negrita** y una tabla:\n\n| A | B |\n|---|---|\n| 1 | 2 |\n"}
  onChange={(md) => console.log(md)}
/>
```

**Pasos de validación**:
1. Montar el componente — debe mostrarse renderizado (heading, negrita, tabla).
2. Pulsar el botón `</>` — debe mostrarse el texto Markdown fuente, idéntico al `initialContent`.
3. Editar el texto Markdown directamente (p. ej. añadir un ítem a la tabla).
4. Pulsar `</>` de nuevo — la vista renderizada debe reflejar la edición.
5. Alternar 3 veces sin editar — el contenido debe permanecer bit a bit idéntico (SC-002).

## Escenario 3 — Insertar elementos desde la toolbar (US3)

Para cada control de la toolbar (bloque de código, imagen, enlace, tabla, línea horizontal, HTML
embebido): invocar la acción y verificar que el elemento aparece en ambas vistas de forma
consistente (ver [contracts/MarkdownEditor.md](./contracts/MarkdownEditor.md) punto 3).

## Escenario 4 — Exportar contenido (US4, SC-003)

1. Crear contenido con formato variado.
2. Usar `Export → Copiar como Markdown` — el resultado debe coincidir con el Markdown fuente
   actual.
3. Usar `Export → Copiar como HTML` — el resultado debe ser el HTML equivalente fiel al contenido.

## Escenario 5 — Sanitización de HTML embebido (FR-022, FR-023)

```tsx
// Caso A: sanitización activa (default)
<MarkdownEditor initialContent={'<script>alert(1)</script>'} />
// Esperado: el script NO se ejecuta ni se renderiza tal cual.

// Caso B: sanitización desactivada explícitamente
<MarkdownEditor
  initialContent={'<div class="custom">Contenido de confianza</div>'}
  sanitizeEmbeddedHtml={false}
/>
// Esperado: el HTML se renderiza sin modificar.
```

## Criterio de éxito global

Todos los escenarios anteriores deben pasar sin intervención manual adicional para considerar la
Fase 1 (diseño) validada. La cobertura formal de estos escenarios como tests automatizados se
desglosa en `tasks.md` (generado por `/speckit-tasks`).

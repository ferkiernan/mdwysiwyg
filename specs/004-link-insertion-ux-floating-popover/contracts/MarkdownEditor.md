# Contract: `MarkdownEditor` — comportamiento de enlaces (004)

**Feature**: [../spec.md](../spec.md) | **Date**: 2026-09-17

Extiende (sin modificar) el contrato de
[001-markdown-editor/contracts/MarkdownEditor.md](../../001-markdown-editor/contracts/MarkdownEditor.md).
`MarkdownEditorProps` no cambia — esta feature es exclusivamente comportamiento interno de la
barra de herramientas y la vista renderizada.

## Comportamiento contractual — Diálogo de inserción de enlace

1. Al activar el control de insertar enlace con una selección de texto no vacía, el diálogo MUST
   mostrar únicamente el campo de URL (FR-001).
2. Al confirmar ese diálogo, el sistema MUST aplicar el enlace sobre el rango exacto que estaba
   seleccionado, sin alterar su contenido textual (FR-002).
3. Al activar el control de insertar enlace sin selección, el diálogo MUST mostrar ambos campos
   (URL y texto), igual que el comportamiento ya definido en `002-toolbar-redesign-insert-pickers`
   (FR-003).

## Comportamiento contractual — Autocompletado de protocolo

1. Cualquier valor de URL sin `"://"` MUST recibir el prefijo `"http://"` antes de aplicarse como
   destino de un enlace, en el diálogo de inserción y en el popover de edición (FR-004, FR-005).
2. Un valor de URL que ya incluye un protocolo explícito MUST conservarse sin modificación
   (FR-006).

## Comportamiento contractual — Popover de acciones de enlace

1. Un clic sobre texto con marca de enlace, en la vista renderizada, MUST mostrar un panel
   flotante con "Ir a la url", "Copiar url", un separador, y "Editar url", en ese orden (FR-007).
2. "Ir a la url" MUST abrir la URL en una pestaña/ventana nueva sin alterar el estado del editor
   (FR-008).
3. "Copiar url" MUST copiar la URL exacta al portapapeles (FR-009).
4. "Editar url" MUST cambiar el panel a un modo con: input de URL actual, opción "Eliminar link",
   botón "Guardar" (FR-010).
5. "Eliminar link" MUST quitar la marca de enlace preservando el texto, y MUST cerrar el panel
   (FR-011).
6. "Guardar" con URL no vacía MUST actualizar el enlace (aplicando el autocompletado de protocolo)
   y MUST cerrar el panel (FR-012). Con el campo vacío, "Guardar" MUST NOT aplicar cambios
   (FR-013).
7. El panel (en cualquier modo) MUST poder cerrarse sin aplicar cambios, vía clic externo o
   Escape (FR-014).
8. Cuando el componente está en modo `onlyView`, el panel MUST mostrar únicamente "Ir a la url" y
   "Copiar url", sin "Editar url" (FR-015).

## Fuera de contrato (explícitamente no expuesto)

- No se agrega ninguna prop pública para configurar el comportamiento del popover (por ejemplo,
  deshabilitarlo, cambiar el trigger de apertura) — no hay requisito que lo pida; si aparece un
  caso de uso real, se evaluará en una feature futura conforme al Principio XV.
- No se agrega soporte para editar enlaces desde la vista Markdown cruda — explícitamente fuera de
  alcance en spec.md.

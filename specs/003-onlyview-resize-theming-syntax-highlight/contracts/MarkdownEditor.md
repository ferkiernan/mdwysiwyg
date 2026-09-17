# Contract: `MarkdownEditor` — extensión de API pública (003)

**Feature**: [../spec.md](../spec.md) | **Date**: 2026-09-17

Extiende el contrato de [001-markdown-editor/contracts/MarkdownEditor.md](../../001-markdown-editor/contracts/MarkdownEditor.md).
Todo lo no mencionado aquí permanece sin cambios (FR-021).

## Props nuevas (`MarkdownEditorProps`)

| Prop | Tipo | Requerido | Default | Requisito(s) |
|---|---|---|---|---|
| `onlyView` | `boolean` | No | `false` | FR-001 a FR-008 |
| `resizable` | `boolean` | No | `true` | FR-009 a FR-012 |

No se añade ninguna prop de theming (FR-014): la personalización visual de la toolbar y del fondo
del área de contenido se resuelve íntegramente mediante CSS Custom Properties (ver
[data-model.md](../data-model.md)), no forma parte de `MarkdownEditorProps`.

## Comportamiento contractual — `onlyView`

1. **`onlyView={false}` (default)**: el componente MUST comportarse de forma idéntica a como lo
   hacía antes de esta feature (FR-008).
2. **`onlyView={true}`**: el editor MUST rechazar cualquier intento de modificación de contenido
   desde ambas vistas (FR-002, FR-003); la toolbar MUST mostrar únicamente el texto "Edición
   desactivada" y el control de exportar (FR-004, FR-005); el control `</>` de alternancia de vista
   MUST NOT mostrarse (FR-006); el control de exportar MUST seguir siendo completamente funcional
   (FR-007).
3. `onlyView` MUST poder combinarse con `resizable` sin conflicto: el redimensionamiento, si está
   habilitado, MUST seguir funcionando independientemente del valor de `onlyView`.

## Comportamiento contractual — `resizable`

1. **`resizable={true}` (default)**: el componente MUST mostrar un control de arrastre en su
   esquina inferior derecha que permita aumentar ancho y alto (FR-009, FR-010).
2. **`resizable={false}`**: el componente MUST NOT mostrar ningún control de arrastre y MUST
   mantener el tamaño indicado por `width`/`height` (o sus defaults) sin cambios (FR-011).
3. El componente MUST imponer un tamaño mínimo de redimensionamiento que preserve la usabilidad de
   la toolbar (FR-012); el valor exacto es un detalle de implementación, no una prop configurable
   (no se agrega ninguna prop de tamaño mínimo).

## Comportamiento contractual — Theming de la toolbar y del área de contenido

1. Sin ninguna variable CSS sobreescrita, el componente MUST mostrar el aspecto visual por defecto
   actual (FR-015), incluyendo el fondo del área de contenido (blanco, heredado de `--mdw-bg`).
2. La aplicación consumidora MUST poder sobreescribir cualquier subconjunto de las variables listadas
   en [data-model.md](../data-model.md) mediante CSS estándar (por ejemplo, un selector que apunte
   al `className` pasado por la app, o una regla más específica), y las variables no sobreescritas
   MUST conservar su valor por defecto (FR-016).
3. `--mdw-content-bg` MUST aceptar cualquier valor válido del shorthand CSS `background` (color
   sólido, degradado, o imagen con capas/transparencia combinadas), aplicándose al área de
   contenido en ambas vistas (renderizada y Markdown), no solo a una de ellas.
4. Las variables CSS MUST documentarse en el README del componente como parte de su superficie de
   personalización pública, aunque no formen parte de `MarkdownEditorProps`.

## Comportamiento contractual — Resaltado de sintaxis

1. Un bloque de código con un `language` registrado (json, sql, typescript, javascript, java)
   MUST mostrarse con resaltado de sintaxis en la vista renderizada (FR-017, FR-018).
2. Un bloque de código con un `language` personalizado no reconocido MUST mostrarse en texto plano
   legible, sin error ni pérdida de contenido (FR-018).
3. Un bloque de código sin `language` asignado MUST mostrarse sin resaltado, igual que antes de
   esta feature (FR-019).
4. El resaltado MUST ser exclusivamente presentacional: alternar a la vista Markdown y de vuelta
   MUST devolver exactamente el mismo Markdown fuente que antes de la alternancia (FR-020).

## Fuera de contrato (explícitamente no expuesto)

- No se agrega ninguna prop para controlar el tamaño mínimo de redimensionamiento, ni para
  personalizar la paleta de colores del resaltado de sintaxis: ambos quedan como detalles de
  implementación/CSS, conforme al Principio XV (evitar superficie de API no solicitada).
- No se agrega ninguna prop de "tema" de objeto (`theme={{...}}`): decisión explícita del usuario
  a favor de CSS Custom Properties (ver Clarifications en spec.md).

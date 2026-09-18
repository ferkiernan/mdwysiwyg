# Quickstart: Table Context Menus, Mermaid, Cursor Preservation, Extended Theming & Imperative API

**Feature**: [spec.md](./spec.md) | **Contract**: [contracts/MarkdownEditor.md](./contracts/MarkdownEditor.md)

Guía de validación manual/automatizada end-to-end.

## Escenario 1 — Aviso de solo lectura personalizado (US1)

```tsx
<MarkdownEditor onlyView onlyViewNotice="informe-final.md" initialContent={doc} />
```

**Verificar**: la barra muestra "informe-final.md" en lugar de "Edición desactivada".

## Escenario 2 — Menús de tabla (US2)

1. Insertar una tabla (selector visual, por ejemplo 3×3).
2. Hacer clic sobre una celda de encabezado (primer clic) → cursor se posiciona, sin menú.
3. Hacer clic de nuevo sobre esa misma celda → se abre el menú de columna con "Añadir columna" (a
   la derecha/izquierda), "Mover columna" (a la derecha/izquierda), "Eliminar esta columna".
4. Seleccionar "Añadir columna a la derecha" → aparece una nueva columna.
5. Repetir sobre una celda de datos (no encabezado) → el segundo clic abre el menú de fila con
   "Añadir fila" (arriba/abajo), "Mover fila" (subir/bajar), "Eliminar esta fila".

## Escenario 3 — Preservación de cursor al alternar vista (US3)

1. Escribir un párrafo largo en la vista renderizada, colocar el cursor en medio de una palabra
   específica.
2. Alternar a la vista Markdown (`</>`) → el cursor del textarea debe estar en el punto de texto
   que corresponde a esa misma palabra.
3. Alternar de vuelta a la vista renderizada → el cursor debe volver a la misma palabra.

## Escenario 4 — Diagramas Mermaid (US4)

```tsx
<MarkdownEditor
  initialContent={"```mermaid\ngraph TD\nA-->B\n```\n"}
/>
```

1. **Verificar**: el bloque se muestra como un diagrama de flujo (SVG), no como texto de código.
2. Insertar HTML con el contenido `"sequenceDiagram\nAlice->>Bob: Hola"` → verificar que se
   inserta como bloque de código con lenguaje Mermaid (con su diagrama renderizado), no como HTML
   embebido.
3. Insertar HTML con contenido no-Mermaid (por ejemplo `<div>Hola</div>`) → verificar que sigue
   insertándose como HTML embebido, comportamiento sin cambios.
4. Con un bloque Mermaid de sintaxis inválida (por ejemplo `graph TD\nA--` incompleto), verificar
   que se muestra el texto de forma legible, sin romper el resto del documento.

## Escenario 5 — Theming extendido (US5)

```css
.mi-editor-personalizado {
  --mdw-content-markdown-fg: #0f172a;
  --mdw-content-markdown-font-family: "Fira Code", monospace;
  --mdw-content-wysiwyg-fg: #1e293b;
  --mdw-scrollbar-thumb: #94a3b8;
  --mdw-toolbar-select-bg: #ffffff;
  --mdw-button-active-bg: #cbd5e1;
  --mdw-button-hover-gradient-from: #f1f5f9;
  --mdw-button-hover-gradient-to: #e2e8f0;
}
```

**Verificar**: cada aspecto refleja el valor personalizado; sin esta clase, el componente se ve
igual que en `003`/`004`.

## Escenario 6 — API imperativa (US6)

```tsx
const ref = useRef<MarkdownEditorHandle>(null);
<MarkdownEditor ref={ref} initialContent="# Original" documentId="doc-1" fileName="a.md" />;
```

1. Editar el contenido del editor.
2. `ref.current.isModified()` → `true`.
3. `ref.current.reset()` → el contenido vuelve a "# Original" en ambas vistas.
4. `ref.current.isModified()` → `false`.

## Criterio de éxito global

Los 6 escenarios anteriores deben pasar sin intervención manual adicional para considerar la Fase
1 (diseño) validada. La cobertura formal como tests automatizados se desglosa en `tasks.md`
(generado por `/speckit-tasks`).

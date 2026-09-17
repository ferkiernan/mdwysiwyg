# Quickstart: Only-View Mode, Resizable Editor, Toolbar Theming & Code Syntax Highlighting

**Feature**: [spec.md](./spec.md) | **Contract**: [contracts/MarkdownEditor.md](./contracts/MarkdownEditor.md)

Guía de validación manual/automatizada end-to-end. Referencia el contrato y el modelo de datos en
vez de duplicarlos.

## Escenario 1 — Modo de solo lectura (US1)

```tsx
<MarkdownEditor
  onlyView
  initialContent={"# Documento\n\nContenido no editable."}
/>
```

**Pasos de validación**:
1. La toolbar muestra "Edición desactivada" y solo el icono de exportar a la derecha.
2. Intentar escribir en la vista renderizada no modifica el contenido.
3. El control `</>` no está disponible (no hay forma de ver/editar el Markdown crudo).
4. El icono de exportar sigue copiando Markdown/HTML correctamente.
5. Montar el mismo componente sin `onlyView` (o con `onlyView={false}`) — debe verse y comportarse
   exactamente igual que en `002-toolbar-redesign-insert-pickers`.

## Escenario 2 — Redimensionamiento manual (US2)

```tsx
<MarkdownEditor />               {/* resizable=true por default */}
<MarkdownEditor resizable={false} />  {/* tamaño fijo */}
```

**Pasos de validación**:
1. En el primer caso, arrastrar la esquina inferior derecha del componente hacia abajo y hacia la
   derecha — el componente debe agrandarse en ambas direcciones.
2. Intentar reducir el componente por debajo de un tamaño mínimo razonable — la toolbar debe seguir
   siendo visible y utilizable.
3. En el segundo caso, no debe aparecer ningún control de arrastre, y el tamaño debe permanecer
   igual al especificado (o al default 700×500) sin importar la interacción del usuario.

## Escenario 3 — Personalización visual de la toolbar (US3)

```css
/* En el CSS de la aplicación consumidora */
.mi-editor-personalizado {
  --mdw-toolbar-gradient-from: #1e293b;
  --mdw-toolbar-gradient-via: #0f172a;
  --mdw-toolbar-gradient-to: #020617;
  --mdw-toolbar-fg: #f8fafc;
  --mdw-toolbar-font-family: "Inter", sans-serif;
}
```

```tsx
<MarkdownEditor className="mi-editor-personalizado" />
```

**Pasos de validación**:
1. La toolbar debe mostrar el degradado oscuro y texto claro definidos, en vez del degradado gris
   por defecto.
2. Sobreescribir solo `--mdw-toolbar-fg` (sin tocar el resto) — el degradado y la fuente deben
   seguir siendo los valores por defecto.
3. Montar el componente sin ninguna clase personalizada — debe verse igual que en
   `002-toolbar-redesign-insert-pickers` (degradado gris, texto oscuro).

## Escenario 4 — Resaltado de sintaxis (US4)

```tsx
<MarkdownEditor
  initialContent={"```javascript\nconst x = 1;\nfunction f() { return x; }\n```\n"}
/>
```

**Pasos de validación**:
1. El bloque de código debe mostrar al menos dos colores distintos (por ejemplo, `const`/`function`
   coloreados distinto de `x`/`f`).
2. Cambiar el lenguaje del bloque a un valor personalizado no reconocido (por ejemplo "brainfuck")
   vía el selector de `002-toolbar-redesign-insert-pickers` — el contenido debe seguir siendo
   legible, sin errores, sin resaltado específico.
3. Un bloque de código sin lenguaje asignado debe verse igual que en la feature anterior (sin
   resaltado).
4. Alternar a la vista Markdown y de vuelta — el Markdown fuente del bloque debe ser exactamente
   el mismo antes y después (el resaltado no debe filtrarse al Markdown).
5. Exportar como HTML (`Export → Copiar como HTML`) — el HTML resultante debe incluir las mismas
   clases de resaltado que la vista renderizada.

## Criterio de éxito global

Los 4 escenarios anteriores deben pasar sin intervención manual adicional para considerar la Fase
1 (diseño) validada. La cobertura formal como tests automatizados se desglosa en `tasks.md`
(generado por `/speckit-tasks`).

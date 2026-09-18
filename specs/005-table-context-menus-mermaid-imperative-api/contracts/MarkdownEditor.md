# Contract: `MarkdownEditor` — extensión de API pública (005)

**Feature**: [../spec.md](../spec.md) | **Date**: 2026-09-18

Extiende (sin modificar) los contratos de `001`, `002`, `003` y `004`. Introduce, por primera vez,
una API imperativa vía `ref` además de props nuevas.

## Props nuevas (`MarkdownEditorProps`)

| Prop | Tipo | Requerido | Default | Requisito(s) |
|---|---|---|---|---|
| `onlyViewNotice` | `string` | No | `"Edición desactivada"` | FR-001 |
| `documentId` | `string` | No | — | FR-018 |
| `fileName` | `string` | No | — | FR-018 |

## Tipo nuevo exportado: `MarkdownEditorHandle`

```ts
export interface MarkdownEditorHandle {
  reset(): void;
  isModified(): boolean;
}
```

El componente MUST ser un `forwardRef<MarkdownEditorHandle, MarkdownEditorProps>`. Una aplicación
consumidora MUST poder obtener esta interfaz vía:

```tsx
const editorRef = useRef<MarkdownEditorHandle>(null);
<MarkdownEditor ref={editorRef} initialContent="..." />;
// editorRef.current?.reset();
// editorRef.current?.isModified();
```

## Comportamiento contractual — Aviso de solo lectura (US1)

1. Sin `onlyViewNotice`, el componente MUST mostrar "Edición desactivada" (FR-001, comportamiento
   idéntico a `003`).
2. Con `onlyViewNotice` definido, el componente MUST mostrar ese texto en su lugar, sin alterar
   el resto del comportamiento de `onlyView` ya definido en `003`.

## Comportamiento contractual — Menús de tabla (US2)

1. Un primer clic sobre una celda de tabla (encabezado o dato) MUST solo posicionar el cursor,
   sin abrir ningún menú (FR-002).
2. Un clic sobre una celda de encabezado que ya tenía el cursor posicionado MUST abrir el menú de
   columna con las 5 opciones especificadas (FR-003).
3. Un clic sobre una celda de datos que ya tenía el cursor posicionado MUST abrir el menú de fila
   con las 5 opciones especificadas (FR-004).
4. Cada acción del menú MUST reflejarse en la vista renderizada y en el Markdown resultante
   (FR-005).

## Comportamiento contractual — Preservación de cursor (US3)

1. Alternar de vista MUST posicionar el cursor en la ubicación equivalente de la vista destino,
   exacta cuando exista correspondencia textual directa, o la mejor aproximación disponible en
   caso contrario (FR-006).

## Comportamiento contractual — Mermaid (US4)

1. Un bloque de código con `language: "mermaid"` y sintaxis válida MUST renderizarse como
   diagrama SVG en la vista renderizada (FR-007).
2. Sintaxis Mermaid inválida MUST degradar a texto legible sin bloquear el documento (FR-008).
3. Al insertar HTML, contenido cuya sintaxis corresponde a Mermaid MUST insertarse como bloque de
   código con lenguaje Mermaid, no como HTML embebido (FR-009).
4. El renderizado Mermaid MUST ser puramente presentacional — MUST NOT alterar el Markdown fuente
   del bloque al alternar de vista (FR-010).

## Comportamiento contractual — Theming extendido (US5)

1. Las nuevas variables CSS (ver [data-model.md](../data-model.md)) MUST seguir el mismo
   mecanismo ya establecido en `003`: sin sobreescribir ninguna, el aspecto por defecto MUST ser
   idéntico al ya existente (FR-011 a FR-014).

## Comportamiento contractual — API imperativa (US6)

1. `reset()` MUST restablecer el contenido del editor (ambas vistas) al valor con el que se montó
   originalmente (FR-015).
2. `isModified()` MUST reflejar correctamente si el contenido actual difiere del original en todo
   momento (FR-016).
3. Tras `reset()`, `isModified()` MUST devolver `false` (FR-017).
4. `documentId`/`fileName` MUST aceptarse sin que el componente les imponga un comportamiento
   propio obligatorio (FR-018).

## Fuera de contrato (explícitamente no expuesto)

- No se agrega ningún método imperativo adicional (por ejemplo, `getContent()`, `focus()`,
  `exportHtml()`) sin un requisito que lo respalde — conforme al Principio XV; si aparece una
  necesidad concreta, se evaluará en una feature futura.
- No se agrega ninguna prop para configurar el comportamiento de renderizado de Mermaid (por
  ejemplo, tema del diagrama, `securityLevel` configurable) — la spec no lo pide; `strict` es el
  valor fijo por defecto de seguridad.
- El mapeo de posición de cursor entre vistas no se expone como API pública ni es determinístico
  al 100% en todos los casos (ver Assumptions de la spec) — es un comportamiento interno del
  componente, no una garantía contractual exacta.

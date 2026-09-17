# Research: Only-View Mode, Resizable Editor, Toolbar Theming & Code Syntax Highlighting

**Feature**: [spec.md](./spec.md) | **Date**: 2026-09-17

## 1. Modo de solo lectura (`onlyView`)

**Decision**: Prop `editable={false}` nativa de Tiptap (`useEditor({ editable, ... })`) para
bloquear la vista WYSIWYG, más un `readOnly` en el `<textarea>` nativo para la vista Markdown, y
renderizado condicional de la toolbar.

**Rationale**: Tiptap expone `editable` como opción de primera clase del editor —
`editor.setEditable(false)` ya deshabilita la edición sin desmontar el documento ni perder
posición/estado. Cero dependencias nuevas.

**Alternatives considered**: Interceptar cada comando de edición manualmente — innecesariamente
complejo frente a una opción ya soportada por la librería.

## 2. Redimensionamiento manual (`resizable`)

**Decision**: Propiedad CSS nativa `resize: both` (más `overflow: auto` requerido por la spec CSS
para que `resize` tenga efecto) sobre el contenedor raíz del componente, activada/desactivada
condicionalmente según la prop.

**Rationale**: Es exactamente el mecanismo que usa un `<textarea>` nativo (la analogía pedida
explícitamente en la spec), soportado por todos los navegadores evergreen sin JavaScript ni
dependencias adicionales — máximo cumplimiento de Principio VIII. `min-width`/`min-height` en CSS
cubren el requisito de tamaño mínimo (FR-012) de forma declarativa.

**Alternatives considered**: Implementar un handle de arrastre manual con listeners de
`pointermove` — reimplementaría algo que la plataforma ya resuelve de forma accesible y
consistente entre navegadores; se descarta por Principio XV (Simplicidad/YAGNI). Librerías de
resize de terceros (`re-resizable`, etc.) — dependencia no justificada para un caso que CSS nativo
ya cubre.

## 3. Personalización visual de la toolbar (theming)

**Decision**: Exponer los valores actualmente hardcodeados del degradado, color de texto/iconos y
fuente de la toolbar como CSS Custom Properties con prefijo `--mdw-toolbar-*`, definidas con sus
valores por defecto en `.toolbar` dentro del CSS Module, sobreescribibles por la aplicación
consumidora mediante selectores CSS estándar (o inline `style` con `className`).

**Rationale**: Confirmado con el usuario como la práctica moderna estándar para theming de
componentes de librería de UI en React (mismo patrón que Radix UI, shadcn/ui, MUI v5+). No agrega
props nuevas a `MarkdownEditorProps` (Principio V: API pública mínima), permite personalización
parcial de forma natural (una variable no definida cae a su valor por defecto vía `var(--x, fallback)`),
y no requiere JavaScript en runtime para aplicarse.

**Alternatives considered**: Prop `theme={{...}}` de objeto — evaluada explícitamente y
descartada por el usuario por agrandar la superficie de la API pública frente al estándar de CSS
Custom Properties.

## 4. Resaltado de sintaxis en bloques de código

**Decision**: `@tiptap/extension-code-block-lowlight` (extensión oficial de Tiptap) sobre
`lowlight` (motor `highlight.js`), registrando únicamente los 5 lenguajes ya soportados por el
selector (`json`, `sql`, `typescript`, `javascript`, `java`) vía `createLowlight().register({...})`
en lugar de `createLowlight(all)`. Para el pipeline de exportación (`markdownToHtml`), se añade
`rehype-highlight` (misma familia `unified`/`rehype` ya usada, construido sobre el mismo `lowlight`)
configurado con la misma lista de lenguajes, insertado entre `rehype-raw` y `rehype-sanitize`.

**Rationale**: `@tiptap/extension-code-block-lowlight` es mantenida por el equipo core de Tiptap y
sustituye en su lugar a la `CodeBlock` de `starter-kit` sin cambiar el modelo de nodo ni el
atributo `language` ya usado (FR-017, FR-020: no altera el Markdown fuente). `rehype-highlight`
reutiliza el mismo motor `lowlight`/`highlight.js` para el HTML exportado, evitando mantener dos
motores de resaltado distintos (una sola dependencia conceptual, cumpliendo Principio VIII).
Lenguajes personalizados no reconocidos ("Otro") se degradan de forma legible: `lowlight.registered(lang)`
se verifica antes de resaltar en el editor (si no está registrado, se omite el resaltado sin
excepción); `rehype-highlight` usa `{ ignoreMissing: true }` para el mismo comportamiento en el
export (FR-018, FR-019).

**Alternatives considered**:
- **Shiki** (vía extensión comunitaria no oficial para Tiptap, o `@shikijs/rehype` para el
  pipeline): motor basado en TextMate grammars + WASM, pensado para build-time/SSG; mayor costo de
  inicialización en runtime interactivo, integración con Tiptap no mantenida por el equipo core, y
  generaría estilos inline en vez de clases reutilizables — dos motores/dos temas a mantener en
  vez de uno. Descartado.
- **CodeMirror/Monaco embebido como nodo de código**: agrega un editor completo dentro del editor,
  bundle desproporcionado para el requisito (solo resaltado visual, sin edición de código
  avanzada). Descartado por Principio XV.
- **`refractor` (Prism) en vez de `highlight.js`** como motor de `lowlight`: técnicamente
  intercambiable, pero no es la ruta que la documentación oficial de Tiptap instala por defecto, y
  no aporta ventaja concreta para los 5 lenguajes objetivo. Descartado para no introducir un
  segundo ecosistema de gramáticas sin beneficio.

**Nota de implementación**: `rehype-sanitize` deberá extender su schema (`defaultSchema`) para
permitir explícitamente el atributo `class` en `code`/`span`, ya que el schema GFM por defecto lo
elimina — de lo contrario el resaltado del HTML exportado se perdería en el paso de sanitización.

## Resumen de dependencias nuevas a introducir

| Dependencia | Propósito | Justificación (Principio VIII) |
|---|---|---|
| `@tiptap/extension-code-block-lowlight` | Reemplaza la `CodeBlock` de starter-kit para habilitar resaltado en el editor | Extensión oficial de Tiptap; no introduce un motor de edición ni modelo de nodo nuevo |
| `lowlight` | Motor de resaltado (highlight.js) usado por la extensión anterior | Requerido por la extensión oficial; se importan solo los 5 lenguajes necesarios (tree-shakeable) |
| `rehype-highlight` | Resaltado del HTML exportado, reutilizando `lowlight` | Misma familia `unified`/`rehype` ya usada por el pipeline; evita un segundo motor de resaltado |

Ninguna dependencia de aplicación (routers, estado global, meta-frameworks) se introduce. No se
agregan dependencias para el modo de solo lectura (usa `editable` nativo de Tiptap) ni para el
redimensionamiento (usa `resize` nativo de CSS) ni para el theming (usa CSS Custom Properties
nativas).

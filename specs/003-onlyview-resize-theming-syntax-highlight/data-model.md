# Data Model: Only-View Mode, Resizable Editor, Toolbar Theming & Code Syntax Highlighting

**Feature**: [spec.md](./spec.md) | **Date**: 2026-09-17

Sin cambios al `MarkdownDocument` ni al `ViewMode` de `001-markdown-editor`. Esta feature añade
únicamente configuración de inicialización (props) y estilo (CSS), sin nuevas entidades de dominio
persistentes.

## Modo de solo lectura (`onlyView`)

| Campo | Tipo | Default | Descripción |
|---|---|---|---|
| `onlyView` | `boolean` | `false` | Determina si el contenido es editable. Se traduce directamente en `editable={!onlyView}` del editor Tiptap y en `readOnly` del `<textarea>` de la vista Markdown. |

No es un objeto de estado propio: es una prop de solo lectura que controla dos flags derivados
(`editable` del editor, `readOnly` del textarea) y una rama de renderizado de la toolbar.

## Preferencia de redimensionamiento (`resizable`)

| Campo | Tipo | Default | Descripción |
|---|---|---|---|
| `resizable` | `boolean` | `true` | Determina si el contenedor raíz aplica `resize: both` (con `overflow: auto` y `min-width`/`min-height`) o `resize: none`. |

El tamaño resultante de un redimensionamiento por arrastre es estado de layout del navegador (no
gestionado por React), efímero por diseño (fuera de alcance persistirlo, según la spec).

## Personalización visual (CSS Custom Properties)

No es un objeto de props — es un contrato de nombres de variables CSS que el componente define con
sus valores por defecto y la aplicación consumidora puede sobreescribir. Cubre tanto la toolbar
(FR-013 a FR-016) como el fondo del área de contenido (extensión no numerada de la misma
capacidad, mismo mecanismo).

| Variable | Valor por defecto | Controla |
|---|---|---|
| `--mdw-toolbar-gradient-from` | `#eeeeee` | Color inicial del degradado de fondo de la toolbar |
| `--mdw-toolbar-gradient-via` | `#dcdcdc` | Color intermedio del degradado (45%) |
| `--mdw-toolbar-gradient-to` | `#cfcfcf` | Color final del degradado |
| `--mdw-toolbar-fg` | `#222222` | Color de texto e iconos de la toolbar |
| `--mdw-toolbar-font-family` | `Arial, sans-serif` | Fuente tipográfica de la toolbar |
| `--mdw-content-bg` | `var(--mdw-bg)` (blanco) | Fondo del área de contenido editable (ambas vistas). Acepta cualquier valor válido del shorthand `background` (color sólido, degradado, o imagen con capas/transparencia) |

Cada variable no sobreescrita conserva su valor por defecto de forma independiente (FR-016), al
declararse en el propio CSS Module mediante `var(--mdw-toolbar-x, <default>)` o definiendo el
default directamente en `:root`/`.root` y dejando que la app la sobreescriba en un selector más
específico. `--mdw-content-bg` sigue el mismo patrón: se aplica como `background: var(--mdw-content-bg)`
sobre el contenedor de contenido (no sobre `.root`), por lo que no interfiere con el color de fondo
general del contenedor raíz/borde.

## Lenguaje de bloque de código → esquema de resaltado

Reutiliza la entidad "Lenguaje de bloque de código" de `002-toolbar-redesign-insert-pickers` sin
cambios de forma; esta feature solo añade una función derivada:

| Entrada | Salida |
|---|---|
| `language` registrado en `lowlight` (json, sql, typescript, javascript, java) | Tokens de sintaxis coloreados vía clases `hljs-*` |
| `language` no registrado (valor libre de "Otro") | Sin resaltado (texto plano legible), sin error |
| Sin `language` asignado | Sin resaltado (comportamiento idéntico a antes de esta feature) |

# Cómo implementar estilos en tu host

Guía completa para darle a `mdwysiwyg` el aspecto de tu producto con CSS estándar: tema oscuro, colores de marca,
otras fuentes, una barra plana… sin props de estilo, sin `!important` y sin depender del orden en que cargues las hojas.

> Probalo en vivo: el [playground](https://ferkiernan.github.io/mdwysiwyg/) tiene un panel de tema que genera el CSS
> final listo para copiar.

## 1. En 30 segundos

```tsx
import { MarkdownEditor } from "mdwysiwyg";
import "mdwysiwyg/styles.css"; // obligatorio: los estilos del control

<MarkdownEditor className="mi-editor" />;
```

```css
/* tu CSS, en cualquier orden respecto de mdwysiwyg/styles.css */
.mi-editor {
  --mdw-bg: #0b1220;
  --mdw-fg: #e5e7eb;
  --mdw-border: #334155;
}
```

Eso es todo: el control **lee** variables CSS `--mdw-*`. Vos las declarás; todo lo que no declares conserva su valor
por defecto.

## 2. Cómo funciona (y por qué siempre gana tu valor)

- El control **nunca declara** las variables públicas `--mdw-*`. Internamente usa tokens privados
  (`--_mdw-*`) definidos como `var(--mdw-x, <default>)`: si vos declarás `--mdw-x`, se usa tu valor; si no, el default.
- Por eso tu declaración funciona **cargue antes o después** que `mdwysiwyg/styles.css`, con un selector común y sin
  `!important`.
- Las variables CSS se heredan: podés declararlas en la clase del control **o en cualquier ancestro**.

### Dónde declararlas

| Querés tematizar… | Declarala en… | Ejemplo |
| --- | --- | --- |
| Un control concreto | la clase que pasás en `className` | `.mi-editor { … }` + `<MarkdownEditor className="mi-editor" />` |
| Todos los controles de una sección | un contenedor | `.panel-de-notas { … }` y los controles dentro de `<div class="panel-de-notas">` |
| Todos los controles de la página | la raíz | `:root { … }` |

### Prioridad

**Clase del control > ancestro más cercano > default del control.** Es la herencia normal de CSS: la declaración más
cercana al control gana.

```css
:root        { --mdw-accent: #7c3aed; }   /* toda la app */
.panel-notas { --mdw-accent: #059669; }   /* esta sección */
.mi-editor   { --mdw-accent: #dc2626; }   /* este control: gana */
```

Los menús, diálogos y popovers del control se muestran fuera de él (en `document.body`); al abrirse copian los valores
que hayas declarado en cualquiera de los tres niveles, así que también se tematizan.

## 3. Todas las variables

Las variables derivadas (por ejemplo `--mdw-content-bg`, cuyo default es `var(--mdw-bg)`) siguen a su base mientras no
las declares: cambiando `--mdw-bg` cambian también el contenido y los paneles flotantes.

### Colores base

| Variable | Default | Tipo de valor | Controla |
| --- | --- | --- | --- |
| `--mdw-border` | `#d0d4da` | color | Bordes del componente, tablas y paneles |
| `--mdw-bg` | `#ffffff` | color | Fondo del componente; base del fondo del contenido y de los paneles flotantes |
| `--mdw-fg` | `#1f2328` | color | Color de texto; base del texto del contenido |
| `--mdw-muted` | `#f6f7f9` | color | Fondos suaves: encabezados de tabla, código, Mermaid, lista de versiones |
| `--mdw-accent` | `#3d6fd8` | color | Anillos de foco y estados seleccionados |

### Barra de herramientas

| Variable | Default | Tipo de valor | Controla |
| --- | --- | --- | --- |
| `--mdw-toolbar-gradient-from` | `#eeeeee` | color | Color inicial del degradado de la barra |
| `--mdw-toolbar-gradient-via` | `#dcdcdc` | color | Color intermedio del degradado |
| `--mdw-toolbar-gradient-to` | `#cfcfcf` | color | Color final del degradado |
| `--mdw-toolbar-fg` | `#222222` | color | Texto e iconos de la barra |
| `--mdw-toolbar-font-family` | `Arial, sans-serif` | `font-family` | Fuente de la barra |
| `--mdw-toolbar-select-bg` | `#e9e9e9` | color | Fondo del selector de encabezado |
| `--mdw-button-active-bg` | `#c8c8c8` | color | Fondo de un botón presionado o activo |
| `--mdw-button-hover-gradient-from` | `#ffffff` | color | Degradado de un botón en hover (inicio) |
| `--mdw-button-hover-gradient-to` | `#d8d8d8` | color | Degradado de un botón en hover (fin) |

### Área de contenido

| Variable | Default | Tipo de valor | Controla |
| --- | --- | --- | --- |
| `--mdw-content-bg` | `var(--mdw-bg)` | `background` (color, degradado, imagen) | Fondo del área de contenido (color, degradado o imagen) |
| `--mdw-content-wysiwyg-fg` | `var(--mdw-fg)` | color | Texto de la vista renderizada |
| `--mdw-content-wysiwyg-font-family` | `inherit` | `font-family` | Fuente de la vista renderizada |
| `--mdw-content-markdown-fg` | `var(--mdw-fg)` | color | Texto de la vista Markdown |
| `--mdw-content-markdown-font-family` | `ui-monospace, Consolas, monospace` | `font-family` | Fuente de la vista Markdown |

### Tablas, código y diagramas

| Variable | Default | Tipo de valor | Controla |
| --- | --- | --- | --- |
| `--mdw-table-header-bg` | `var(--mdw-muted)` | color | Fondo de los encabezados de tabla |
| `--mdw-table-menu-trigger-color` | `var(--mdw-scrollbar-thumb)` | color | Triángulo que abre el menú de columna/fila |
| `--mdw-table-menu-trigger-size` | `0.7em` | longitud | Tamaño del triángulo del menú de tabla |
| `--mdw-table-picker-selected-bg` | `#dbe4f8` | color | Celdas seleccionadas al elegir el tamaño de una tabla |
| `--mdw-code-block-bg` | `var(--mdw-muted)` | color | Fondo de los bloques de código |
| `--mdw-mermaid-bg` | `var(--mdw-muted)` | color | Fondo de los diagramas Mermaid |

### Resaltado de sintaxis

| Variable | Default | Tipo de valor | Controla |
| --- | --- | --- | --- |
| `--mdw-code-keyword` | `#a626a4` | color | Palabras clave, etiquetas y literales |
| `--mdw-code-string` | `#50a14f` | color | Cadenas y atributos |
| `--mdw-code-comment` | `#a0a1a7` | color | Comentarios |
| `--mdw-code-number` | `#986801` | color | Números y funciones integradas |
| `--mdw-code-title` | `#4078f2` | color | Títulos y nombres de función o clase |

### Área de contenido

| Variable | Default | Tipo de valor | Controla |
| --- | --- | --- | --- |
| `--mdw-link-fg` | `#0000ee` | color | Enlaces de la vista renderizada (el azul por defecto del navegador) |
| `--mdw-link-visited-fg` | `#551a8b` | color | Enlaces ya visitados |

### Citas

| Variable | Default | Tipo de valor | Controla |
| --- | --- | --- | --- |
| `--mdw-blockquote-fg` | `#57606a` | color | Texto de las citas |
| `--mdw-blockquote-border` | `var(--mdw-border)` | color | Línea izquierda de las citas |

### Botones y controles

| Variable | Default | Tipo de valor | Controla |
| --- | --- | --- | --- |
| `--mdw-control-border` | `#999` | color | Bordes de botones, selectores, barras y celdas del selector de tabla |
| `--mdw-control-highlight` | `#fff` | color | Borde claro interior de botones y barras |
| `--mdw-control-shadow` | `rgba(0, 0, 0, 0.15)` | color | Sombra de botones y de la barra |
| `--mdw-control-pressed-shadow` | `rgba(0, 0, 0, 0.25)` | color | Sombra interior de un botón presionado |
| `--mdw-separator-color` | `#aaa` | color | Separadores de la barra |

### Menús, diálogos y popovers

| Variable | Default | Tipo de valor | Controla |
| --- | --- | --- | --- |
| `--mdw-popover-bg` | `var(--mdw-bg)` | color | Fondo de menús, diálogos y popovers |
| `--mdw-popover-shadow` | `0 4px 12px rgba(0, 0, 0, 0.12)` | `box-shadow` | Sombra de los paneles flotantes |
| `--mdw-menu-hover-bg` | `#e4e7eb` | color | Fondo de un elemento de menú en hover o foco |
| `--mdw-danger-fg` | `#b42318` | color | Acciones destructivas (eliminar fila/columna, quitar enlace) |
| `--mdw-danger-hover-fg` | `#8c1c11` | color | Acciones destructivas en hover o foco |

### Comparación

| Variable | Default | Tipo de valor | Controla |
| --- | --- | --- | --- |
| `--mdw-compare-highlight-bg` | `#fff176` | color | Resaltado de diferencias en modo comparación |

### Barras de desplazamiento

| Variable | Default | Tipo de valor | Controla |
| --- | --- | --- | --- |
| `--mdw-scrollbar-thumb` | `#c1c1c1` | color | Pulgar de las barras de desplazamiento |
| `--mdw-scrollbar-track` | `transparent` | color | Riel de las barras de desplazamiento |

## 4. Recetas

Copiá la que quieras tal cual; cambiá `.mi-editor` por `:root` o por un contenedor según el alcance (sección 2).

### Tema oscuro

```css
.mi-editor {
  --mdw-bg: #0b1220;
  --mdw-fg: #e5e7eb;
  --mdw-muted: #111a2e;
  --mdw-border: #334155;
  --mdw-accent: #60a5fa;

  --mdw-toolbar-gradient-from: #1e293b;
  --mdw-toolbar-gradient-via: #172033;
  --mdw-toolbar-gradient-to: #0f172a;
  --mdw-toolbar-fg: #f8fafc;
  --mdw-toolbar-select-bg: #1e293b;
  --mdw-button-active-bg: #334155;
  --mdw-button-hover-gradient-from: #334155;
  --mdw-button-hover-gradient-to: #1e293b;

  --mdw-control-border: #475569;
  --mdw-control-highlight: rgba(255, 255, 255, 0.06);
  --mdw-control-shadow: rgba(0, 0, 0, 0.5);
  --mdw-control-pressed-shadow: rgba(0, 0, 0, 0.6);
  --mdw-separator-color: #475569;

  --mdw-code-keyword: #c792ea;
  --mdw-code-string: #c3e88d;
  --mdw-code-comment: #7f8ea3;
  --mdw-code-number: #f78c6c;
  --mdw-code-title: #82aaff;
  --mdw-blockquote-fg: #94a3b8;
  --mdw-link-fg: #93c5fd;
  --mdw-link-visited-fg: #c4b5fd;

  --mdw-menu-hover-bg: #1e293b;
  --mdw-popover-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  --mdw-danger-fg: #f87171;
  --mdw-danger-hover-fg: #fca5a5;
  --mdw-table-picker-selected-bg: #1e3a8a;
  --mdw-compare-highlight-bg: #854d0e;

  --mdw-scrollbar-thumb: #475569;
}
```

### Seguir la preferencia clara/oscura del sistema

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* pegá aquí las variables del tema oscuro */
  }
}
```

### Interruptor claro/oscuro de la página

```css
[data-theme="dark"] {
  /* pegá aquí las variables del tema oscuro */
}
```

```ts
document.documentElement.dataset.theme = oscuro ? "dark" : "light";
```

### Color de marca

```css
.mi-editor {
  --mdw-accent: #7c3aed;
  --mdw-toolbar-gradient-from: #f5f3ff;
  --mdw-toolbar-gradient-via: #ede9fe;
  --mdw-toolbar-gradient-to: #ddd6fe;
  --mdw-toolbar-fg: #4c1d95;
  --mdw-button-active-bg: #c4b5fd;
  --mdw-table-picker-selected-bg: #ddd6fe;
}
```

### Otras fuentes

```css
.mi-editor {
  --mdw-toolbar-font-family: "Inter", system-ui, sans-serif;
  --mdw-content-wysiwyg-font-family: "Georgia", serif;
  --mdw-content-markdown-font-family: "JetBrains Mono", ui-monospace, monospace;
}
```

### Barra plana (sin degradado)

```css
.mi-editor {
  --mdw-toolbar-gradient-from: #f3f4f6;
  --mdw-toolbar-gradient-via: #f3f4f6;
  --mdw-toolbar-gradient-to: #f3f4f6;
  --mdw-button-hover-gradient-from: #e5e7eb;
  --mdw-button-hover-gradient-to: #e5e7eb;
  --mdw-control-highlight: transparent;
  --mdw-control-shadow: transparent;
}
```

### Fondo tintado o con imagen

```css
.mi-editor {
  --mdw-content-bg: #fffbeb;
}

.mi-editor-con-marca-de-agua {
  --mdw-content-bg:
    url("/marca-de-agua.png") center / 200px no-repeat,
    #ffffff;
}
```

`--mdw-content-bg` se aplica como `background`, así que admite el shorthand completo (color, degradados, imágenes en
capas).

## 5. Con tu estrategia de CSS

- **CSS / Sass / CSS Modules**: declará las variables en una clase y pasala en `className` (con CSS Modules,
  `className={styles.editor}`).
- **CSS-in-JS** (styled-components, Emotion…): generá una clase con las variables y pasala en `className`, o
  declaralas en un contenedor.
- **Tailwind / clases utilitarias**: usá valores arbitrarios en un contenedor o en la clase,
  p. ej. `className="[--mdw-accent:#7c3aed]"`.
- **Capas (`@layer`) o design systems**: funcionan igual: el control no declara las variables públicas, así que
  cualquier capa tuya gana.
- **Shadow DOM / iframes**: las variables no cruzan esos límites; declaralas dentro del mismo subárbol que el control.

## 6. Qué está soportado y qué no

- **Soportado**: las variables de la sección 3 y la clase de `className`. Son la interfaz pública de estilos: no se
  quitan ni se renombran sin aviso en el CHANGELOG.
- **No soportado**: apuntar a las clases internas del control (`.toolbar`, `.content`…). Se generan con CSS Modules,
  cambian de nombre entre versiones y pueden romperse sin aviso.
- **¿Necesitás algo que no está?** Abrí un issue en el repositorio describiendo qué querés cambiar; se puede añadir
  una variable nueva.

## 7. Si algo no se aplica

| Síntoma | Causa habitual | Cómo comprobarlo |
| --- | --- | --- |
| Nada tiene estilo | No importaste `mdwysiwyg/styles.css` | En DevTools, el elemento raíz del control no tiene `display: flex` ni borde |
| Tu clase no hace nada | La clase no llegó al control | Inspeccioná el elemento raíz: debe tener tu clase además de la suya |
| Una variable no cambia | Nombre mal escrito | En *Computed* filtrá por `--mdw-`: aparece tu variable con tu valor |
| Una variable no cambia | Otra regla más específica o más cercana la redefine | En *Styles*, la declaración tachada indica cuál gana |
| El color queda transparente o raro | Valor inválido para esa propiedad | Un valor inválido no vuelve al default: anula la propiedad. Revisá la unidad o el formato |
| Menús o diálogos sin tu tema | Declaraste las variables en un elemento que no es ancestro del control | Declaralas en la clase del control, en un ancestro o en `:root` |

## 8. Impresión y alto contraste

- **Impresión**: se imprimen los mismos colores; si querés otros, redefiní las variables dentro de `@media print`.
- **Modo de colores forzados** (Windows alto contraste): el navegador reemplaza los colores del sistema y las
  variables de color no se aplican; los bordes y el foco siguen visibles.

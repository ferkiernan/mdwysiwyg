/**
 * Lista de los puntos de personalización públicos (CSS custom properties) del
 * componente. Es la fuente única para la copia del tema a los paneles
 * flotantes, el panel de tema del playground y las comprobaciones de la
 * documentación (`scripts/check-docs.mjs`). Debe coincidir con los tokens
 * privados `--_mdw-*` de `MarkdownEditor.module.css` y con `docs/THEMING.md`.
 */

export type ThemeTokenGroup =
  | "base"
  | "toolbar"
  | "content"
  | "tables-code"
  | "syntax"
  | "quote"
  | "controls"
  | "floating"
  | "compare"
  | "scroll";

/** Tipo de valor que acepta el token (para validar y elegir el control de edición). */
export type ThemeTokenKind = "color" | "background" | "font" | "shadow" | "length";

export interface ThemeToken {
  name: `--mdw-${string}`;
  group: ThemeTokenGroup;
  kind: ThemeTokenKind;
  /** Valor por defecto tal como lo aplica el componente (con referencias públicas). */
  default: string;
  /** Qué controla (español). */
  description: string;
}

export const THEME_TOKEN_GROUP_LABELS: Record<ThemeTokenGroup, string> = {
  base: "Colores base",
  toolbar: "Barra de herramientas",
  content: "Área de contenido",
  "tables-code": "Tablas, código y diagramas",
  syntax: "Resaltado de sintaxis",
  quote: "Citas",
  controls: "Botones y controles",
  floating: "Menús, diálogos y popovers",
  compare: "Comparación",
  scroll: "Barras de desplazamiento",
};

export const THEME_TOKENS: readonly ThemeToken[] = [
  { name: "--mdw-border", group: "base", kind: "color", default: "#d0d4da", description: "Bordes del componente, tablas y paneles" },
  { name: "--mdw-bg", group: "base", kind: "color", default: "#ffffff", description: "Fondo del componente; base del fondo del contenido y de los paneles flotantes" },
  { name: "--mdw-fg", group: "base", kind: "color", default: "#1f2328", description: "Color de texto; base del texto del contenido" },
  { name: "--mdw-muted", group: "base", kind: "color", default: "#f6f7f9", description: "Fondos suaves: encabezados de tabla, código, Mermaid, lista de versiones" },
  { name: "--mdw-accent", group: "base", kind: "color", default: "#3d6fd8", description: "Anillos de foco y estados seleccionados" },

  { name: "--mdw-toolbar-gradient-from", group: "toolbar", kind: "color", default: "#eeeeee", description: "Color inicial del degradado de la barra" },
  { name: "--mdw-toolbar-gradient-via", group: "toolbar", kind: "color", default: "#dcdcdc", description: "Color intermedio del degradado" },
  { name: "--mdw-toolbar-gradient-to", group: "toolbar", kind: "color", default: "#cfcfcf", description: "Color final del degradado" },
  { name: "--mdw-toolbar-fg", group: "toolbar", kind: "color", default: "#222222", description: "Texto e iconos de la barra" },
  { name: "--mdw-toolbar-font-family", group: "toolbar", kind: "font", default: "Arial, sans-serif", description: "Fuente de la barra" },
  { name: "--mdw-toolbar-select-bg", group: "toolbar", kind: "color", default: "#e9e9e9", description: "Fondo del selector de encabezado" },
  { name: "--mdw-button-active-bg", group: "toolbar", kind: "color", default: "#c8c8c8", description: "Fondo de un botón presionado o activo" },
  { name: "--mdw-button-hover-gradient-from", group: "toolbar", kind: "color", default: "#ffffff", description: "Degradado de un botón en hover (inicio)" },
  { name: "--mdw-button-hover-gradient-to", group: "toolbar", kind: "color", default: "#d8d8d8", description: "Degradado de un botón en hover (fin)" },

  { name: "--mdw-content-bg", group: "content", kind: "background", default: "var(--mdw-bg)", description: "Fondo del área de contenido (color, degradado o imagen)" },
  { name: "--mdw-content-wysiwyg-fg", group: "content", kind: "color", default: "var(--mdw-fg)", description: "Texto de la vista renderizada" },
  { name: "--mdw-content-wysiwyg-font-family", group: "content", kind: "font", default: "inherit", description: "Fuente de la vista renderizada" },
  { name: "--mdw-content-markdown-fg", group: "content", kind: "color", default: "var(--mdw-fg)", description: "Texto de la vista Markdown" },
  { name: "--mdw-content-markdown-font-family", group: "content", kind: "font", default: "ui-monospace, Consolas, monospace", description: "Fuente de la vista Markdown" },

  { name: "--mdw-table-header-bg", group: "tables-code", kind: "color", default: "var(--mdw-muted)", description: "Fondo de los encabezados de tabla" },
  { name: "--mdw-table-menu-trigger-color", group: "tables-code", kind: "color", default: "var(--mdw-scrollbar-thumb)", description: "Triángulo que abre el menú de columna/fila" },
  { name: "--mdw-table-menu-trigger-size", group: "tables-code", kind: "length", default: "0.7em", description: "Tamaño del triángulo del menú de tabla" },
  { name: "--mdw-table-picker-selected-bg", group: "tables-code", kind: "color", default: "#dbe4f8", description: "Celdas seleccionadas al elegir el tamaño de una tabla" },
  { name: "--mdw-code-block-bg", group: "tables-code", kind: "color", default: "var(--mdw-muted)", description: "Fondo de los bloques de código" },
  { name: "--mdw-mermaid-bg", group: "tables-code", kind: "color", default: "var(--mdw-muted)", description: "Fondo de los diagramas Mermaid" },

  { name: "--mdw-code-keyword", group: "syntax", kind: "color", default: "#a626a4", description: "Palabras clave, etiquetas y literales" },
  { name: "--mdw-code-string", group: "syntax", kind: "color", default: "#50a14f", description: "Cadenas y atributos" },
  { name: "--mdw-code-comment", group: "syntax", kind: "color", default: "#a0a1a7", description: "Comentarios" },
  { name: "--mdw-code-number", group: "syntax", kind: "color", default: "#986801", description: "Números y funciones integradas" },
  { name: "--mdw-code-title", group: "syntax", kind: "color", default: "#4078f2", description: "Títulos y nombres de función o clase" },

  { name: "--mdw-link-fg", group: "content", kind: "color", default: "#0000ee", description: "Enlaces de la vista renderizada (el azul por defecto del navegador)" },
  { name: "--mdw-link-visited-fg", group: "content", kind: "color", default: "#551a8b", description: "Enlaces ya visitados" },

  { name: "--mdw-blockquote-fg", group: "quote", kind: "color", default: "#57606a", description: "Texto de las citas" },
  { name: "--mdw-blockquote-border", group: "quote", kind: "color", default: "var(--mdw-border)", description: "Línea izquierda de las citas" },

  { name: "--mdw-control-border", group: "controls", kind: "color", default: "#999", description: "Bordes de botones, selectores, barras y celdas del selector de tabla" },
  { name: "--mdw-control-highlight", group: "controls", kind: "color", default: "#fff", description: "Borde claro interior de botones y barras" },
  { name: "--mdw-control-shadow", group: "controls", kind: "color", default: "rgba(0, 0, 0, 0.15)", description: "Sombra de botones y de la barra" },
  { name: "--mdw-control-pressed-shadow", group: "controls", kind: "color", default: "rgba(0, 0, 0, 0.25)", description: "Sombra interior de un botón presionado" },
  { name: "--mdw-separator-color", group: "controls", kind: "color", default: "#aaa", description: "Separadores de la barra" },

  { name: "--mdw-popover-bg", group: "floating", kind: "color", default: "var(--mdw-bg)", description: "Fondo de menús, diálogos y popovers" },
  { name: "--mdw-popover-shadow", group: "floating", kind: "shadow", default: "0 4px 12px rgba(0, 0, 0, 0.12)", description: "Sombra de los paneles flotantes" },
  { name: "--mdw-menu-hover-bg", group: "floating", kind: "color", default: "#e4e7eb", description: "Fondo de un elemento de menú en hover o foco" },
  { name: "--mdw-danger-fg", group: "floating", kind: "color", default: "#b42318", description: "Acciones destructivas (eliminar fila/columna, quitar enlace)" },
  { name: "--mdw-danger-hover-fg", group: "floating", kind: "color", default: "#8c1c11", description: "Acciones destructivas en hover o foco" },

  { name: "--mdw-compare-highlight-bg", group: "compare", kind: "color", default: "#fff176", description: "Resaltado de diferencias en modo comparación" },

  { name: "--mdw-scrollbar-thumb", group: "scroll", kind: "color", default: "#c1c1c1", description: "Pulgar de las barras de desplazamiento" },
  { name: "--mdw-scrollbar-track", group: "scroll", kind: "color", default: "transparent", description: "Riel de las barras de desplazamiento" },
];

/**
 * Copia en `target` (inline) los valores públicos que el host haya declarado
 * para `source` (en su clase o en un ancestro). Se usa en los paneles
 * flotantes, que se renderizan en `document.body` y no heredan del componente.
 */
export function copyThemeTokens(source: Element, target: HTMLElement): void {
  const view = source.ownerDocument.defaultView;
  if (view === null) return;
  const computed = view.getComputedStyle(source);
  for (const token of THEME_TOKENS) {
    const value = computed.getPropertyValue(token.name).trim();
    if (value === "") target.style.removeProperty(token.name);
    else target.style.setProperty(token.name, value);
  }
}

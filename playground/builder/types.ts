/** Atributo de `<MarkdownEditor>` tal como lo describe `generated/attributes.json`. */
export interface AttributeSpec {
  name: string;
  kind: "switch" | "options" | "size" | "text" | "function";
  options?: string[];
  default: boolean | string | number | null;
  summary: string;
}

/** Valor elegido para un atributo; las funciones se marcan con `true` (incluir marcador). */
export type AttributeValue = boolean | string | number;
export type AttributeChoices = Record<string, AttributeValue>;

export type AttributesFormat = "jsx" | "object";

export type ThemeScope = "control" | "section" | "page";

export interface ThemeChoices {
  preset: string;
  /** Valores de las variables `--mdw-*` (sobre el preset). */
  values: Record<string, string>;
  /** Variante oscura para `prefers-color-scheme: dark`, o `null`. */
  darkValues: Record<string, string> | null;
  scope: ThemeScope;
  /** Clase del control (alcance "control") o del contenedor (alcance "section"). */
  className: string;
  includeAll: boolean;
}

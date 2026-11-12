import type {
  AttributeChoices,
  AttributeSpec,
  AttributeValue,
  AttributesFormat,
  ThemeChoices,
} from "./types";
import { THEME_TOKENS } from "../../src/components/MarkdownEditor/theme/themeTokens";

export const GUIDE_URL =
  "https://github.com/ferkiernan/mdwysiwyg/blob/master/docs/THEMING.md";

const PLACEHOLDERS: Record<string, string> = {
  onChange: "(markdown) => { /* TODO: tu código */ }",
  onCompareDecision: "({ decision, markdown }) => { /* TODO: tu código */ }",
  resolveImageSrc: "(src) => src /* TODO: tu código */",
};

/** Atributos con valor distinto del default, en el orden de `specs`. */
export function changedAttributes(
  specs: readonly AttributeSpec[],
  choices: AttributeChoices,
): Array<[AttributeSpec, AttributeValue]> {
  const result: Array<[AttributeSpec, AttributeValue]> = [];
  for (const spec of specs) {
    const value = choices[spec.name];
    if (value === undefined) continue;
    if (spec.kind === "function") {
      if (value === true) result.push([spec, value]);
      continue;
    }
    if (value === "" && spec.default === null) continue;
    if (value === spec.default) continue;
    result.push([spec, value]);
  }
  return result;
}

function jsxValue(spec: AttributeSpec, value: AttributeValue): string {
  if (spec.kind === "function") return `{${PLACEHOLDERS[spec.name] ?? "() => {}"}}`;
  if (typeof value === "number") return `{${value}}`;
  if (typeof value === "boolean") return `{${value}}`;
  const safe = !/["{}\n\\<>]/.test(value);
  return safe ? `"${value}"` : `{${JSON.stringify(value)}}`;
}

function objectValue(spec: AttributeSpec, value: AttributeValue): string {
  if (spec.kind === "function") return PLACEHOLDERS[spec.name] ?? "() => {}";
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

/** Valor de tamaño: los números (o cadenas numéricas) se emiten como número. */
function normalize(spec: AttributeSpec, value: AttributeValue): AttributeValue {
  if (spec.kind === "size" && typeof value === "string" && /^\d+(\.\d+)?$/.test(value.trim())) {
    return Number(value.trim());
  }
  return value;
}

/** Fragmento listo para pegar en el host: JSX o un objeto de props. */
export function buildAttributesSnippet(
  specs: readonly AttributeSpec[],
  choices: AttributeChoices,
  format: AttributesFormat,
  className: string | null,
): string {
  const entries = changedAttributes(specs, choices).map(
    ([spec, value]) => [spec, normalize(spec, value)] as const,
  );
  if (format === "object") {
    const lines = [
      ...(className !== null ? [`  className: ${JSON.stringify(className)},`] : []),
      ...entries.map(([spec, value]) => `  ${spec.name}: ${objectValue(spec, value)},`),
    ];
    return [
      'import type { MarkdownEditorProps } from "mdwysiwyg";',
      "",
      lines.length === 0
        ? "const editorProps: MarkdownEditorProps = {};"
        : `const editorProps: MarkdownEditorProps = {\n${lines.join("\n")}\n};`,
      "",
      "// <MarkdownEditor {...editorProps} />",
    ].join("\n");
  }
  const props = [
    ...(className !== null ? [`  className="${className}"`] : []),
    ...entries.map(([spec, value]) =>
      spec.kind === "switch" && value === true ? `  ${spec.name}` : `  ${spec.name}=${jsxValue(spec, value)}`,
    ),
  ];
  return props.length === 0 ? "<MarkdownEditor />" : `<MarkdownEditor\n${props.join("\n")}\n/>`;
}

/** Selector CSS del alcance elegido. */
export function scopeSelector(theme: Pick<ThemeChoices, "scope" | "className">): string {
  if (theme.scope === "page") return ":root";
  return `.${theme.className}`;
}

function declarations(values: Record<string, string>, indent: string): string[] {
  const order = THEME_TOKENS.map((token) => token.name);
  return Object.entries(values)
    .sort(([a], [b]) => order.indexOf(a as never) - order.indexOf(b as never))
    .map(([name, value]) => `${indent}${name}: ${value};`);
}

/** Valores a emitir: los distintos del default (o todos con `includeAll`). */
export function themeValuesToEmit(
  values: Record<string, string>,
  includeAll: boolean,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const token of THEME_TOKENS) {
    const value = values[token.name]?.trim();
    if (value === undefined || value === "") {
      if (includeAll) result[token.name] = token.default;
      continue;
    }
    if (includeAll || value !== token.default) result[token.name] = value;
  }
  return result;
}

function instructions(theme: ThemeChoices): string[] {
  const where =
    theme.scope === "control"
      ? `Poné className="${theme.className}" en <MarkdownEditor>.`
      : theme.scope === "section"
        ? `Envolvé los controles en un elemento con class="${theme.className}".`
        : "Se aplica a todos los controles de la página.";
  return [
    "/* mdwysiwyg — tema generado en el playground",
    '   1. Importá los estilos del control: import "mdwysiwyg/styles.css";',
    `   2. ${where}`,
    "   Funciona cargado antes o después de los estilos del control, sin !important.",
    `   Guía: ${GUIDE_URL} */`,
  ];
}

/**
 * CSS final del tema: instrucciones, valores bajo el selector del alcance y,
 * opcionalmente, la variante oscura. `invalid` lista variables omitidas.
 */
export function buildThemeCss(
  theme: ThemeChoices,
  invalid: ReadonlySet<string> = new Set(),
): string {
  const selector = scopeSelector(theme);
  const clean = (values: Record<string, string>) =>
    Object.fromEntries(Object.entries(values).filter(([name]) => !invalid.has(name)));
  const main = themeValuesToEmit(clean(theme.values), theme.includeAll);
  const out = [...instructions(theme)];
  for (const name of invalid) out.push(`/* ${name}: valor inválido omitido */`);
  const body = declarations(main, "  ");
  out.push(
    body.length === 0
      ? `${selector} {\n  /* sin cambios: se usan los valores por defecto */\n}`
      : `${selector} {\n${body.join("\n")}\n}`,
  );
  if (theme.darkValues !== null) {
    const dark = declarations(themeValuesToEmit(clean(theme.darkValues), false), "    ");
    if (dark.length > 0) {
      out.push(
        `@media (prefers-color-scheme: dark) {\n  ${selector} {\n${dark.join("\n")}\n  }\n}`,
      );
    }
  }
  return out.join("\n");
}

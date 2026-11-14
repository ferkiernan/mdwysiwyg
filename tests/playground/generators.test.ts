import { describe, it, expect } from "vitest";
import {
  buildAttributesSnippet,
  buildThemeCss,
  changedAttributes,
  themeValuesToEmit,
} from "../../playground/builder/generators";
import { dependencyNotes, isValidClassName, isValidCssValue } from "../../playground/builder/validation";
import type { AttributeSpec, ThemeChoices } from "../../playground/builder/types";
import { generate } from "../../scripts/gen-playground-attributes.mjs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SPECS: AttributeSpec[] = [
  { name: "onChange", kind: "function", default: null, summary: "" },
  { name: "height", kind: "size", default: 500, summary: "" },
  { name: "onlyView", kind: "switch", default: false, summary: "" },
  { name: "showToolbar", kind: "switch", default: true, summary: "" },
  { name: "onlyViewNotice", kind: "text", default: "Edición desactivada", summary: "" },
  { name: "mode", kind: "options", options: ["default", "compare"], default: "default", summary: "" },
];

const THEME: ThemeChoices = {
  preset: "default",
  values: {},
  darkValues: null,
  scope: "control",
  className: "mi-editor",
  includeAll: false,
};

describe("atributos copiados", () => {
  it("solo incluye valores distintos del default", () => {
    const changed = changedAttributes(SPECS, { height: 500, onlyView: true, mode: "default" });
    expect(changed.map(([spec]) => spec.name)).toEqual(["onlyView"]);
  });

  it("JSX: booleanos verdaderos sin valor, falsos explícitos, números entre llaves, marcadores de funciones", () => {
    const jsx = buildAttributesSnippet(
      SPECS,
      { onChange: true, height: "400", onlyView: true, showToolbar: false, onlyViewNotice: 'Dice "hola"' },
      "jsx",
      "mi-editor",
    );
    expect(jsx).toBe(
      [
        "<MarkdownEditor",
        '  className="mi-editor"',
        "  onChange={(markdown) => { /* TODO: tu código */ }}",
        "  height={400}",
        "  onlyView",
        "  showToolbar={false}",
        '  onlyViewNotice={"Dice \\"hola\\""}',
        "/>",
      ].join("\n"),
    );
  });

  it("objeto de props con los mismos valores", () => {
    const object = buildAttributesSnippet(SPECS, { height: "40rem", onlyView: true }, "object", null);
    expect(object).toContain('const editorProps: MarkdownEditorProps = {\n  height: "40rem",\n  onlyView: true,\n};');
    expect(object).toContain("<MarkdownEditor {...editorProps} />");
  });

  it("sin cambios devuelve el uso mínimo", () => {
    expect(buildAttributesSnippet(SPECS, {}, "jsx", null)).toBe("<MarkdownEditor />");
  });
});

describe("CSS final", () => {
  it("solo los valores cambiados, bajo la clase del control, con instrucciones y sin !important", () => {
    const css = buildThemeCss({ ...THEME, values: { "--mdw-fg": "#111111", "--mdw-bg": "#ffffff" } });
    expect(css).toContain('import "mdwysiwyg/styles.css"');
    expect(css).toContain('className="mi-editor"');
    expect(css).toContain(".mi-editor {\n  --mdw-fg: #111111;\n}");
    expect(css).not.toContain("--mdw-bg:");
    expect(css).not.toMatch(/--mdw-[a-z-]+:[^;]*!important/);
  });

  it("alcance sección y página", () => {
    expect(buildThemeCss({ ...THEME, scope: "section", className: "notas", values: { "--mdw-fg": "#000" } })).toContain(
      ".notas {",
    );
    expect(buildThemeCss({ ...THEME, scope: "page", values: { "--mdw-fg": "#000" } })).toContain(":root {");
  });

  it("variante oscura y valores inválidos omitidos con comentario", () => {
    const css = buildThemeCss(
      { ...THEME, values: { "--mdw-fg": "#000", "--mdw-bg": "rojo" }, darkValues: { "--mdw-fg": "#fff" } },
      new Set(["--mdw-bg"]),
    );
    expect(css).toContain("/* --mdw-bg: valor inválido omitido */");
    expect(css).toContain("@media (prefers-color-scheme: dark) {\n  .mi-editor {\n    --mdw-fg: #fff;\n  }\n}");
  });

  it("incluir todo emite los 48 tokens", () => {
    expect(Object.keys(themeValuesToEmit({}, true))).toHaveLength(48);
  });
});

describe("validación y dependencias", () => {
  it("clases y valores", () => {
    expect(isValidClassName("mi-editor")).toBe(true);
    expect(isValidClassName("1mal")).toBe(false);
    expect(isValidCssValue("color", "")).toBe(false);
    expect(isValidCssValue("color", "red; x")).toBe(false);
    expect(isValidCssValue("color", "var(--mdw-fg)")).toBe(true);
  });

  it("avisa de dependencias entre atributos", () => {
    const notes = dependencyNotes({ historyUndo: true, onlyView: true, autoHeight: true, mode: "compare" });
    expect(notes["historyUndo"]).toMatch(/onlyView/);
    expect(notes["height"]).toMatch(/mínimo/);
    expect(notes["mode"]).toMatch(/compareContent/);
  });
});

describe("lista de atributos generada", () => {
  it("coincide con las props de types.ts (salvo initialContent y className)", () => {
    const source = readFileSync(resolve(__dirname, "../../src/components/MarkdownEditor/types.ts"), "utf8");
    const generated = generate(source);
    const committed = JSON.parse(
      readFileSync(resolve(__dirname, "../../playground/generated/attributes.json"), "utf8"),
    );
    expect(committed).toEqual(generated);
    expect(generated.find((a: AttributeSpec) => a.name === "mode")).toMatchObject({
      kind: "options",
      options: ["default", "compare"],
      default: "default",
    });
    expect(generated.map((a: AttributeSpec) => a.name)).not.toContain("className");
  });
});

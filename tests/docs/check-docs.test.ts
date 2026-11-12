import { describe, it, expect } from "vitest";
import {
  analyzeTypes,
  checkJsDoc,
  checkPropsInDoc,
  checkTokens,
  runChecks,
} from "../../scripts/check-docs.mjs";

const TYPES = `
/** Modo. */
export type Mode = "a" | "b";
/** Props. */
export interface MarkdownEditorProps {
  /**
   * Documentada.
   * @default true
   */
  good?: boolean;
  /** Sin default. */
  noDefault?: string;
  undocumented?: number;
}
/** API. */
export interface Handle {
  /** Hace algo. */
  run(): void;
  bare(): void;
}
`;

describe("check-docs (analizador)", () => {
  it("detecta props sin JSDoc o sin @default y miembros sin descripción", () => {
    const warnings = checkJsDoc(analyzeTypes(TYPES));
    expect(warnings.map((w) => `${w.kind}:${w.name}`)).toEqual([
      "prop-no-default:noDefault",
      "prop-undocumented:undocumented",
      "item-undocumented:Handle.bare",
    ]);
  });

  it("detecta props que faltan o sobran en un documento", () => {
    const doc = "| `good` | x |\n| `ghost` | y |\n| `reset()` | z |";
    const warnings = checkPropsInDoc(["good", "noDefault"], doc, "README");
    expect(warnings.map((w) => `${w.kind}:${w.name}`)).toEqual([
      "prop-missing:noDefault",
      "prop-unknown:ghost",
    ]);
  });

  it("compara los tokens del CSS con la tabla de la guía", () => {
    const css = ".root { --_mdw-bg: var(--mdw-bg, #fff); --_mdw-fg: var(--mdw-fg, #000); }";
    const guide = "| `--mdw-bg` | x |\n| `--mdw-old` | y |";
    expect(checkTokens(css, guide).map((w) => `${w.kind}:${w.name}`)).toEqual([
      "token-missing:--mdw-fg",
      "token-unknown:--mdw-old",
    ]);
  });

  it("sobre el repositorio real no lanza (solo informa)", () => {
    expect(() => runChecks()).not.toThrow();
  });
});

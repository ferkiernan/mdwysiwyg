import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MarkdownEditor } from "../../src";
import {
  THEME_TOKENS,
  copyThemeTokens,
} from "../../src/components/MarkdownEditor/theme/themeTokens";

const css = readFileSync(
  resolve(__dirname, "../../src/components/MarkdownEditor/MarkdownEditor.module.css"),
  "utf8",
);

function injectStyle(text: string): () => void {
  const style = document.createElement("style");
  style.textContent = text;
  document.head.appendChild(style);
  return () => style.remove();
}

describe("015: los defaults son respaldo, el host siempre gana", () => {
  it("el componente nunca declara una variable pública --mdw-*", () => {
    expect(css).not.toMatch(/^\s*--mdw-[a-z0-9-]+\s*:/m);
  });

  it("cada token público tiene su token privado con el default del contrato", () => {
    for (const token of THEME_TOKENS) {
      const privateName = token.name.replace("--mdw-", "--_mdw-");
      const fallback = token.default.replace(/--mdw-/g, "--_mdw-");
      expect(css).toContain(`${privateName}: var(${token.name}, ${fallback});`);
    }
  });

  it("no hay tokens privados sin token público listado", () => {
    const declared = [...css.matchAll(/--_mdw-([a-z0-9-]+):/g)].map((m) => `--mdw-${m[1]}`);
    expect(declared.sort()).toEqual(THEME_TOKENS.map((t) => t.name).sort());
  });

  it("fuera del bloque de tokens solo se leen tokens privados", () => {
    const body = css.slice(css.indexOf("box-sizing: border-box;"));
    expect(body).not.toContain("var(--mdw-");
  });

  it("un valor en la clase del control llega aunque su CSS se cargue antes", () => {
    const cleanup = injectStyle(".mi-editor { --mdw-toolbar-fg: #ff0000; }");
    try {
      const { container } = render(<MarkdownEditor className="mi-editor" />);
      const root = container.firstElementChild as HTMLElement;
      expect(getComputedStyle(root).getPropertyValue("--mdw-toolbar-fg").trim()).toBe("#ff0000");
    } finally {
      cleanup();
    }
  });

  it("un valor en un ancestro llega al control (antes lo tapaba el default)", () => {
    const cleanup = injectStyle(".mi-seccion { --mdw-content-bg: #101010; }");
    try {
      const { container } = render(
        <div className="mi-seccion">
          <MarkdownEditor />
        </div>,
      );
      const root = container.querySelector(".mi-seccion > div") as HTMLElement;
      expect(getComputedStyle(root).getPropertyValue("--mdw-content-bg").trim()).toBe("#101010");
    } finally {
      cleanup();
    }
  });

  it("la clase del control gana sobre el ancestro", () => {
    const cleanup = injectStyle(
      ".mi-seccion { --mdw-fg: #111111; } .mi-editor { --mdw-fg: #222222; }",
    );
    try {
      const { container } = render(
        <div className="mi-seccion">
          <MarkdownEditor className="mi-editor" />
        </div>,
      );
      const root = container.querySelector(".mi-editor") as HTMLElement;
      expect(getComputedStyle(root).getPropertyValue("--mdw-fg").trim()).toBe("#222222");
    } finally {
      cleanup();
    }
  });
});

describe("015: paneles flotantes", () => {
  it("copyThemeTokens copia los valores declarados y no inventa los que faltan", () => {
    const cleanup = injectStyle(".tema { --mdw-popover-bg: #0b1220; --mdw-danger-fg: #ff6b6b; }");
    try {
      const source = document.createElement("div");
      source.className = "tema";
      document.body.append(source);
      const panel = document.createElement("div");
      copyThemeTokens(source, panel);
      expect(panel.style.getPropertyValue("--mdw-popover-bg")).toBe("#0b1220");
      expect(panel.style.getPropertyValue("--mdw-danger-fg")).toBe("#ff6b6b");
      expect(panel.style.getPropertyValue("--mdw-bg")).toBe("");
      source.remove();
    } finally {
      cleanup();
    }
  });
});

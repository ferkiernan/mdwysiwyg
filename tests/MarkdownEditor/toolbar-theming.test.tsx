import { render, screen } from "@testing-library/react";
import { MarkdownEditor } from "../../src";

function injectStyle(css: string): () => void {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  return () => style.remove();
}

/**
 * Valor efectivo de una variable pública de theming: la declarada por el host o,
 * si no hay, el default con el que el control la lee (fallback de su token
 * privado `--_mdw-*`). Las referencias internas se devuelven con nombre público.
 */
function tokenValue(style: CSSStyleDeclaration, name: string): string {
  const declared = style.getPropertyValue(name).trim();
  if (declared !== "") return declared;
  const privateValue = style
    .getPropertyValue(name.replace("--mdw-", "--_mdw-"))
    .trim();
  const comma = privateValue.indexOf(",");
  if (comma === -1) return "";
  return privateValue
    .slice(comma + 1, privateValue.length - 1)
    .trim()
    .replace(/--_mdw-/g, "--mdw-");
}

describe("US3: personalización visual de la toolbar (CSS Custom Properties)", () => {
  it("conserva el aspecto por defecto sin personalización", () => {
    render(<MarkdownEditor />);
    const toolbar = screen.getByRole("toolbar", {
      name: "Barra de herramientas",
    });
    const style = getComputedStyle(toolbar);
    expect(tokenValue(style, "--mdw-toolbar-fg")).toBe(
      "#222222",
    );
  });

  it("permite personalizar el color de texto sin afectar el degradado por defecto", () => {
    const cleanup = injectStyle(`
      .mdw-theme-test {
        --mdw-toolbar-fg: #ff00ff;
      }
    `);
    try {
      render(<MarkdownEditor className="mdw-theme-test" />);
      const toolbar = screen.getByRole("toolbar", {
        name: "Barra de herramientas",
      });
      const style = getComputedStyle(toolbar);
      expect(tokenValue(style, "--mdw-toolbar-fg")).toBe(
        "#ff00ff",
      );
      expect(
        tokenValue(style, "--mdw-toolbar-gradient-from"),
      ).toBe("#eeeeee");
    } finally {
      cleanup();
    }
  });

  it("permite personalizar el degradado completo", () => {
    const cleanup = injectStyle(`
      .mdw-theme-gradient {
        --mdw-toolbar-gradient-from: #1e293b;
        --mdw-toolbar-gradient-via: #0f172a;
        --mdw-toolbar-gradient-to: #020617;
      }
    `);
    try {
      render(<MarkdownEditor className="mdw-theme-gradient" />);
      const toolbar = screen.getByRole("toolbar", {
        name: "Barra de herramientas",
      });
      const style = getComputedStyle(toolbar);
      expect(
        tokenValue(style, "--mdw-toolbar-gradient-from"),
      ).toBe("#1e293b");
      expect(
        tokenValue(style, "--mdw-toolbar-gradient-to"),
      ).toBe("#020617");
    } finally {
      cleanup();
    }
  });

  it("el fondo del área de contenido hereda --mdw-bg por defecto (--mdw-content-bg: var(--mdw-bg))", () => {
    const { container } = render(<MarkdownEditor />);
    const root = container.firstElementChild as HTMLElement;
    const content = root.querySelector(
      "div > div:last-child",
    ) as HTMLElement;
    const contentStyle = getComputedStyle(content);
    expect(tokenValue(contentStyle, "--mdw-content-bg")).toBe(
      "var(--mdw-bg)",
    );
  });

  it("permite personalizar el fondo del área de contenido (color, degradado o imagen)", () => {
    const cleanup = injectStyle(`
      .mdw-theme-content-bg {
        --mdw-content-bg: linear-gradient(135deg, #fef3c7, #fde68a);
      }
    `);
    try {
      const { container } = render(
        <MarkdownEditor className="mdw-theme-content-bg" />,
      );
      const root = container.firstElementChild as HTMLElement;
      const content = root.querySelector(
        "div > div:last-child",
      ) as HTMLElement;
      const style = getComputedStyle(content);
      expect(
        tokenValue(style, "--mdw-content-bg").replace(/\s+/g, ""),
      ).toBe("linear-gradient(135deg,#fef3c7,#fde68a)");
    } finally {
      cleanup();
    }
  });
});

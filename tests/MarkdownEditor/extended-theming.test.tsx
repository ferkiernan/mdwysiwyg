import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

function rootOf(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

// jsdom normaliza los valores de las custom properties (quita espacios tras
// las comas y resuelve `inherit` a cadena vacía), por eso los esperados no
// son literalmente idénticos al CSS fuente.
const NEW_VARIABLES: Array<[string, string]> = [
  ["--mdw-content-markdown-fg", "var(--mdw-fg)"],
  ["--mdw-content-markdown-font-family", "ui-monospace,Consolas,monospace"],
  ["--mdw-content-wysiwyg-fg", "var(--mdw-fg)"],
  ["--mdw-scrollbar-thumb", "#c1c1c1"],
  ["--mdw-scrollbar-track", "transparent"],
  ["--mdw-toolbar-select-bg", "#e9e9e9"],
  ["--mdw-button-active-bg", "#c8c8c8"],
  ["--mdw-button-hover-gradient-from", "#ffffff"],
  ["--mdw-button-hover-gradient-to", "#d8d8d8"],
  ["--mdw-table-header-bg", "var(--mdw-muted)"],
  ["--mdw-code-block-bg", "var(--mdw-muted)"],
  ["--mdw-mermaid-bg", "var(--mdw-muted)"],
  ["--mdw-table-menu-trigger-size", "0.7em"],
  ["--mdw-table-menu-trigger-color", "var(--mdw-scrollbar-thumb)"],
];

describe("US5: theming extendido (CSS Custom Properties)", () => {
  it.each(NEW_VARIABLES)(
    "%s está declarada con su valor por defecto",
    (variable, expected) => {
      const { container } = render(<MarkdownEditor />);
      const style = getComputedStyle(rootOf(container));
      expect(tokenValue(style, variable)).toBe(expected);
    },
  );

  it("--mdw-table-menu-trigger-color es personalizable independientemente de la scrollbar", () => {
    const cleanup = injectStyle(`
      .mdw-trigger-theme { --mdw-table-menu-trigger-color: #ff0000; }
    `);
    try {
      const { container } = render(
        <MarkdownEditor className="mdw-trigger-theme" />,
      );
      const style = getComputedStyle(rootOf(container));
      expect(
        tokenValue(style, "--mdw-table-menu-trigger-color"),
      ).toBe("#ff0000");
    } finally {
      cleanup();
    }
  });

  it("--mdw-content-wysiwyg-font-family es personalizable sobre su default heredado", () => {
    const cleanup = injectStyle(`
      .mdw-wysiwyg-font { --mdw-content-wysiwyg-font-family: "Georgia", serif; }
    `);
    try {
      const { container } = render(
        <MarkdownEditor className="mdw-wysiwyg-font" />,
      );
      const style = getComputedStyle(rootOf(container));
      expect(
        tokenValue(style, "--mdw-content-wysiwyg-font-family"),
      ).toBe('"Georgia",serif');
    } finally {
      cleanup();
    }
  });

  it("permite personalizar color y fuente del área de contenido en modo Markdown", async () => {
    const cleanup = injectStyle(`
      .mdw-md-theme {
        --mdw-content-markdown-fg: #123456;
        --mdw-content-markdown-font-family: "Fira Code", monospace;
      }
    `);
    try {
      const { container } = render(<MarkdownEditor className="mdw-md-theme" />);
      await userEvent.click(
        screen.getByRole("button", { name: "Ver código Markdown" }),
      );
      const style = getComputedStyle(rootOf(container));
      expect(tokenValue(style, "--mdw-content-markdown-fg")).toBe(
        "#123456",
      );
      // La vista renderizada conserva su propio default, independiente.
      expect(tokenValue(style, "--mdw-content-wysiwyg-fg")).toBe(
        "var(--mdw-fg)",
      );
    } finally {
      cleanup();
    }
  });

  it("permite personalizar el fondo de encabezados de tabla y de bloques de código", () => {
    const cleanup = injectStyle(`
      .mdw-table-code-theme {
        --mdw-table-header-bg: #dbeafe;
        --mdw-code-block-bg: #111827;
      }
    `);
    try {
      const { container } = render(
        <MarkdownEditor className="mdw-table-code-theme" />,
      );
      const style = getComputedStyle(rootOf(container));
      expect(tokenValue(style, "--mdw-table-header-bg")).toBe(
        "#dbeafe",
      );
      expect(tokenValue(style, "--mdw-code-block-bg")).toBe(
        "#111827",
      );
    } finally {
      cleanup();
    }
  });

  it("permite personalizar el fondo del área de diagramas Mermaid", () => {
    const cleanup = injectStyle(`
      .mdw-mermaid-theme { --mdw-mermaid-bg: #ecfdf5; }
    `);
    try {
      const { container } = render(
        <MarkdownEditor className="mdw-mermaid-theme" />,
      );
      const style = getComputedStyle(rootOf(container));
      expect(tokenValue(style, "--mdw-mermaid-bg")).toBe(
        "#ecfdf5",
      );
    } finally {
      cleanup();
    }
  });

  it("permite personalizar el color del scroll", () => {
    const cleanup = injectStyle(`
      .mdw-scroll-theme { --mdw-scrollbar-thumb: #94a3b8; }
    `);
    try {
      const { container } = render(
        <MarkdownEditor className="mdw-scroll-theme" />,
      );
      const style = getComputedStyle(rootOf(container));
      expect(tokenValue(style, "--mdw-scrollbar-thumb")).toBe(
        "#94a3b8",
      );
      expect(tokenValue(style, "--mdw-scrollbar-track")).toBe(
        "transparent",
      );
    } finally {
      cleanup();
    }
  });

  it("permite personalizar select, botón presionado y hover de la barra", () => {
    const cleanup = injectStyle(`
      .mdw-toolbar-theme {
        --mdw-toolbar-select-bg: #ffffff;
        --mdw-button-active-bg: #cbd5e1;
        --mdw-button-hover-gradient-from: #f1f5f9;
        --mdw-button-hover-gradient-to: #e2e8f0;
      }
    `);
    try {
      const { container } = render(
        <MarkdownEditor className="mdw-toolbar-theme" />,
      );
      const style = getComputedStyle(rootOf(container));
      expect(tokenValue(style, "--mdw-toolbar-select-bg")).toBe(
        "#ffffff",
      );
      expect(tokenValue(style, "--mdw-button-active-bg")).toBe(
        "#cbd5e1",
      );
      expect(
        tokenValue(style, "--mdw-button-hover-gradient-from"),
      ).toBe("#f1f5f9");
      expect(
        tokenValue(style, "--mdw-button-hover-gradient-to"),
      ).toBe("#e2e8f0");
    } finally {
      cleanup();
    }
  });

  it("una personalización parcial no altera las demás variables", () => {
    const cleanup = injectStyle(`
      .mdw-partial-theme { --mdw-button-active-bg: #000000; }
    `);
    try {
      const { container } = render(
        <MarkdownEditor className="mdw-partial-theme" />,
      );
      const style = getComputedStyle(rootOf(container));
      expect(tokenValue(style, "--mdw-button-active-bg")).toBe(
        "#000000",
      );
      expect(tokenValue(style, "--mdw-toolbar-select-bg")).toBe(
        "#e9e9e9",
      );
      expect(tokenValue(style, "--mdw-toolbar-fg")).toBe("#222222");
    } finally {
      cleanup();
    }
  });
});

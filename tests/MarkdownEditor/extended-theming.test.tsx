import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../../src";

function injectStyle(css: string): () => void {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  return () => style.remove();
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
];

describe("US5: theming extendido (CSS Custom Properties)", () => {
  it.each(NEW_VARIABLES)(
    "%s está declarada con su valor por defecto",
    (variable, expected) => {
      const { container } = render(<MarkdownEditor />);
      const style = getComputedStyle(rootOf(container));
      expect(style.getPropertyValue(variable).trim()).toBe(expected);
    },
  );

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
        style.getPropertyValue("--mdw-content-wysiwyg-font-family").trim(),
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
      expect(style.getPropertyValue("--mdw-content-markdown-fg").trim()).toBe(
        "#123456",
      );
      // La vista renderizada conserva su propio default, independiente.
      expect(style.getPropertyValue("--mdw-content-wysiwyg-fg").trim()).toBe(
        "var(--mdw-fg)",
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
      expect(style.getPropertyValue("--mdw-scrollbar-thumb").trim()).toBe(
        "#94a3b8",
      );
      expect(style.getPropertyValue("--mdw-scrollbar-track").trim()).toBe(
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
      expect(style.getPropertyValue("--mdw-toolbar-select-bg").trim()).toBe(
        "#ffffff",
      );
      expect(style.getPropertyValue("--mdw-button-active-bg").trim()).toBe(
        "#cbd5e1",
      );
      expect(
        style.getPropertyValue("--mdw-button-hover-gradient-from").trim(),
      ).toBe("#f1f5f9");
      expect(
        style.getPropertyValue("--mdw-button-hover-gradient-to").trim(),
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
      expect(style.getPropertyValue("--mdw-button-active-bg").trim()).toBe(
        "#000000",
      );
      expect(style.getPropertyValue("--mdw-toolbar-select-bg").trim()).toBe(
        "#e9e9e9",
      );
      expect(style.getPropertyValue("--mdw-toolbar-fg").trim()).toBe("#222222");
    } finally {
      cleanup();
    }
  });
});

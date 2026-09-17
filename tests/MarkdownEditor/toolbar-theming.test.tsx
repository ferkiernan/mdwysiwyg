import { render, screen } from "@testing-library/react";
import { MarkdownEditor } from "../../src";

function injectStyle(css: string): () => void {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  return () => style.remove();
}

describe("US3: personalización visual de la toolbar (CSS Custom Properties)", () => {
  it("conserva el aspecto por defecto sin personalización", () => {
    render(<MarkdownEditor />);
    const toolbar = screen.getByRole("toolbar", {
      name: "Barra de herramientas",
    });
    const style = getComputedStyle(toolbar);
    expect(style.getPropertyValue("--mdw-toolbar-fg").trim()).toBe(
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
      expect(style.getPropertyValue("--mdw-toolbar-fg").trim()).toBe(
        "#ff00ff",
      );
      expect(
        style.getPropertyValue("--mdw-toolbar-gradient-from").trim(),
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
        style.getPropertyValue("--mdw-toolbar-gradient-from").trim(),
      ).toBe("#1e293b");
      expect(
        style.getPropertyValue("--mdw-toolbar-gradient-to").trim(),
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
    expect(contentStyle.getPropertyValue("--mdw-content-bg").trim()).toBe(
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
        style.getPropertyValue("--mdw-content-bg").trim().replace(/\s+/g, ""),
      ).toBe("linear-gradient(135deg,#fef3c7,#fde68a)");
    } finally {
      cleanup();
    }
  });
});

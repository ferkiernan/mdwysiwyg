import { render } from "@testing-library/react";
import { MarkdownEditor } from "../../src";

describe("US2: redimensionamiento manual (resizable)", () => {
  it("por defecto (resizable no especificado) permite redimensionar", () => {
    const { container } = render(<MarkdownEditor />);
    const root = container.firstElementChild as HTMLElement;
    expect(getComputedStyle(root).resize).toBe("both");
  });

  it("con resizable={false} no permite redimensionar", () => {
    const { container } = render(<MarkdownEditor resizable={false} />);
    const root = container.firstElementChild as HTMLElement;
    expect(getComputedStyle(root).resize).not.toBe("both");
  });

  it("define un tamaño mínimo cuando el redimensionamiento está habilitado", () => {
    const { container } = render(<MarkdownEditor />);
    const root = container.firstElementChild as HTMLElement;
    const style = getComputedStyle(root);
    expect(style.minWidth).not.toBe("");
    expect(style.minHeight).not.toBe("");
  });
});

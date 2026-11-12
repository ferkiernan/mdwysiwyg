import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../../src";
import type { MarkdownEditorProps } from "../../src";

const TEXTBOX = { name: "Editor de texto enriquecido" };
const TOGGLE = { name: "Ver código Markdown" };

function rootOf(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

/** `scrollHeight` simulado de los textarea: 20 px por línea. */
function stubTextareaScrollHeight() {
  return vi
    .spyOn(HTMLTextAreaElement.prototype, "scrollHeight", "get")
    .mockImplementation(function (this: HTMLTextAreaElement) {
      return this.value.split(String.fromCharCode(10)).length * 20;
    });
}

afterEach(() => vi.restoreAllMocks());

async function setup(props: MarkdownEditorProps) {
  const onChange = vi.fn();
  const view = render(<MarkdownEditor onChange={onChange} {...props} />);
  await screen.findByRole("textbox", TEXTBOX);
  return { ...view, onChange, root: rootOf(view.container) };
}

describe("US2: desactivado por defecto", () => {
  it("sin la prop conserva alto fijo y el tirador de redimensionar", async () => {
    const { root } = await setup({ height: 320 });
    expect(root.style.height).toBe("320px");
    expect(root.style.minHeight).toBe("");
    expect(root.className).toContain("resizable");
    expect(root.className).not.toContain("autoHeight");
  });
});

describe("US1/US4: con autoHeight", () => {
  it("el alto configurado pasa a ser el mínimo y no hay tirador", async () => {
    const { root } = await setup({ height: 320, autoHeight: true });
    expect(root.style.height).toBe("");
    expect(root.style.minHeight).toBe("320px");
    expect(root.className).toContain("autoHeight");
    expect(root.className).not.toContain("resizable");
  });

  it("vista Markdown: el área de texto toma el alto de su contenido y lo sigue", async () => {
    stubTextareaScrollHeight();
    await setup({ autoHeight: true, initialContent: "uno\n\ndos\n\ntres" });
    await userEvent.click(screen.getByRole("button", TOGGLE));
    const source = screen.getByLabelText("Código fuente Markdown") as HTMLTextAreaElement;
    const before = parseInt(source.style.height, 10);
    expect(before).toBe(source.value.split("\n").length * 20);

    await userEvent.type(source, "{Enter}cuatro{Enter}cinco");
    expect(parseInt(source.style.height, 10)).toBeGreaterThan(before);
  });

  it("comparación en vista Markdown: ambas áreas se ajustan a su contenido", async () => {
    stubTextareaScrollHeight();
    await setup({
      autoHeight: true,
      initialContent: "a\n\nb",
      mode: "compare",
      compareOrientation: "up-and-down",
      compareContent: "a\n\nb\n\nc\n\nd",
    });
    await userEvent.click(screen.getByRole("button", TOGGLE));
    const original = screen.getByLabelText(
      "Código fuente Markdown original (solo lectura)",
    ) as HTMLTextAreaElement;
    const current = screen.getByLabelText("Código fuente Markdown") as HTMLTextAreaElement;
    expect(original.style.height).toBe(`${original.value.split("\n").length * 20}px`);
    expect(current.style.height).toBe(`${current.value.split("\n").length * 20}px`);
  });

  it("activar y desactivar no toca el contenido ni notifica cambios", async () => {
    const { root, rerender, onChange } = await setup({ initialContent: "hola mundo" });
    const box = screen.getByRole("textbox", TEXTBOX);
    rerender(<MarkdownEditor onChange={onChange} initialContent="hola mundo" autoHeight />);
    expect(root.style.minHeight).toBe("500px");
    rerender(<MarkdownEditor onChange={onChange} initialContent="hola mundo" />);
    expect(root.style.height).toBe("500px");
    expect(screen.getByRole("textbox", TEXTBOX)).toBe(box);
    expect(box).toHaveTextContent("hola mundo");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("al desactivarlo el área de texto vuelve a su alto normal", async () => {
    stubTextareaScrollHeight();
    const { rerender, onChange } = await setup({ autoHeight: true, initialContent: "x" });
    await userEvent.click(screen.getByRole("button", TOGGLE));
    const source = screen.getByLabelText("Código fuente Markdown") as HTMLTextAreaElement;
    expect(source.style.height).not.toBe("");
    rerender(<MarkdownEditor onChange={onChange} initialContent="x" />);
    expect(source.style.height).toBe("");
  });
});

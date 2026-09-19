import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../../src";
import type { MarkdownEditorHandle } from "../../src";

async function setupWithRef(initialContent: string) {
  const ref = createRef<MarkdownEditorHandle>();
  render(<MarkdownEditor ref={ref} initialContent={initialContent} />);
  const pm = await screen.findByRole("textbox", {
    name: "Editor de texto enriquecido",
  });
  return { ref, pm };
}

describe("US6: API imperativa (reset / isModified)", () => {
  it("isModified() es false mientras el contenido no se modifica", async () => {
    const { ref } = await setupWithRef("# Original\n");
    expect(ref.current?.isModified()).toBe(false);
  });

  it("isModified() pasa a true tras modificar el contenido", async () => {
    const { ref, pm } = await setupWithRef("Original");
    await userEvent.click(pm);
    await userEvent.keyboard(" modificado");

    expect(ref.current?.isModified()).toBe(true);
  });

  it("reset() restablece el contenido original en la vista renderizada", async () => {
    const { ref, pm } = await setupWithRef("Original");
    await userEvent.click(pm);
    await userEvent.keyboard(" modificado");
    expect(pm.textContent).toContain("modificado");

    ref.current?.reset();

    expect(pm.textContent).toBe("Original");
  });

  it("reset() también restablece el contenido en la vista Markdown", async () => {
    const { ref, pm } = await setupWithRef("Original");
    await userEvent.click(pm);
    await userEvent.keyboard(" modificado");
    ref.current?.reset();

    await userEvent.click(
      screen.getByRole("button", { name: "Ver código Markdown" }),
    );
    expect(
      screen.getByRole("textbox", { name: "Código fuente Markdown" }),
    ).toHaveValue("Original");
  });

  it("isModified() vuelve a false tras reset()", async () => {
    const { ref, pm } = await setupWithRef("Original");
    await userEvent.click(pm);
    await userEvent.keyboard(" modificado");
    expect(ref.current?.isModified()).toBe(true);

    ref.current?.reset();

    expect(ref.current?.isModified()).toBe(false);
  });

  it("reset() sin modificaciones previas no produce cambios", async () => {
    const { ref, pm } = await setupWithRef("Original");
    ref.current?.reset();

    expect(pm).toHaveTextContent("Original");
    expect(ref.current?.isModified()).toBe(false);
  });

  it("acepta documentId y fileName sin alterar el comportamiento", async () => {
    render(
      <MarkdownEditor
        initialContent="Hola"
        documentId="doc-1"
        fileName="a.md"
      />,
    );
    const editors = await screen.findAllByRole("textbox", {
      name: "Editor de texto enriquecido",
    });
    expect(editors.length).toBeGreaterThan(0);
  });
});

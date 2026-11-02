import { createRef } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../../src";
import type { MarkdownEditorHandle } from "../../src";

async function setup(
  props: Partial<React.ComponentProps<typeof MarkdownEditor>> & { initialContent: string },
) {
  const ref = createRef<MarkdownEditorHandle>();
  const onChange = vi.fn();
  render(<MarkdownEditor ref={ref} onChange={onChange} {...props} />);
  const pm = await screen.findByRole("textbox", { name: "Editor de texto enriquecido" });
  return { ref, pm, onChange };
}

describe("host integration API (insertMarkdown / setMarkdown / resolveImageSrc)", () => {
  it("insertMarkdown inserta en el cursor y notifica onChange con Markdown", async () => {
    const { ref, pm, onChange } = await setup({ initialContent: "Hola" });
    await userEvent.click(pm);
    act(() => ref.current?.insertMarkdown("![gato](assets/gato.png)"));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const last = onChange.mock.calls.at(-1)?.[0] as string;
    expect(last).toContain("![gato](assets/gato.png)");
    expect(last).toContain("Hola");
    expect(pm.querySelector("img")).not.toBeNull();
  });

  it("resolveImageSrc cambia solo el src mostrado; el Markdown conserva el original", async () => {
    const { ref, pm, onChange } = await setup({
      initialContent: "![gato](assets/gato.png)",
      resolveImageSrc: (src) => `asset://resolved/${src}`,
    });
    expect(pm.querySelector("img")?.getAttribute("src")).toBe("asset://resolved/assets/gato.png");
    await userEvent.click(pm);
    await userEvent.keyboard("x");
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const md = onChange.mock.calls.at(-1)?.[0] as string;
    expect(md).toContain("(assets/gato.png)");
    expect(md).not.toContain("asset://resolved");
    expect(ref.current?.isModified()).toBe(true);
  });

  it("sin resolveImageSrc las imágenes se muestran como antes", async () => {
    const { pm } = await setup({ initialContent: "![a](https://e.com/a.png)" });
    expect(pm.querySelector("img")?.getAttribute("src")).toBe("https://e.com/a.png");
  });

  it("setMarkdown reemplaza el contenido, notifica y es deshacible con Ctrl+Z", async () => {
    const { ref, pm, onChange } = await setup({ initialContent: "Original" });
    await userEvent.click(pm);
    act(() => ref.current?.setMarkdown("Del disco"));
    expect(pm.textContent).toBe("Del disco");
    expect(onChange).toHaveBeenLastCalledWith("Del disco");

    await userEvent.click(pm);
    await userEvent.keyboard("{Control>}z{/Control}");
    await waitFor(() => expect(pm.textContent).toBe("Original"));
  });
});

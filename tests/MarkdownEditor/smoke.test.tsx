import { render, screen } from "@testing-library/react";
import { MarkdownEditor } from "../../src";

describe("MarkdownEditor (smoke)", () => {
  it("monta vacío sin errores, en vista WYSIWYG, con tamaño por defecto 700x500", async () => {
    const { container } = render(<MarkdownEditor />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.width).toBe("700px");
    expect(root.style.height).toBe("500px");
    expect(
      await screen.findByRole("textbox", {
        name: "Editor de texto enriquecido",
      }),
    ).toBeInTheDocument();
  });

  it("acepta tamaño personalizado", async () => {
    const { container } = render(<MarkdownEditor width={900} height="60vh" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.width).toBe("900px");
    expect(root.style.height).toBe("60vh");
    await screen.findByRole("textbox", { name: "Editor de texto enriquecido" });
  });
});

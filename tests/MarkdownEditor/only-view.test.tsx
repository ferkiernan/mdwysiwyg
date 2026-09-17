import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupEditor } from "./helpers";

describe("US1: modo de solo lectura (onlyView)", () => {
  it("muestra 'Edición desactivada' y oculta los controles de edición", async () => {
    await setupEditor({ onlyView: true, initialContent: "Hola" });

    expect(screen.getByText("Edición desactivada")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Negrita" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ver código Markdown" }),
    ).not.toBeInTheDocument();
  });

  it("conserva el control de exportar, funcional, en modo solo lectura", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await setupEditor({ onlyView: true, initialContent: "# Hola\n" });

    const exportButton = screen.getByRole("button", { name: "Export" });
    expect(exportButton).toBeInTheDocument();
    await userEvent.click(exportButton);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Copiar como Markdown" }),
    );
    expect(writeText).toHaveBeenCalledWith("# Hola\n");
  });

  it("no permite modificar el contenido desde la vista renderizada", async () => {
    const { onChange, pm } = await setupEditor({
      onlyView: true,
      initialContent: "Hola",
    });
    await userEvent.click(pm);
    await userEvent.keyboard(" mundo");
    expect(pm).toHaveTextContent("Hola");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("no ofrece alternar a la vista Markdown para editarla", async () => {
    await setupEditor({ onlyView: true, initialContent: "Hola" });
    expect(
      screen.queryByRole("textbox", { name: "Código fuente Markdown" }),
    ).not.toBeInTheDocument();
  });

  it("sin onlyView (default false) el editor se comporta igual que antes", async () => {
    await setupEditor({});
    expect(screen.queryByText("Edición desactivada")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Negrita" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ver código Markdown" }),
    ).toBeInTheDocument();
  });
});

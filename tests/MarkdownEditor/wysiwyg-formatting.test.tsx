import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupEditor, selectAll } from "./helpers";

describe("US1: formato desde la barra en vista renderizada", () => {
  it("aplica negrita a la selección y la refleja en el Markdown", async () => {
    const { onChange, pm } = await setupEditor({
      initialContent: "Hola mundo",
    });
    selectAll(pm);
    const bold = screen.getByRole("button", { name: "Negrita" });
    await userEvent.click(bold);

    expect(pm.querySelector("strong")).toHaveTextContent("Hola mundo");
    expect(onChange).toHaveBeenLastCalledWith("**Hola mundo**\n");
    expect(bold).toHaveAttribute("aria-pressed", "true");
  });

  it("aplica cursiva y tachado", async () => {
    const { onChange, pm } = await setupEditor({
      initialContent: "Hola mundo",
    });
    selectAll(pm);
    await userEvent.click(screen.getByRole("button", { name: "Cursiva" }));
    expect(onChange).toHaveBeenLastCalledWith("*Hola mundo*\n");

    await userEvent.click(screen.getByRole("button", { name: "Tachado" }));
    expect(onChange).toHaveBeenLastCalledWith("*~~Hola mundo~~*\n");
    expect(pm.querySelector("s")).not.toBeNull();
  });

  it("convierte un párrafo en heading nivel 2 con estilo visual correspondiente", async () => {
    const { onChange } = await setupEditor({ initialContent: "Hola mundo" });
    const select = screen.getByRole("combobox", {
      name: "Nivel de encabezado",
    });
    await userEvent.selectOptions(select, "h2");

    expect(
      screen.getByRole("heading", { level: 2, name: "Hola mundo" }),
    ).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith("## Hola mundo\n");
    expect(select).toHaveValue("h2");
  });

  it("convierte un párrafo en cita (blockquote)", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: "Hola" });
    await userEvent.click(screen.getByRole("button", { name: "Cita" }));
    expect(pm.querySelector("blockquote")).toHaveTextContent("Hola");
    expect(onChange).toHaveBeenLastCalledWith("> Hola\n");
  });

  it("vuelve de heading a párrafo", async () => {
    const { onChange } = await setupEditor({ initialContent: "# Hola\n" });
    const select = screen.getByRole("combobox", {
      name: "Nivel de encabezado",
    });
    expect(select).toHaveValue("h1");
    await userEvent.selectOptions(select, "p");
    expect(onChange).toHaveBeenLastCalledWith("Hola\n");
  });
});

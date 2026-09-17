import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupEditor, selectAll } from "./helpers";

describe("US3: inserción de elementos desde la barra", () => {
  it("inserta un bloque de código diferenciado", async () => {
    const { onChange, pm } = await setupEditor({
      initialContent: "const x = 1;",
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Bloque de código" }),
    );
    expect(pm.querySelector("pre code")).toHaveTextContent("const x = 1;");
    expect(onChange.mock.lastCall?.[0]).toContain("```");
  });

  it("inserta una imagen por URL visible en ambas representaciones", async () => {
    const { onChange, pm } = await setupEditor({});
    await userEvent.click(
      screen.getByRole("button", { name: "Insertar imagen" }),
    );
    await userEvent.type(
      screen.getByLabelText("URL de la imagen"),
      "https://img.example/foto.png",
    );
    await userEvent.type(screen.getByLabelText("Texto alternativo"), "Foto");
    await userEvent.click(screen.getByRole("button", { name: "Insertar" }));

    expect(pm.querySelector("img")).toHaveAttribute(
      "src",
      "https://img.example/foto.png",
    );
    expect(onChange).toHaveBeenLastCalledWith(
      "![Foto](https://img.example/foto.png)\n",
    );
  });

  it("convierte el texto seleccionado en un enlace", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: "Sitio" });
    selectAll(pm);
    await userEvent.click(
      screen.getByRole("button", { name: "Insertar enlace" }),
    );
    await userEvent.type(
      screen.getByLabelText("URL del enlace"),
      "https://ejemplo.com",
    );
    await userEvent.click(screen.getByRole("button", { name: "Insertar" }));

    const link = pm.querySelector("a");
    expect(link).toHaveTextContent("Sitio");
    expect(link).toHaveAttribute("href", "https://ejemplo.com");
    expect(onChange).toHaveBeenLastCalledWith("[Sitio](https://ejemplo.com)\n");
  });

  it("inserta una tabla editable con su sintaxis GFM equivalente", async () => {
    const { onChange, pm } = await setupEditor({});
    await userEvent.click(
      screen.getByRole("button", { name: "Insertar tabla" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Insertar" }));

    expect(pm.querySelector("table")).not.toBeNull();
    expect(pm.querySelectorAll("tr")).toHaveLength(3);
    const markdown = onChange.mock.lastCall?.[0] as string;
    expect(markdown).toContain("|");
    expect(markdown).toContain("-");
  });

  it("inserta una línea horizontal", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: "texto" });
    await userEvent.click(
      screen.getByRole("button", { name: "Línea horizontal" }),
    );
    expect(pm.querySelector("hr")).not.toBeNull();
    expect(onChange.mock.lastCall?.[0]).toContain("---");
  });

  it("inserta HTML embebido preservando la fuente en el Markdown", async () => {
    const { onChange, pm } = await setupEditor({});
    await userEvent.click(screen.getByRole("button", { name: "Insertar HTML" }));
    // userEvent.type interpreta llaves/corchetes; fireEvent-like paste es innecesario
    const field = screen.getByLabelText("Código HTML");
    await userEvent.click(field);
    await userEvent.paste("<b>negrita embebida</b>");
    await userEvent.click(screen.getByRole("button", { name: "Insertar" }));

    const block = pm.querySelector("[data-html-block]");
    expect(block?.querySelector("b")).toHaveTextContent("negrita embebida");
    expect(onChange.mock.lastCall?.[0]).toContain("<b>negrita embebida</b>");
  });
});

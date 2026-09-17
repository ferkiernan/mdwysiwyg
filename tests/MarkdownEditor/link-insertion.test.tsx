import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupEditor, selectAll } from "./helpers";

describe("US1: diálogo de enlace condicionado por selección activa", () => {
  it("con texto seleccionado, el diálogo solo pide la URL (sin campo de texto)", async () => {
    const { pm } = await setupEditor({ initialContent: "Sitio" });
    selectAll(pm);
    await userEvent.click(
      screen.getByRole("button", { name: "Insertar enlace" }),
    );

    expect(screen.getByLabelText("URL del enlace")).toBeInTheDocument();
    expect(screen.queryByLabelText("Texto del enlace")).not.toBeInTheDocument();
  });

  it("sin selección, el diálogo pide URL y texto del enlace", async () => {
    await setupEditor({ initialContent: "" });
    await userEvent.click(
      screen.getByRole("button", { name: "Insertar enlace" }),
    );

    expect(screen.getByLabelText("URL del enlace")).toBeInTheDocument();
    expect(screen.getByLabelText("Texto del enlace")).toBeInTheDocument();
  });

  it("con selección, confirmar aplica el enlace sobre el texto sin alterarlo", async () => {
    const { onChange, pm } = await setupEditor({
      initialContent: "Visitá nuestro sitio",
    });
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
    expect(link).toHaveTextContent("Visitá nuestro sitio");
    expect(link).toHaveAttribute("href", "https://ejemplo.com");
    expect(onChange).toHaveBeenLastCalledWith(
      "[Visitá nuestro sitio](https://ejemplo.com)\n",
    );
  });
});

describe("US2: autocompletado de protocolo al insertar un enlace", () => {
  it("antepone http:// a una URL con www sin protocolo", async () => {
    const { pm } = await setupEditor({ initialContent: "Sitio" });
    selectAll(pm);
    await userEvent.click(
      screen.getByRole("button", { name: "Insertar enlace" }),
    );
    await userEvent.type(
      screen.getByLabelText("URL del enlace"),
      "www.ejemplo.com",
    );
    await userEvent.click(screen.getByRole("button", { name: "Insertar" }));

    expect(pm.querySelector("a")).toHaveAttribute(
      "href",
      "http://www.ejemplo.com",
    );
  });

  it("antepone http:// a una URL sin www y sin protocolo", async () => {
    const { pm } = await setupEditor({ initialContent: "Sitio" });
    selectAll(pm);
    await userEvent.click(
      screen.getByRole("button", { name: "Insertar enlace" }),
    );
    await userEvent.type(
      screen.getByLabelText("URL del enlace"),
      "ejemplo.com",
    );
    await userEvent.click(screen.getByRole("button", { name: "Insertar" }));

    expect(pm.querySelector("a")).toHaveAttribute("href", "http://ejemplo.com");
  });

  it("conserva un protocolo explícito sin modificarlo", async () => {
    const { pm } = await setupEditor({ initialContent: "Sitio" });
    selectAll(pm);
    await userEvent.click(
      screen.getByRole("button", { name: "Insertar enlace" }),
    );
    await userEvent.type(
      screen.getByLabelText("URL del enlace"),
      "https://ejemplo.com",
    );
    await userEvent.click(screen.getByRole("button", { name: "Insertar" }));

    expect(pm.querySelector("a")).toHaveAttribute(
      "href",
      "https://ejemplo.com",
    );
  });
});

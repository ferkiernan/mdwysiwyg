import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupEditor } from "./helpers";

describe("Principio VI: accesibilidad de los elementos interactivos", () => {
  it("todos los controles de la barra tienen nombre accesible", async () => {
    await setupEditor({});
    const toolbar = screen.getByRole("toolbar", {
      name: "Barra de herramientas",
    });
    for (const button of within(toolbar).getAllByRole("button")) {
      expect(
        button.getAttribute("aria-label") ?? button.textContent,
      ).toBeTruthy();
    }
    expect(
      within(toolbar).getByRole("combobox", { name: "Nivel de encabezado" }),
    ).toBeInTheDocument();
  });

  it("los botones de estado exponen aria-pressed", async () => {
    await setupEditor({});
    expect(
      screen.getByRole("button", { name: "Negrita" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: "Ver código Markdown" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("la vista Markdown es un textarea etiquetado", async () => {
    await setupEditor({});
    await userEvent.click(
      screen.getByRole("button", { name: "Ver código Markdown" }),
    );
    const textarea = screen.getByRole("textbox", {
      name: "Código fuente Markdown",
    });
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("el área WYSIWYG expone rol textbox multilinea etiquetado", async () => {
    const { pm } = await setupEditor({});
    expect(pm).toHaveAttribute("aria-multiline", "true");
    expect(pm).toHaveAttribute("aria-label", "Editor de texto enriquecido");
  });

  it("el menú Export se abre, se cierra con Escape y devuelve el foco", async () => {
    await setupEditor({});
    const trigger = screen.getByRole("button", { name: "Export" });
    await userEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("los diálogos de inserción tienen campos etiquetados y cierran con Escape", async () => {
    await setupEditor({});
    await userEvent.click(
      screen.getByRole("button", { name: "Insertar imagen" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Insertar imagen" });
    expect(
      within(dialog).getByLabelText("URL de la imagen"),
    ).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("el popover de enlace enfoca el primer elemento al abrirse en cada modo", async () => {
    const { pm } = await setupEditor({
      initialContent: "Visitá [sitio](https://ejemplo.com)\n",
    });
    const link = pm.querySelector("a") as HTMLElement;
    await userEvent.click(link);

    const firstMenuItem = screen.getByRole("menuitem", {
      name: "Ir a la url",
    });
    expect(firstMenuItem).toHaveFocus();

    await userEvent.click(
      screen.getByRole("menuitem", { name: "Editar url" }),
    );
    expect(screen.getByLabelText("URL del enlace")).toHaveFocus();
  });

  it("'Eliminar link' es un botón nativo, accesible por teclado", async () => {
    const { pm } = await setupEditor({
      initialContent: "Visitá [sitio](https://ejemplo.com)\n",
    });
    await userEvent.click(pm.querySelector("a") as HTMLElement);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Editar url" }),
    );

    const removeButton = screen.getByRole("button", { name: "Eliminar link" });
    expect(removeButton.tagName).toBe("BUTTON");
    expect(removeButton).not.toHaveAttribute("tabindex", "-1");
  });

  it("los controles de formato quedan deshabilitados en vista Markdown", async () => {
    await setupEditor({});
    await userEvent.click(
      screen.getByRole("button", { name: "Ver código Markdown" }),
    );
    expect(screen.getByRole("button", { name: "Negrita" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Insertar tabla" }),
    ).toBeDisabled();
    // El toggle y Export siguen operables
    expect(
      screen.getByRole("button", { name: "Ver código Markdown" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Export" })).toBeEnabled();
  });
});

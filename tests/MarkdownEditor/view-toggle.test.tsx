import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupEditor } from "./helpers";

const TOGGLE = { name: "Ver código Markdown" };
const SOURCE = { name: "Código fuente Markdown" };
const WYSIWYG = { name: "Editor de texto enriquecido" };

describe("US2: alternancia de vista y edición del Markdown fuente", () => {
  it("muestra el Markdown fuente exacto al activar </>", async () => {
    const initial = "# Título\n\nHola **mundo**\n";
    const { onChange } = await setupEditor({ initialContent: initial });

    await userEvent.click(screen.getByRole("button", TOGGLE));

    const textarea = screen.getByRole("textbox", SOURCE);
    expect(textarea).toHaveValue(initial);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("refleja en la vista renderizada lo editado en la vista Markdown", async () => {
    const { onChange } = await setupEditor({ initialContent: "Hola" });
    await userEvent.click(screen.getByRole("button", TOGGLE));

    const textarea = screen.getByRole("textbox", SOURCE);
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "## Nuevo título");
    expect(onChange).toHaveBeenLastCalledWith("## Nuevo título");

    await userEvent.click(screen.getByRole("button", TOGGLE));
    await screen.findByRole("textbox", WYSIWYG);
    expect(
      screen.getByRole("heading", { level: 2, name: "Nuevo título" }),
    ).toBeInTheDocument();
  });

  it("alternar repetidamente sin editar preserva el contenido bit a bit", async () => {
    // Formato deliberadamente no canónico: no debe ser reescrito jamás
    const initial = "# T\n\n*   item uno\n*   item __dos__\n";
    const { onChange } = await setupEditor({ initialContent: initial });
    const toggle = screen.getByRole("button", TOGGLE);

    for (let i = 0; i < 3; i += 1) {
      await userEvent.click(toggle);
      expect(screen.getByRole("textbox", SOURCE)).toHaveValue(initial);
      await userEvent.click(toggle);
      await screen.findByRole("textbox", WYSIWYG);
    }
    expect(onChange).not.toHaveBeenCalled();
  });

  it("el botón </> expone su estado con aria-pressed", async () => {
    await setupEditor({});
    const toggle = screen.getByRole("button", TOGGLE);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });
});

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupEditor } from "./helpers";

const LINK_MD = "Visitá [nuestro sitio](https://ejemplo.com)\n";

describe("US3: popover de acciones sobre un enlace existente", () => {
  it("un clic sobre el enlace muestra el menú con las 3 acciones en orden", async () => {
    const { pm } = await setupEditor({ initialContent: LINK_MD });
    const link = pm.querySelector("a") as HTMLElement;
    await userEvent.click(link);

    const menu = await screen.findByRole("menu", {
      name: "Acciones del enlace",
    });
    const items = screen.getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Ir a la url",
      "Copiar url",
      "Editar url",
    ]);
    expect(menu.querySelector("hr")).not.toBeNull();
  });

  it("'Ir a la url' abre la URL en una pestaña nueva y segura", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const { pm } = await setupEditor({ initialContent: LINK_MD });
    await userEvent.click(pm.querySelector("a") as HTMLElement);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Ir a la url" }),
    );

    expect(openSpy).toHaveBeenCalledWith(
      "https://ejemplo.com",
      "_blank",
      "noopener,noreferrer",
    );
    openSpy.mockRestore();
  });

  it("'Copiar url' copia la URL exacta del enlace", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const { pm } = await setupEditor({ initialContent: LINK_MD });
    await userEvent.click(pm.querySelector("a") as HTMLElement);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Copiar url" }),
    );

    expect(writeText).toHaveBeenCalledWith("https://ejemplo.com");
  });

  it("'Editar url' muestra input, 'Eliminar link' y 'Guardar'", async () => {
    const { pm } = await setupEditor({ initialContent: LINK_MD });
    await userEvent.click(pm.querySelector("a") as HTMLElement);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Editar url" }),
    );

    const dialog = screen.getByRole("dialog", { name: "Editar enlace" });
    expect(screen.getByLabelText("URL del enlace")).toHaveValue(
      "https://ejemplo.com",
    );
    expect(
      screen.getByRole("button", { name: "Eliminar link" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
    expect(dialog).toBeInTheDocument();
  });

  it("'Guardar' con URL sin protocolo la autocompleta y cierra el panel", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: LINK_MD });
    await userEvent.click(pm.querySelector("a") as HTMLElement);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Editar url" }),
    );

    const input = screen.getByLabelText("URL del enlace");
    await userEvent.clear(input);
    await userEvent.type(input, "www.otro-sitio.com");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(pm.querySelector("a")).toHaveAttribute(
      "href",
      "http://www.otro-sitio.com",
    );
    expect(screen.queryByRole("dialog", { name: "Editar enlace" })).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith(
      "Visitá [nuestro sitio](http://www.otro-sitio.com)\n",
    );
  });

  it("'Guardar' con el campo vacío no aplica ningún cambio", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: LINK_MD });
    await userEvent.click(pm.querySelector("a") as HTMLElement);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Editar url" }),
    );

    const input = screen.getByLabelText("URL del enlace");
    await userEvent.clear(input);
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(pm.querySelector("a")).toHaveAttribute(
      "href",
      "https://ejemplo.com",
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("'Eliminar link' quita el enlace preservando el texto y cierra el panel", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: LINK_MD });
    await userEvent.click(pm.querySelector("a") as HTMLElement);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Editar url" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Eliminar link" }),
    );

    expect(pm.querySelector("a")).toBeNull();
    expect(pm).toHaveTextContent("Visitá nuestro sitio");
    expect(screen.queryByRole("dialog", { name: "Editar enlace" })).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith("Visitá nuestro sitio\n");
  });

  it("Escape cierra el panel sin aplicar cambios", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: LINK_MD });
    await userEvent.click(pm.querySelector("a") as HTMLElement);
    await screen.findByRole("menu", { name: "Acciones del enlace" });
    await userEvent.keyboard("{Escape}");

    expect(
      screen.queryByRole("menu", { name: "Acciones del enlace" }),
    ).toBeNull();
    expect(pm.querySelector("a")).toHaveAttribute(
      "href",
      "https://ejemplo.com",
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("un clic fuera del panel lo cierra sin aplicar cambios", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: LINK_MD });
    await userEvent.click(pm.querySelector("a") as HTMLElement);
    await screen.findByRole("menu", { name: "Acciones del enlace" });
    await userEvent.click(document.body);

    expect(
      screen.queryByRole("menu", { name: "Acciones del enlace" }),
    ).toBeNull();
    expect(pm.querySelector("a")).toHaveAttribute(
      "href",
      "https://ejemplo.com",
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("en modo onlyView el popover solo muestra 'Ir a la url' y 'Copiar url'", async () => {
    const { pm } = await setupEditor({
      initialContent: LINK_MD,
      onlyView: true,
    });
    await userEvent.click(pm.querySelector("a") as HTMLElement);

    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Ir a la url",
      "Copiar url",
    ]);
    expect(
      screen.queryByRole("menuitem", { name: "Editar url" }),
    ).not.toBeInTheDocument();
  });
});

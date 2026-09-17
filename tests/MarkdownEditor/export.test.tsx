import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { setupEditor } from "./helpers";

describe("US4: exportar el contenido", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
  });

  const initial = "# Hola\n\nAdiós **mundo**\n";

  it("copia el contenido como Markdown exacto", async () => {
    await setupEditor({ initialContent: initial });
    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Copiar como Markdown" }),
    );
    expect(writeText).toHaveBeenCalledWith(initial);
  });

  it("copia el contenido como HTML equivalente", async () => {
    await setupEditor({ initialContent: initial });
    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Copiar como HTML" }),
    );
    const html = writeText.mock.lastCall?.[0] as string;
    expect(html).toContain("<h1>Hola</h1>");
    expect(html).toContain("<strong>mundo</strong>");
  });

  it("exporta el estado actual tras una edición en la vista Markdown", async () => {
    await setupEditor({ initialContent: "" });
    await userEvent.click(
      screen.getByRole("button", { name: "Ver código Markdown" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Código fuente Markdown" }),
      "# Nuevo",
    );
    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Copiar como Markdown" }),
    );
    expect(writeText).toHaveBeenCalledWith("# Nuevo");
  });
});

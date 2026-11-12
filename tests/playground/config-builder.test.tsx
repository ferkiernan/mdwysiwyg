import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigBuilder } from "../../playground/builder/ConfigBuilder";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

function stubClipboard(result: "ok" | "fail") {
  const writeText = vi.fn(() => (result === "ok" ? Promise.resolve() : Promise.reject(new Error("denegado"))));
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  return writeText;
}

describe("constructor del playground", () => {
  it("muestra ambas secciones, la vista previa y el enlace a la guía", async () => {
    render(<ConfigBuilder />);
    expect(screen.getByRole("heading", { name: "Seleccioná los atributos de tu control" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Theming" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Vista previa" })).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: /Cómo implementar estilos en tu host/ });
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[0]).toHaveAttribute("rel", "noopener noreferrer");
    expect(links[0]).toHaveAccessibleName(/se abre en una pestaña nueva/);
    await screen.findByRole("textbox", { name: "Editor de texto enriquecido" });
  });

  it("cambiar un atributo actualiza los atributos copiados y la vista previa", async () => {
    const writeText = stubClipboard("ok");
    render(<ConfigBuilder />);
    await userEvent.click(screen.getByRole("checkbox", { name: /autoHideBar/ }));
    await userEvent.click(screen.getByRole("button", { name: "Copiar atributos" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("  autoHideBar"));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('className="mi-editor"'));
    expect(await screen.findByText("¡Copiado!")).toBeInTheDocument();
    // La barra de la vista previa queda oculta sin foco.
    expect(screen.queryByRole("toolbar", { name: "Barra de herramientas" })).toBeNull();
  });

  it("«Crear CSS» copia el CSS que muestra el panel", async () => {
    const writeText = stubClipboard("ok");
    render(<ConfigBuilder />);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Preset" }), "dark-full");
    const panel = screen.getByLabelText("CSS final para tu host");
    expect(panel.textContent).toContain("--mdw-bg: #0b1220;");
    await userEvent.click(screen.getByRole("button", { name: "Crear CSS" }));
    expect(writeText).toHaveBeenCalledWith(panel.textContent);
  });

  it("conserva los presets de la versión anterior", () => {
    render(<ConfigBuilder />);
    const select = screen.getByRole("combobox", { name: "Preset" }) as HTMLSelectElement;
    const labels = Array.from(select.options).map((o) => o.textContent);
    expect(labels).toEqual(
      expect.arrayContaining(["Default", "Oscuro", "Notebook (pastel)", "Terminal", "Winamp", "CG Theme", "Anthropic"]),
    );
  });

  it("si el portapapeles falla muestra el texto para copiar a mano", async () => {
    stubClipboard("fail");
    render(<ConfigBuilder />);
    await userEvent.click(screen.getByRole("button", { name: "Copiar atributos" }));
    const fallback = await screen.findByRole("textbox", { name: "Texto para copiar" });
    expect((fallback as HTMLTextAreaElement).value).toContain("<MarkdownEditor");
  });

  it("recuerda las elecciones y «Empezar de nuevo» las borra", async () => {
    const { unmount } = render(<ConfigBuilder />);
    await userEvent.click(screen.getByRole("checkbox", { name: /autoHeight/ }));
    unmount();
    render(<ConfigBuilder />);
    expect(screen.getByRole("checkbox", { name: /autoHeight/ })).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Empezar de nuevo" }));
    expect(screen.getByRole("checkbox", { name: /autoHeight/ })).not.toBeChecked();
  });

  it("avisa de dependencias junto al atributo afectado", async () => {
    render(<ConfigBuilder />);
    await userEvent.click(screen.getByRole("checkbox", { name: /^onlyView$/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: /historyUndo/ }));
    const section = screen.getByRole("region", { name: "Seleccioná los atributos de tu control" });
    expect(within(section).getByText(/No tiene efecto con onlyView/)).toBeInTheDocument();
  });

  it("borrar todo compareContent mantiene la comparación y el original", async () => {
    render(<ConfigBuilder />);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: /^mode/ }), "compare");
    const content = screen.getByRole("textbox", { name: /compareContent/ });
    await userEvent.type(content, "propuesta");
    const original = await screen.findByRole("group", { name: "Contenido original (solo lectura)" });
    expect(original).toHaveTextContent("Documento de ejemplo");
    await userEvent.clear(content);
    expect(screen.getByRole("group", { name: "Contenido original (solo lectura)" })).toHaveTextContent(
      "Documento de ejemplo",
    );
    await userEvent.type(content, "otra");
    expect(screen.getByRole("group", { name: "Contenido original (solo lectura)" })).toHaveTextContent(
      "Documento de ejemplo",
    );
  });
});

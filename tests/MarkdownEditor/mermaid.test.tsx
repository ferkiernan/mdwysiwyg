import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { setupEditor } from "./helpers";

// La librería real es pesada y depende de layout de navegador: se mockea para
// verificar el comportamiento observable del editor, no el motor de Mermaid.
const parseMock = vi.fn();
const renderMock = vi.fn();

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    parse: (...args: unknown[]) => parseMock(...args),
    render: (...args: unknown[]) => renderMock(...args),
  },
}));

const VALID_DIAGRAM = "graph TD\nA-->B";
const MERMAID_MD = "```mermaid\ngraph TD\nA-->B\n```\n";

beforeEach(() => {
  parseMock.mockReset();
  renderMock.mockReset();
  parseMock.mockResolvedValue({ diagramType: "flowchart-v2" });
  renderMock.mockResolvedValue({ svg: "<svg data-testid='diagram'></svg>" });
});

describe("US4: diagramas Mermaid", () => {
  it("renderiza un bloque mermaid válido como diagrama SVG", async () => {
    const { pm } = await setupEditor({ initialContent: MERMAID_MD });

    await waitFor(() => {
      expect(pm.querySelector("[data-mermaid-block] svg")).not.toBeNull();
    });
    expect(renderMock).toHaveBeenCalled();
  });

  it("el SVG del diagrama es accesible", async () => {
    const { pm } = await setupEditor({ initialContent: MERMAID_MD });

    await waitFor(() => {
      const svg = pm.querySelector("[data-mermaid-block] svg");
      expect(svg?.getAttribute("role")).toBe("img");
      expect(svg?.getAttribute("aria-label")).toBe("Diagrama Mermaid");
    });
  });

  it("degrada a texto legible con sintaxis inválida", async () => {
    parseMock.mockResolvedValue(false);
    const { pm } = await setupEditor({ initialContent: MERMAID_MD });

    await waitFor(() => {
      const block = pm.querySelector("[data-mermaid-block]");
      expect(block?.textContent).toContain("graph TD");
    });
    expect(pm.querySelector("[data-mermaid-block] svg")).toBeNull();
  });

  it("no altera el Markdown fuente al alternar de vista", async () => {
    const { onChange } = await setupEditor({ initialContent: MERMAID_MD });
    const toggle = screen.getByRole("button", { name: "Ver código Markdown" });

    await userEvent.click(toggle);
    expect(
      screen.getByRole("textbox", { name: "Código fuente Markdown" }),
    ).toHaveValue(MERMAID_MD);

    await userEvent.click(toggle);
    await screen.findByRole("textbox", { name: "Editor de texto enriquecido" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("insertar HTML con sintaxis Mermaid crea un bloque de código mermaid", async () => {
    const { onChange, pm } = await setupEditor({});
    await userEvent.click(screen.getByRole("button", { name: "Insertar HTML" }));
    const field = screen.getByLabelText("Código HTML");
    await userEvent.click(field);
    await userEvent.paste(VALID_DIAGRAM);
    await userEvent.click(screen.getByRole("button", { name: "Insertar" }));

    await waitFor(() => {
      expect(onChange.mock.lastCall?.[0]).toContain("```mermaid");
    });
    expect(pm.querySelector("[data-html-block]")).toBeNull();
  });

  it("insertar HTML no-Mermaid sigue creando un bloque de HTML embebido", async () => {
    const { onChange, pm } = await setupEditor({});
    await userEvent.click(screen.getByRole("button", { name: "Insertar HTML" }));
    const field = screen.getByLabelText("Código HTML");
    await userEvent.click(field);
    await userEvent.paste("<b>hola</b>");
    await userEvent.click(screen.getByRole("button", { name: "Insertar" }));

    await waitFor(() => {
      expect(pm.querySelector("[data-html-block]")).not.toBeNull();
    });
    expect(onChange.mock.lastCall?.[0]).not.toContain("```mermaid");
    // El filtro de palabras clave evita cargar la librería para HTML común.
    expect(parseMock).not.toHaveBeenCalled();
  });
});

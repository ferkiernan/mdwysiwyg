import { afterEach, describe, it, expect, vi } from "vitest";
import { fireEvent, waitFor } from "@testing-library/react";
import { editorHtmlToMarkdown, markdownToEditorHtml } from "../../src/components/MarkdownEditor/markdown/pipeline";
import { applyColumnWidths, splitRow } from "../../src/components/MarkdownEditor/markdown/columnWidths";
import { setupEditor } from "./helpers";

const AUTO = "| Columna | Valor |\n| ------- | ----- |\n| Uno     | 1     |\n";
const WIDE = "| Columna      | Valor |\n| ------------ | ----- |\n| Uno          | 1     |\n";

const roundTrip = (md: string) => editorHtmlToMarkdown(markdownToEditorHtml(md));
const separator = (md: string) => md.split("\n")[1];

afterEach(() => vi.restoreAllMocks());

describe("023: el ancho de columna vive en los guiones de la fila separadora", () => {
  it("tablas con relleno automático (o guiones mínimos) no cambian: sin ancho explícito", () => {
    expect(markdownToEditorHtml(AUTO)).not.toContain("colwidth");
    expect(markdownToEditorHtml("| a | b |\n|---|---|\n| c | d |\n")).not.toContain("colwidth");
    expect(roundTrip(AUTO)).toBe(AUTO);
  });

  it("guiones distintos del relleno automático son un ancho: 1 guion = 8 px, ida y vuelta idéntica", () => {
    expect(markdownToEditorHtml(WIDE)).toMatch(/<th colwidth="96">Columna<\/th>/);
    expect(markdownToEditorHtml(WIDE)).not.toMatch(/<th colwidth="\d+">Valor/);
    expect(roundTrip(WIDE)).toBe(WIDE);
  });

  it("se conservan los marcadores de alineación; los dos puntos no cuentan como guiones", () => {
    const md = "| Columna     |   Valor   |\n| ----------: | :-------: |\n|         Uno |     1     |\n";
    const html = markdownToEditorHtml(md);
    expect(html).toMatch(/colwidth="80"[^>]*>Columna|>Columna/);
    expect(separator(roundTrip(md))).toBe("| ----------: | :-------: |");
  });

  it("escribir anchos en una tabla generada alinea las barras de esa columna", () => {
    const out = applyColumnWidths(AUTO, [[96, null]]);
    expect(out).toBe(WIDE);
  });

  it("un ancho igual al relleno automático se escribe con un guion más para no perderse", () => {
    expect(separator(applyColumnWidths(AUTO, [[56, null]]))).toBe("| -------- | ----- |");
  });

  it("tablas dentro de citas y celdas con barras escapadas", () => {
    expect(splitRow("| a \\| b | c |")).toEqual(["a \\| b", "c"]);
    const md = "> | Columna      | Valor |\n> | ------------ | ----- |\n> | Uno          | 1     |\n";
    expect(roundTrip(md)).toBe(md);
  });
});

function stubRect(element: Element, rect: { left: number; top: number; width: number; height: number }) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    ...rect,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
  } as DOMRect);
}

async function setupTable(props = {}) {
  const setup = await setupEditor({ initialContent: AUTO, ...props });
  const header = setup.pm.querySelector("th") as HTMLElement;
  stubRect(header, { left: 0, top: 0, width: 80, height: 30 });
  return { ...setup, header };
}

describe("023: arrastrar el borde derecho de un encabezado", () => {
  it("la mitad inferior del borde derecho muestra la doble flecha; la superior y el resto de la celda no", async () => {
    const { pm, header } = await setupTable();
    fireEvent.mouseMove(header, { clientX: 79, clientY: 25 });
    expect(pm).toHaveClass("mdw-column-resize");
    fireEvent.mouseMove(header, { clientX: 79, clientY: 5 });
    expect(pm).not.toHaveClass("mdw-column-resize");
    fireEvent.mouseMove(header, { clientX: 40, clientY: 25 });
    expect(pm).not.toHaveClass("mdw-column-resize");
  });

  it("arrastrar cambia el ancho y lo escribe en el Markdown en un solo cambio", async () => {
    const { pm, header, onChange } = await setupTable();
    fireEvent.mouseDown(header, { clientX: 79, clientY: 25, button: 0 });
    fireEvent.mouseMove(document, { clientX: 120, clientY: 25 });
    fireEvent.mouseMove(document, { clientX: 179, clientY: 25 });
    fireEvent.mouseUp(document, { clientX: 179, clientY: 25 });
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(onChange).toHaveBeenCalledTimes(1);
    const md = String(onChange.mock.calls[0]?.[0]);
    expect(separator(md)).toBe(`| ${"-".repeat(23)} | ----- |`);
    expect(pm.querySelector("th")).toHaveAttribute("colwidth", "184");
  });

  it("no baja del mínimo", async () => {
    const { header, onChange } = await setupTable();
    fireEvent.mouseDown(header, { clientX: 79, clientY: 25, button: 0 });
    fireEvent.mouseMove(document, { clientX: -500, clientY: 25 });
    fireEvent.mouseUp(document);
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(separator(String(onChange.mock.calls[0]?.[0]))).toBe("| ----- | ----- |");
  });

  it("en solo lectura no hay área de arrastre", async () => {
    const { pm, header, onChange } = await setupTable({ onlyView: true });
    fireEvent.mouseMove(header, { clientX: 79, clientY: 25 });
    expect(pm).not.toHaveClass("mdw-column-resize");
    fireEvent.mouseDown(header, { clientX: 79, clientY: 25, button: 0 });
    fireEvent.mouseMove(document, { clientX: 179, clientY: 25 });
    fireEvent.mouseUp(document);
    expect(onChange).not.toHaveBeenCalled();
  });
});

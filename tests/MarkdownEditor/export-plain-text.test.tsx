import { beforeEach, describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { markdownToPlainText } from "../../src/components/MarkdownEditor/markdown/plainText";
import { setupEditor } from "./helpers";

const NL = String.fromCharCode(10);
const TAB = String.fromCharCode(9);
const lines = (...rows: string[]) => rows.join(NL);

describe("markdownToPlainText", () => {
  it("quita la sintaxis de encabezados, énfasis, código en línea y citas", () => {
    expect(markdownToPlainText(lines("# Título", "", "Texto **fuerte**, *cursiva*, ~~tachado~~ y `código`.", "", "> Una cita"))).toBe(
      lines("Título", "", "Texto fuerte, cursiva, tachado y código.", "", "Una cita"),
    );
  });

  it("enlaces como texto (dirección), sin repetir la dirección; imágenes como su texto alternativo", () => {
    expect(markdownToPlainText("Ver [la guía](https://a.b/g) o https://a.b y ![logo](x.png)")).toBe(
      "Ver la guía (https://a.b/g) o https://a.b y logo",
    );
  });

  it("listas con marcadores simples y sangría por nivel", () => {
    expect(markdownToPlainText(lines("- uno", "  - uno.a", "- dos", "", "1. primero", "2. segundo", "", "- [ ] pendiente", "- [x] hecha"))).toBe(
      lines("- uno", "  - uno.a", "- dos", "", "1. primero", "2. segundo", "", "- [ ] pendiente", "- [x] hecha"),
    );
  });

  it("tablas con celdas separadas por tabuladores", () => {
    expect(markdownToPlainText(lines("| Fase | Estado |", "| --- | --- |", "| Diseño | **Hecho** |"))).toBe(
      lines(`Fase${TAB}Estado`, `Diseño${TAB}Hecho`),
    );
  });

  it("código y diagramas tal cual, sin las vallas", () => {
    expect(markdownToPlainText(lines("```js", "const a = 1;", "```", "", "```mermaid", "graph TD", "```"))).toBe(
      lines("const a = 1;", "", "graph TD"),
    );
  });

  it("HTML embebido: solo su texto visible; caracteres escapados como literales", () => {
    expect(markdownToPlainText(lines('<div style="color: red"><b>Hola</b> &amp; chau</div>', "", "un \\*literal\\*"))).toBe(
      lines("Hola & chau", "", "un *literal*"),
    );
  });

  it("documento vacío", () => {
    expect(markdownToPlainText("")).toBe("");
  });
});

describe("menú Export: Copiar como TXT", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  });

  it("aparece después de «Copiar como HTML» y copia el texto plano", async () => {
    await setupEditor({ initialContent: "# Hola\n\nAdiós **mundo**\n" });
    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    const items = screen.getAllByRole("menuitem").map((item) => item.textContent);
    expect(items).toEqual(["Copiar como Markdown", "Copiar como HTML", "Copiar como TXT"]);

    await userEvent.click(screen.getByRole("menuitem", { name: "Copiar como TXT" }));
    expect(writeText).toHaveBeenCalledWith(lines("Hola", "", "Adiós mundo"));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByRole("button", { name: "Export" })).toHaveFocus();
  });

  it("también funciona en la barra reducida de onlyView", async () => {
    await setupEditor({ initialContent: "- **a**\n- b\n", onlyView: true });
    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Copiar como TXT" }));
    expect(writeText).toHaveBeenLastCalledWith(lines("- a", "- b"));
  });
});

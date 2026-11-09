import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../../src";
import {
  expectHighlighted,
  highlighted,
  setupCompare,
} from "./helpers";

const TEXTBOX = { name: "Editor de texto enriquecido" };

describe("US1: original y nuevo lado a lado con diferencias resaltadas", () => {
  it("side-to-side: original a la izquierda y nuevo a la derecha", async () => {
    const { originalPane, newPane } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
      compareOrientation: "side-to-side",
    });

    const layout = originalPane.parentElement as HTMLElement;
    expect(layout).toBe(newPane.parentElement);
    expect(layout).toHaveAttribute("data-compare-orientation", "side-to-side");
    expect(
      originalPane.compareDocumentPosition(newPane) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(originalPane).toHaveTextContent("A B C");
    expect(newPane).toHaveTextContent("A X C");
  });

  it("up-and-down: original arriba y nuevo abajo", async () => {
    const { originalPane, newPane } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
      compareOrientation: "up-and-down",
    });

    const layout = originalPane.parentElement as HTMLElement;
    expect(layout).toHaveAttribute("data-compare-orientation", "up-and-down");
    expect(
      originalPane.compareDocumentPosition(newPane) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("solo la palabra cambiada del panel nuevo se resalta; el original no", async () => {
    const { originalPane, newPane } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
    });

    await expectHighlighted(newPane, ["X"]);
    expect(highlighted(originalPane)).toEqual([]);
  });

  it("contenido idéntico: nada resaltado", async () => {
    const { newPane } = await setupCompare({
      initialContent: "# Título\n\nUn párrafo con **negrita**.",
      compareContent: "# Título\n\nUn párrafo con **negrita**.",
    });

    await waitFor(() =>
      expect(newPane).toHaveAccessibleDescription("Sin diferencias"),
    );
    expect(highlighted(newPane)).toEqual([]);
    expect(newPane.querySelector("[data-compare]")).toBeNull();
  });

  it("un párrafo añadido se resalta entero", async () => {
    const { newPane } = await setupCompare({
      initialContent: "Uno\n\nDos",
      compareContent: "Uno\n\nNuevo párrafo\n\nDos",
    });

    await expectHighlighted(newPane, ["Nuevo párrafo"]);
    const added = newPane.querySelectorAll('p[data-compare="added"]');
    expect(Array.from(added).map((p) => p.textContent)).toEqual([
      "Nuevo párrafo",
    ]);
  });

  it("un elemento de lista añadido se resalta entero", async () => {
    const { newPane } = await setupCompare({
      initialContent: "- a\n- b",
      compareContent: "- a\n- nuevo\n- b",
    });

    await expectHighlighted(newPane, ["nuevo"]);
    const added = newPane.querySelectorAll('li[data-compare="added"]');
    expect(Array.from(added).map((li) => li.textContent)).toEqual(["nuevo"]);
  });

  it("una fila de tabla añadida se resalta entera", async () => {
    const original = "| A | B |\n| - | - |\n| 1 | 2 |\n";
    const { newPane } = await setupCompare({
      initialContent: original,
      compareContent: "| A | B |\n| - | - |\n| 1 | 2 |\n| 3 | 4 |\n",
    });

    await expectHighlighted(newPane, ["3", "4"]);
    const rows = newPane.querySelectorAll('tr[data-compare="added"]');
    expect(Array.from(rows).map((row) => row.textContent)).toEqual(["34"]);
  });

  it("un bloque de código añadido se resalta entero", async () => {
    const { newPane } = await setupCompare({
      initialContent: "Texto",
      compareContent: "Texto\n\n```js\nconst a = 1;\n```",
    });

    await waitFor(() =>
      expect(newPane.querySelector('pre[data-compare="added"]')).not.toBeNull(),
    );
  });

  it("en un bloque de código se resaltan solo las líneas cambiadas", async () => {
    const { newPane } = await setupCompare({
      initialContent: "```js\nconst a = 1;\nconst b = 2;\nconst c = 3;\n```",
      compareContent: "```js\nconst a = 1;\nconst b = 20;\nconst c = 3;\n```",
    });

    // El resaltado de sintaxis puede partir el <mark> en varios; juntos cubren la línea.
    await waitFor(() =>
      expect(highlighted(newPane).join("")).toBe("const b = 20;"),
    );
  });

  it("un cambio solo de borrado no resalta nada en el panel nuevo", async () => {
    const { newPane } = await setupCompare({
      initialContent: "Uno\n\nDos",
      compareContent: "Uno",
    });

    await waitFor(() =>
      expect(newPane).toHaveAccessibleDescription("Solo hay contenido eliminado"),
    );
    expect(highlighted(newPane)).toEqual([]);
  });

  it("un cambio solo de formato (palabra en negrita) se considera diferencia", async () => {
    const { newPane } = await setupCompare({
      initialContent: "uno dos tres",
      compareContent: "uno **dos** tres",
    });

    await expectHighlighted(newPane, ["dos"]);
  });

  it("un cambio de nivel de encabezado resalta el encabezado entero", async () => {
    const { newPane } = await setupCompare({
      initialContent: "# Título",
      compareContent: "## Título",
    });

    await waitFor(() =>
      expect(newPane.querySelector('h2[data-compare="added"]')).not.toBeNull(),
    );
  });

  it("describe el panel nuevo con el número de diferencias resaltadas", async () => {
    const { newPane } = await setupCompare({
      initialContent: "uno dos tres cuatro",
      compareContent: "uno DOS tres CUATRO",
    });

    await waitFor(() =>
      expect(newPane).toHaveAccessibleDescription("2 diferencias resaltadas"),
    );
  });
});

describe("US1: sin modo de comparación el comportamiento no cambia", () => {
  it("sin la prop mode: un solo panel, sin marcas ni barra de comparación", async () => {
    render(<MarkdownEditor initialContent="A B C" compareContent="A X C" />);
    await screen.findByRole("textbox", TEXTBOX);

    expect(screen.queryByRole("group", { name: /Contenido/ })).toBeNull();
    expect(screen.queryByRole("toolbar", { name: "Barra de comparación" })).toBeNull();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(document.querySelector("mark")).toBeNull();
  });

  it('mode="default" con orientación y contenido: se ignoran', async () => {
    render(
      <MarkdownEditor
        mode="default"
        compareOrientation="side-to-side"
        compareContent="otro"
        initialContent="A B C"
      />,
    );
    const textbox = await screen.findByRole("textbox", TEXTBOX);

    expect(textbox).toHaveTextContent("A B C");
    expect(screen.queryByRole("group", { name: /Contenido/ })).toBeNull();
  });

  it("compare sin orientación se comporta como default", async () => {
    render(
      <MarkdownEditor mode="compare" compareContent="nuevo" initialContent="viejo" />,
    );
    const textbox = await screen.findByRole("textbox", TEXTBOX);

    expect(textbox).toHaveTextContent("viejo");
    expect(screen.queryByRole("group", { name: /Contenido/ })).toBeNull();
    expect(screen.queryByRole("toolbar", { name: "Barra de comparación" })).toBeNull();
  });

  it("compare sin contenido nuevo se comporta como default", async () => {
    render(
      <MarkdownEditor
        mode="compare"
        compareOrientation="up-and-down"
        initialContent="viejo"
      />,
    );
    const textbox = await screen.findByRole("textbox", TEXTBOX);

    expect(textbox).toHaveTextContent("viejo");
    expect(screen.queryByRole("group", { name: /Contenido/ })).toBeNull();
  });
});

describe("US5: cambiar modo, orientación o contenido nuevo en tiempo real", () => {
  it("cambiar la orientación recoloca los paneles y conserva el panel nuevo con sus ediciones, sin remontar", async () => {
    const { update, newPane, originalPane, onChange } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
      compareOrientation: "side-to-side",
    });
    const pm = screen.getByRole("textbox", TEXTBOX);
    await userEvent.click(pm);
    await userEvent.keyboard(" extra");
    onChange.mockClear();

    update({ compareOrientation: "up-and-down" });

    const layout = newPane.parentElement as HTMLElement;
    expect(layout).toHaveAttribute("data-compare-orientation", "up-and-down");
    expect(screen.getByRole("textbox", TEXTBOX)).toBe(pm);
    expect(document.contains(pm)).toBe(true);
    expect(pm).toHaveTextContent("A X C extra");
    expect(originalPane).toHaveTextContent("A B C");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("de modo normal a comparación: el contenido actual pasa a ser el original", async () => {
    const onChange = vi.fn();
    const view = render(
      <MarkdownEditor onChange={onChange} initialContent="contenido actual" />,
    );
    await screen.findByRole("textbox", TEXTBOX);
    expect(screen.queryByRole("group", { name: /Contenido/ })).toBeNull();

    view.rerender(
      <MarkdownEditor
        onChange={onChange}
        initialContent="contenido actual"
        mode="compare"
        compareOrientation="side-to-side"
        compareContent="contenido propuesto"
      />,
    );

    const original = await screen.findByRole("group", {
      name: "Contenido original (solo lectura)",
    });
    const next = screen.getByRole("group", { name: /Contenido nuevo/ });
    expect(original).toHaveTextContent("contenido actual");
    expect(next).toHaveTextContent("contenido propuesto");
    expect(screen.getByRole("toolbar", { name: "Barra de comparación" })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("un compareContent distinto reemplaza el panel nuevo, descarta ediciones y conserva el original", async () => {
    const { update, originalPane, newPane } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
    });
    const pm = screen.getByRole("textbox", TEXTBOX);
    await userEvent.click(pm);
    await userEvent.keyboard(" extra");

    update({ compareContent: "A Y C" });

    await waitFor(() => expect(newPane).toHaveTextContent("A Y C"));
    expect(newPane).not.toHaveTextContent("extra");
    expect(originalPane).toHaveTextContent("A B C");
    await expectHighlighted(newPane, ["Y"]);
    expect(screen.queryByRole("button", { name: "Restaurar" })).toBeNull();
  });

  it("de comparación a modo normal: el editor único muestra el contenido del panel nuevo", async () => {
    const { update, onChange } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
    });
    const pm = screen.getByRole("textbox", TEXTBOX);
    await userEvent.click(pm);
    await userEvent.keyboard(" extra");
    onChange.mockClear();

    update({ mode: "default" });

    expect(screen.queryByRole("group", { name: /Contenido/ })).toBeNull();
    expect(screen.queryByRole("toolbar", { name: "Barra de comparación" })).toBeNull();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getByRole("textbox", TEXTBOX)).toHaveTextContent("A X C extra");
    expect(document.querySelector("mark")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("al cambiar onlyView en comparación el resaltado se mantiene", async () => {
    const { update, newPane } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
    });
    await expectHighlighted(newPane, ["X"]);

    update({ onlyView: true });

    const next = await screen.findByRole("group", { name: "Contenido nuevo (solo lectura)" });
    await expectHighlighted(next, ["X"]);
  });
});

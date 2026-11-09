import { createRef } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../../src";
import type { MarkdownEditorHandle } from "../../src";
import { expectHighlighted, highlighted, selectAll, setupCompare } from "./helpers";

const NEW_TEXTBOX = { name: "Editor de texto enriquecido" };
const ORIGINAL_TEXTBOX = { name: "Texto original (solo lectura)" };
const TOGGLE = { name: "Ver código Markdown" };
const NEW_SOURCE = { name: "Código fuente Markdown" };
const ORIGINAL_SOURCE = { name: "Código fuente Markdown original (solo lectura)" };

describe("US2: editar solo el lado nuevo", () => {
  it("escribir en el panel nuevo cambia el texto, notifica onChange y actualiza el resaltado", async () => {
    const { onChange, newPane } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
    });
    await expectHighlighted(newPane, ["X"]);

    const pm = screen.getByRole("textbox", NEW_TEXTBOX);
    await userEvent.click(pm);
    await userEvent.keyboard(" extra");

    expect(pm).toHaveTextContent("A X C extra");
    expect(onChange).toHaveBeenLastCalledWith("A X C extra\n");
    await expectHighlighted(newPane, ["X", "extra"]);
  });

  it("el panel original no es editable y no cambia al escribir", async () => {
    const { onChange, originalPane } = await setupCompare({
      initialContent: "Original",
      compareContent: "Nuevo",
    });

    const originalBox = screen.getByRole("textbox", ORIGINAL_TEXTBOX);
    expect(originalBox).toHaveAttribute("contenteditable", "false");
    expect(originalBox).toHaveAttribute("aria-readonly", "true");

    await userEvent.type(originalBox, "intento");

    expect(originalPane).toHaveTextContent("Original");
    expect(originalPane).not.toHaveTextContent("intento");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("solo hay un editor con el nombre del editor de texto enriquecido", async () => {
    await setupCompare({ initialContent: "a", compareContent: "b" });

    expect(screen.getAllByRole("textbox", NEW_TEXTBOX)).toHaveLength(1);
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
  });

  it("los botones de formato de la barra se aplican al panel nuevo", async () => {
    const { onChange, originalPane, newPane } = await setupCompare({
      initialContent: "texto",
      compareContent: "texto nuevo",
    });
    const pm = screen.getByRole("textbox", NEW_TEXTBOX);
    await userEvent.click(pm);
    selectAll(pm);

    await userEvent.click(screen.getByRole("button", { name: "Negrita" }));

    await waitFor(() => expect(newPane.querySelector("strong")).not.toBeNull());
    expect(originalPane.querySelector("strong")).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith("**texto nuevo**\n");
  });

  it("con onlyView ambos paneles son de solo lectura", async () => {
    const { onChange } = await setupCompare({
      onlyView: true,
      initialContent: "Original",
      compareContent: "Nuevo",
    });

    const newBox = screen.getByRole("textbox", NEW_TEXTBOX);
    expect(newBox).toHaveAttribute("contenteditable", "false");
    expect(screen.getByRole("textbox", ORIGINAL_TEXTBOX)).toHaveAttribute(
      "contenteditable",
      "false",
    );
    expect(screen.getByRole("group", { name: "Contenido nuevo (solo lectura)" })).toBeInTheDocument();

    await userEvent.type(newBox, "intento");
    expect(newBox).not.toHaveTextContent("intento");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("US2: vista Markdown en comparación", () => {
  it("el botón </> cambia ambos paneles a código Markdown, el original de solo lectura", async () => {
    const { originalPane, newPane } = await setupCompare({
      initialContent: "uno dos tres",
      compareContent: "uno cuatro tres",
    });

    await userEvent.click(screen.getByRole("button", TOGGLE));

    const originalSource = screen.getByRole("textbox", ORIGINAL_SOURCE);
    const newSource = screen.getByRole("textbox", NEW_SOURCE);
    expect(originalSource).toHaveValue("uno dos tres");
    expect(originalSource).toHaveAttribute("readonly");
    expect(newSource).toHaveValue("uno cuatro tres");
    expect(newSource).not.toHaveAttribute("readonly");
    expect(originalPane).toContainElement(originalSource);
    expect(newPane).toContainElement(newSource);
    expect(highlighted(newPane)).toEqual(["cuatro"]);
    expect(highlighted(originalPane)).toEqual([]);
  });

  it("editar el texto fuente nuevo actualiza el resaltado y la vista renderizada lo conserva", async () => {
    const { onChange, newPane } = await setupCompare({
      initialContent: "uno dos tres",
      compareContent: "uno cuatro tres",
    });
    await userEvent.click(screen.getByRole("button", TOGGLE));

    const newSource = screen.getByRole("textbox", NEW_SOURCE);
    // Al cambiar de vista el componente enfoca el texto fuente en el siguiente frame.
    await waitFor(() => expect(newSource).toHaveFocus());
    await userEvent.type(newSource, " cinco");

    expect(onChange).toHaveBeenLastCalledWith("uno cuatro tres cinco");
    expect(highlighted(newPane)).toEqual(["cuatro", "cinco"]);

    await userEvent.click(screen.getByRole("button", TOGGLE));
    await expectHighlighted(newPane, ["cuatro", "cinco"]);
  });

  it("al dejar el texto fuente igual al original, no queda nada resaltado", async () => {
    const { newPane } = await setupCompare({
      initialContent: "uno dos",
      compareContent: "uno tres",
    });
    await userEvent.click(screen.getByRole("button", TOGGLE));

    const newSource = screen.getByRole("textbox", NEW_SOURCE);
    await userEvent.clear(newSource);
    await userEvent.type(newSource, "uno dos");

    expect(highlighted(newPane)).toEqual([]);
    expect(newPane).toHaveAccessibleDescription("Sin diferencias");
  });
});

describe("US2: el resaltado sigue a las ediciones", () => {
  it("setMarkdown en el panel nuevo recalcula el resaltado", async () => {
    const ref = createRef<MarkdownEditorHandle>();
    render(
      <MarkdownEditor
        ref={ref}
        mode="compare"
        compareOrientation="side-to-side"
        initialContent="uno dos"
        compareContent="uno tres"
      />,
    );
    const newPane = await screen.findByRole("group", {
      name: "Contenido nuevo (editable)",
    });
    await expectHighlighted(newPane, ["tres"]);

    ref.current?.setMarkdown("uno dos");
    await waitFor(() => expect(highlighted(newPane)).toEqual([]));

    ref.current?.setMarkdown("otro dos");
    await expectHighlighted(newPane, ["otro"]);
  });
});

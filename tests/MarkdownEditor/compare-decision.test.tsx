import { createRef } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../../src";
import type { MarkdownEditorHandle } from "../../src";
import { expectHighlighted, highlighted, setupCompare } from "./helpers";

const NEW_TEXTBOX = { name: "Editor de texto enriquecido" };
const COMPARE_BAR = { name: "Barra de comparación" };
const REJECT = { name: "Rechazar cambio" };
const ACCEPT = { name: "Aceptar cambio" };
const RESTORE = { name: "Restaurar" };
const TOGGLE = { name: "Ver código Markdown" };
const NEW_SOURCE = { name: "Código fuente Markdown" };

describe("US3: aceptar o rechazar el cambio", () => {
  it("la barra de comparación está bajo la barra de herramientas con los dos botones", async () => {
    await setupCompare({ initialContent: "A B C", compareContent: "A X C" });

    const toolbar = screen.getByRole("toolbar", { name: "Barra de herramientas" });
    const bar = screen.getByRole("toolbar", COMPARE_BAR);
    expect(
      toolbar.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("button", REJECT)).toBeEnabled();
    expect(screen.getByRole("button", ACCEPT)).toBeEnabled();
  });

  it("aceptar sin editar notifica una vez con el Markdown nuevo y vuelve al modo normal", async () => {
    const { onChange, onCompareDecision } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
    });

    await userEvent.click(screen.getByRole("button", ACCEPT));

    expect(onCompareDecision).toHaveBeenCalledTimes(1);
    expect(onCompareDecision).toHaveBeenCalledWith({
      decision: "accepted",
      markdown: "A X C",
    });
    expect(onChange).toHaveBeenLastCalledWith("A X C");

    const pm = screen.getByRole("textbox", NEW_TEXTBOX);
    expect(pm).toHaveTextContent("A X C");
    expect(screen.queryByRole("group", { name: /Contenido/ })).toBeNull();
    expect(screen.queryByRole("toolbar", COMPARE_BAR)).toBeNull();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(document.querySelector("mark")).toBeNull();
    expect(screen.getByRole("toolbar", { name: "Barra de herramientas" })).toBeInTheDocument();
  });

  it("aceptar tras editar notifica el Markdown editado", async () => {
    const { onCompareDecision } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
    });
    const pm = screen.getByRole("textbox", NEW_TEXTBOX);
    await userEvent.click(pm);
    await userEvent.keyboard(" extra");

    await userEvent.click(screen.getByRole("button", ACCEPT));

    expect(onCompareDecision).toHaveBeenCalledTimes(1);
    expect(onCompareDecision).toHaveBeenCalledWith({
      decision: "accepted",
      markdown: "A X C extra\n",
    });
    expect(screen.getByRole("textbox", NEW_TEXTBOX)).toHaveTextContent("A X C extra");
  });

  it("rechazar notifica el Markdown original, descarta las ediciones y muestra el original", async () => {
    const { onChange, onCompareDecision } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
    });
    const pm = screen.getByRole("textbox", NEW_TEXTBOX);
    await userEvent.click(pm);
    await userEvent.keyboard(" extra");

    await userEvent.click(screen.getByRole("button", REJECT));

    expect(onCompareDecision).toHaveBeenCalledTimes(1);
    expect(onCompareDecision).toHaveBeenCalledWith({
      decision: "rejected",
      markdown: "A B C",
    });
    expect(onChange).toHaveBeenLastCalledWith("A B C");
    const after = screen.getByRole("textbox", NEW_TEXTBOX);
    expect(after).toHaveTextContent("A B C");
    expect(after).not.toHaveTextContent("extra");
    expect(screen.queryByRole("group", { name: /Contenido/ })).toBeNull();
    expect(screen.queryByRole("toolbar", COMPARE_BAR)).toBeNull();
  });

  it("tras decidir el foco queda en el editor", async () => {
    await setupCompare({ initialContent: "A B C", compareContent: "A X C" });

    await userEvent.click(screen.getByRole("button", ACCEPT));

    expect(screen.getByRole("textbox", NEW_TEXTBOX)).toHaveFocus();
  });

  it("en la vista Markdown aceptar conserva el texto fuente y el foco en él", async () => {
    const { onCompareDecision } = await setupCompare({
      initialContent: "uno dos",
      compareContent: "uno tres",
    });
    await userEvent.click(screen.getByRole("button", TOGGLE));
    const source = screen.getByRole("textbox", NEW_SOURCE);
    await waitFor(() => expect(source).toHaveFocus());

    await userEvent.click(screen.getByRole("button", ACCEPT));

    expect(onCompareDecision).toHaveBeenCalledWith({
      decision: "accepted",
      markdown: "uno tres",
    });
    expect(screen.getByRole("textbox", NEW_SOURCE)).toHaveValue("uno tres");
    expect(screen.getByRole("textbox", NEW_SOURCE)).toHaveFocus();
  });

  it("sin diferencias, aceptar y rechazar están deshabilitados", async () => {
    await setupCompare({ initialContent: "igual", compareContent: "igual" });

    await waitFor(() =>
      expect(screen.getByRole("button", ACCEPT)).toBeDisabled(),
    );
    expect(screen.getByRole("button", REJECT)).toBeDisabled();
  });

  it("si lo único que cambia es contenido eliminado, siguen habilitados", async () => {
    await setupCompare({
      initialContent: "Uno\n\nDos",
      compareContent: "Uno",
    });

    expect(screen.getByRole("button", ACCEPT)).toBeEnabled();
    expect(screen.getByRole("button", REJECT)).toBeEnabled();
    expect(highlighted(screen.getByRole("group", { name: /Contenido nuevo/ }))).toEqual([]);
  });

  it("tras decidir, con las mismas props sigue en modo normal", async () => {
    const { update } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
    });
    await userEvent.click(screen.getByRole("button", ACCEPT));

    update({});
    update({ compareOrientation: "up-and-down" });

    expect(screen.queryByRole("group", { name: /Contenido/ })).toBeNull();
    expect(screen.queryByRole("toolbar", COMPARE_BAR)).toBeNull();
  });

  it("tras decidir, un compareContent distinto inicia una nueva comparación con lo decidido como original", async () => {
    const { update } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
    });
    await userEvent.click(screen.getByRole("button", ACCEPT));

    update({ compareContent: "A X C Z" });

    const original = await screen.findByRole("group", {
      name: "Contenido original (solo lectura)",
    });
    const next = screen.getByRole("group", { name: /Contenido nuevo/ });
    expect(original).toHaveTextContent("A X C");
    expect(original).not.toHaveTextContent("A X C Z");
    expect(next).toHaveTextContent("A X C Z");
    await expectHighlighted(next, ["Z"]);
  });

  it("tras decidir, salir y volver a entrar en comparación con el mismo contenido la reinicia", async () => {
    const { update } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
    });
    await userEvent.click(screen.getByRole("button", ACCEPT));

    update({ mode: "default" });
    update({ mode: "compare" });

    const original = await screen.findByRole("group", {
      name: "Contenido original (solo lectura)",
    });
    expect(original).toHaveTextContent("A X C");
  });
});

describe("US3: interacción con showToolbar y onlyView", () => {
  it("showToolbar=false oculta también la barra de comparación y los paneles siguen", async () => {
    await setupCompare({
      showToolbar: false,
      initialContent: "A B C",
      compareContent: "A X C",
    });

    expect(screen.queryByRole("toolbar")).toBeNull();
    expect(screen.queryByRole("button", ACCEPT)).toBeNull();
    expect(screen.getByRole("group", { name: "Contenido original (solo lectura)" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Contenido nuevo/ })).toBeInTheDocument();
  });

  it("mostrar la barra en tiempo real muestra también la barra de comparación", async () => {
    const { update } = await setupCompare({
      showToolbar: false,
      initialContent: "A B C",
      compareContent: "A X C",
    });

    update({ showToolbar: true });

    expect(screen.getByRole("toolbar", COMPARE_BAR)).toBeInTheDocument();
  });

  it("con onlyView la barra de comparación mantiene aceptar/rechazar y nunca muestra restaurar", async () => {
    await setupCompare({
      onlyView: true,
      initialContent: "A B C",
      compareContent: "A X C",
    });

    expect(screen.getByRole("button", ACCEPT)).toBeEnabled();
    expect(screen.getByRole("button", REJECT)).toBeEnabled();
    expect(screen.queryByRole("button", RESTORE)).toBeNull();
  });
});

describe("US4: restaurar", () => {
  it("Restaurar está oculto mientras el panel nuevo coincide con el contenido proporcionado", async () => {
    await setupCompare({ initialContent: "A B C", compareContent: "A X C" });

    expect(screen.queryByRole("button", RESTORE)).toBeNull();
  });

  it("aparece tras editar y, al pulsarlo, devuelve el contenido nuevo inicial", async () => {
    const { onChange, newPane } = await setupCompare({
      initialContent: "A B C",
      compareContent: "A X C",
    });
    const pm = screen.getByRole("textbox", NEW_TEXTBOX);
    await userEvent.click(pm);
    await userEvent.keyboard(" extra");
    await expectHighlighted(newPane, ["X", "extra"]);

    await userEvent.click(await screen.findByRole("button", RESTORE));

    expect(pm).toHaveTextContent("A X C");
    expect(pm).not.toHaveTextContent("extra");
    await expectHighlighted(newPane, ["X"]);
    expect(screen.queryByRole("button", RESTORE)).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith("A X C");
    expect(pm).toHaveFocus();
  });

  it("vuelve a ocultarse si el usuario revierte a mano al contenido proporcionado", async () => {
    await setupCompare({ initialContent: "uno dos", compareContent: "uno tres" });
    await userEvent.click(screen.getByRole("button", TOGGLE));
    const source = screen.getByRole("textbox", NEW_SOURCE);
    await waitFor(() => expect(source).toHaveFocus());

    await userEvent.type(source, "!");
    expect(await screen.findByRole("button", RESTORE)).toBeInTheDocument();

    await userEvent.type(source, "{Backspace}");
    await waitFor(() => expect(screen.queryByRole("button", RESTORE)).toBeNull());
  });

  it("se compara con el contenido proporcionado ya normalizado (Markdown no canónico)", async () => {
    const ref = createRef<MarkdownEditorHandle>();
    render(
      <MarkdownEditor
        ref={ref}
        mode="compare"
        compareOrientation="side-to-side"
        initialContent="otro"
        compareContent={"*   uno\n*   dos\n"}
      />,
    );
    await screen.findByRole("group", { name: /Contenido nuevo/ });
    expect(screen.queryByRole("button", RESTORE)).toBeNull();

    act(() => ref.current?.setMarkdown("- uno\n- dos\n"));
    await waitFor(() => expect(screen.queryByRole("button", RESTORE)).toBeNull());
    expect(ref.current?.isModified()).toBe(false);

    act(() => ref.current?.setMarkdown("- uno\n- tres\n"));
    expect(await screen.findByRole("button", RESTORE)).toBeInTheDocument();
  });
});

describe("US4: API imperativa en comparación", () => {
  async function setupWithRef() {
    const ref = createRef<MarkdownEditorHandle>();
    const onChange = vi.fn();
    render(
      <MarkdownEditor
        ref={ref}
        onChange={onChange}
        mode="compare"
        compareOrientation="side-to-side"
        initialContent="A B C"
        compareContent="A X C"
      />,
    );
    const pm = await screen.findByRole("textbox", NEW_TEXTBOX);
    return { ref, pm, onChange };
  }

  it("isModified() es false al empezar y true exactamente cuando Restaurar es visible", async () => {
    const { ref, pm } = await setupWithRef();
    expect(ref.current?.isModified()).toBe(false);

    await userEvent.click(pm);
    await userEvent.keyboard(" extra");

    expect(ref.current?.isModified()).toBe(true);
    expect(await screen.findByRole("button", RESTORE)).toBeInTheDocument();
  });

  it("reset() equivale a Restaurar y notifica el contenido restaurado", async () => {
    const { ref, pm, onChange } = await setupWithRef();
    await userEvent.click(pm);
    await userEvent.keyboard(" extra");

    act(() => ref.current?.reset());

    expect(pm).toHaveTextContent("A X C");
    expect(pm).not.toHaveTextContent("extra");
    expect(ref.current?.isModified()).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith("A X C");
    await waitFor(() => expect(screen.queryByRole("button", RESTORE)).toBeNull());
  });

  it("en modo normal reset()/isModified() mantienen su comportamiento", async () => {
    const ref = createRef<MarkdownEditorHandle>();
    render(<MarkdownEditor ref={ref} initialContent="Original" />);
    const pm = await screen.findByRole("textbox", NEW_TEXTBOX);
    await userEvent.click(pm);
    await userEvent.keyboard(" cambio");
    expect(ref.current?.isModified()).toBe(true);

    ref.current?.reset();

    expect(pm.textContent).toBe("Original");
    expect(ref.current?.isModified()).toBe(false);
  });
});

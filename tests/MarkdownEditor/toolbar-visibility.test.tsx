import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MarkdownEditor } from "../../src";
import type { MarkdownEditorHandle, MarkdownEditorProps } from "../../src";
import { openTableMenuViaTrigger, placeCaretIn, selectAll } from "./helpers";

const TEXTBOX = { name: "Editor de texto enriquecido" };
const TOGGLE = { name: "Ver código Markdown" };

const TABLE_MD = [
  "| A | B |",
  "| - | - |",
  "| 1 | 2 |",
  "",
].join("\n");

async function setup(props: MarkdownEditorProps = {}) {
  const onChange = vi.fn();
  const view = render(<MarkdownEditor onChange={onChange} {...props} />);
  const pm = await screen.findByRole("textbox", TEXTBOX);
  const update = (next: MarkdownEditorProps) =>
    view.rerender(<MarkdownEditor onChange={onChange} {...props} {...next} />);
  return { onChange, pm, update, container: view.container };
}

describe("US1: mostrar y ocultar la barra", () => {
  it("sin la prop o con true, la barra se muestra", async () => {
    await setup();
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("showToolbar=true muestra la barra", async () => {
    await setup({ showToolbar: true });
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("showToolbar=false no muestra la barra ni ninguno de sus controles", async () => {
    const { pm } = await setup({ showToolbar: false });

    expect(screen.queryByRole("toolbar")).toBeNull();
    expect(screen.queryByRole("button", TOGGLE)).toBeNull();
    expect(screen.queryByLabelText("Nivel de encabezado")).toBeNull();
    expect(screen.queryByRole("button", { name: "Negrita" })).toBeNull();
    expect(pm).toBeInTheDocument();
  });

  it("con onlyView, false oculta la barra reducida y el valor por defecto la muestra", async () => {
    const hidden = await setup({ onlyView: true, showToolbar: false });
    expect(screen.queryByRole("toolbar")).toBeNull();
    hidden.container.remove();

    await setup({ onlyView: true });
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });

  it("ocultar la barra no cambia las dimensiones configuradas del componente", async () => {
    const { container } = await setup({
      showToolbar: false,
      width: 400,
      height: 300,
    });
    const root = container.firstElementChild as HTMLElement;

    expect(root.style.width).toBe("400px");
    expect(root.style.height).toBe("300px");
  });
});

describe("US2: cambio en tiempo real sin perder trabajo", () => {
  it("la barra sigue a la prop y el editor no se vuelve a montar", async () => {
    const { pm, update } = await setup({ initialContent: "hola\n" });

    update({ showToolbar: false });
    expect(screen.queryByRole("toolbar")).toBeNull();
    expect(screen.getByRole("textbox", TEXTBOX)).toBe(pm);

    update({ showToolbar: true });
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
    expect(screen.getByRole("textbox", TEXTBOX)).toBe(pm);
    expect(pm.textContent).toBe("hola");
  });

  it("alternar nunca dispara onChange y 20 alternancias terminan en el último valor", async () => {
    const { onChange, update } = await setup({ initialContent: "hola\n" });

    for (let i = 0; i < 20; i += 1) {
      update({ showToolbar: i % 2 === 1 });
    }
    // La última (i = 19) es true
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
    update({ showToolbar: false });
    expect(screen.queryByRole("toolbar")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("conserva el historial de deshacer", async () => {
    const ref = createRef<MarkdownEditorHandle>();
    const onChange = vi.fn();
    const view = render(
      <MarkdownEditor ref={ref} onChange={onChange} initialContent={"uno\n"} />,
    );
    const pm = await screen.findByRole("textbox", TEXTBOX);
    act(() => ref.current?.setMarkdown("dos\n"));
    expect(pm.textContent).toBe("dos");

    view.rerender(
      <MarkdownEditor
        ref={ref}
        onChange={onChange}
        initialContent={"uno\n"}
        showToolbar={false}
      />,
    );
    view.rerender(
      <MarkdownEditor
        ref={ref}
        onChange={onChange}
        initialContent={"uno\n"}
        showToolbar
      />,
    );
    fireEvent.keyDown(pm, { key: "z", ctrlKey: true });

    expect(pm.textContent).toBe("uno");
  });

  it("conserva la posición del cursor", async () => {
    const { pm, update } = await setup({ initialContent: "hola mundo\n" });
    await placeCaretIn(pm.querySelector("p") as HTMLElement);
    const before = window.getSelection();
    const anchor = before?.anchorNode;
    const offset = before?.anchorOffset;

    update({ showToolbar: false });
    update({ showToolbar: true });

    const after = window.getSelection();
    expect(after?.anchorNode).toBe(anchor);
    expect(after?.anchorOffset).toBe(offset);
  });

  it("en la vista Markdown conserva la vista y la posición del cursor", async () => {
    const { update } = await setup({ initialContent: "hola mundo\n" });
    await userEvent.click(screen.getByRole("button", TOGGLE));
    const source = screen.getByRole("textbox", {
      name: "Código fuente Markdown",
    }) as HTMLTextAreaElement;
    source.setSelectionRange(3, 3);

    update({ showToolbar: false });
    expect(screen.queryByRole("toolbar")).toBeNull();
    const hiddenSource = screen.getByRole("textbox", {
      name: "Código fuente Markdown",
    }) as HTMLTextAreaElement;
    expect(hiddenSource.selectionStart).toBe(3);
    expect(screen.queryByRole("textbox", TEXTBOX)).toBeNull();

    update({ showToolbar: true });
    expect(
      screen.getByRole("textbox", { name: "Código fuente Markdown" }),
    ).toBeInTheDocument();
  });

  it("al ocultar la barra se cierra un panel abierto sin aplicar acciones", async () => {
    const { onChange, update } = await setup();
    await userEvent.click(screen.getByRole("button", { name: "Insertar tabla" }));
    expect(screen.getByText("Selecciona el tamaño")).toBeInTheDocument();

    update({ showToolbar: false });
    expect(screen.queryByText("Selecciona el tamaño")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();

    update({ showToolbar: true });
    expect(screen.queryByText("Selecciona el tamaño")).toBeNull();
  });

  it("si un control de la barra tenía el foco, este pasa al editor", async () => {
    const { pm, update } = await setup();
    const bold = screen.getByRole("button", { name: "Negrita" });
    bold.focus();
    expect(bold).toHaveFocus();

    update({ showToolbar: false });

    expect(pm).toHaveFocus();
  });

  it("si el foco no estaba en la barra, ocultarla no mueve el foco", async () => {
    const { update } = await setup({
      initialContent: "[a](https://ejemplo.com)\n",
    });
    const outside = document.createElement("input");
    document.body.appendChild(outside);
    outside.focus();

    update({ showToolbar: false });

    expect(outside).toHaveFocus();
    outside.remove();
  });

  it("al volver a mostrarla, los controles reflejan el estado actual", async () => {
    const { pm, update } = await setup({ initialContent: "**fuerte**\n" });
    await placeCaretIn(pm.querySelector("strong") as HTMLElement);
    expect(screen.getByRole("button", { name: "Negrita" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    update({ showToolbar: false });
    update({ showToolbar: true });

    expect(screen.getByRole("button", { name: "Negrita" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("US3: seguir trabajando con la barra oculta", () => {
  it("los atajos de teclado siguen formateando el texto", async () => {
    const { pm } = await setup({ showToolbar: false, initialContent: "hola\n" });
    selectAll(pm);

    fireEvent.keyDown(pm, { key: "b", ctrlKey: true });

    expect(pm.querySelector("strong")?.textContent).toBe("hola");
  });

  it("el menú de celda de tabla funciona", async () => {
    const { pm } = await setup({
      showToolbar: false,
      initialContent: TABLE_MD,
    });

    await openTableMenuViaTrigger(pm.querySelector("td") as HTMLElement);

    expect(
      await screen.findByRole("menu", { name: "Acciones de fila" }),
    ).toBeInTheDocument();
  });

  it("el popover de enlace funciona", async () => {
    const { pm } = await setup({
      showToolbar: false,
      initialContent: "Ver [sitio](https://ejemplo.com)\n",
    });

    await userEvent.click(pm.querySelector("a") as HTMLElement);

    expect(
      screen.getByRole("menuitem", { name: "Ir a la url" }),
    ).toBeInTheDocument();
  });

  it("la API imperativa funciona", async () => {
    const ref = createRef<MarkdownEditorHandle>();
    render(
      <MarkdownEditor ref={ref} showToolbar={false} initialContent={"uno\n"} />,
    );
    const pm = await screen.findByRole("textbox", TEXTBOX);

    act(() => ref.current?.setMarkdown("dos\n"));
    expect(pm.textContent).toBe("dos");
    expect(ref.current?.isModified()).toBe(true);

    act(() => ref.current?.reset());
    expect(pm.textContent).toBe("uno");
    expect(ref.current?.isModified()).toBe(false);

    act(() => ref.current?.insertMarkdown("**x**"));
    expect(pm.querySelector("strong")?.textContent).toBe("x");
  });
});

import { describe, it, expect, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../../src";
import type { MarkdownEditorProps } from "../../src";

const TEXTBOX = { name: "Editor de texto enriquecido" };
const TOOLBAR = { name: "Barra de herramientas" };

function Host(props: MarkdownEditorProps) {
  return (
    <div>
      <button type="button">antes</button>
      <MarkdownEditor initialContent="hola" {...props} />
      <button type="button">después</button>
    </div>
  );
}

async function setup(props: MarkdownEditorProps = {}) {
  const onChange = vi.fn();
  const view = render(<Host onChange={onChange} {...props} />);
  const box = await screen.findByRole("textbox", TEXTBOX);
  const update = (next: MarkdownEditorProps) =>
    view.rerender(<Host onChange={onChange} {...props} {...next} />);
  return { view, box, onChange, update };
}

const toolbar = () => screen.queryByRole("toolbar", TOOLBAR);

async function focusOutside() {
  await userEvent.click(screen.getByRole("button", { name: "después" }));
  await waitFor(() => expect(toolbar()).toBeNull());
}

describe("US2: desactivado por defecto", () => {
  it("sin la prop la barra no se oculta al perder el foco", async () => {
    const { box } = await setup();
    await userEvent.click(box);
    await userEvent.click(screen.getByRole("button", { name: "después" }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(toolbar()).not.toBeNull();
  });
});

describe("US1: la barra sigue al foco", () => {
  it("empieza oculta si el foco no está dentro", async () => {
    await setup({ autoHideBar: true });
    expect(toolbar()).toBeNull();
  });

  it("aparece al entrar y desaparece al salir", async () => {
    const { box } = await setup({ autoHideBar: true });
    await userEvent.click(box);
    expect(toolbar()).not.toBeNull();
    await focusOutside();
    await userEvent.click(box);
    expect(toolbar()).not.toBeNull();
  });

  it("no se oculta al moverse entre el contenido y la barra ni al abrir un diálogo", async () => {
    const { box } = await setup({ autoHideBar: true });
    await userEvent.click(box);
    const insertLink = screen.getByRole("button", { name: /enlace/i });
    await userEvent.click(insertLink);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(toolbar()).not.toBeNull();
    const dialogInput = await screen.findByRole("textbox", { name: /url/i });
    await userEvent.click(dialogInput);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(toolbar()).not.toBeNull();
  });
});

describe("US3: teclado", () => {
  it("con Tab entra, la barra aparece y sus controles son alcanzables; al salir se oculta", async () => {
    await setup({ autoHideBar: true });
    screen.getByRole("button", { name: "antes" }).focus();
    expect(toolbar()).toBeNull();
    await userEvent.tab();
    // La barra oculta no es una parada de tabulación: el Tab llega al contenido.
    expect(document.activeElement).toBe(screen.getByRole("textbox", TEXTBOX));
    await waitFor(() => expect(toolbar()).not.toBeNull());
    // Ya visible, sus controles se alcanzan con Shift+Tab.
    await userEvent.tab({ shift: true });
    expect(toolbar()?.contains(document.activeElement) ?? false).toBe(true);
    expect(toolbar()).not.toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "después" }));
    await waitFor(() => expect(toolbar()).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "después" }));
  });
});

describe("US4: convive con otros ajustes", () => {
  it("showToolbar={false} manda: nunca la muestra", async () => {
    const { box } = await setup({ autoHideBar: true, showToolbar: false });
    await userEvent.click(box);
    expect(toolbar()).toBeNull();
  });

  it("la barra de comparación sigue visible sin foco", async () => {
    await setup({
      autoHideBar: true,
      mode: "compare",
      compareOrientation: "side-to-side",
      compareContent: "chau",
    });
    expect(toolbar()).toBeNull();
    expect(screen.getByRole("toolbar", { name: "Barra de comparación" })).toBeInTheDocument();
  });

  it("activarla y desactivarla en caliente no toca el contenido ni notifica", async () => {
    const { box, update, onChange } = await setup();
    expect(toolbar()).not.toBeNull();
    update({ autoHideBar: true });
    expect(toolbar()).toBeNull();
    update({ autoHideBar: false });
    expect(toolbar()).not.toBeNull();
    expect(screen.getByRole("textbox", TEXTBOX)).toBe(box);
    expect(box).toHaveTextContent("hola");
    expect(onChange).not.toHaveBeenCalled();
  });
});

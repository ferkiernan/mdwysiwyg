import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MarkdownEditor } from "../../src";
import type { MarkdownEditorProps } from "../../src";

export async function setupEditor(props: MarkdownEditorProps = {}) {
  const onChange = vi.fn();
  const view = render(<MarkdownEditor onChange={onChange} {...props} />);
  const pm = await screen.findByRole("textbox", {
    name: "Editor de texto enriquecido",
  });
  return { onChange, pm, view };
}

/** Selecciona todo el contenido vía el atajo Mod-A que maneja ProseMirror. */
export function selectAll(pm: HTMLElement): void {
  fireEvent.keyDown(pm, { key: "a", ctrlKey: true });
}

/** Pasa el puntero sobre la celda y hace clic en su disparador de menú. */
export async function openTableMenuViaTrigger(
  cell: HTMLElement,
): Promise<void> {
  await userEvent.hover(cell);
  await userEvent.click(
    await screen.findByRole("button", {
      name: /^Abrir acciones de (columna|fila)$/,
    }),
  );
}

/**
 * Coloca el cursor dentro de `element`. jsdom no tiene layout, así que un clic
 * no resuelve la posición del documento: se fija la selección del DOM y se
 * notifica a ProseMirror, como haría el navegador.
 */
export async function placeCaretIn(element: HTMLElement): Promise<void> {
  await userEvent.click(element);
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const text = walker.nextNode();
  if (text === null) throw new Error("placeCaretIn: el elemento no tiene texto");
  window.getSelection()?.setBaseAndExtent(text, 0, text, 0);
  document.dispatchEvent(new Event("selectionchange"));
}

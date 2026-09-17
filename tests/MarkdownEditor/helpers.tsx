import { render, screen, fireEvent } from "@testing-library/react";
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

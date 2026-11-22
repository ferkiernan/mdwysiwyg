import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../../src";

// Spec 029: atributo spellCheck (activado por defecto) para la vista renderizada.

const content = () => screen.findByRole("textbox", { name: "Editor de texto enriquecido" });

describe("spellCheck", () => {
  it("por defecto la vista renderizada tiene la corrección activada", async () => {
    render(<MarkdownEditor initialContent="holaa mundoo" />);
    expect(await content()).toHaveAttribute("spellcheck", "true");
  });

  it("spellCheck={false} la desactiva", async () => {
    render(<MarkdownEditor initialContent="holaa" spellCheck={false} />);
    expect(await content()).toHaveAttribute("spellcheck", "false");
  });

  it("cambia en vivo sin recrear el editor ni perder contenido, selección ni historial", async () => {
    const { rerender } = render(<MarkdownEditor initialContent="uno dos" spellCheck />);
    const pm = (await content()) as HTMLElement & { editor: import("@tiptap/core").Editor };
    const editor = pm.editor;
    editor.commands.insertContentAt(1, "X");
    editor.commands.setTextSelection(3);
    rerender(<MarkdownEditor initialContent="uno dos" spellCheck={false} />);
    const after = (await content()) as HTMLElement & { editor: import("@tiptap/core").Editor };
    expect(after).toHaveAttribute("spellcheck", "false");
    expect(after.editor).toBe(editor);
    expect(editor.getText()).toBe("Xuno dos");
    expect(editor.state.selection.from).toBe(3);
    editor.commands.undo();
    expect(editor.getText()).toBe("uno dos");
    rerender(<MarkdownEditor initialContent="uno dos" spellCheck />);
    expect(await content()).toHaveAttribute("spellcheck", "true");
  });

  it("la vista Markdown nunca usa la corrección", async () => {
    render(<MarkdownEditor initialContent="holaa" spellCheck />);
    await content();
    await userEvent.click(screen.getByRole("button", { name: "Ver código Markdown" }));
    const textarea = await screen.findByRole("textbox", { name: "Código fuente Markdown" });
    expect(textarea).toHaveAttribute("spellcheck", "false");
  });
});

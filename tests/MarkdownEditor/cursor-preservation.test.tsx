import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@tiptap/core";
import { MarkdownEditor } from "../../src";
import {
  markdownOffsetToProseMirrorPos,
  proseMirrorPosToMarkdownOffset,
} from "../../src/components/MarkdownEditor/markdown/cursorMapping";
import {
  createEditorExtensions,
  markdownToEditorContent,
} from "../../src/components/MarkdownEditor/markdown/tiptapMarkdownBridge";
import { setupEditor } from "./helpers";

const TOGGLE = { name: "Ver código Markdown" };
const SOURCE = { name: "Código fuente Markdown" };
const WYSIWYG = { name: "Editor de texto enriquecido" };

const DOC = "Primera linea\n\nSegunda linea con mas texto\n";

function buildEditor(markdown: string): Editor {
  return new Editor({
    extensions: createEditorExtensions({ sanitizeEmbeddedHtml: true }),
    content: markdownToEditorContent(markdown),
  });
}

describe("US3: mapeo de posición entre vistas", () => {
  it("un offset avanzado del Markdown mapea a una posición avanzada del documento", () => {
    const editor = buildEditor(DOC);
    const offset = DOC.indexOf("Segunda");
    const pos = markdownOffsetToProseMirrorPos(DOC, offset, editor.state.doc);

    expect(pos).toBeGreaterThan(0);
    // "Segunda" empieza tras el primer párrafo: la posición debe caer más
    // allá del inicio del documento.
    expect(pos).toBeGreaterThan("Primera linea".length / 2);
    editor.destroy();
  });

  it("el offset 0 mapea al inicio del documento", () => {
    const editor = buildEditor(DOC);
    expect(markdownOffsetToProseMirrorPos(DOC, 0, editor.state.doc)).toBe(0);
    editor.destroy();
  });

  it("una posición avanzada del documento mapea a un offset avanzado del Markdown", () => {
    const editor = buildEditor(DOC);
    const pos = editor.state.doc.content.size - 2;
    const offset = proseMirrorPosToMarkdownOffset(editor, pos, DOC);

    expect(offset).toBeGreaterThan(0);
    expect(offset).toBeLessThanOrEqual(DOC.length);
    editor.destroy();
  });

  it("las posiciones devueltas siempre están dentro del rango válido", () => {
    const editor = buildEditor(DOC);
    const beyond = markdownOffsetToProseMirrorPos(
      DOC,
      DOC.length * 2,
      editor.state.doc,
    );
    expect(beyond).toBeLessThanOrEqual(editor.state.doc.content.size);

    const offset = proseMirrorPosToMarkdownOffset(
      editor,
      editor.state.doc.content.size,
      DOC,
    );
    expect(offset).toBeLessThanOrEqual(DOC.length);
    editor.destroy();
  });
});

describe("US3: preservación del cursor al alternar de vista", () => {
  it("el cursor del textarea refleja la posición previa en la vista renderizada", async () => {
    render(<MarkdownEditor initialContent={DOC} />);
    const pm = await screen.findByRole("textbox", WYSIWYG);
    expect(pm).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", TOGGLE));
    const textarea = screen.getByRole("textbox", SOURCE) as HTMLTextAreaElement;
    // Sin haber movido el cursor, la posición de origen es el inicio.
    expect(textarea.selectionStart).toBe(0);
  });

  it("una posición del textarea se traslada a la vista renderizada sin error", async () => {
    await setupEditor({ initialContent: DOC });
    const toggle = screen.getByRole("button", TOGGLE);

    await userEvent.click(toggle);
    const textarea = screen.getByRole("textbox", SOURCE) as HTMLTextAreaElement;
    const offset = DOC.indexOf("Segunda");
    textarea.setSelectionRange(offset, offset);

    await userEvent.click(toggle);
    const pm = await screen.findByRole("textbox", WYSIWYG);
    expect(pm.textContent).toContain("Segunda linea");
  });

  it("alternar con un bloque de código preserva el contenido sin error", async () => {
    const withCode = "Texto\n\n```js\nconst x = 1;\n```\n";
    const { pm } = await setupEditor({ initialContent: withCode });
    const toggle = screen.getByRole("button", TOGGLE);

    await userEvent.click(toggle);
    expect(screen.getByRole("textbox", SOURCE)).toHaveValue(withCode);

    await userEvent.click(toggle);
    await screen.findByRole("textbox", WYSIWYG);
    expect(pm.querySelector("pre code")).not.toBeNull();
  });
});

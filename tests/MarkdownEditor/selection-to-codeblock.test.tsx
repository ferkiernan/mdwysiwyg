import { afterEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { Editor } from "@tiptap/core";
import { MarkdownEditor, type MarkdownEditorHandle } from "../../src";
import { createEditorExtensions, editorToMarkdown } from "../../src/components/MarkdownEditor/markdown/tiptapMarkdownBridge";
import { selectionToCodeBlock } from "../../src/components/MarkdownEditor/markdown/codeBlockSelection";

// Spec 027: una selección de varias líneas se convierte en UN bloque de código con su texto visible.

let editor: Editor | null = null;
afterEach(() => {
  editor?.destroy();
  editor = null;
});

function make(html: string): Editor {
  editor = new Editor({ extensions: createEditorExtensions({ sanitizeEmbeddedHtml: true }), content: html });
  return editor;
}

/** Posición de `text`: primero un nodo de texto idéntico, si no el primero que lo contiene. */
function find(ed: Editor, text: string): number {
  let exact = -1;
  let partial = -1;
  ed.state.doc.descendants((node, pos) => {
    if (!node.isText || node.text === undefined) return;
    if (exact === -1 && node.text === text) exact = pos;
    if (partial === -1 && node.text.includes(text)) partial = pos + node.text.indexOf(text);
  });
  return exact !== -1 ? exact : partial;
}

/** Bloques de primer nivel, sin el párrafo vacío auxiliar del final. */
const topLevel = (ed: Editor) =>
  ed.state.doc.content.content.filter((node) => !(node.type.name === "paragraph" && node.content.size === 0)).length;

function convert(ed: Editor, from: number, to: number, language = "javascript"): boolean {
  ed.commands.setTextSelection({ from, to });
  return selectionToCodeBlock(language)(ed.state, ed.view.dispatch);
}

const codeBlocks = (ed: Editor) => {
  const blocks: string[] = [];
  ed.state.doc.descendants((node) => {
    if (node.type.name === "codeBlock") blocks.push(`${String(node.attrs["language"])}:${node.textContent}`);
  });
  return blocks;
};

describe("selección de varias líneas → un único bloque de código", () => {
  it("tres párrafos dan un solo bloque con tres líneas, sin formato", () => {
    const ed = make("<p>uno</p><p>dos <strong>b</strong></p><p>tres</p>");
    expect(convert(ed, find(ed, "uno"), find(ed, "tres") + 4)).toBe(true);
    expect(codeBlocks(ed)).toEqual(["javascript:uno\ndos b\ntres"]);
    expect(editorToMarkdown(ed)).toBe("```javascript\nuno\ndos b\ntres\n```\n");
  });

  it("título, párrafo, lista y párrafo entran todos en el mismo bloque, sin restos", () => {
    const ed = make("<h2>Titulo</h2><p>texto</p><ul><li><p>a</p><ul><li><p>a.1</p></li></ul></li><li><p>b</p></li></ul><p>fin</p>");
    convert(ed, find(ed, "Titulo"), find(ed, "fin") + 3);
    expect(codeBlocks(ed)).toEqual(["javascript:Titulo\ntexto\na\na.1\nb\nfin"]);
    expect(topLevel(ed)).toBe(1);
  });

  it("una selección parcial incluye las líneas enteras y deja intacto lo de afuera", () => {
    const ed = make("<p>antes</p><p>uno dos</p><p>tres cuatro</p><p>después</p>");
    convert(ed, find(ed, "dos"), find(ed, "tres") + 2);
    expect(editorToMarkdown(ed)).toBe("antes\n\n```javascript\nuno dos\ntres cuatro\n```\n\ndespués\n");
  });

  it("solo algunos ítems de una lista: los demás quedan en su lista arriba y abajo", () => {
    const ed = make("<ul><li><p>a</p></li><li><p>b</p></li><li><p>c</p></li><li><p>d</p></li></ul>");
    convert(ed, find(ed, "b"), find(ed, "c") + 1);
    expect(editorToMarkdown(ed)).toBe("- a\n\n```javascript\nb\nc\n```\n\n- d\n");
  });

  it("si la selección corta un ítem con hijos, los hijos no seleccionados suben un nivel en vez de dejar una viñeta vacía", () => {
    const ed = make("<p>antes</p><ul><li><p>a</p><ul><li><p>a.1</p></li></ul></li><li><p>b</p></li></ul>");
    convert(ed, find(ed, "antes"), find(ed, "a") + 1);
    expect(editorToMarkdown(ed)).toBe("```javascript\nantes\na\n```\n\n- a.1\n- b\n");
  });

  it("citas, tablas y bloques de código aportan su texto; imágenes y reglas se descartan", () => {
    const ed = make(
      '<blockquote><p>cita</p></blockquote><table><tr><th><p>A</p></th><th><p>B</p></th></tr><tr><td><p>1</p></td><td><p>2</p></td></tr></table><hr><img src="x.png" alt=""><pre><code class="language-sql">select 1;\nselect 2;</code></pre><p>fin</p>',
    );
    convert(ed, find(ed, "cita"), find(ed, "fin") + 3, "sql");
    expect(codeBlocks(ed)).toEqual(["sql:cita\nA | B\n1 | 2\nselect 1;\nselect 2;\nfin"]);
    expect(topLevel(ed)).toBe(1);
  });

  it("una sola línea o el interior de una tabla dejan el comportamiento por defecto", () => {
    const ed = make("<p>uno dos</p><table><tr><td><p>x</p></td></tr></table><p>fin</p>");
    expect(convert(ed, find(ed, "uno"), find(ed, "dos") + 3)).toBe(false);
    expect(convert(ed, find(ed, "x"), find(ed, "fin") + 3)).toBe(false);
  });

  it("es un solo paso de deshacer y el cursor queda dentro del bloque", () => {
    const ed = make("<p>uno</p><p><em>dos</em></p>");
    const original = ed.getHTML();
    convert(ed, find(ed, "uno"), find(ed, "dos") + 3);
    expect(ed.state.selection.$from.parent.type.name).toBe("codeBlock");
    ed.commands.undo();
    expect(ed.getHTML()).toBe(original);
  });
});

describe("desde la barra: Bloque de código > Aplicar", () => {
  it("convierte la selección en un único bloque y emite un solo cambio", async () => {
    const ref = createRef<MarkdownEditorHandle>();
    const changes: string[] = [];
    const { container } = render(
      <MarkdownEditor ref={ref} initialContent={"uno\n\ndos\n\ntres"} onChange={(md) => changes.push(md)} />,
    );
    await screen.findByRole("textbox", { name: "Editor de texto enriquecido" });
    const pm = container.querySelector(".ProseMirror") as HTMLElement & { editor: Editor };
    pm.editor.commands.setTextSelection({ from: 1, to: pm.editor.state.doc.content.size - 1 });
    await userEvent.click(screen.getByRole("button", { name: "Bloque de código" }));
    await userEvent.selectOptions(screen.getByLabelText("Lenguaje"), "json");
    await userEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    await waitFor(() => expect(changes.at(-1)).toBe("```json\nuno\ndos\ntres\n```\n"));
    expect(changes).toHaveLength(1);
  });
});

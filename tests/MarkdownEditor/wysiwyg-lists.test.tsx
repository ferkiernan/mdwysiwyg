import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@tiptap/core";
import { setupEditor } from "./helpers";
import {
  createEditorExtensions,
  markdownToEditorContent,
  editorToMarkdown,
} from "../../src/components/MarkdownEditor/markdown/tiptapMarkdownBridge";

describe("US1: listas desde la barra de herramientas", () => {
  it("crea una lista no ordenada", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: "uno" });
    await userEvent.click(
      screen.getByRole("button", { name: "Lista con viñetas" }),
    );
    expect(pm.querySelector("ul li")).toHaveTextContent("uno");
    expect(onChange).toHaveBeenLastCalledWith("- uno\n");
  });

  it("crea una lista ordenada", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: "uno" });
    await userEvent.click(
      screen.getByRole("button", { name: "Lista ordenada" }),
    );
    expect(pm.querySelector("ol li")).toHaveTextContent("uno");
    expect(onChange).toHaveBeenLastCalledWith("1. uno\n");
  });

  it("crea una checklist con estado no marcado", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: "tarea" });
    await userEvent.click(
      screen.getByRole("button", { name: "Lista de tareas" }),
    );
    expect(
      pm.querySelector('ul[data-type="taskList"] li input[type="checkbox"]'),
    ).not.toBeNull();
    expect(onChange).toHaveBeenLastCalledWith("- [ ] tarea\n");
  });

  it("renderiza una checklist marcada desde Markdown", async () => {
    const { pm } = await setupEditor({
      initialContent: "- [x] hecha\n- [ ] pendiente\n",
    });
    const boxes = pm.querySelectorAll('input[type="checkbox"]');
    expect(boxes).toHaveLength(2);
    expect((boxes[0] as HTMLInputElement).checked).toBe(true);
    expect((boxes[1] as HTMLInputElement).checked).toBe(false);
  });

  it("indenta un ítem convirtiéndolo en lista anidada (comportamiento del comando de la barra)", () => {
    const editor = new Editor({
      extensions: createEditorExtensions({ sanitizeEmbeddedHtml: true }),
      content: markdownToEditorContent("- uno\n- dos\n"),
    });
    editor.commands.setTextSelection(editor.state.doc.content.size - 3);
    editor.commands.sinkListItem("listItem");
    expect(editorToMarkdown(editor)).toBe("- uno\n  - dos\n");
    editor.destroy();
  });

  it("expone botones de sangría en la barra", async () => {
    await setupEditor({ initialContent: "- uno\n- dos\n" });
    expect(
      screen.getByRole("button", { name: "Aumentar sangría" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Disminuir sangría" }),
    ).toBeInTheDocument();
  });
});

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupEditor } from "./helpers";
import { markdownToHtml } from "../../src/components/MarkdownEditor/markdown/pipeline";

const JS_CODE = "```javascript\nconst x = 1;\nfunction f() { return x; }\n```\n";

describe("US4: resaltado de sintaxis en bloques de código", () => {
  it("resalta un bloque con lenguaje predefinido con múltiples clases de token", async () => {
    const { pm } = await setupEditor({ initialContent: JS_CODE });
    const spans = pm.querySelectorAll("pre code span[class*='hljs-']");
    expect(spans.length).toBeGreaterThan(1);
    const classes = new Set(
      Array.from(spans).map((span) => span.className),
    );
    expect(classes.size).toBeGreaterThan(1);
  });

  it("degrada de forma legible un lenguaje personalizado no reconocido", async () => {
    const { pm } = await setupEditor({
      initialContent: "```brainfuck\n++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.\n```\n",
    });
    const code = pm.querySelector("pre code");
    expect(code).not.toBeNull();
    expect(code?.textContent).toContain("++++++++");
  });

  it("no aplica resaltado a un bloque sin lenguaje asignado", async () => {
    const { pm } = await setupEditor({
      initialContent: "```\nplain text block\n```\n",
    });
    const code = pm.querySelector("pre code");
    expect(code?.querySelector("span[class*='hljs-']")).toBeNull();
  });

  it("preserva el Markdown fuente exacto al alternar de vista con resaltado activo", async () => {
    const { onChange } = await setupEditor({ initialContent: JS_CODE });
    await userEvent.click(
      screen.getByRole("button", { name: "Ver código Markdown" }),
    );
    expect(
      screen.getByRole("textbox", { name: "Código fuente Markdown" }),
    ).toHaveValue(JS_CODE);
    await userEvent.click(
      screen.getByRole("button", { name: "Ver código Markdown" }),
    );
    await screen.findByRole("textbox", { name: "Editor de texto enriquecido" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("markdownToHtml incluye clases de resaltado para lenguajes reconocidos", () => {
    const html = markdownToHtml(JS_CODE, { sanitize: true });
    expect(html).toContain("hljs-keyword");
  });

  it("markdownToHtml no falla para lenguajes no reconocidos (ignoreMissing)", () => {
    const html = markdownToHtml("```cobol\nDISPLAY 'HI'.\n```\n", {
      sanitize: true,
    });
    expect(html).toContain("DISPLAY");
  });
});

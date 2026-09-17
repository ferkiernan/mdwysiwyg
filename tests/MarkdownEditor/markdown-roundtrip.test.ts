import {
  markdownToEditorHtml,
  editorHtmlToMarkdown,
  markdownToHtml,
} from "../../src/components/MarkdownEditor/markdown/pipeline";

const kitchenSink = [
  "# Título",
  "",
  "Texto con **negrita**, *cursiva* y ~~tachado~~.",
  "",
  "- uno",
  "- dos",
  "  - anidado",
  "",
  "1. primero",
  "2. segundo",
  "",
  "- [ ] pendiente",
  "- [x] hecha",
  "",
  "> cita",
  "",
  "```js",
  "const x = 1;",
  "```",
  "",
  "| A | B |",
  "| - | - |",
  "| 1 | 2 |",
  "",
  "---",
  "",
  "![alt](https://img.example/i.png)",
  "",
  "[enlace](https://example.com)",
  "",
  '<div class="raw"><b>html crudo</b></div>',
  "",
].join("\n");

describe("pipeline GFM round-trip", () => {
  it("markdown → editor HTML → markdown es identidad para GFM canónico", () => {
    const html = markdownToEditorHtml(kitchenSink);
    expect(editorHtmlToMarkdown(html)).toBe(kitchenSink);
  });

  it("el HTML embebido en bloque se preserva byte a byte", () => {
    const md = '<section data-x="1"><em>raw</em></section>\n';
    expect(editorHtmlToMarkdown(markdownToEditorHtml(md))).toBe(md);
  });

  it("markdownToHtml exporta GFM completo", () => {
    const html = markdownToHtml(kitchenSink, { sanitize: true });
    expect(html).toContain("<h1>Título</h1>");
    expect(html).toContain("<strong>negrita</strong>");
    expect(html).toContain("<del>tachado</del>");
    expect(html).toContain("<table>");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("<hr>");
  });
});

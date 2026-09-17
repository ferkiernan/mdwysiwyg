import { setupEditor } from "./helpers";
import { markdownToHtml } from "../../src/components/MarkdownEditor/markdown/pipeline";

describe("FR-022/FR-023: sanitización de HTML embebido", () => {
  it("sanitiza por defecto el HTML embebido en la vista renderizada", async () => {
    const { pm } = await setupEditor({
      initialContent: '<div><script>window.x=1</script><b>hola</b></div>\n',
    });
    const block = pm.querySelector("[data-html-block]");
    expect(block).not.toBeNull();
    expect(block?.querySelector("script")).toBeNull();
    expect(block?.querySelector("b")).toHaveTextContent("hola");
  });

  it("renderiza el HTML intacto cuando la app consumidora desactiva la sanitización", async () => {
    const { pm } = await setupEditor({
      initialContent: '<div class="custom">Contenido de confianza</div>\n',
      sanitizeEmbeddedHtml: false,
    });
    const block = pm.querySelector("[data-html-block]");
    expect(block?.querySelector("div.custom")).toHaveTextContent(
      "Contenido de confianza",
    );
  });

  it("la sanitización no altera el Markdown fuente (solo la proyección)", async () => {
    const raw = "<div><script>window.x=1</script></div>";
    const { onChange } = await setupEditor({
      initialContent: `Hola\n\n${raw}\n`,
    });
    // Editar en WYSIWYG algo ajeno al bloque HTML no debe reescribir el bloque
    const { screen } = await import("@testing-library/react");
    const userEvent = (await import("@testing-library/user-event")).default;
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Nivel de encabezado" }),
      "h2",
    );
    const markdown = onChange.mock.lastCall?.[0] as string;
    expect(markdown).toContain(raw);
    expect(markdown).toContain("## Hola");
  });

  it("markdownToHtml sanitiza al exportar por defecto y respeta la desactivación", () => {
    const md = '<script>window.x=1</script>\n\nHola\n';
    expect(markdownToHtml(md, { sanitize: true })).not.toContain("<script>");
    expect(markdownToHtml(md, { sanitize: false })).toContain("<script>");
  });
});

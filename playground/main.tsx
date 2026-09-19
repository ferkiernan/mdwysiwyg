import { StrictMode, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { MarkdownEditor } from "../src";
import type { MarkdownEditorHandle } from "../src";

const DEMO = [
  "# Demo mdwysiwyg",
  "",
  "It's super easy, you can use **bold**, *italic* and ~~Strikethrough~~.",
  "",
  "- [ ] pending tasks",
  "- [x] are done.",
  "",
  "Repeat [after](https://github.com/ferkiernan) me:",
  "",
  "> I refuse to learn Markdown.",
  "",
  "---",
  "",
  "After all... tables are looking good:",
  "",
  "| Col A | Col B | Col C       |",
  "| ----- | ----- | ----------- |",
  "| 1     | 2     | 3           |",
  "| this  | *is*  | **example** |",
  "",
  "```javascript",
  "const x = 1;",
  "function greet(name) {",
  "  return `Hola, ${name}!`;",
  "}",
  "// Yep, this code has some style.",
  "```",
  "",
  "And diagrams render for real:",
  "",
  "```mermaid",
  "graph TD",
  "  A[Markdown] --> B[WYSIWYG]",
  "  B --> A",
  "```",
  "Would you like to insert some",
  '<div style="color: teal"><b>⚽embedded HTML? Yes please💙💛</b>',
  "</div>",
  "",
].join("\n");

function App() {
  const [markdown, setMarkdown] = useState(DEMO);
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const [modified, setModified] = useState<boolean | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 16 }}>
      <section>
        <h2>Editor normal (resizable por defecto)</h2>
        <div style={{ display: "flex", gap: 16 }}>
          <MarkdownEditor initialContent={DEMO} onChange={setMarkdown} />
          <pre
            style={{
              flex: 1,
              background: "#f6f7f9",
              padding: 12,
              fontSize: 12,
              overflow: "auto",
              maxHeight: 500,
            }}
          >
            {markdown}
          </pre>
        </div>
      </section>

      <section>
        <h2>Modo solo lectura (onlyView) con aviso personalizado</h2>
        <MarkdownEditor
          onlyView
          onlyViewNotice="demo-readme.md"
          initialContent={DEMO}
          width={500}
          height={300}
        />
      </section>

      <section>
        <h2>API imperativa (reset / isModified)</h2>
        <p>
          Editá el contenido y usá los botones: el estado se consulta por{" "}
          <code>ref</code>, sin remontar el componente.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button type="button" onClick={() => editorRef.current?.reset()}>
            Descartar cambios
          </button>
          <button
            type="button"
            onClick={() =>
              setModified(editorRef.current?.isModified() ?? false)
            }
          >
            ¿Modificado?
          </button>
          <span>{modified === null ? "—" : modified ? "Sí" : "No"}</span>
        </div>
        <MarkdownEditor
          ref={editorRef}
          initialContent="# Original\n\nProbá editar esto."
          documentId="demo-1"
          fileName="demo-readme.md"
          width={500}
          height={220}
        />
      </section>

      <section>
        <h2>Tamaño fijo (resizable=false)</h2>
        <MarkdownEditor
          resizable={false}
          initialContent="Este editor no se puede redimensionar."
          width={400}
          height={200}
        />
      </section>

      <section>
        <h2>Toolbar y fondo de contenido personalizados (CSS Custom Properties)</h2>
        <style>{`
          .mdw-dark-theme {
            --mdw-toolbar-gradient-from: #1e293b;
            --mdw-toolbar-gradient-via: #0f172a;
            --mdw-toolbar-gradient-to: #020617;
            --mdw-toolbar-fg: #f8fafc;
            --mdw-toolbar-font-family: "Trebuchet MS", sans-serif;
            --mdw-content-bg: linear-gradient(135deg, #fef3c7, #fde68a);
          }
        `}</style>
        <MarkdownEditor
          className="mdw-dark-theme"
          initialContent={DEMO}
          width={500}
          height={300}
        />
      </section>
    </div>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

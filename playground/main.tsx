import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { MarkdownEditor } from "../src";

const DEMO = [
  "# Demo mdwysiwyg",
  "",
  "Texto con **negrita**, *cursiva* y ~~tachado~~.",
  "",
  "- [ ] tarea pendiente",
  "- [x] tarea hecha",
  "",
  "| Col A | Col B |",
  "| - | - |",
  "| 1 | 2 |",
  "",
  "```javascript",
  "const x = 1;",
  "function greet(name) {",
  "  return `Hola, ${name}!`;",
  "}",
  "```",
  "",
  '<div style="color: teal"><b>HTML embebido</b></div>',
  "",
].join("\n");

function App() {
  const [markdown, setMarkdown] = useState(DEMO);
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
        <h2>Modo solo lectura (onlyView)</h2>
        <MarkdownEditor onlyView initialContent={DEMO} width={500} height={300} />
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
        <h2>Toolbar con tema oscuro personalizado (CSS Custom Properties)</h2>
        <style>{`
          .mdw-dark-theme {
            --mdw-toolbar-gradient-from: #1e293b;
            --mdw-toolbar-gradient-via: #0f172a;
            --mdw-toolbar-gradient-to: #020617;
            --mdw-toolbar-fg: #f8fafc;
            --mdw-toolbar-font-family: "Trebuchet MS", sans-serif;
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

import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { MarkdownEditor } from "../src";

const DEMO = [
  "# Demo mdwysiwyg",
  "",
  "It's super easy, you can use **bold**, *italic* and ~~Strikethrough~~.",
  "",
  "- [ ] pending tasks",
  "- [x] are done.",
  "",
  "Repeat after me:",
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
  "-- Yep, this code has some style.",
  "```",
  "Would you like to insert some",
  '<div style="color: teal"><b>⚽embedded HTML? Yes please💙💛</b>',
  "</div>",
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

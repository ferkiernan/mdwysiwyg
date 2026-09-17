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
  "```js",
  "const x = 1;",
  "```",
  "",
  '<div style="color: teal"><b>HTML embebido</b></div>',
  "",
].join("\n");

function App() {
  const [markdown, setMarkdown] = useState(DEMO);
  return (
    <div style={{ display: "flex", gap: 16, padding: 16 }}>
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
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

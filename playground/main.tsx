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

interface ThemePreset {
  id: string;
  label: string;
  className: string;
  css: string;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "default",
    label: "Default",
    className: "",
    css: "",
  },
  {
    id: "dark",
    label: "Oscuro",
    className: "mdw-theme-dark",
    css: `
      .mdw-theme-dark {
        --mdw-toolbar-gradient-from: #1e293b;
        --mdw-toolbar-gradient-via: #0f172a;
        --mdw-toolbar-gradient-to: #020617;
        --mdw-toolbar-fg: #f8fafc;
        --mdw-toolbar-font-family: "Trebuchet MS", sans-serif;
        --mdw-toolbar-select-bg: #1e293b;
        --mdw-button-active-bg: #334155;
        --mdw-button-hover-gradient-from: #334155;
        --mdw-button-hover-gradient-to: #1e293b;
        --mdw-content-bg: #0b1220;
        --mdw-content-wysiwyg-fg: #e2e8f0;
        --mdw-content-markdown-fg: #94a3b8;
        --mdw-scrollbar-thumb: #475569;
        --mdw-scrollbar-track: #0b1220;
      }
    `,
  },
  {
    id: "notebook",
    label: "Notebook (pastel)",
    className: "mdw-theme-notebook",
    css: `
      .mdw-theme-notebook {
        --mdw-toolbar-gradient-from: #fde68a;
        --mdw-toolbar-gradient-via: #fbbf24;
        --mdw-toolbar-gradient-to: #f59e0b;
        --mdw-toolbar-fg: #78350f;
        --mdw-toolbar-font-family: Georgia, serif;
        --mdw-toolbar-select-bg: #fef3c7;
        --mdw-button-active-bg: #f59e0b;
        --mdw-button-hover-gradient-from: #fef3c7;
        --mdw-button-hover-gradient-to: #fde68a;
        --mdw-content-bg: linear-gradient(135deg, #fffbeb, #fef3c7);
        --mdw-content-wysiwyg-fg: #451a03;
        --mdw-content-wysiwyg-font-family: Georgia, serif;
        --mdw-content-markdown-fg: #78350f;
        --mdw-scrollbar-thumb: #d97706;
      }
    `,
  },
  {
    id: "terminal",
    label: "Terminal",
    className: "mdw-theme-terminal",
    css: `
      .mdw-theme-terminal {
        --mdw-toolbar-gradient-from: #052e16;
        --mdw-toolbar-gradient-via: #14532d;
        --mdw-toolbar-gradient-to: #052e16;
        --mdw-toolbar-fg: #4ade80;
        --mdw-toolbar-font-family: ui-monospace, Consolas, monospace;
        --mdw-toolbar-select-bg: #052e16;
        --mdw-button-active-bg: #166534;
        --mdw-button-hover-gradient-from: #166534;
        --mdw-button-hover-gradient-to: #052e16;
        --mdw-content-bg: #000000;
        --mdw-content-wysiwyg-fg: #4ade80;
        --mdw-content-wysiwyg-font-family: ui-monospace, Consolas, monospace;
        --mdw-content-markdown-fg: #22c55e;
        --mdw-content-markdown-font-family: ui-monospace, Consolas, monospace;
        --mdw-scrollbar-thumb: #166534;
        --mdw-scrollbar-track: #000000;
      }
    `,
  },
  {
    id: "high-contrast",
    label: "Alto contraste",
    className: "mdw-theme-hc",
    css: `
      .mdw-theme-hc {
        --mdw-toolbar-gradient-from: #000000;
        --mdw-toolbar-gradient-via: #000000;
        --mdw-toolbar-gradient-to: #000000;
        --mdw-toolbar-fg: #ffff00;
        --mdw-toolbar-font-family: Arial, sans-serif;
        --mdw-toolbar-select-bg: #000000;
        --mdw-button-active-bg: #ffff00;
        --mdw-button-hover-gradient-from: #333333;
        --mdw-button-hover-gradient-to: #000000;
        --mdw-content-bg: #000000;
        --mdw-content-wysiwyg-fg: #ffffff;
        --mdw-content-markdown-fg: #ffff00;
        --mdw-scrollbar-thumb: #ffff00;
        --mdw-scrollbar-track: #000000;
      }
    `,
  },
];

function App() {
  const [markdown, setMarkdown] = useState(DEMO);
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const [modified, setModified] = useState<boolean | null>(null);
  const [themeId, setThemeId] = useState(THEME_PRESETS[0]!.id);
  const activeTheme =
    THEME_PRESETS.find((theme) => theme.id === themeId) ?? THEME_PRESETS[0]!;
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
        <h2>Theming: 5 estilos (CSS Custom Properties)</h2>
        <style>{THEME_PRESETS.map((theme) => theme.css).join("\n")}</style>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {THEME_PRESETS.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => setThemeId(theme.id)}
              style={{
                fontWeight: theme.id === themeId ? "bold" : "normal",
                outline: theme.id === themeId ? "2px solid #3d6fd8" : "none",
              }}
            >
              {theme.label}
            </button>
          ))}
        </div>
        <MarkdownEditor
          key={activeTheme.id}
          className={activeTheme.className || undefined}
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

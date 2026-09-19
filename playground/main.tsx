import { StrictMode, useMemo, useRef, useState } from "react";
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

/** Todas las CSS Custom Properties de theming que expone el componente. */
type ThemeVars = Record<string, string>;

const THEME_VAR_ORDER: Array<{ group: string; vars: string[] }> = [
  {
    group: "Barra de herramientas",
    vars: [
      "--mdw-toolbar-gradient-from",
      "--mdw-toolbar-gradient-via",
      "--mdw-toolbar-gradient-to",
      "--mdw-toolbar-fg",
      "--mdw-toolbar-font-family",
      "--mdw-toolbar-select-bg",
      "--mdw-button-active-bg",
      "--mdw-button-hover-gradient-from",
      "--mdw-button-hover-gradient-to",
    ],
  },
  {
    group: "Área de contenido",
    vars: [
      "--mdw-content-bg",
      "--mdw-content-wysiwyg-fg",
      "--mdw-content-wysiwyg-font-family",
      "--mdw-content-markdown-fg",
      "--mdw-content-markdown-font-family",
    ],
  },
  {
    group: "Scroll",
    vars: ["--mdw-scrollbar-thumb", "--mdw-scrollbar-track"],
  },
  {
    group: "Tablas y código",
    vars: ["--mdw-table-header-bg", "--mdw-code-block-bg"],
  },
];

/** `true` si el valor es un color hex simple, editable con `<input type="color">`. */
function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

interface ThemePreset {
  id: string;
  label: string;
  vars: ThemeVars;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "default",
    label: "Default",
    vars: {
      "--mdw-toolbar-gradient-from": "#eeeeee",
      "--mdw-toolbar-gradient-via": "#dcdcdc",
      "--mdw-toolbar-gradient-to": "#cfcfcf",
      "--mdw-toolbar-fg": "#222222",
      "--mdw-toolbar-font-family": "Arial, sans-serif",
      "--mdw-toolbar-select-bg": "#e9e9e9",
      "--mdw-button-active-bg": "#c8c8c8",
      "--mdw-button-hover-gradient-from": "#ffffff",
      "--mdw-button-hover-gradient-to": "#d8d8d8",
      "--mdw-content-bg": "#ffffff",
      "--mdw-content-wysiwyg-fg": "#1f2328",
      "--mdw-content-wysiwyg-font-family": "inherit",
      "--mdw-content-markdown-fg": "#1f2328",
      "--mdw-content-markdown-font-family": "ui-monospace, Consolas, monospace",
      "--mdw-scrollbar-thumb": "#c1c1c1",
      "--mdw-scrollbar-track": "transparent",
      "--mdw-table-header-bg": "#f6f7f9",
      "--mdw-code-block-bg": "#f6f7f9",
    },
  },
  {
    id: "dark",
    label: "Oscuro",
    vars: {
      "--mdw-toolbar-gradient-from": "#1e293b",
      "--mdw-toolbar-gradient-via": "#0f172a",
      "--mdw-toolbar-gradient-to": "#020617",
      "--mdw-toolbar-fg": "#f8fafc",
      "--mdw-toolbar-font-family": '"Trebuchet MS", sans-serif',
      "--mdw-toolbar-select-bg": "#1e293b",
      "--mdw-button-active-bg": "#334155",
      "--mdw-button-hover-gradient-from": "#334155",
      "--mdw-button-hover-gradient-to": "#1e293b",
      "--mdw-content-bg": "#0b1220",
      "--mdw-content-wysiwyg-fg": "#e2e8f0",
      "--mdw-content-wysiwyg-font-family": "inherit",
      "--mdw-content-markdown-fg": "#94a3b8",
      "--mdw-content-markdown-font-family": "ui-monospace, Consolas, monospace",
      "--mdw-scrollbar-thumb": "#475569",
      "--mdw-scrollbar-track": "#0b1220",
      "--mdw-table-header-bg": "#1e293b",
      "--mdw-code-block-bg": "#1e293b",
    },
  },
  {
    id: "notebook",
    label: "Notebook (pastel)",
    vars: {
      "--mdw-toolbar-gradient-from": "#fde68a",
      "--mdw-toolbar-gradient-via": "#fbbf24",
      "--mdw-toolbar-gradient-to": "#f59e0b",
      "--mdw-toolbar-fg": "#78350f",
      "--mdw-toolbar-font-family": "Georgia, serif",
      "--mdw-toolbar-select-bg": "#fef3c7",
      "--mdw-button-active-bg": "#f59e0b",
      "--mdw-button-hover-gradient-from": "#fef3c7",
      "--mdw-button-hover-gradient-to": "#fde68a",
      "--mdw-content-bg": "linear-gradient(135deg, #fffbeb, #fef3c7)",
      "--mdw-content-wysiwyg-fg": "#451a03",
      "--mdw-content-wysiwyg-font-family": "Georgia, serif",
      "--mdw-content-markdown-fg": "#78350f",
      "--mdw-content-markdown-font-family": "ui-monospace, Consolas, monospace",
      "--mdw-scrollbar-thumb": "#d97706",
      "--mdw-scrollbar-track": "transparent",
      "--mdw-table-header-bg": "#fef3c7",
      "--mdw-code-block-bg": "#fef3c7",
    },
  },
  {
    id: "terminal",
    label: "Terminal",
    vars: {
      "--mdw-toolbar-gradient-from": "#052e16",
      "--mdw-toolbar-gradient-via": "#14532d",
      "--mdw-toolbar-gradient-to": "#052e16",
      "--mdw-toolbar-fg": "#4ade80",
      "--mdw-toolbar-font-family": "ui-monospace, Consolas, monospace",
      "--mdw-toolbar-select-bg": "#052e16",
      "--mdw-button-active-bg": "#166534",
      "--mdw-button-hover-gradient-from": "#166534",
      "--mdw-button-hover-gradient-to": "#052e16",
      "--mdw-content-bg": "#000000",
      "--mdw-content-wysiwyg-fg": "#4ade80",
      "--mdw-content-wysiwyg-font-family": "ui-monospace, Consolas, monospace",
      "--mdw-content-markdown-fg": "#22c55e",
      "--mdw-content-markdown-font-family": "ui-monospace, Consolas, monospace",
      "--mdw-scrollbar-thumb": "#166534",
      "--mdw-scrollbar-track": "#000000",
      "--mdw-table-header-bg": "#052e16",
      "--mdw-code-block-bg": "#052e16",
    },
  },
  {
    id: "high-contrast",
    label: "Alto contraste",
    vars: {
      "--mdw-toolbar-gradient-from": "#000000",
      "--mdw-toolbar-gradient-via": "#000000",
      "--mdw-toolbar-gradient-to": "#000000",
      "--mdw-toolbar-fg": "#ffff00",
      "--mdw-toolbar-font-family": "Arial, sans-serif",
      "--mdw-toolbar-select-bg": "#000000",
      "--mdw-button-active-bg": "#ffff00",
      "--mdw-button-hover-gradient-from": "#333333",
      "--mdw-button-hover-gradient-to": "#000000",
      "--mdw-content-bg": "#000000",
      "--mdw-content-wysiwyg-fg": "#ffffff",
      "--mdw-content-wysiwyg-font-family": "inherit",
      "--mdw-content-markdown-fg": "#ffff00",
      "--mdw-content-markdown-font-family": "ui-monospace, Consolas, monospace",
      "--mdw-scrollbar-thumb": "#ffff00",
      "--mdw-scrollbar-track": "#000000",
      "--mdw-table-header-bg": "#000000",
      "--mdw-code-block-bg": "#000000",
    },
  },
];

/** Arma el bloque CSS `.mi-clase { --var: valor; ... }`. */
function buildCssBlock(
  vars: ThemeVars,
  selector: string,
  options: { important?: boolean } = {},
): string {
  const suffix = options.important === true ? " !important" : "";
  const lines = Object.entries(vars).map(
    ([name, value]) => `  ${name}: ${value}${suffix};`,
  );
  return `${selector} {\n${lines.join("\n")}\n}`;
}

function ThemeEditor({
  vars,
  onChange,
}: {
  vars: ThemeVars;
  onChange: (name: string, value: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyCss = () => {
    const css = buildCssBlock(vars, ".mi-editor-personalizado");
    void navigator.clipboard.writeText(css).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        border: "1px solid #d0d4da",
        borderRadius: 6,
        padding: 12,
        fontSize: 12,
        maxHeight: 500,
        overflow: "auto",
      }}
    >
      <h3 style={{ marginTop: 0, fontSize: 13 }}>Parámetros en tiempo real</h3>
      {THEME_VAR_ORDER.map(({ group, vars: groupVars }) => (
        <div key={group} style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>{group}</div>
          {groupVars.map((name) => {
            const value = vars[name] ?? "";
            const hex = isHexColor(value);
            return (
              <label
                key={name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontFamily: "ui-monospace, Consolas, monospace",
                    fontSize: 10,
                    wordBreak: "break-all",
                  }}
                >
                  {name.replace("--mdw-", "")}
                </span>
                {hex && (
                  <input
                    type="color"
                    value={value}
                    onChange={(event) =>
                      onChange(name, event.target.value)
                    }
                    style={{ width: 28, height: 22, padding: 0 }}
                  />
                )}
                <input
                  type="text"
                  value={value}
                  onChange={(event) => onChange(name, event.target.value)}
                  style={{ width: hex ? 90 : 130, fontSize: 10 }}
                />
              </label>
            );
          })}
        </div>
      ))}
      <button type="button" onClick={copyCss} style={{ width: "100%" }}>
        {copied ? "¡Copiado!" : "Copiar CSS"}
      </button>
    </div>
  );
}

function App() {
  const [markdown, setMarkdown] = useState(DEMO);
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const [modified, setModified] = useState<boolean | null>(null);
  const [themeId, setThemeId] = useState(THEME_PRESETS[0]!.id);
  const [customVars, setCustomVars] = useState<ThemeVars>(
    THEME_PRESETS[0]!.vars,
  );

  const selectPreset = (id: string) => {
    const preset = THEME_PRESETS.find((theme) => theme.id === id);
    if (!preset) return;
    setThemeId(id);
    setCustomVars(preset.vars);
  };

  const updateVar = (name: string, value: string) => {
    setCustomVars((prev) => ({ ...prev, [name]: value }));
  };

  // El propio `.root` del componente ya define un valor concreto para cada
  // --mdw-*, así que esas variables NUNCA se heredan de un ancestro (la
  // cascada solo hereda una propiedad si el elemento no la redefine). Por
  // eso hace falta una regla de mayor especificidad aplicada directamente
  // sobre la clase del componente, no un `style` en un `<div>` padre.
  const liveThemeCss = useMemo(
    () =>
      buildCssBlock(customVars, ".mdw-live-theme", { important: true }),
    [customVars],
  );

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
        <h2>Theming: 5 estilos + edición en vivo (CSS Custom Properties)</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <label>
            Estilo:{" "}
            <select
              value={themeId}
              onChange={(event) => selectPreset(event.target.value)}
            >
              {THEME_PRESETS.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <style>{liveThemeCss}</style>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <MarkdownEditor
            className="mdw-live-theme"
            initialContent={DEMO}
            width={700}
            height={600}
          />
          <ThemeEditor vars={customVars} onChange={updateVar} />
        </div>
      </section>
    </div>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

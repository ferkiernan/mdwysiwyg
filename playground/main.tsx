import { StrictMode, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { MarkdownEditor } from "../src";
import { ConfigBuilder } from "./builder/ConfigBuilder";
import { GUIDE_URL } from "./builder/generators";
import { version } from "../package.json";
import "./playground.css";
import type {
  CompareDecision,
  CompareOrientation,
  EditorMode,
  MarkdownEditorHandle,
} from "../src";

// Relleno para que ambos paneles tengan que desplazarse (prueba del desplazamiento sincronizado).
const COMPARE_FILLER = Array.from(
  { length: 24 },
  (_, index) =>
    `Párrafo de relleno ${index + 1}: texto largo para comprobar que al desplazar un panel el otro muestra el mismo contenido.\n`,
);

const COMPARE_ORIGINAL = [
  "# Informe",
  "",
  "El proyecto avanza según lo previsto y el equipo está contento.",
  "",
  "- Diseño",
  "- Desarrollo",
  "",
  "| Fase | Estado |",
  "| --- | --- |",
  "| Diseño | Hecho |",
  "",
  ...COMPARE_FILLER,
].join("\n");

const COMPARE_PROPOSED = [
  "# Informe",
  "",
  "El proyecto avanza mejor de lo previsto y el equipo está muy contento.",
  "",
  "Se añade un párrafo nuevo con la propuesta.",
  "",
  "- Diseño",
  "- Pruebas",
  "- Desarrollo",
  "",
  "| Fase | Estado |",
  "| --- | --- |",
  "| Diseño | Hecho |",
  "| Pruebas | Pendiente |",
  "",
  "Sección nueva antes del relleno.",
  "",
  "Otro párrafo añadido por la propuesta.",
  "",
  ...COMPARE_FILLER,
].join("\n");

/** Demo del modo de comparación: modo, orientación, contenido nuevo y registro de decisiones. */
function CompareDemo({
  showToolbar,
  onShowToolbar,
}: {
  showToolbar: boolean;
  onShowToolbar: (value: boolean) => void;
}) {
  const [mode, setMode] = useState<EditorMode>("compare");
  const [orientation, setOrientation] = useState<CompareOrientation>("side-to-side");
  const [proposed, setProposed] = useState(COMPARE_PROPOSED);
  const [syncScroll, setSyncScroll] = useState(true);
  const [log, setLog] = useState<string[]>([]);

  const record = (result: CompareDecision) =>
    setLog((previous) => [`${result.decision}: ${JSON.stringify(result.markdown).slice(0, 80)}…`, ...previous]);

  return (
    <div className="pg-demo">
      <div className="pg-row pg-controls">
        <label className="pg-check">
          Modo
          <select value={mode} onChange={(event) => setMode(event.target.value as EditorMode)}>
            <option value="default">default</option>
            <option value="compare">compare</option>
          </select>
        </label>
        <label className="pg-check">
          Orientación
          <select value={orientation} onChange={(event) => setOrientation(event.target.value as CompareOrientation)}>
            <option value="side-to-side">side-to-side</option>
            <option value="up-and-down">up-and-down</option>
          </select>
        </label>
        <label className="pg-check">
          <input type="checkbox" checked={syncScroll} onChange={(event) => setSyncScroll(event.target.checked)} />
          Desplazamiento sincronizado (compareSyncScroll)
        </label>
        <label className="pg-check">
          <input type="checkbox" checked={showToolbar} onChange={(event) => onShowToolbar(event.target.checked)} />
          Mostrar barra
        </label>
      </div>
      <div className="pg-demo-wide">
        <MarkdownEditor
          initialContent={COMPARE_ORIGINAL}
          mode={mode}
          compareOrientation={orientation}
          compareContent={proposed}
          compareSyncScroll={syncScroll}
          onCompareDecision={record}
          showToolbar={showToolbar}
          height={620}
          width="100%"
        />
        <div className="pg-demo pg-controls">
          <label className="pg-field-stack">
            <span className="pg-label">Contenido nuevo (compareContent)</span>
            <textarea rows={16} value={proposed} onChange={(event) => setProposed(event.target.value)} />
          </label>
          <div>
            <p className="pg-label">Decisiones (onCompareDecision)</p>
            <pre className="pg-code">{log.length === 0 ? "Sin decisiones todavía" : log.join("\n")}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  "And mermaid diagrams render for real:",
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

interface Tab {
  id: string;
  label: string;
  title: string;
  lead: ReactNode;
}

const TABS: Tab[] = [
  {
    id: "configurador",
    label: "Configurador",
    title: "Configurá tu control",
    lead: "Elegí atributos y aspecto, mirá el resultado en la vista previa y copiá los atributos y el CSS para tu host.",
  },
  {
    id: "demo-editor",
    label: "Editor",
    title: "Editor normal",
    lead: "Redimensionable por defecto. Al lado, el Markdown que emite onChange en cada cambio.",
  },
  {
    id: "demo-compare",
    label: "Comparación",
    title: "Modo comparación (compare)",
    lead: "Original y propuesta lado a lado: aceptá o rechazá los cambios y mirá las decisiones registradas.",
  },
  {
    id: "demo-readonly",
    label: "Solo lectura",
    title: "Modo solo lectura (onlyView)",
    lead: "Con un aviso personalizado en lugar de la barra de herramientas.",
  },
  {
    id: "demo-api",
    label: "API imperativa",
    title: "API imperativa (reset / isModified)",
    lead: (
      <>
        Editá el contenido y usá los botones: el estado se consulta por <code>ref</code>, sin remontar el componente.
      </>
    ),
  },
  {
    id: "demo-fixed",
    label: "Tamaño fijo",
    title: "Tamaño fijo (resizable=false)",
    lead: "Ancho y alto fijos: el control no se puede redimensionar.",
  },
];

const HOME = "configurador";

function tabFromHash(): string {
  const id = window.location.hash.slice(1);
  return TABS.some((tab) => tab.id === id) ? id : HOME;
}

function App() {
  const [active, setActive] = useState(tabFromHash);
  const [markdown, setMarkdown] = useState(DEMO);
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const [modified, setModified] = useState<boolean | null>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const [historyUndo, setHistoryUndo] = useState(true);

  useEffect(() => {
    const onHash = () => setActive(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const select = (id: string) => {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0 });
  };
  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = TABS[(index + step + TABS.length) % TABS.length];
    if (next === undefined) return;
    select(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <>
      <header className="pg-header">
        <div className="pg-header-inner">
          <div className="pg-brand">
            <span className="pg-brand-name">mdwysiwyg</span>
            <span className="pg-brand-version">v{version}</span>
          </div>
          <nav className="pg-tabs" role="tablist" aria-label="Secciones del playground">
            {TABS.map((t, index) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                type="button"
                role="tab"
                className="pg-tab"
                aria-selected={t.id === active}
                aria-controls="pg-panel"
                tabIndex={t.id === active ? 0 : -1}
                onClick={() => select(t.id)}
                onKeyDown={(event) => onTabKey(event, index)}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="pg-header-links">
            <a href={GUIDE_URL} target="_blank" rel="noopener noreferrer">
              Guía de estilos ↗
            </a>
            <a href="https://github.com/ferkiernan/mdwysiwyg" target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
            <a href="https://www.npmjs.com/package/mdwysiwyg" target="_blank" rel="noopener noreferrer">
              npm ↗
            </a>
          </div>
        </div>
      </header>

      <main className="pg-main" id="pg-panel" role="tabpanel" aria-labelledby={`tab-${tab?.id ?? HOME}`}>
        <div className="pg-intro">
          <h1>{tab?.title}</h1>
          <p>{tab?.lead}</p>
        </div>

        {active === "configurador" && <ConfigBuilder />}

        {active === "demo-editor" && (
          <div className="pg-card pg-demo">
            <div className="pg-row pg-controls">
              <label className="pg-check">
                <input type="checkbox" checked={showToolbar} onChange={(event) => setShowToolbar(event.target.checked)} />
                Mostrar barra
              </label>
              <label className="pg-check">
                <input type="checkbox" checked={historyUndo} onChange={(event) => setHistoryUndo(event.target.checked)} />
                Historial de versiones (historyUndo)
              </label>
            </div>
            <div className="pg-demo-split">
              <MarkdownEditor
                initialContent={DEMO}
                onChange={setMarkdown}
                showToolbar={showToolbar}
                historyUndo={historyUndo}
                width="100%"
                height={600}
              />
              <div>
                <p className="pg-label">Markdown (onChange)</p>
                <pre className="pg-code">{markdown}</pre>
              </div>
            </div>
          </div>
        )}

        {active === "demo-compare" && (
          <div className="pg-card">
            <CompareDemo showToolbar={showToolbar} onShowToolbar={setShowToolbar} />
          </div>
        )}

        {active === "demo-readonly" && (
          <div className="pg-card">
            <MarkdownEditor onlyView onlyViewNotice="demo-readme.md" initialContent={DEMO} height={520} width="100%" />
          </div>
        )}

        {active === "demo-api" && (
          <div className="pg-card pg-demo">
            <div className="pg-row pg-controls">
              <button type="button" onClick={() => editorRef.current?.reset()}>
                Descartar cambios
              </button>
              <button type="button" onClick={() => setModified(editorRef.current?.isModified() ?? false)}>
                ¿Modificado?
              </button>
              <span className="pg-status" role="status">
                {modified === null ? "—" : modified ? "Sí" : "No"}
              </span>
            </div>
            <MarkdownEditor
              ref={editorRef}
              initialContent={"# Original\n\nProbá editar esto."}
              documentId="demo-1"
              fileName="demo-readme.md"
              height={300}
              width="100%"
            />
          </div>
        )}

        {active === "demo-fixed" && (
          <div className="pg-card">
            <MarkdownEditor
              resizable={false}
              initialContent="Este editor no se puede redimensionar."
              width={400}
              height={200}
            />
          </div>
        )}
      </main>
    </>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

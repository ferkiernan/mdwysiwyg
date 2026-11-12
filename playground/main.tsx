import { StrictMode, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { MarkdownEditor } from "../src";
import { ConfigBuilder } from "./builder/ConfigBuilder";
import { StylingGuideLink } from "./builder/StylingGuideLink";
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
function CompareDemo({ showToolbar }: { showToolbar: boolean }) {
  const [mode, setMode] = useState<EditorMode>("compare");
  const [orientation, setOrientation] =
    useState<CompareOrientation>("side-to-side");
  const [proposed, setProposed] = useState(COMPARE_PROPOSED);
  const [syncScroll, setSyncScroll] = useState(true);
  const [log, setLog] = useState<string[]>([]);

  const record = (result: CompareDecision) =>
    setLog((previous) => [
      `${result.decision}: ${JSON.stringify(result.markdown).slice(0, 80)}…`,
      ...previous,
    ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <label>
          Modo{" "}
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as EditorMode)}
          >
            <option value="default">default</option>
            <option value="compare">compare</option>
          </select>
        </label>
        <label>
          Orientación{" "}
          <select
            value={orientation}
            onChange={(event) =>
              setOrientation(event.target.value as CompareOrientation)
            }
          >
            <option value="side-to-side">side-to-side</option>
            <option value="up-and-down">up-and-down</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={syncScroll}
            onChange={(event) => setSyncScroll(event.target.checked)}
          />{" "}
          Desplazamiento sincronizado (compareSyncScroll)
        </label>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        Contenido nuevo (compareContent)
        <textarea
          rows={4}
          value={proposed}
          onChange={(event) => setProposed(event.target.value)}
          style={{ fontFamily: "monospace", fontSize: 12 }}
        />
      </label>
      <MarkdownEditor
        initialContent={COMPARE_ORIGINAL}
        mode={mode}
        compareOrientation={orientation}
        compareContent={proposed}
        compareSyncScroll={syncScroll}
        onCompareDecision={record}
        showToolbar={showToolbar}
        height={560}
        width="100%"
      />
      <pre style={{ background: "#f6f7f9", padding: 8, fontSize: 12, margin: 0 }}>
        {log.length === 0 ? "Sin decisiones todavía" : log.join("\n")}
      </pre>
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

function App() {
  const [markdown, setMarkdown] = useState(DEMO);
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const [modified, setModified] = useState<boolean | null>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const [historyUndo, setHistoryUndo] = useState(true);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: 16 }}>
      <p style={{ margin: 0 }}>
        Configurá el control y su aspecto, copiá los atributos y el CSS, y pegalos en tu host.{" "}
        <StylingGuideLink prefix="¿Querés adaptar el aspecto?" />
      </p>

      <ConfigBuilder />

      <h2 style={{ marginBottom: 0 }}>Demos</h2>

      <section>
        <h2>Editor normal (resizable por defecto)</h2>
        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={showToolbar}
            onChange={(event) => setShowToolbar(event.target.checked)}
          />{" "}
          Mostrar barra
        </label>
        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={historyUndo}
            onChange={(event) => setHistoryUndo(event.target.checked)}
          />{" "}
          Historial de versiones (historyUndo)
        </label>
        <div style={{ display: "flex", gap: 16 }}>
          <MarkdownEditor
            initialContent={DEMO}
            onChange={setMarkdown}
            showToolbar={showToolbar}
            historyUndo={historyUndo}
          />
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
        <h2>Modo comparación (compare)</h2>
        <CompareDemo showToolbar={showToolbar} />
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
          initialContent="# Original
          
Probá editar esto."
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

    </div>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

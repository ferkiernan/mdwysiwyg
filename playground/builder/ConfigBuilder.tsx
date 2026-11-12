import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MarkdownEditor } from "../../src";
import type { MarkdownEditorProps } from "../../src";
import {
  THEME_TOKENS,
  THEME_TOKEN_GROUP_LABELS,
  type ThemeTokenGroup,
} from "../../src/components/MarkdownEditor/theme/themeTokens";
import attributeSpecs from "../generated/attributes.json";
import { buildAttributesSnippet, buildThemeCss } from "./generators";
import { dependencyNotes, isValidClassName, isValidCssValue } from "./validation";
import { DARK_VALUES, THEME_PRESETS } from "./presets";
import { copyText } from "./clipboard";
import { StylingGuideLink } from "./StylingGuideLink";
import type {
  AttributeChoices,
  AttributeSpec,
  AttributesFormat,
  ThemeChoices,
  ThemeScope,
} from "./types";

const SPECS = attributeSpecs as AttributeSpec[];
const STORAGE_KEY = "mdwysiwyg-playground-builder";

const PREVIEW_CONTENT = [
  "# Documento de ejemplo",
  "",
  "Texto con **negrita**, *cursiva* y un [enlace](https://example.com).",
  "",
  "> Una cita para ver su color.",
  "",
  "```typescript",
  "// comentario",
  'const saludo: string = "hola";',
  "function sumar(a: number) { return a + 42; }",
  "```",
  "",
  "| Columna | Valor |",
  "| --- | --- |",
  "| Uno | 1 |",
  "",
  "- Elemento de lista",
  "- [ ] Tarea pendiente",
  "",
].join("\n");

const DEFAULT_THEME: ThemeChoices = {
  preset: "control-default",
  values: {},
  darkValues: null,
  scope: "control",
  className: "mi-editor",
  includeAll: false,
};

interface BuilderState {
  version: 1;
  attributes: AttributeChoices;
  format: AttributesFormat;
  theme: ThemeChoices;
}

const FRESH: BuilderState = {
  version: 1,
  attributes: {},
  format: "jsx",
  theme: DEFAULT_THEME,
};

function loadState(): BuilderState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return FRESH;
    const parsed = JSON.parse(raw) as Partial<BuilderState>;
    if (parsed.version !== 1) return FRESH;
    return {
      ...FRESH,
      ...parsed,
      theme: { ...DEFAULT_THEME, ...(parsed.theme ?? {}) },
    } as BuilderState;
  } catch {
    return FRESH;
  }
}

/** Props de la vista previa a partir de los atributos elegidos. */
function previewProps(choices: AttributeChoices): MarkdownEditorProps {
  const props: Record<string, unknown> = {};
  for (const spec of SPECS) {
    const value = choices[spec.name] ?? spec.default;
    if (value === null || value === "") continue;
    if (spec.kind === "function") {
      if (value === true && spec.name === "resolveImageSrc") props[spec.name] = (src: string) => src;
      continue;
    }
    props[spec.name] =
      spec.kind === "size" && typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number(value)
        : value;
  }
  return props as MarkdownEditorProps;
}

const box = {
  border: "1px solid #d0d4da",
  borderRadius: 6,
  padding: 12,
} as const;

const mono = { fontFamily: "ui-monospace, Consolas, monospace", fontSize: 12 } as const;

function CopyFeedback({ status, text }: { status: "idle" | "copied" | "failed"; text: string }) {
  return (
    <>
      <span role="status" aria-live="polite" style={{ marginLeft: 8, fontSize: 13 }}>
        {status === "copied" ? "¡Copiado!" : status === "failed" ? "No se pudo copiar automáticamente: seleccioná y copiá el texto." : ""}
      </span>
      {status === "failed" && (
        <textarea
          readOnly
          value={text}
          aria-label="Texto para copiar"
          ref={(el) => el?.select()}
          style={{ ...mono, width: "100%", height: 120, marginTop: 6 }}
        />
      )}
    </>
  );
}

function useCopy() {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const copy = async (text: string) => {
    const ok = await copyText(text);
    setStatus(ok ? "copied" : "failed");
    if (ok) setTimeout(() => setStatus("idle"), 1500);
  };
  return { status, copy };
}

function Field({ label, note, children }: { label: ReactNode; note?: string | undefined; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {children}
      <div style={{ fontSize: 12, color: "#57606a", marginTop: 2 }}>{label}</div>
      {note !== undefined && (
        <div style={{ fontSize: 12, color: "#9a6700", marginTop: 2 }}>⚠ {note}</div>
      )}
    </div>
  );
}

function AttributeInput({
  spec,
  value,
  onChange,
}: {
  spec: AttributeSpec;
  value: AttributeChoices[string] | undefined;
  onChange: (value: AttributeChoices[string] | undefined) => void;
}) {
  const id = `attr-${spec.name}`;
  const name = <code style={mono}>{spec.name}</code>;
  const current = value ?? spec.default;
  if (spec.kind === "switch" || spec.kind === "function") {
    return (
      <label htmlFor={id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          id={id}
          type="checkbox"
          checked={spec.kind === "function" ? value === true : current === true}
          onChange={(event) => onChange(event.target.checked)}
        />
        {name}
        {spec.kind === "function" && <span style={{ fontSize: 12 }}>(incluir marcador para el host)</span>}
      </label>
    );
  }
  if (spec.kind === "options") {
    return (
      <label htmlFor={id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {name}
        <select
          id={id}
          value={typeof current === "string" ? current : ""}
          onChange={(event) => onChange(event.target.value === "" ? undefined : event.target.value)}
        >
          {spec.default === null && <option value="">(sin valor)</option>}
          {spec.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }
  const text = current === null || current === undefined ? "" : String(current);
  if (spec.name === "compareContent") {
    return (
      <label htmlFor={id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {name}
        <textarea id={id} rows={3} value={text} onChange={(event) => onChange(event.target.value)} style={mono} />
      </label>
    );
  }
  return (
    <label htmlFor={id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {name}
      <input id={id} type="text" value={text} onChange={(event) => onChange(event.target.value)} style={{ ...mono, flex: 1 }} />
    </label>
  );
}

/**
 * Constructor de configuración: atributos del control + tema, una vista previa
 * compartida y las salidas listas para pegar en el host (spec 017).
 */
export function ConfigBuilder() {
  const [state, setState] = useState<BuilderState>(loadState);
  const [drafts, setDrafts] = useState<Record<string, string>>(() => ({ ...state.theme.values }));
  const attributesCopy = useCopy();
  const cssCopy = useCopy();
  const { attributes, format, theme } = state;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Sin almacenamiento: las elecciones no se recuerdan.
    }
  }, [state]);

  const setAttribute = (name: string, value: AttributeChoices[string] | undefined) =>
    setState((prev) => {
      const next = { ...prev.attributes };
      if (value === undefined) delete next[name];
      else next[name] = value;
      return { ...prev, attributes: next };
    });
  const setTheme = (patch: Partial<ThemeChoices>) =>
    setState((prev) => ({ ...prev, theme: { ...prev.theme, ...patch } }));

  const classValid = isValidClassName(theme.className);
  const invalid = useMemo(
    () =>
      new Set(
        THEME_TOKENS.filter(
          (token) => drafts[token.name] !== undefined && drafts[token.name] !== theme.values[token.name],
        ).map((token) => token.name),
      ),
    [drafts, theme.values],
  );
  const effectiveTheme: ThemeChoices = classValid ? theme : { ...theme, className: DEFAULT_THEME.className };
  const css = buildThemeCss(effectiveTheme, invalid);
  const notes = dependencyNotes(attributes);
  const snippet = buildAttributesSnippet(
    SPECS,
    attributes,
    format,
    effectiveTheme.scope === "control" ? effectiveTheme.className : null,
  );

  // La vista previa usa el mismo CSS; el alcance "página" se limita a la vista
  // previa para no tematizar las demás demos.
  const previewTheme: ThemeChoices =
    effectiveTheme.scope === "page"
      ? { ...effectiveTheme, scope: "section", className: "mdw-builder-page" }
      : effectiveTheme;
  const previewCss = buildThemeCss(previewTheme, invalid);
  const wrapperClass = previewTheme.scope === "section" ? previewTheme.className : undefined;
  const editorClass = previewTheme.scope === "control" ? previewTheme.className : undefined;

  const setToken = (name: string, value: string) => {
    const token = THEME_TOKENS.find((t) => t.name === name);
    setDrafts((prev) => ({ ...prev, [name]: value }));
    if (token !== undefined && isValidCssValue(token.kind, value)) {
      setState((prev) => ({
        ...prev,
        theme: { ...prev.theme, values: { ...prev.theme.values, [name]: value } },
      }));
    }
  };
  const selectPreset = (id: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === id);
    if (preset === undefined) return;
    setDrafts({ ...preset.values });
    setTheme({ preset: id, values: { ...preset.values } });
  };
  const startOver = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignorado
    }
    setDrafts({});
    setState(FRESH);
  };

  const groups = Object.keys(THEME_TOKEN_GROUP_LABELS) as ThemeTokenGroup[];

  return (
    <div className="mdw-builder">
      <style>{`
        .mdw-builder { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; align-items: start; }
        .mdw-builder-preview { position: sticky; top: 8px; }
        @media (max-width: 900px) {
          .mdw-builder { grid-template-columns: minmax(0, 1fr); }
          .mdw-builder-preview { position: static; }
        }
      `}</style>
      <div>
        <section aria-labelledby="mdw-builder-attrs" style={{ ...box, marginBottom: 24 }}>
          <h2 id="mdw-builder-attrs" style={{ marginTop: 0 }}>Seleccioná los atributos de tu control</h2>
          <p style={{ fontSize: 13, marginTop: 0 }}>
            Cada cambio se aplica a la vista previa. «Copiar atributos» copia solo lo que difiere del valor por defecto.
          </p>
          {SPECS.map((spec) => (
            <Field
              key={spec.name}
              label={
                <>
                  {spec.summary} Default: <code style={mono}>{spec.default === null ? "—" : JSON.stringify(spec.default)}</code>
                </>
              }
              note={notes[spec.name]}
            >
              <AttributeInput spec={spec} value={attributes[spec.name]} onChange={(v) => setAttribute(spec.name, v)} />
            </Field>
          ))}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <fieldset style={{ border: "none", padding: 0, margin: 0, display: "flex", gap: 8 }}>
              <legend style={{ fontSize: 13, float: "left", marginRight: 6 }}>Formato:</legend>
              {(["jsx", "object"] as const).map((value) => (
                <label key={value} style={{ fontSize: 13 }}>
                  <input
                    type="radio"
                    name="mdw-builder-format"
                    checked={format === value}
                    onChange={() => setState((prev) => ({ ...prev, format: value }))}
                  />{" "}
                  {value === "jsx" ? "JSX" : "Objeto"}
                </label>
              ))}
            </fieldset>
            <button type="button" onClick={() => void attributesCopy.copy(snippet)}>
              Copiar atributos
            </button>
            <CopyFeedback status={attributesCopy.status} text={snippet} />
          </div>
          <pre aria-label="Atributos para pegar en el host" style={{ ...mono, background: "#f6f7f9", padding: 8, overflow: "auto" }}>
            {snippet}
          </pre>
        </section>

        <section aria-labelledby="mdw-builder-theme" style={box}>
          <h2 id="mdw-builder-theme" style={{ marginTop: 0 }}>Theming</h2>
          <p style={{ fontSize: 13, marginTop: 0 }}>
            Ajustá el aspecto; el panel de abajo muestra en vivo el CSS final listo para pegar en tu host.{" "}
            <StylingGuideLink />
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
            <label>
              Preset{" "}
              <select value={theme.preset} onChange={(event) => selectPreset(event.target.value)}>
                {THEME_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => selectPreset("control-default")}>
              Restablecer
            </button>
          </div>
          <fieldset style={{ border: "none", padding: 0, margin: "0 0 8px" }}>
            <legend style={{ fontSize: 13 }}>Alcance del CSS</legend>
            {(
              [
                ["control", "Este control (clase en className)"],
                ["section", "Una sección (clase en un contenedor)"],
                ["page", "Toda la página (:root)"],
              ] as Array<[ThemeScope, string]>
            ).map(([value, label]) => (
              <label key={value} style={{ display: "block", fontSize: 13 }}>
                <input type="radio" name="mdw-builder-scope" checked={theme.scope === value} onChange={() => setTheme({ scope: value })} />{" "}
                {label}
              </label>
            ))}
          </fieldset>
          {theme.scope !== "page" && (
            <Field
              label={theme.scope === "control" ? "Clase del control" : "Clase del contenedor"}
              note={classValid ? undefined : "Nombre de clase inválido: se usa «mi-editor» hasta corregirlo."}
            >
              <input
                aria-label="Nombre de clase"
                value={theme.className}
                onChange={(event) => setTheme({ className: event.target.value })}
                style={mono}
              />
            </Field>
          )}
          <label style={{ display: "block", fontSize: 13 }}>
            <input type="checkbox" checked={theme.includeAll} onChange={(event) => setTheme({ includeAll: event.target.checked })} />{" "}
            Incluir todas las variables (no solo las cambiadas)
          </label>
          <label style={{ display: "block", fontSize: 13, marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={theme.darkValues !== null}
              onChange={(event) => setTheme({ darkValues: event.target.checked ? DARK_VALUES : null })}
            />{" "}
            Seguir la preferencia del sistema (añade la variante oscura del preset «Oscuro completo»)
          </label>

          {groups.map((group) => (
            <details key={group} style={{ marginBottom: 4 }}>
              <summary style={{ fontSize: 13, fontWeight: 600 }}>{THEME_TOKEN_GROUP_LABELS[group]}</summary>
              {THEME_TOKENS.filter((token) => token.group === group).map((token) => {
                const value = drafts[token.name] ?? theme.values[token.name] ?? "";
                const shown = value === "" ? token.default : value;
                const hex = /^#[0-9a-fA-F]{6}$/.test(shown);
                const bad = invalid.has(token.name);
                return (
                  <div key={token.name} style={{ display: "flex", gap: 6, alignItems: "center", margin: "4px 0" }}>
                    <span style={{ ...mono, fontSize: 11, flex: "0 0 45%", wordBreak: "break-all" }} title={token.description}>
                      {token.name}
                    </span>
                    {hex && (
                      <input
                        type="color"
                        aria-label={`${token.name} (selector de color)`}
                        value={shown}
                        onChange={(event) => setToken(token.name, event.target.value)}
                        style={{ width: 28, height: 22, padding: 0 }}
                      />
                    )}
                    <input
                      aria-label={token.name}
                      aria-invalid={bad}
                      placeholder={token.default}
                      value={value}
                      onChange={(event) => setToken(token.name, event.target.value)}
                      style={{ ...mono, fontSize: 11, flex: 1, borderColor: bad ? "#b42318" : undefined }}
                    />
                  </div>
                );
              })}
            </details>
          ))}

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={() => void cssCopy.copy(css)}>
              Crear CSS
            </button>
            <StylingGuideLink prefix="¿Dudas?" />
            <CopyFeedback status={cssCopy.status} text={css} />
          </div>
          <pre aria-label="CSS final para tu host" style={{ ...mono, background: "#f6f7f9", padding: 8, overflow: "auto", maxHeight: 320 }}>
            {css}
          </pre>
          <button type="button" onClick={startOver} style={{ marginTop: 8 }}>
            Empezar de nuevo
          </button>
        </section>
      </div>

      <div className="mdw-builder-preview">
        <h2 style={{ marginTop: 0 }}>Vista previa</h2>
        <style>{previewCss}</style>
        <div className={wrapperClass}>
          <MarkdownEditor
            key={attributes["resolveImageSrc"] === true ? "resolver" : "plain"}
            initialContent={PREVIEW_CONTENT}
            width="100%"
            {...previewProps(attributes)}
            {...(editorClass !== undefined ? { className: editorClass } : {})}
          />
        </div>
      </div>
    </div>
  );
}

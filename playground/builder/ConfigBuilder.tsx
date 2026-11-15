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
    if (value === null) continue;
    // Un compareContent vacío es una propuesta válida ("borrar todo"): no se
    // descarta, para que la comparación siga activa con el mismo original.
    if (value === "" && !(spec.name === "compareContent" && spec.name in choices)) continue;
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

/** Grupos de atributos por propósito; los que no figuran van a «Otros». */
export const ATTRIBUTE_GROUPS: Array<[string, string[]]> = [
  ["Tamaño", ["width", "height", "resizable", "autoHeight"]],
  ["Barra y vista", ["showToolbar", "autoHideBar", "allowContentZoom"]],
  ["Contenido", ["onChange", "sanitizeEmbeddedHtml", "resolveImageSrc"]],
  ["Solo lectura", ["onlyView", "onlyViewNotice"]],
  ["Comparación", ["mode", "compareOrientation", "compareContent", "compareSyncScroll", "onCompareDecision"]],
  ["Historial de versiones", ["historyUndo", "documentId", "fileName"]],
];

/** Atributos agrupados según {@link ATTRIBUTE_GROUPS}, cada uno una sola vez. */
export function groupAttributes(specs: AttributeSpec[]): Array<[string, AttributeSpec[]]> {
  const listed = new Set(ATTRIBUTE_GROUPS.flatMap(([, names]) => names));
  const groups: Array<[string, AttributeSpec[]]> = ATTRIBUTE_GROUPS.map(([label, names]) => [
    label,
    names.map((name) => specs.find((spec) => spec.name === name)).filter((spec): spec is AttributeSpec => spec !== undefined),
  ]);
  const others = specs.filter((spec) => !listed.has(spec.name));
  if (others.length > 0) groups.push(["Otros", others]);
  return groups.filter(([, items]) => items.length > 0);
}

function CopyFeedback({ status, text }: { status: "idle" | "copied" | "failed"; text: string }) {
  return (
    <>
      <span role="status" aria-live="polite" className="pg-status">
        {status === "copied" ? "¡Copiado!" : status === "failed" ? "No se pudo copiar automáticamente: seleccioná y copiá el texto." : ""}
      </span>
      {status === "failed" && (
        <textarea
          readOnly
          value={text}
          aria-label="Texto para copiar"
          ref={(el) => el?.select()}
          style={{ width: "100%", height: 120 }}
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
    <div className="pg-field">
      {children}
      <div className="pg-field-help">{label}</div>
      {note !== undefined && <div className="pg-field-note">⚠ {note}</div>}
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
  const name = <code className="pg-name">{spec.name}</code>;
  const current = value ?? spec.default;
  if (spec.kind === "switch" || spec.kind === "function") {
    return (
      <label htmlFor={id} className="pg-field-control">
        <input
          id={id}
          type="checkbox"
          checked={spec.kind === "function" ? value === true : current === true}
          onChange={(event) => onChange(event.target.checked)}
        />
        {name}
        {spec.kind === "function" && <span className="pg-field-help">(incluir marcador para el host)</span>}
      </label>
    );
  }
  if (spec.kind === "options") {
    return (
      <label htmlFor={id} className="pg-field-control">
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
      <label htmlFor={id} className="pg-field-stack">
        {name}
        <textarea id={id} rows={3} value={text} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }
  return (
    <label htmlFor={id} className="pg-field-control">
      {name}
      <input id={id} type="text" className="pg-mono" value={text} onChange={(event) => onChange(event.target.value)} />
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
      <section aria-labelledby="mdw-builder-attrs" className="pg-card pg-controls mdw-builder-attrs">
        <h2 id="mdw-builder-attrs">Seleccioná los atributos de tu control</h2>
        <p className="pg-card-lead">
          Cada cambio se aplica a la vista previa. «Copiar atributos» copia solo lo que difiere del valor por defecto.
        </p>
        {groupAttributes(SPECS).map(([label, specs]) => (
          <div key={label} className="pg-group" role="group" aria-label={label}>
            <h3 className="pg-group-title">{label}</h3>
            {specs.map((spec) => (
              <Field
                key={spec.name}
                label={
                  <>
                    {spec.summary} Default: <code>{spec.default === null ? "—" : JSON.stringify(spec.default)}</code>
                  </>
                }
                note={notes[spec.name]}
              >
                <AttributeInput spec={spec} value={attributes[spec.name]} onChange={(v) => setAttribute(spec.name, v)} />
              </Field>
            ))}
          </div>
        ))}
        <div className="pg-output">
          <div className="pg-row">
            <fieldset className="pg-row">
              <legend className="pg-label" style={{ float: "left", margin: 0 }}>
                Formato
              </legend>
              {(["jsx", "object"] as const).map((value) => (
                <label key={value} className="pg-check">
                  <input
                    type="radio"
                    name="mdw-builder-format"
                    checked={format === value}
                    onChange={() => setState((prev) => ({ ...prev, format: value }))}
                  />
                  {value === "jsx" ? "JSX" : "Objeto"}
                </label>
              ))}
            </fieldset>
            <button type="button" className="pg-primary" onClick={() => void attributesCopy.copy(snippet)}>
              Copiar atributos
            </button>
            <CopyFeedback status={attributesCopy.status} text={snippet} />
          </div>
          <pre aria-label="Atributos para pegar en el host" className="pg-code">
            {snippet}
          </pre>
        </div>
      </section>

      <section aria-labelledby="mdw-builder-theme" className="pg-card pg-controls mdw-builder-theme">
        <h2 id="mdw-builder-theme">Theming</h2>
        <p className="pg-card-lead">
          Ajustá el aspecto; abajo se ve en vivo el CSS final listo para pegar en tu host. <StylingGuideLink />
        </p>
        <div className="pg-group">
          <h3 className="pg-group-title">Punto de partida</h3>
          <div className="pg-row">
            <label className="pg-check">
              Preset
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
        </div>
        <div className="pg-group">
          <h3 className="pg-group-title">Alcance</h3>
          <fieldset className="pg-option-list">
            <legend className="pg-label">Alcance del CSS</legend>
            {(
              [
                ["control", "Este control (clase en className)"],
                ["section", "Una sección (clase en un contenedor)"],
                ["page", "Toda la página (:root)"],
              ] as Array<[ThemeScope, string]>
            ).map(([value, label]) => (
              <label key={value} className="pg-check">
                <input type="radio" name="mdw-builder-scope" checked={theme.scope === value} onChange={() => setTheme({ scope: value })} />
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
                className="pg-mono"
                value={theme.className}
                onChange={(event) => setTheme({ className: event.target.value })}
              />
            </Field>
          )}
          <div className="pg-option-list">
            <label className="pg-check">
              <input type="checkbox" checked={theme.includeAll} onChange={(event) => setTheme({ includeAll: event.target.checked })} />
              Incluir todas las variables (no solo las cambiadas)
            </label>
            <label className="pg-check">
              <input
                type="checkbox"
                checked={theme.darkValues !== null}
                onChange={(event) => setTheme({ darkValues: event.target.checked ? DARK_VALUES : null })}
              />
              Seguir la preferencia del sistema (añade la variante oscura del preset «Oscuro completo»)
            </label>
          </div>
        </div>

        <div className="pg-group pg-tokens">
          <h3 className="pg-group-title">Variables</h3>
          {groups.map((group) => (
            <details key={group}>
              <summary>{THEME_TOKEN_GROUP_LABELS[group]}</summary>
              {THEME_TOKENS.filter((token) => token.group === group).map((token) => {
                const value = drafts[token.name] ?? theme.values[token.name] ?? "";
                const shown = value === "" ? token.default : value;
                const hex = /^#[0-9a-fA-F]{6}$/.test(shown);
                const bad = invalid.has(token.name);
                return (
                  <div key={token.name} className="pg-token">
                    <span className="pg-token-name" title={token.description}>
                      {token.name}
                    </span>
                    {hex ? (
                      <input
                        type="color"
                        aria-label={`${token.name} (selector de color)`}
                        value={shown}
                        onChange={(event) => setToken(token.name, event.target.value)}
                      />
                    ) : (
                      <span />
                    )}
                    <input
                      aria-label={token.name}
                      aria-invalid={bad}
                      placeholder={token.default}
                      value={value}
                      onChange={(event) => setToken(token.name, event.target.value)}
                    />
                  </div>
                );
              })}
            </details>
          ))}
        </div>

        <div className="pg-output">
          <div className="pg-row">
            <button type="button" className="pg-primary" onClick={() => void cssCopy.copy(css)}>
              Crear CSS
            </button>
            <StylingGuideLink prefix="¿Dudas?" />
            <CopyFeedback status={cssCopy.status} text={css} />
          </div>
          <pre aria-label="CSS final para tu host" className="pg-code" style={{ maxHeight: 320 }}>
            {css}
          </pre>
          <div>
            <button type="button" className="pg-ghost" onClick={startOver}>
              Empezar de nuevo
            </button>
          </div>
        </div>
      </section>

      <div className="pg-card mdw-builder-preview">
        <div className="pg-preview-title">
          <h2 className="pg-card-title">Vista previa</h2>
          <span className="pg-status">Se actualiza con cada cambio</span>
        </div>
        <style>{previewCss}</style>
        <div className={wrapperClass} style={{ marginTop: 12 }}>
          <MarkdownEditor
            key={attributes["resolveImageSrc"] === true ? "resolver" : "plain"}
            initialContent={PREVIEW_CONTENT}
            {...previewProps(attributes)}
            // Sin un ancho elegido, la vista previa ocupa su columna (el default de 700 px la desbordaría).
            {...(attributes["width"] === undefined ? { width: "100%" } : {})}
            {...(editorClass !== undefined ? { className: editorClass } : {})}
          />
        </div>
      </div>
    </div>
  );
}

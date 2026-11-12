# Research: Playground Configuration Builder

## 1. Attribute list source (FR-010)

**Decision**: `scripts/gen-playground-attributes.mjs` parses `src/components/MarkdownEditor/types.ts` with the TypeScript
compiler API (same analyzer as 015's `check-docs`) and writes `playground/generated/attributes.json`: `{ name, kind, options?,
default, summary, dependsOn? }`. `kind` from the type: `boolean` → switch, string-literal union → options, `number | string`
→ size, `string` → text, function → host placeholder. `summary` = first JSDoc line; `default` from `@default`;
`dependsOn` from a `@remarks`/text convention defined in 015's JSDoc contract (or a small local map for the known cases).
Run by `predev` and `prebuild:demo`; the JSON is committed so the demo builds without the step.

**Alternatives**: hand-written list (drifts — FR-010 forbids); parsing at runtime in the browser (ships the TS compiler);
Vite plugin (more machinery than a prestep).

Excluded from the section: `initialContent` (preview uses demo content), `documentId`/`fileName` (free host metadata, listed
as placeholders only if set), `className` (set from the theme scope, FR-014).

## 2. Attribute snippet (Clarification Q1)

`buildAttributesSnippet(choices, format)`: only values ≠ default; booleans `true` → bare prop in JSX, `false` →
`prop={false}`; strings JSON-escaped (`prop="…"` when safe, `prop={"…"}` otherwise); numbers as `{n}`; functions →
`onChange={(markdown) => { /* TODO: tu código */ }}`. Object format: `const editorProps: MarkdownEditorProps = { … };` with the
same rules plus an import line comment. Includes `className` when the theme scope is "this control".

## 3. CSS output (FR-004–006, Clarification Q3)

`buildThemeCss(values, { scope, className, wrapperSelector, includeAll, dark })`:

```css
/* mdwysiwyg — tema generado en el playground
   1. Importá los estilos del control: import "mdwysiwyg/styles.css";
   2. <alcance>: poné className="mi-editor" en <MarkdownEditor> | envolvé los controles en .mi-seccion | se aplica a toda la página
   Guía: https://github.com/ferkiernan/mdwysiwyg/blob/master/docs/THEMING.md */
.mi-editor { --mdw-…: …; }
@media (prefers-color-scheme: dark) { .mi-editor { --mdw-…: …; } }
```

Scope selectors: class `.<className>`, wrapper `<selector>`, page `:root`. Values only if changed (unless `includeAll`), ordered
by guide group. Relies on 015's fallbacks — no `!important`. The output panel renders this string live; "Crear CSS" copies it.

## 4. Preview application

The shared preview gets `className` from the scope (or a fixed internal class for wrapper/page scopes wrapped in a demo `div`
carrying the wrapper selector) and one `<style>` element containing exactly the generated CSS — the preview is themed by the
same text the user copies (guarantees SC-002/004). Sticky via `position: sticky; top: 0` on a right column (stacked on narrow
screens).

Floating panels on demand: buttons "Abrir menú de tabla" / "Abrir popover de enlace" are not feasible without driving the
control's internals; instead the preview content includes a table, a link, code, a quote and a compare toggle, and the section
hints how to open them (click a link, hover a cell).

## 5. Validation

`CSS.supports(property-for-kind, value)` per token kind (color → `color`, background → `background`, font → `font-family`,
shadow → `box-shadow`, length → `width`); invalid → flagged, excluded from CSS with a comment, preview keeps last valid. Class
name: `/^-?[_a-zA-Z][_a-zA-Z0-9-]*$/`.

Dependency notes (FR-012): compare needs `mode="compare"` + orientation + content; `historyUndo` inactive with `onlyView` or
compare; `height` is the minimum with `autoHeight`; `autoHideBar` has no effect with `showToolbar={false}`; `resolveImageSrc`
mount-only.

## 6. Persistence and clipboard

`localStorage` `{ version: 1, attributes, theme }` with try/catch; reset clears it. Clipboard via `navigator.clipboard.writeText`;
on rejection or absence, show a read-only textarea with the text selected (FR-015). Confirmations in an `aria-live="polite"`
region.

## 7. Existing demos

The current "Theming: 5 estilos + edición en vivo" section is replaced by the new theme section (its presets move to
`presets.ts`); the other demos (compare, onlyView, imperative API, fixed size) stay below unchanged.

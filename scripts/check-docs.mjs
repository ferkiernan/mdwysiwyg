#!/usr/bin/env node
/**
 * Comprobaciones de documentación (no bloqueantes): avisa de props sin JSDoc o
 * sin `@default`, de props que faltan (o sobran) en la documentación y de
 * tokens de theming que faltan (o sobran) en docs/THEMING.md.
 *
 * Siempre termina con código 0: solo informa. Se ejecuta con
 * `npm run check:docs` y al final de `prepublishOnly`.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = "src/components/MarkdownEditor/types.ts";
const CSS = "src/components/MarkdownEditor/MarkdownEditor.module.css";
const PROP_DOCS = ["src/components/MarkdownEditor/README.md", "llms.txt"];
const THEMING = "docs/THEMING.md";

/** Miembros documentados de las interfaces/tipos exportados de `types.ts`. */
export function analyzeTypes(source) {
  const file = ts.createSourceFile("types.ts", source, ts.ScriptTarget.Latest, true);
  const props = [];
  const items = [];
  const jsdocOf = (node) => {
    const docs = node.jsDoc ?? [];
    const doc = docs[docs.length - 1];
    if (doc === undefined) return { text: "", tags: [] };
    const text = typeof doc.comment === "string" ? doc.comment : (doc.comment ?? []).map((c) => c.text).join("");
    const tags = (doc.tags ?? []).map((tag) => tag.tagName.text);
    return { text: text.trim(), tags };
  };
  for (const statement of file.statements) {
    const exported = statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;
    if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
      const name = statement.name.text;
      if (name === "ViewMode") continue; // interno
      items.push({ kind: "type", name, ...jsdocOf(statement) });
    }
    if (ts.isInterfaceDeclaration(statement)) {
      for (const member of statement.members) {
        if (member.name === undefined || !ts.isIdentifier(member.name)) continue;
        const entry = { owner: statement.name.text, name: member.name.text, ...jsdocOf(member) };
        if (statement.name.text === "MarkdownEditorProps") props.push(entry);
        else items.push({ kind: "member", ...entry });
      }
    }
  }
  return { props, items };
}

/** Avisos de JSDoc. */
export function checkJsDoc({ props, items }) {
  const warnings = [];
  for (const prop of props) {
    if (prop.text === "") warnings.push({ kind: "prop-undocumented", name: prop.name, where: TYPES });
    else if (!prop.tags.includes("default")) warnings.push({ kind: "prop-no-default", name: prop.name, where: TYPES });
  }
  for (const item of items) {
    if (item.text === "") warnings.push({ kind: "item-undocumented", name: item.owner ? `${item.owner}.${item.name}` : item.name, where: TYPES });
  }
  return warnings;
}

/** Avisos de props que faltan o sobran en un documento. */
export function checkPropsInDoc(propNames, docText, where) {
  const warnings = [];
  for (const name of propNames) {
    if (!new RegExp("`" + name + "`").test(docText)) warnings.push({ kind: "prop-missing", name, where });
  }
  // Filas de tabla de props: | `nombre` | ...
  const listed = [...docText.matchAll(/^\|\s*`([a-zA-Z]+)`\s*\|/gm)].map((m) => m[1]);
  for (const name of listed) {
    if (!propNames.includes(name) && /^[a-z]/.test(name) && looksLikeProp(name)) {
      warnings.push({ kind: "prop-unknown", name, where });
    }
  }
  return warnings;
}

const NON_PROP_ROWS = new Set(["reset", "isModified", "insertMarkdown", "setMarkdown"]);
function looksLikeProp(name) {
  return !NON_PROP_ROWS.has(name.replace(/\(.*$/, ""));
}

/** Avisos de tokens: CSS (tokens privados) frente a la guía. */
export function checkTokens(cssText, guideText) {
  const warnings = [];
  const inCss = [...new Set([...cssText.matchAll(/--_mdw-([a-z0-9-]+):/g)].map((m) => `--mdw-${m[1]}`))];
  const inGuide = [...new Set([...guideText.matchAll(/^\|\s*`(--mdw-[a-z0-9-]+)`/gm)].map((m) => m[1]))];
  for (const token of inCss) if (!inGuide.includes(token)) warnings.push({ kind: "token-missing", name: token, where: THEMING });
  for (const token of inGuide) if (!inCss.includes(token)) warnings.push({ kind: "token-unknown", name: token, where: THEMING });
  return warnings;
}

export function runChecks(read = (path) => readFileSync(resolve(ROOT, path), "utf8"), exists = (path) => existsSync(resolve(ROOT, path))) {
  const analysis = analyzeTypes(read(TYPES));
  const warnings = [...checkJsDoc(analysis)];
  const propNames = analysis.props.map((p) => p.name);
  for (const doc of PROP_DOCS) {
    if (!exists(doc)) warnings.push({ kind: "doc-missing", name: doc, where: doc });
    else warnings.push(...checkPropsInDoc(propNames, read(doc), doc));
  }
  if (!exists(THEMING)) warnings.push({ kind: "doc-missing", name: THEMING, where: THEMING });
  else warnings.push(...checkTokens(read(CSS), read(THEMING)));
  return warnings;
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const warnings = runChecks();
  for (const w of warnings) console.warn(`WARN docs: ${w.kind} ${w.name} — ${w.where}`);
  console.log(`check-docs: ${warnings.length} warning(s)`);
  process.exitCode = 0;
}

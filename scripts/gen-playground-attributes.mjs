#!/usr/bin/env node
/**
 * Genera `playground/generated/attributes.json` a partir de las props de
 * `MarkdownEditorProps` (tipo + JSDoc de `types.ts`): así la sección
 * «Seleccioná los atributos de tu control» del playground nunca se desfasa.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = resolve(ROOT, "src/components/MarkdownEditor/types.ts");
const OUT = resolve(ROOT, "playground/generated/attributes.json");

/** Props que el playground no ofrece como atributo (las pone él mismo). */
const EXCLUDED = new Set(["initialContent", "className"]);

function docOf(node) {
  const docs = node.jsDoc ?? [];
  const doc = docs[docs.length - 1];
  if (doc === undefined) return { text: "", defaultText: undefined };
  const text = typeof doc.comment === "string" ? doc.comment : (doc.comment ?? []).map((c) => c.text).join("");
  const tag = (doc.tags ?? []).find((t) => t.tagName.text === "default");
  const defaultText =
    tag === undefined
      ? undefined
      : typeof tag.comment === "string"
        ? tag.comment
        : (tag.comment ?? []).map((c) => c.text).join("");
  return { text: text.trim(), defaultText: defaultText?.trim() };
}

function firstSentence(text) {
  const flat = text.replace(/\s+/g, " ").trim();
  // Primera oración: hasta un punto seguido de espacio y mayúscula (evita «p. ej.»).
  const match = flat.match(/^(.+?\.)(?=\s+[A-ZÁÉÍÓÚÑ`]|$)/);
  const sentence = match ? match[1] : flat;
  return sentence.length > 220 ? `${sentence.slice(0, 217)}…` : sentence;
}

function parseDefault(raw) {
  if (raw === undefined) return null;
  const value = raw.split(/\s+\(/)[0].trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "undefined") return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  const quoted = value.match(/^"(.*)"$/);
  if (quoted) return quoted[1];
  return null;
}

export function generate(source) {
  const file = ts.createSourceFile("types.ts", source, ts.ScriptTarget.Latest, true);
  const aliases = new Map();
  let props = null;
  for (const st of file.statements) {
    if (ts.isTypeAliasDeclaration(st) && ts.isUnionTypeNode(st.type)) {
      const literals = st.type.types
        .filter((t) => ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal))
        .map((t) => t.literal.text);
      if (literals.length === st.type.types.length) aliases.set(st.name.text, literals);
    }
    if (ts.isInterfaceDeclaration(st) && st.name.text === "MarkdownEditorProps") props = st;
  }
  if (props === null) throw new Error("MarkdownEditorProps no encontrado");
  const attributes = [];
  for (const member of props.members) {
    if (!ts.isPropertySignature(member) || member.type === undefined) continue;
    const name = member.name.getText(file);
    if (EXCLUDED.has(name)) continue;
    const typeText = member.type.getText(file).replace(/\s+/g, " ");
    let kind = "text";
    let options;
    if (ts.isFunctionTypeNode(member.type)) kind = "function";
    else if (typeText === "boolean") kind = "switch";
    else if (typeText === "number | string" || typeText === "string | number") kind = "size";
    else if (aliases.has(typeText)) {
      kind = "options";
      options = aliases.get(typeText);
    }
    const doc = docOf(member);
    attributes.push({
      name,
      kind,
      ...(options ? { options } : {}),
      default: parseDefault(doc.defaultText),
      summary: firstSentence(doc.text),
    });
  }
  return attributes;
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const attributes = generate(readFileSync(TYPES, "utf8"));
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(attributes, null, 2) + "\n", "utf8");
  console.log(`gen-playground-attributes: ${attributes.length} atributos → playground/generated/attributes.json`);
}

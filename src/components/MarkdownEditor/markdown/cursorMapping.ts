import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

/**
 * Mapeo aproximado de posición de cursor entre la vista Markdown (offset de
 * carácter en el texto fuente) y la vista WYSIWYG (posición de documento
 * ProseMirror).
 *
 * El mapeo se basa en el texto plano acumulado: se cuenta cuánto texto
 * "visible" precede a la posición en cada representación y se busca el punto
 * equivalente en la otra. No es byte-exacto cuando el Markdown usa sintaxis
 * que no aparece en el texto renderizado (marcadores como `**`, `#`, `|`),
 * por eso la spec lo define como mejor esfuerzo (FR-006).
 */

/** Caracteres de sintaxis Markdown que no forman parte del texto renderizado. */
const MARKDOWN_SYNTAX = /[*_`~#>\-+|[\]()!]/;

/**
 * Cuenta caracteres de texto "visible" (excluyendo sintaxis Markdown obvia y
 * espacios de indentación) en `markdown` hasta `offset`.
 */
function visibleTextLengthUpTo(markdown: string, offset: number): number {
  let count = 0;
  const limit = Math.min(offset, markdown.length);
  for (let i = 0; i < limit; i += 1) {
    const char = markdown[i];
    if (char === undefined) continue;
    if (char === "\n") {
      count += 1;
      continue;
    }
    if (MARKDOWN_SYNTAX.test(char)) continue;
    count += 1;
  }
  return count;
}

/** Texto visible acumulado del documento ProseMirror hasta `pos`. */
function visibleTextLengthUpToPos(doc: ProseMirrorNode, pos: number): number {
  const clamped = Math.max(0, Math.min(pos, doc.content.size));
  // textBetween con separador de bloque "\n" aproxima el texto tal como se ve.
  return doc.textBetween(0, clamped, "\n", "\n").length;
}

/**
 * Markdown offset → posición ProseMirror equivalente (aproximada).
 * Devuelve una posición siempre dentro del rango válido del documento.
 */
export function markdownOffsetToProseMirrorPos(
  markdown: string,
  offset: number,
  doc: ProseMirrorNode,
): number {
  const target = visibleTextLengthUpTo(markdown, offset);
  if (target <= 0) return 0;

  const docSize = doc.content.size;
  let best = 0;
  let bestDelta = Number.POSITIVE_INFINITY;

  // Búsqueda lineal sobre posiciones del documento: el documento es de tamaño
  // moderado por diseño (spec 003, SC-006), así que es suficiente y evita
  // mantener un índice paralelo.
  for (let pos = 0; pos <= docSize; pos += 1) {
    const delta = Math.abs(visibleTextLengthUpToPos(doc, pos) - target);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = pos;
      if (delta === 0) break;
    }
  }
  return best;
}

/**
 * Posición ProseMirror → offset equivalente en el Markdown fuente
 * (aproximado). Devuelve un offset siempre dentro del rango del string.
 */
export function proseMirrorPosToMarkdownOffset(
  editor: Editor,
  pos: number,
  markdown: string,
): number {
  const target = visibleTextLengthUpToPos(editor.state.doc, pos);
  if (target <= 0) return 0;

  let best = 0;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (let offset = 0; offset <= markdown.length; offset += 1) {
    const delta = Math.abs(visibleTextLengthUpTo(markdown, offset) - target);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = offset;
      if (delta === 0) break;
    }
  }
  return best;
}

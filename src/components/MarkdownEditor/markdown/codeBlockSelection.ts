import { Fragment, type Node as PMNode, type Schema } from "@tiptap/pm/model";
import { TextSelection, type EditorState, type Transaction } from "@tiptap/pm/state";

/**
 * «Bloque de código» sobre una selección de varias líneas (spec 027): todas
 * las líneas que toca la selección se reemplazan por UN solo bloque de código
 * con su texto visible, una línea por renglón (filas de tabla como
 * `celda | celda`; imágenes, diagramas y reglas se descartan). Las líneas no
 * seleccionadas de una lista o cita quedan en su lista/cita, arriba y abajo
 * del bloque. Devuelve `false` (comportamiento por defecto) si la selección
 * abarca una sola línea o si empieza/termina dentro de una tabla.
 */

const LIST_TYPES = new Set(["bulletList", "orderedList", "taskList"]);
const ITEM_TYPES = new Set(["listItem", "taskItem"]);
const CELL_TYPES = new Set(["tableCell", "tableHeader"]);

/** Texto visible de un bloque de texto; los saltos de línea duros cuentan como línea nueva. */
function visibleText(node: PMNode): string {
  return node.textBetween(0, node.content.size, "\n", (leaf) => (leaf.type.name === "hardBreak" ? "\n" : ""));
}

function insideTable(state: EditorState, pos: number): boolean {
  const $pos = state.doc.resolve(pos);
  for (let depth = $pos.depth; depth > 0; depth--) {
    if (CELL_TYPES.has($pos.node(depth).type.name)) return true;
  }
  return false;
}

/**
 * Quita los restos que deja cortar una lista o cita por la mitad: ítems y
 * listas vacíos, citas vacías; un ítem que quedó sin su primera línea sube
 * sus subítems un nivel en vez de dejar una viñeta vacía.
 */
function clean(node: PMNode, schema: Schema): PMNode[] {
  if (node.isTextblock || node.isLeaf || node.isAtom) return [node];
  const children: PMNode[] = [];
  node.forEach((child) => children.push(...clean(child, schema)));
  const name = node.type.name;
  if (LIST_TYPES.has(name)) {
    const items = children.filter((child) => ITEM_TYPES.has(child.type.name));
    return items.length === 0 ? [] : [node.copy(Fragment.fromArray(items))];
  }
  if (ITEM_TYPES.has(name)) {
    if (children.length === 0) return [];
    if (children[0]?.type.name !== "paragraph") {
      const hoisted: PMNode[] = [];
      const rest: PMNode[] = [];
      for (const child of children) {
        if (LIST_TYPES.has(child.type.name) && rest.length === 0) child.forEach((item) => hoisted.push(item));
        else rest.push(child);
      }
      if (rest.length > 0) {
        const paragraph = schema.nodes["paragraph"];
        if (paragraph === undefined) return hoisted;
        hoisted.push(node.copy(Fragment.fromArray([paragraph.create(), ...rest])));
      }
      return hoisted;
    }
    return [node.copy(Fragment.fromArray(children))];
  }
  if (children.length === 0) return [];
  return [node.copy(Fragment.fromArray(children))];
}

export function selectionToCodeBlock(language: string | null) {
  return (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    const { selection, doc, schema } = state;
    const codeBlock = schema.nodes["codeBlock"];
    if (codeBlock === undefined || selection.empty) return false;
    if (insideTable(state, selection.from) || insideTable(state, selection.to)) return false;

    // Líneas (texto visible) y bloques ancla (bloque de texto, o la tabla entera) que toca la selección.
    const lines: string[] = [];
    let first = null as number | null;
    let last = null as number | null;
    let anchors = 0;
    doc.nodesBetween(selection.from, selection.to, (node, pos) => {
      if (node.type.name === "table") {
        node.forEach((row) => {
          const cells: string[] = [];
          row.forEach((cell) => cells.push(cell.textContent));
          lines.push(cells.join(" | "));
        });
        first ??= pos;
        last = pos + node.nodeSize;
        anchors += 1;
        return false;
      }
      if (node.isTextblock) {
        const text = visibleText(node);
        lines.push(...(node.type.name === "codeBlock" ? text.split("\n") : [text]));
        first ??= pos;
        last = pos + node.nodeSize;
        anchors += 1;
        return false;
      }
      return true;
    });
    if (first === null || last === null || anchors < 2) return false;
    const from: number = first;
    const to: number = last;

    // Bloques de primer nivel afectados y los restos antes/después de la selección.
    const $from = doc.resolve(from);
    const $to = doc.resolve(to);
    const startIndex = $from.index(0);
    const endIndex = $to.index(0) - ($to.depth === 0 ? 1 : 0);
    const firstTop = doc.child(startIndex);
    const lastTop = doc.child(endIndex);
    const firstTopPos = $from.posAtIndex(startIndex, 0);
    const lastTopPos = $to.posAtIndex(endIndex, 0);
    const before = firstTopPos < from ? clean(firstTop.cut(0, from - firstTopPos - 1), schema) : [];
    const after = lastTopPos + lastTop.nodeSize > to ? clean(lastTop.cut(to - lastTopPos - 1), schema) : [];

    const text = lines.join("\n");
    const block = codeBlock.create({ language }, text === "" ? null : schema.text(text));
    const replacement = [...before, block, ...after];
    try {
      for (const node of replacement) node.check();
    } catch {
      return false;
    }

    if (dispatch) {
      const rangeFrom = firstTopPos;
      const rangeTo = lastTopPos + lastTop.nodeSize;
      const tr = state.tr.replaceWith(rangeFrom, rangeTo, Fragment.fromArray(replacement));
      const blockStart = rangeFrom + before.reduce((size, node) => size + node.nodeSize, 0);
      tr.setSelection(TextSelection.create(tr.doc, blockStart + 1 + text.length));
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

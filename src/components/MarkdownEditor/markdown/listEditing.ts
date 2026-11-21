import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection, type EditorState, type Transaction } from "@tiptap/pm/state";
import type { Node as PMNode, ResolvedPos } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

/**
 * Borrado y selección en listas sin perder la jerarquía
 * (bug list-item-delete-cascade):
 *
 * - Triple clic sobre una lista, un ítem o una cita (en el hueco entre líneas
 *   o en el borde de una línea) selecciona solo la línea más cercana, no el
 *   contenedor entero; así Retroceso/Suprimir no borran la lista completa.
 * - Retroceso en un ítem vacío que tiene un ítem anterior lo elimina y deja el
 *   cursor al final de la línea de arriba; los ítems de abajo conservan padre
 *   y nivel, y los hijos del ítem vacío pasan al anterior.
 * - Suprimir al final de una línea une el texto de la línea siguiente cuando
 *   entre ambas hay un límite de lista; el resto de los bloques conserva su
 *   lugar y los hijos del ítem absorbido pasan al ítem que recibe el texto.
 */

const LIST_TYPES = new Set(["bulletList", "orderedList", "taskList"]);
const ITEM_TYPES = new Set(["listItem", "taskItem"]);
const CONTAINER_TYPES = new Set([...LIST_TYPES, ...ITEM_TYPES, "blockquote"]);
const JOINABLE_TEXTBLOCKS = new Set(["paragraph", "heading"]);

const isList = (node: PMNode | null | undefined) => node != null && LIST_TYPES.has(node.type.name);
const isItem = (node: PMNode | null | undefined) => node != null && ITEM_TYPES.has(node.type.name);

/** Une dos listas del mismo tipo que quedaron pegadas en `pos`. */
function joinListsAt(tr: Transaction, pos: number): void {
  if (pos <= 0 || pos >= tr.doc.content.size) return;
  const $pos = tr.doc.resolve(pos);
  const before = $pos.nodeBefore;
  const after = $pos.nodeAfter;
  if (isList(before) && isList(after) && before?.type === after?.type) tr.join(pos);
}

/** Posición del final de la última línea (bloque de texto) dentro de `node`, que empieza en `start`. */
function lastTextblockEnd(node: PMNode, start: number): number | null {
  let found = null as number | null;
  node.descendants((child, pos) => {
    if (child.isTextblock) found = start + pos + 1 + child.content.size;
    return !child.isTextblock;
  });
  return found;
}

/**
 * Retroceso en un ítem vacío con un ítem anterior: se elimina el ítem, sus
 * hijos pasan al final del anterior y el cursor queda al final de la línea de
 * arriba. Devuelve `false` (comportamiento por defecto) en cualquier otro caso.
 */
export function deleteEmptyListItem(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { selection } = state;
  if (!selection.empty) return false;
  const $from = selection.$from;
  const block = $from.parent;
  if (!block.isTextblock || block.content.size !== 0 || $from.depth < 3) return false;
  const itemDepth = $from.depth - 1;
  const item = $from.node(itemDepth);
  if (!isItem(item) || $from.index(itemDepth) !== 0) return false;
  const index = $from.index(itemDepth - 1);
  if (index === 0) return false;
  const list = $from.node(itemDepth - 1);
  const previous = list.child(index - 1);
  const itemPos = $from.before(itemDepth);
  const previousPos = itemPos - previous.nodeSize;
  const cursor = lastTextblockEnd(previous, previousPos + 1);
  if (cursor === null) return false;

  if (dispatch) {
    const children = item.content.cut(block.nodeSize);
    const tr = state.tr.delete(itemPos, itemPos + item.nodeSize);
    if (children.size > 0) {
      const insertAt = previousPos + previous.nodeSize - 1;
      tr.insert(insertAt, children);
      joinListsAt(tr, insertAt);
    }
    tr.setSelection(TextSelection.create(tr.doc, cursor));
    dispatch(tr.scrollIntoView());
  }
  return true;
}

/** Primer bloque de texto que empieza después de `pos`, o `null`. */
function nextTextblock(doc: PMNode, pos: number): { node: PMNode; pos: number } | null {
  let found = null as { node: PMNode; pos: number } | null;
  doc.nodesBetween(pos, doc.content.size, (node, nodePos) => {
    if (found !== null) return false;
    if (nodePos < pos) return true;
    if (node.isTextblock) {
      found = { node, pos: nodePos };
      return false;
    }
    return true;
  });
  return found;
}

/** `true` si los ancestros no comunes de ambas líneas son solo listas e ítems (y hay al menos uno). */
function crossesOnlyListBoundaries($a: ResolvedPos, $b: ResolvedPos): boolean {
  const shared = $a.sharedDepth($b.pos);
  let crossed = false;
  for (const $p of [$a, $b]) {
    for (let depth = shared + 1; depth < $p.depth; depth++) {
      const node = $p.node(depth);
      if (!isList(node) && !isItem(node)) return false;
      crossed = true;
    }
  }
  return crossed;
}

/**
 * Suprimir al final de una línea cuando la siguiente está del otro lado de un
 * límite de lista: une su texto a la línea actual y elimina esa línea; si
 * vaciaba su ítem, se elimina el ítem y sus hijos pasan al ítem (o al nivel)
 * de la línea actual. Devuelve `false` en cualquier otro caso.
 */
export function joinNextLineAcrossList(state: EditorState, dispatch?: (tr: Transaction) => void): boolean {
  const { selection, doc } = state;
  if (!selection.empty) return false;
  const $from = selection.$from;
  const current = $from.parent;
  if (!JOINABLE_TEXTBLOCKS.has(current.type.name) || $from.parentOffset !== current.content.size) return false;
  const currentEnd = $from.after();
  const next = nextTextblock(doc, currentEnd);
  if (next === null || !JOINABLE_TEXTBLOCKS.has(next.node.type.name)) return false;
  const $next = doc.resolve(next.pos + 1);
  if (!crossesOnlyListBoundaries($from, $next)) return false;

  if (dispatch) {
    const tr = state.tr;
    const parentDepth = $next.depth - 1;
    const parent = $next.node(parentDepth);
    let children = parent.content.cut(0, 0);
    let from = next.pos;
    let to = next.pos + next.node.nodeSize;
    if (isItem(parent) && $next.index(parentDepth) === 0) {
      // La línea siguiente es la primera de su ítem: se quita el ítem entero y
      // sus otros bloques (sublistas) los adopta la línea actual.
      children = parent.content.cut(next.node.nodeSize);
      from = $next.before(parentDepth);
      to = $next.after(parentDepth);
      // Si era el único ítem de su lista, se quita también la lista vacía.
      const listDepth = parentDepth - 1;
      if (isList($next.node(listDepth)) && $next.node(listDepth).childCount === 1) {
        from = $next.before(listDepth);
        to = $next.after(listDepth);
      }
    }
    tr.delete(from, to);
    if (children.size > 0) {
      tr.insert(currentEnd, children);
      joinListsAt(tr, currentEnd + children.size);
    }
    tr.insert($from.pos, next.node.content);
    tr.setSelection(TextSelection.create(tr.doc, $from.pos));
    dispatch(tr.scrollIntoView());
  }
  return true;
}

/**
 * Selección de un triple clic que cae sobre una lista, un ítem o una cita: el
 * contenido de la línea más cercana al puntero, o `null` para dejar el
 * comportamiento por defecto (líneas, átomos, tablas).
 */
export function tripleClickLineSelection(
  view: EditorView,
  inside: number,
  clientY: number,
): TextSelection | null {
  if (inside < 0) return null;
  const { doc } = view.state;
  const container = doc.nodeAt(inside);
  if (container === null || !CONTAINER_TYPES.has(container.type.name)) return null;
  let best = null as { from: number; to: number; distance: number } | null;
  container.descendants((child, pos) => {
    if (!child.isTextblock) return true;
    const start = inside + 1 + pos;
    const dom = view.nodeDOM(start);
    let distance = Number.POSITIVE_INFINITY;
    if (dom instanceof Element) {
      const rect = dom.getBoundingClientRect();
      if (rect.height > 0) {
        distance = clientY < rect.top ? rect.top - clientY : clientY > rect.bottom ? clientY - rect.bottom : 0;
      }
    }
    if (best === null || distance < best.distance) {
      best = { from: start + 1, to: start + 1 + child.content.size, distance };
    }
    return false;
  });
  if (best === null) return null;
  const { from, to } = best;
  return TextSelection.create(doc, from, to);
}

export const ListEditing = Extension.create({
  name: "mdwListEditing",
  // Antes que el keymap de listas del StarterKit y que la edición de tablas.
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      Backspace: () => deleteEmptyListItem(this.editor.state, this.editor.view.dispatch),
      Delete: () => joinNextLineAcrossList(this.editor.state, this.editor.view.dispatch),
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("mdwListEditing"),
        props: {
          handleTripleClick(view, _pos, event) {
            if (!view.editable || event.button !== 0) return false;
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (coords === null) return false;
            const selection = tripleClickLineSelection(view, coords.inside, event.clientY);
            if (selection === null) return false;
            view.dispatch(view.state.tr.setSelection(selection));
            return true;
          },
        },
      }),
    ];
  },
});

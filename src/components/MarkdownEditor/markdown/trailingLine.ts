import type { Editor } from "@tiptap/core";
import { GapCursor } from "@tiptap/pm/gapcursor";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Selection, TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

/**
 * Garantiza un párrafo vacío editable tras un bloque final (tabla, código,
 * Mermaid, cita, lista…). La extensión `trailingNode` de StarterKit solo
 * actúa tras una transacción, así que el contenido inicial que termina en
 * bloque quedaba sin línea posterior (FR-001). La inserción no emite
 * `onUpdate`, no entra en el historial y no cambia el Markdown, porque el
 * pipeline descarta los párrafos vacíos finales (FR-008, FR-010).
 */
export function ensureTrailingParagraph(editor: Editor): void {
  if (!editor.isEditable) return;
  const { state, view } = editor;
  const paragraph = state.schema.nodes["paragraph"];
  if (!paragraph) return;
  if (state.doc.lastChild?.type === paragraph) return;
  view.dispatch(
    state.tr
      .insert(state.doc.content.size, paragraph.create())
      .setMeta("preventUpdate", true)
      .setMeta("addToHistory", false),
  );
}

interface TopLevelBlock {
  node: ProseMirrorNode;
  pos: number;
  el: HTMLElement | null;
}

function topLevelBlocks(view: EditorView): TopLevelBlock[] {
  const blocks: TopLevelBlock[] = [];
  view.state.doc.forEach((node, pos) => {
    const dom = view.nodeDOM(pos);
    blocks.push({ node, pos, el: dom instanceof HTMLElement ? dom : null });
  });
  return blocks;
}

function isEmptyParagraph(node: ProseMirrorNode | undefined): boolean {
  return (
    node !== undefined &&
    node.type.name === "paragraph" &&
    node.content.size === 0
  );
}

/** Un clic sobre la barra de scroll del wrapper no debe tratarse como área libre. */
function isOnScrollbar(element: Element, event: MouseEvent): boolean {
  const rect = element.getBoundingClientRect();
  return (
    (element.clientWidth > 0 &&
      event.clientX - rect.left >= element.clientWidth) ||
    (element.clientHeight > 0 &&
      event.clientY - rect.top >= element.clientHeight)
  );
}

/**
 * Índice de la frontera entre bloques de nivel superior (0 = antes del
 * primero, `childCount` = tras el último) que corresponde a un `mousedown`
 * sobre un área libre, o `null` si el clic no es de área libre.
 */
function findBoundary(
  view: EditorView,
  target: Element,
  event: MouseEvent,
): number | null {
  const blocks = topLevelBlocks(view);
  const last = blocks[blocks.length - 1];
  if (last === undefined || last.el === null) return null;

  // Tabla: el clic a su derecha o en su margen cae sobre el wrapper (más
  // ancho que la tabla); según esté sobre o bajo la tabla, la frontera es la
  // anterior o la posterior.
  const tableIndex = blocks.findIndex(
    (block) => block.el === target && block.node.type.name === "table",
  );
  if (tableIndex !== -1) {
    if (isOnScrollbar(target, event)) return null;
    const tableTop = target.querySelector("table")?.getBoundingClientRect().top;
    return tableTop !== undefined && event.clientY < tableTop
      ? tableIndex
      : tableIndex + 1;
  }

  // A partir de aquí solo clics sobre el propio contenedor del editor
  // (padding, huecos entre bloques, espacio bajo el contenido).
  if (target !== view.dom) return null;

  // Bajo el contenido, o junto al último bloque cuando le sigue la línea
  // vacía auxiliar: frontera final.
  const beforeLast = blocks[blocks.length - 2];
  const lastIsEmpty = isEmptyParagraph(last.node);
  const thresholdEl =
    lastIsEmpty && beforeLast?.node.type.name !== "paragraph"
      ? (beforeLast?.el ?? last.el)
      : last.el;
  const threshold = thresholdEl.getBoundingClientRect();
  if (event.clientY >= (lastIsEmpty ? threshold.top : threshold.bottom)) {
    return last.node.type.name === "paragraph" ? blocks.length : null;
  }

  // Padding lateral junto a una tabla: misma frontera posterior.
  const inside = blocks.findIndex((block) => {
    const rect = block.el?.getBoundingClientRect();
    return (
      rect !== undefined &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  });
  if (inside !== -1) {
    return blocks[inside]?.node.type.name === "table" ? inside + 1 : null;
  }

  // Hueco entre dos bloques: solo si alguno no admite cursor de texto
  // (tabla, código, diagrama…); entre párrafos ProseMirror ya lo resuelve.
  const next = blocks.findIndex(
    (block) =>
      block.el !== null && block.el.getBoundingClientRect().top > event.clientY,
  );
  if (next < 1) return null;
  const prevNode = blocks[next - 1]?.node;
  const nextNode = blocks[next]?.node;
  return prevNode?.isTextblock && nextNode?.isTextblock ? null : next;
}

/**
 * Selección para una frontera entre bloques: dentro de una línea vacía
 * adyacente o al borde de un párrafo si la hay; si no, un cursor de hueco
 * (Enter inserta ahí una línea nueva).
 */
function selectionAtBoundary(
  doc: ProseMirrorNode,
  index: number,
): Selection {
  let pos = 0;
  for (let i = 0; i < index; i++) pos += doc.child(i).nodeSize;
  const prev = index > 0 ? doc.child(index - 1) : undefined;
  const next = index < doc.childCount ? doc.child(index) : undefined;

  if (isEmptyParagraph(next)) return TextSelection.create(doc, pos + 1);
  if (isEmptyParagraph(prev)) return TextSelection.create(doc, pos - 1);
  if (next === undefined && prev?.isTextblock) {
    return TextSelection.create(doc, pos - 1);
  }
  return new GapCursor(doc.resolve(pos));
}

/**
 * `mousedown` sobre un área libre fuera de los bloques: a la derecha o en el
 * margen de una tabla, en el hueco entre dos bloques, o a la derecha/debajo
 * del último bloque. Coloca el cursor en la frontera correspondiente en vez
 * de dejar que ProseMirror lo resuelva hacia la última celda o el interior
 * del bloque (FR-002, FR-012). Con una línea vacía adyacente el cursor entra
 * en ella; si no, queda un cursor de hueco y Enter inserta la línea. Devuelve
 * `true` si gestionó el evento. Los clics dentro de celdas, código o diagramas
 * no coinciden con estas condiciones y conservan su comportamiento (FR-006);
 * en solo lectura no hace nada (FR-009).
 */
export function handleBlankAreaMouseDown(
  view: EditorView,
  event: MouseEvent,
): boolean {
  if (!view.editable || event.button !== 0 || event.shiftKey) return false;
  const target = event.target;
  if (!(target instanceof Element)) return false;

  const boundary = findBoundary(view, target, event);
  if (boundary === null) return false;

  event.preventDefault();
  view.dispatch(
    view.state.tr
      .setSelection(selectionAtBoundary(view.state.doc, boundary))
      .scrollIntoView(),
  );
  view.focus();
  return true;
}

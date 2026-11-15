import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { TableMap } from "@tiptap/pm/tables";
import { DASH_PX, MIN_COLUMN_PX } from "./columnWidths";

/**
 * Cambiar el ancho de una columna arrastrando el borde derecho de su celda de
 * encabezado (spec 023). El área de arrastre es la mitad inferior del borde
 * (la superior queda para el disparador del menú de tabla), unos píxeles a
 * cada lado. Al soltar, el ancho (redondeado a {@link DASH_PX}) se guarda en
 * el atributo `colwidth` de las celdas de la columna, en un solo paso de
 * deshacer; la serialización lo escribe como guiones de la fila separadora.
 */
export const COLUMN_RESIZE_CLASS = "mdw-column-resize";
const EDGE_PX = 6;

interface Hit {
  header: HTMLTableCellElement;
}

/** Celda de encabezado cuyo borde derecho (mitad inferior) está bajo el puntero. */
export function resizeHit(target: EventTarget | null, clientX: number, clientY: number): Hit | null {
  if (!(target instanceof Element)) return null;
  const cell = target.closest("th, td");
  if (!(cell instanceof HTMLTableCellElement)) return null;
  const row = cell.parentElement;
  const rect = cell.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  if (clientY < rect.top + rect.height / 2) return null;
  let header: Element | null = null;
  if (cell.tagName === "TH" && rect.right - clientX <= EDGE_PX && rect.right - clientX >= -EDGE_PX) header = cell;
  else if (clientX - rect.left <= EDGE_PX) {
    const previous = cell.previousElementSibling;
    if (previous?.tagName === "TH") header = previous;
  }
  if (!(header instanceof HTMLTableCellElement) || header.parentElement !== row) return null;
  return { header };
}

/** Posición (dentro de la celda) del encabezado `header` en el documento, o -1. */
function headerPos(view: EditorView, header: HTMLTableCellElement): number {
  let found = -1;
  view.state.doc.descendants((node, pos) => {
    if (found >= 0) return false;
    if (node.type.spec["tableRole"] === "header_cell" && view.nodeDOM(pos) === header) found = pos + 1;
    return true;
  });
  return found;
}

/** Fija `colwidth` en todas las celdas de la columna del encabezado en `cellPos`. */
function commitWidth(view: EditorView, cellPos: number, width: number): void {
  if (cellPos < 0 || cellPos > view.state.doc.content.size) return;
  const $cell = view.state.doc.resolve(cellPos);
  let depth = $cell.depth;
  while (depth > 0 && $cell.node(depth).type.spec["tableRole"] !== "table") depth--;
  if (depth === 0) return;
  const table = $cell.node(depth);
  const tableStart = $cell.start(depth);
  const map = TableMap.get(table);
  const cellStart = $cell.before(depth + 2) - tableStart;
  const rect = map.findCell(cellStart);
  const column = rect.right - 1;
  const tr = view.state.tr;
  const seen = new Set<number>();
  for (let row = 0; row < map.height; row++) {
    const pos = map.map[row * map.width + column];
    if (pos === undefined || seen.has(pos)) continue;
    seen.add(pos);
    const node = table.nodeAt(pos);
    if (node === null) continue;
    const index = column - map.colCount(pos);
    const colspan = Number(node.attrs["colspan"] ?? 1);
    const current = node.attrs["colwidth"] as number[] | null;
    const colwidth = current !== null && current.length === colspan ? [...current] : Array<number>(colspan).fill(0);
    if (colwidth[index] === width) continue;
    colwidth[index] = width;
    tr.setNodeMarkup(tableStart + pos, undefined, {
      ...node.attrs,
      colwidth: colwidth.every((value) => value > 0) ? colwidth : colwidth.map((value) => value || width),
    });
  }
  if (tr.docChanged) view.dispatch(tr);
}

function startDrag(view: EditorView, header: HTMLTableCellElement, startX: number): void {
  // Se ubica la celda ahora: durante el arrastre la tabla puede volver a pintarse.
  const cellPos = headerPos(view, header);
  const table = header.closest("table");
  const index = header.cellIndex;
  const col = table?.querySelectorAll("colgroup > col")[index] as HTMLElement | undefined;
  const startWidth = header.getBoundingClientRect().width;
  const previousCol = col?.style.cssText ?? "";
  const previousTable = table?.style.cssText ?? "";
  let width = startWidth;
  const doc = view.dom.ownerDocument;
  doc.body.classList.add(COLUMN_RESIZE_CLASS);

  const move = (event: MouseEvent) => {
    width = Math.max(MIN_COLUMN_PX, startWidth + event.clientX - startX);
    if (col !== undefined) col.style.width = `${width}px`;
    if (table !== null) {
      table.style.width = "";
      table.style.minWidth = "";
    }
    header.style.width = `${width}px`;
  };
  const up = (event: MouseEvent) => {
    move(event);
    doc.removeEventListener("mousemove", move);
    doc.removeEventListener("mouseup", up);
    doc.body.classList.remove(COLUMN_RESIZE_CLASS);
    header.style.width = "";
    if (col !== undefined) col.style.cssText = previousCol;
    if (table !== null) table.style.cssText = previousTable;
    const snapped = Math.max(MIN_COLUMN_PX, Math.round(width / DASH_PX) * DASH_PX);
    if (Math.abs(width - startWidth) >= 1) commitWidth(view, cellPos, snapped);
  };
  doc.addEventListener("mousemove", move);
  doc.addEventListener("mouseup", up);
}

export const ColumnResize = Extension.create({
  name: "mdwColumnResize",
  // Antes que la edición de tablas: si el arrastre empieza aquí, nadie más maneja ese mousedown.
  priority: 1000,
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("mdwColumnResize"),
        props: {
          handleDOMEvents: {
            mousemove(view, event) {
              const active = view.editable && resizeHit(event.target, event.clientX, event.clientY) !== null;
              view.dom.classList.toggle(COLUMN_RESIZE_CLASS, active);
              return false;
            },
            mouseleave(view) {
              view.dom.classList.remove(COLUMN_RESIZE_CLASS);
              return false;
            },
            mousedown(view, event) {
              if (!view.editable || event.button !== 0) return false;
              const hit = resizeHit(event.target, event.clientX, event.clientY);
              if (hit === null) return false;
              event.preventDefault();
              startDrag(view, hit.header, event.clientX);
              return true;
            },
          },
        },
      }),
    ];
  },
});

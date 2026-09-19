import type { Editor } from "@tiptap/core";
import {
  isInTable,
  moveTableColumn,
  moveTableRow,
  selectedRect,
} from "@tiptap/pm/tables";

export type MoveDirection = "before" | "after";

/**
 * Mueve la columna actual una posición hacia `direction`. Sin efecto si ya
 * está en el borde correspondiente de la tabla (FR-005, edge case de límites).
 */
export function moveCurrentColumn(
  editor: Editor,
  direction: MoveDirection,
): void {
  const { state } = editor.view;
  if (!isInTable(state)) return;

  const rect = selectedRect(state);
  const from = rect.left;
  const to = direction === "before" ? from - 1 : from + 1;
  if (to < 0 || to >= rect.map.width) return;

  moveTableColumn({ from, to })(state, editor.view.dispatch, editor.view);
}

/**
 * Mueve la fila actual una posición hacia `direction`. Sin efecto si ya está
 * en el borde correspondiente de la tabla (FR-005, edge case de límites).
 */
export function moveCurrentRow(
  editor: Editor,
  direction: MoveDirection,
): void {
  const { state } = editor.view;
  if (!isInTable(state)) return;

  const rect = selectedRect(state);
  const from = rect.top;
  const to = direction === "before" ? from - 1 : from + 1;
  // La fila 0 es el encabezado: las filas de datos no deben moverse a ella ni
  // el encabezado desplazarse hacia abajo.
  if (to < 1 || to >= rect.map.height) return;

  moveTableRow({ from, to })(state, editor.view.dispatch, editor.view);
}

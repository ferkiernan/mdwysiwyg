import type { Editor } from "@tiptap/core";
import { matchSequences } from "../diffSequences";
import type { Unit } from "../docDiff";
import type { Anchor } from "./scrollMap";

export interface UnitAnchorsInput {
  /** Parejas `[índice original, índice actual]` (ver `pairUnits`). */
  pairs: ReadonlyArray<readonly [number, number]>;
  originalUnits: readonly Unit[];
  currentUnits: readonly Unit[];
  /** Desplazamiento de la unidad en su panel, o `null` si no se puede medir. */
  measureOriginal: (unit: Unit) => number | null;
  measureCurrent: (unit: Unit) => number | null;
}

/** Anclas de la vista renderizada: una por pareja de unidades medible en ambos paneles. */
export function unitAnchors(input: UnitAnchorsInput): Anchor[] {
  const anchors: Anchor[] = [];
  for (const [i, j] of input.pairs) {
    const originalUnit = input.originalUnits[i];
    const currentUnit = input.currentUnits[j];
    if (originalUnit === undefined || currentUnit === undefined) continue;
    const original = input.measureOriginal(originalUnit);
    const current = input.measureCurrent(currentUnit);
    if (original === null || current === null) continue;
    anchors.push({ original, current });
  }
  return anchors;
}

/**
 * Desplazamiento vertical de la unidad respecto del inicio del contenido
 * desplazable de `scroller`, o `null` si no tiene elemento o tamaño.
 */
export function measureUnitTop(
  editor: Editor,
  scroller: HTMLElement,
  unit: Unit,
): number | null {
  if (editor.isDestroyed) return null;
  let dom: Node | null | undefined;
  try {
    dom = editor.view.nodeDOM(unit.pos);
  } catch {
    return null;
  }
  if (!(dom instanceof HTMLElement)) return null;
  const rect = dom.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  return rect.top - scroller.getBoundingClientRect().top + scroller.scrollTop;
}

/**
 * Anclas de la vista Markdown: líneas no vacías idénticas, emparejadas en orden
 * (Myers). `originalTops[i]` / `currentTops[j]` son los desplazamientos de las
 * líneas (ver `measureLineTops`).
 */
export function lineAnchors(
  originalText: string,
  currentText: string,
  originalTops: readonly number[],
  currentTops: readonly number[],
): Anchor[] {
  const significant = (text: string) => {
    const lines: string[] = [];
    const indexes: number[] = [];
    text.split("\n").forEach((line, index) => {
      if (line.trim() === "") return;
      lines.push(line);
      indexes.push(index);
    });
    return { lines, indexes };
  };
  const original = significant(originalText);
  const current = significant(currentText);
  const anchors: Anchor[] = [];
  for (const [i, j] of matchSequences(original.lines, current.lines)) {
    const originalTop = originalTops[original.indexes[i] as number];
    const currentTop = currentTops[current.indexes[j] as number];
    if (originalTop === undefined || currentTop === undefined) continue;
    anchors.push({ original: originalTop, current: currentTop });
  }
  return anchors;
}

const MIRRORED_STYLES = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "fontVariant",
  "letterSpacing",
  "lineHeight",
  "tabSize",
  "textTransform",
  "wordSpacing",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
] as const;

/**
 * Desplazamiento vertical de cada línea del texto dentro de `textarea`,
 * teniendo en cuenta el ajuste de línea. Se mide con un espejo fuera de pantalla
 * (mismo ancho y tipografía, una línea por bloque) que se retira al terminar.
 */
export function measureLineTops(
  textarea: HTMLTextAreaElement,
  text: string,
): number[] {
  const doc = textarea.ownerDocument;
  const view = doc.defaultView;
  if (view === null || doc.body === null) return [];
  const computed = view.getComputedStyle(textarea);
  const mirror = doc.createElement("div");
  mirror.setAttribute("aria-hidden", "true");
  const style = mirror.style;
  style.position = "absolute";
  style.visibility = "hidden";
  style.top = "0";
  style.left = "-99999px";
  style.boxSizing = "border-box";
  style.whiteSpace = "pre-wrap";
  style.overflowWrap = "break-word";
  style.width = `${textarea.clientWidth}px`;
  for (const name of MIRRORED_STYLES) style[name] = computed[name];

  const lines = text.split("\n");
  for (const line of lines) {
    const row = doc.createElement("div");
    // Una línea vacía ocupa una fila: espacio de ancho cero.
    row.textContent = line === "" ? "​" : line;
    mirror.append(row);
  }
  doc.body.append(mirror);
  try {
    return Array.from(mirror.children, (row) => (row as HTMLElement).offsetTop);
  } finally {
    mirror.remove();
  }
}

import { matchSequences } from "./diffSequences";
import { paintRuns, sentenceIndexes, wholeSentences } from "./sentences";

/** Resumen de una comparación: ¿hay algún cambio? y ¿cuántos pasajes resaltados? */
export interface DiffSummary {
  changed: boolean;
  count: number;
}

export interface TextDiff {
  /** Rangos `[desde, hasta)` del texto nuevo que son nuevos o distintos. */
  ranges: Array<[number, number]>;
  summary: DiffSummary;
}

interface Word {
  text: string;
  start: number;
  end: number;
  /** Salto (línea o celda de tabla) entre la palabra anterior y esta. */
  breakBefore: boolean;
}

/** Marcas de sintaxis Markdown que no son contenido (no se comparan ni se pintan). */
const LINE_MARKER = /^(#{1,6}|[-*+>]|\d+[.)]|\[[ xX]\])$/;
const TABLE_RULE = /^\|?(:?-{3,}:?\|?)+$/;

/**
 * Palabras de contenido del texto Markdown: sin marcadores de inicio de línea
 * (encabezado, lista, cita, tarea), barras de tabla ni filas separadoras.
 */
function words(text: string): Word[] {
  const result: Word[] = [];
  let lineStart = true;
  let pendingBreak = false;
  let lastEnd = 0;
  for (const match of text.matchAll(/\S+/g)) {
    const token = match[0];
    const start = match.index;
    if (text.slice(lastEnd, start).includes("\n")) {
      lineStart = true;
      pendingBreak = true;
    }
    lastEnd = start + token.length;
    if (/^`{3,}/.test(token) || TABLE_RULE.test(token)) {
      pendingBreak = true;
      continue;
    }
    if (/^\|+$/.test(token)) {
      pendingBreak = true;
      continue;
    }
    if (lineStart && LINE_MARKER.test(token)) continue;
    lineStart = false;
    // Barras pegadas a una palabra de una celda (`|texto|`).
    const trimmedStart = token.match(/^\|+/)?.[0].length ?? 0;
    const trimmedEnd = token.match(/\|+$/)?.[0].length ?? 0;
    const textValue = token.slice(trimmedStart, token.length - trimmedEnd);
    if (textValue === "") {
      pendingBreak = true;
      continue;
    }
    result.push({
      text: textValue,
      start: start + trimmedStart,
      end: start + token.length - trimmedEnd,
      breakBefore: pendingBreak || trimmedStart > 0,
    });
    pendingBreak = trimmedEnd > 0;
  }
  return result;
}

/**
 * Diferencias entre dos textos Markdown (vista Markdown) con la misma regla de
 * frase que la vista renderizada: una frase se pinta entera si difiere en más
 * del 50 % (palabras agregadas + quitadas sobre las de ambas versiones); si no,
 * solo sus palabras nuevas o cambiadas. Los espacios y la sintaxis Markdown no
 * cuentan; las frases terminan en puntuación final, salto de línea o celda.
 */
export function diffText(original: string, current: string): TextDiff {
  const before = words(original);
  const after = words(current);
  const pairs = matchSequences(
    before.map((word) => word.text),
    after.map((word) => word.text),
  );

  const matched = new Set<number>();
  for (const [, j] of pairs) matched.add(j);

  const breakAt = (list: Word[]) => (index: number) => list[index]?.breakBefore === true;
  const oldSentence = sentenceIndexes(before.map((word) => word.text), breakAt(before));
  const newSentence = sentenceIndexes(after.map((word) => word.text), breakAt(after));
  const whole = wholeSentences(oldSentence, newSentence, pairs);

  const ranges: Array<[number, number]> = paintRuns(
    newSentence,
    matched,
    whole,
    breakAt(after),
  ).map(([first, last]) => [(after[first] as Word).start, (after[last] as Word).end]);

  const changed =
    pairs.length < before.length || pairs.length < after.length || ranges.length > 0;
  return { ranges, summary: { changed, count: ranges.length } };
}

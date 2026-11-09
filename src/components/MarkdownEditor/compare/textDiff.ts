import { matchSequences } from "./diffSequences";

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
}

function words(text: string): Word[] {
  const result: Word[] = [];
  for (const match of text.matchAll(/\S+/g)) {
    result.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return result;
}

/**
 * Diferencias a nivel de palabra entre dos textos (vista Markdown). Las
 * diferencias solo de espacios en blanco no cuentan. Las palabras nuevas o
 * cambiadas consecutivas forman un único rango, salvo que las separe un salto
 * de línea (así el resaltado no cruza párrafos).
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

  const ranges: Array<[number, number]> = [];
  let open: [number, number] | null = null;
  let previousEnd = 0;
  after.forEach((word, index) => {
    if (matched.has(index)) {
      open = null;
    } else if (open !== null && !current.slice(previousEnd, word.start).includes("\n")) {
      open[1] = word.end;
    } else {
      open = [word.start, word.end];
      ranges.push(open);
    }
    previousEnd = word.end;
  });

  const changed = pairs.length < before.length || pairs.length < after.length;
  return { ranges, summary: { changed, count: ranges.length } };
}

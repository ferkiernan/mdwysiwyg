/**
 * Regla de pintado por frase del modo comparación (spec 019): una frase del
 * contenido nuevo se pinta entera solo si difiere en más del 50 % de su
 * contraparte original; si no, solo sus palabras nuevas o cambiadas.
 */

/** Fin de frase: termina en `.`, `!`, `?` o `…` (con comillas o cierres detrás). */
const SENTENCE_END = /[.!?…]+["'”’»)\]*_`]*$/u;
/** Comienzo de frase: mayúscula o número, tras comillas o aperturas opcionales. */
const SENTENCE_START = /^["'“‘«(¿¡*_`]*[\p{Lu}\p{N}]/u;

/** Diferencia por encima de la cual la frase se pinta entera (estrictamente mayor). */
export const WHOLE_SENTENCE_THRESHOLD = 0.5;

/**
 * Índice de frase de cada palabra. Una frase termina en una palabra con
 * puntuación final seguida de otra que empieza en mayúscula o número (o al
 * final), y siempre antes de una palabra con `hardBreakBefore` (salto de línea,
 * celda de tabla…). Así «p. ej. algo» no corta la frase.
 */
export function sentenceIndexes(
  words: readonly string[],
  hardBreakBefore: (index: number) => boolean = () => false,
): number[] {
  const result: number[] = [];
  let sentence = 0;
  let pendingEnd = false;
  words.forEach((word, index) => {
    if (index > 0 && (pendingEnd || hardBreakBefore(index))) sentence++;
    pendingEnd = false;
    result.push(sentence);
    const next = words[index + 1];
    if (SENTENCE_END.test(word) && (next === undefined || SENTENCE_START.test(next))) {
      pendingEnd = true;
    }
  });
  return result;
}

/**
 * Frases nuevas que se pintan enteras. Para cada frase nueva, su contraparte
 * es la frase original que recibe más palabras emparejadas; la diferencia es
 * (agregadas + quitadas) ÷ (palabras originales + nuevas). Sin palabras
 * emparejadas, la diferencia es del 100 %.
 *
 * @param oldSentence índice de frase de cada palabra original
 * @param newSentence índice de frase de cada palabra nueva
 * @param pairs palabras emparejadas `[índice original, índice nuevo]`
 */
export function wholeSentences(
  oldSentence: readonly number[],
  newSentence: readonly number[],
  pairs: ReadonlyArray<readonly [number, number]>,
): Set<number> {
  const count = (indexes: readonly number[]) => {
    const sizes = new Map<number, number>();
    for (const id of indexes) sizes.set(id, (sizes.get(id) ?? 0) + 1);
    return sizes;
  };
  const oldSizes = count(oldSentence);
  const newSizes = count(newSentence);
  const votes = new Map<number, Map<number, number>>();
  for (const [i, j] of pairs) {
    const newId = newSentence[j];
    const oldId = oldSentence[i];
    if (newId === undefined || oldId === undefined) continue;
    const byOld = votes.get(newId) ?? new Map<number, number>();
    byOld.set(oldId, (byOld.get(oldId) ?? 0) + 1);
    votes.set(newId, byOld);
  }
  const whole = new Set<number>();
  for (const [newId, newSize] of newSizes) {
    const byOld = votes.get(newId);
    if (byOld === undefined) {
      whole.add(newId);
      continue;
    }
    let bestOld = -1;
    let matched = 0;
    for (const [oldId, votesForOld] of byOld) {
      if (votesForOld > matched) {
        matched = votesForOld;
        bestOld = oldId;
      }
    }
    const oldSize = oldSizes.get(bestOld) ?? 0;
    const difference = (newSize - matched + (oldSize - matched)) / (oldSize + newSize);
    if (difference > WHOLE_SENTENCE_THRESHOLD) whole.add(newId);
  }
  return whole;
}

/**
 * Agrupa índices consecutivos en rangos a pintar: una frase entera si está en
 * `whole`, o cada tramo de palabras no emparejadas sin cruzar frases. Devuelve
 * pares de índices de palabra `[primera, última]`.
 */
export function paintRuns(
  newSentence: readonly number[],
  matched: ReadonlySet<number>,
  whole: ReadonlySet<number>,
  breakBefore: (index: number) => boolean = () => false,
): Array<[number, number]> {
  const runs: Array<[number, number]> = [];
  let open: [number, number] | null = null;
  newSentence.forEach((sentence, index) => {
    const previous = newSentence[index - 1];
    const sameSentence = previous === sentence;
    const paint = whole.has(sentence) || !matched.has(index);
    if (!paint) {
      open = null;
      return;
    }
    if (open !== null && sameSentence && !breakBefore(index)) {
      open[1] = index;
    } else {
      open = [index, index];
      runs.push(open);
    }
  });
  return runs;
}

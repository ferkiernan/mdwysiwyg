/**
 * Correspondencia de posiciones de desplazamiento entre el panel original y el
 * nuevo: pura (sin DOM). Ver specs/012-compare-scroll-sync/data-model.md.
 */

export type Axis = "original" | "current";

/** Desplazamiento (px desde el inicio del contenido) del mismo pasaje en cada panel. */
export interface Anchor {
  original: number;
  current: number;
}

/** Anclas ordenadas y no decrecientes, siempre con los extremos inicial y final. */
export type Alignment = readonly Anchor[];

/**
 * Ordena las anclas, descarta las fuera de rango o que rompen el orden y añade
 * los extremos `(0, 0)` y `(maxOriginal, maxCurrent)`: con ellos la
 * correspondencia es total y, sin otras anclas, equivale al progreso
 * proporcional.
 */
export function normalizeAlignment(
  anchors: readonly Anchor[],
  maxOriginal: number,
  maxCurrent: number,
): Alignment {
  const endOriginal = Math.max(0, maxOriginal);
  const endCurrent = Math.max(0, maxCurrent);
  const result: Anchor[] = [{ original: 0, current: 0 }];
  const sorted = [...anchors].sort((a, b) => a.original - b.original);
  for (const anchor of sorted) {
    const last = result[result.length - 1] as Anchor;
    if (
      anchor.original < 0 ||
      anchor.current < 0 ||
      anchor.original > endOriginal ||
      anchor.current > endCurrent ||
      anchor.current < last.current
    ) {
      continue;
    }
    result.push({ original: anchor.original, current: anchor.current });
  }
  const last = result[result.length - 1] as Anchor;
  if (last.original !== endOriginal || last.current !== endCurrent) {
    result.push({ original: endOriginal, current: endCurrent });
  }
  return result;
}

/**
 * `scrollTop` del otro panel que corresponde a `scrollTop` en el panel `axis`,
 * por interpolación lineal entre las anclas vecinas.
 */
export function mapScroll(
  alignment: Alignment,
  axis: Axis,
  scrollTop: number,
): number {
  const other: Axis = axis === "original" ? "current" : "original";
  const last = alignment[alignment.length - 1];
  if (last === undefined) return scrollTop;
  if (alignment.length < 2) return last[other];
  if (scrollTop <= 0) return (alignment[0] as Anchor)[other];
  if (scrollTop >= last[axis]) return last[other];

  // Última ancla con `axis <= scrollTop`.
  let low = 0;
  let high = alignment.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if ((alignment[middle] as Anchor)[axis] <= scrollTop) low = middle;
    else high = middle;
  }
  const from = alignment[low] as Anchor;
  const to = alignment[high] as Anchor;
  const span = to[axis] - from[axis];
  if (span <= 0) return from[other];
  const progress = (scrollTop - from[axis]) / span;
  return from[other] + progress * (to[other] - from[other]);
}

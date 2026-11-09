/**
 * Emparejamiento de dos secuencias de claves (algoritmo de Myers, O(ND)).
 *
 * Devuelve los pares `[i, j]` con `a[i] === b[j]` de una subsecuencia común
 * más larga, en orden creciente. Primero se recortan prefijo y sufijo comunes;
 * `maxEdits` acota el tiempo y la memoria: si el tramo central necesita más
 * ediciones, ese tramo se considera sin coincidencias (resultado válido pero
 * no óptimo, suficiente para resaltar).
 */
export function matchSequences(
  a: readonly string[],
  b: readonly string[],
  maxEdits = 1500,
): Array<[number, number]> {
  const n = a.length;
  const m = b.length;

  let start = 0;
  while (start < n && start < m && a[start] === b[start]) start++;

  let endA = n;
  let endB = m;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < start; i++) pairs.push([i, i]);
  for (const pair of myers(a, start, endA, b, start, endB, maxEdits)) {
    pairs.push(pair);
  }
  for (let k = 0; k < n - endA; k++) pairs.push([endA + k, endB + k]);
  return pairs;
}

function myers(
  a: readonly string[],
  aLo: number,
  aHi: number,
  b: readonly string[],
  bLo: number,
  bHi: number,
  maxEdits: number,
): Array<[number, number]> {
  const n = aHi - aLo;
  const m = bHi - bLo;
  if (n === 0 || m === 0) return [];

  const max = Math.min(n + m, maxEdits);
  const offset = max + 1;
  const v = new Int32Array(2 * max + 3);
  // Instantánea de `v` al inicio de cada ronda d, solo el tramo [-d-1, d+1].
  const trace: Int32Array[] = [];

  for (let d = 0; d <= max; d++) {
    trace.push(v.slice(offset - d - 1, offset + d + 2));
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && (v[offset + k - 1] as number) < (v[offset + k + 1] as number))) {
        x = v[offset + k + 1] as number;
      } else {
        x = (v[offset + k - 1] as number) + 1;
      }
      let y = x - k;
      while (x < n && y < m && a[aLo + x] === b[bLo + y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) return backtrack(trace, n, m, aLo, bLo);
    }
  }
  return [];
}

function backtrack(
  trace: Int32Array[],
  n: number,
  m: number,
  aLo: number,
  bLo: number,
): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d--) {
    const snapshot = trace[d] as Int32Array;
    const at = (k: number) => snapshot[k + d + 1] as number;
    const k = x - y;
    const prevK =
      k === -d || (k !== d && at(k - 1) < at(k + 1)) ? k + 1 : k - 1;
    const prevX = at(prevK);
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      x--;
      y--;
      out.push([aLo + x, bLo + y]);
    }
    if (d > 0) {
      x = prevX;
      y = prevY;
    }
  }
  return out.reverse();
}

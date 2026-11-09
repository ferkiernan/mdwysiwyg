import { matchSequences } from "../../src/components/MarkdownEditor/compare/diffSequences";
import { diffText } from "../../src/components/MarkdownEditor/compare/textDiff";

/** Longitud de la subsecuencia común más larga (programación dinámica). */
function lcsLength(a: string[], b: string[]): number {
  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const row = table[i] as number[];
      const prev = table[i - 1] as number[];
      row[j] =
        a[i - 1] === b[j - 1]
          ? (prev[j - 1] as number) + 1
          : Math.max(prev[j] as number, row[j - 1] as number);
    }
  }
  return (table[a.length] as number[])[b.length] as number;
}

function assertValidMatching(a: string[], b: string[], pairs: Array<[number, number]>) {
  let lastI = -1;
  let lastJ = -1;
  for (const [i, j] of pairs) {
    expect(i).toBeGreaterThan(lastI);
    expect(j).toBeGreaterThan(lastJ);
    expect(a[i]).toBe(b[j]);
    lastI = i;
    lastJ = j;
  }
}

/** PRNG determinista para que el test sea reproducible. */
function makeRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe("matchSequences", () => {
  it("secuencias idénticas: empareja todo", () => {
    const a = ["a", "b", "c"];
    expect(matchSequences(a, [...a])).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
  });

  it("entradas vacías", () => {
    expect(matchSequences([], [])).toEqual([]);
    expect(matchSequences(["a"], [])).toEqual([]);
    expect(matchSequences([], ["a"])).toEqual([]);
  });

  it("reemplazo total: no empareja nada", () => {
    expect(matchSequences(["a", "b"], ["x", "y", "z"])).toEqual([]);
  });

  it("inserción y borrado simples", () => {
    expect(matchSequences(["a", "c"], ["a", "b", "c"])).toEqual([
      [0, 0],
      [1, 2],
    ]);
    expect(matchSequences(["a", "b", "c"], ["a", "c"])).toEqual([
      [0, 0],
      [2, 1],
    ]);
  });

  it("coincide con la LCS de referencia en entradas aleatorias", () => {
    const random = makeRandom(42);
    const alphabet = ["a", "b", "c", "d", "e"];
    for (let round = 0; round < 200; round++) {
      const a = Array.from({ length: Math.floor(random() * 14) }, () =>
        alphabet[Math.floor(random() * alphabet.length)] as string,
      );
      const b = Array.from({ length: Math.floor(random() * 14) }, () =>
        alphabet[Math.floor(random() * alphabet.length)] as string,
      );
      const pairs = matchSequences(a, b);
      assertValidMatching(a, b, pairs);
      expect(pairs.length).toBe(lcsLength(a, b));
    }
  });

  it("con presupuesto agotado devuelve un emparejamiento parcial pero válido", () => {
    const a = Array.from({ length: 200 }, (_, i) => `a${i}`);
    const b = Array.from({ length: 200 }, (_, i) => `b${i}`);
    a[50] = "same";
    b[120] = "same";
    const pairs = matchSequences(a, b, 5);
    assertValidMatching(a, b, pairs);
  });

  it("es rápido con documentos grandes casi iguales", () => {
    const a = Array.from({ length: 20000 }, (_, i) => `w${i % 997}`);
    const b = [...a];
    b[10000] = "changed";
    b.splice(15000, 0, "inserted");
    const start = performance.now();
    const pairs = matchSequences(a, b);
    expect(performance.now() - start).toBeLessThan(300);
    expect(pairs.length).toBe(a.length - 1);
  });
});

describe("diffText", () => {
  it("sin diferencias: sin rangos y sin cambio", () => {
    const result = diffText("hola mundo", "hola mundo");
    expect(result.ranges).toEqual([]);
    expect(result.summary).toEqual({ changed: false, count: 0 });
  });

  it("marca solo las palabras cambiadas o añadidas del texto nuevo", () => {
    const current = "hola nuevo mundo";
    const result = diffText("hola mundo", current);
    expect(result.ranges.map(([from, to]) => current.slice(from, to))).toEqual([
      "nuevo",
    ]);
    expect(result.summary).toEqual({ changed: true, count: 1 });
  });

  it("une palabras consecutivas cambiadas en un solo rango", () => {
    const current = "uno dos tres cuatro";
    const result = diffText("uno cuatro", current);
    expect(result.ranges.map(([from, to]) => current.slice(from, to))).toEqual([
      "dos tres",
    ]);
  });

  it("un borrado puro es un cambio sin rangos", () => {
    const result = diffText("uno dos tres", "uno tres");
    expect(result.ranges).toEqual([]);
    expect(result.summary).toEqual({ changed: true, count: 0 });
  });

  it("ignora diferencias solo de espacios en blanco", () => {
    const result = diffText("uno  dos\n", "uno dos");
    expect(result.summary.changed).toBe(false);
    expect(result.ranges).toEqual([]);
  });
});

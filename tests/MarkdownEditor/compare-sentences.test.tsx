import { describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  paintRuns,
  sentenceIndexes,
  wholeSentences,
} from "../../src/components/MarkdownEditor/compare/sentences";
import { diffText } from "../../src/components/MarkdownEditor/compare/textDiff";
import { expectHighlighted, highlighted, setupCompare } from "./helpers";

const words = (text: string) => text.split(" ");

/** Texto pintado por `diffText` en `current`. */
function painted(original: string, current: string): string[] {
  return diffText(original, current).ranges.map(([from, to]) => current.slice(from, to));
}

describe("segmentación en frases", () => {
  it("corta en puntuación final seguida de mayúscula o número", () => {
    expect(sentenceIndexes(words("Hola mundo. Otra frase! ¿Y esta? 3 más"))).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });

  it("no corta en abreviaturas ni números con punto seguidos de minúscula", () => {
    expect(sentenceIndexes(words("Por ej. esto sigue y la v1.2 también"))).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("corta antes de un salto duro", () => {
    expect(sentenceIndexes(["a", "b", "c"], (i) => i === 2)).toEqual([0, 0, 1]);
  });
});

describe("decisión por frase (agregadas + quitadas ÷ ambas)", () => {
  // Una frase original de 4 palabras frente a una nueva de 4, con k palabras emparejadas.
  const decide = (oldSize: number, newSize: number, matched: number) =>
    wholeSentences(
      new Array(oldSize).fill(0),
      new Array(newSize).fill(0),
      Array.from({ length: matched }, (_, i) => [i, i] as [number, number]),
    ).has(0);

  it.each([
    [4, 4, 4, false], // 0 %
    [4, 4, 3, false], // 25 %
    [2, 2, 1, false], // 50 %: solo palabras
    [4, 4, 1, true], // 75 %
    [4, 4, 0, true], // 100 %
    [10, 3, 3, true], // recortada: 7 ÷ 13 ≈ 54 %
    [4, 10, 4, false], // alargada: 6 ÷ 14 ≈ 43 %
  ])("original %i, nueva %i, emparejadas %i → entera: %s", (o, n, m, expected) => {
    expect(decide(o, n, m)).toBe(expected);
  });

  it("51 % pinta la frase entera", () => {
    // 100 + 100 palabras, 49 emparejadas: (51 + 51) ÷ 200 = 51 %.
    expect(decide(100, 100, 49)).toBe(true);
  });

  it("cada frase se juzga por separado", () => {
    const whole = wholeSentences([0, 0, 1, 1], [0, 0, 1, 1], [[0, 0], [1, 1]]);
    expect([...whole]).toEqual([1]);
  });

  it("los tramos pintados no cruzan frases", () => {
    expect(paintRuns([0, 0, 1, 1], new Set([0]), new Set())).toEqual([[1, 1], [2, 3]]);
  });
});

describe("vista Markdown (diffText)", () => {
  it("frase apenas tocada: solo la palabra; frase reescrita: entera; frase igual: nada", () => {
    const original = "Primera frase igual. Segunda frase con cambio. Tercera frase muy distinta.";
    const current = "Primera frase igual. Segunda frase con ajuste. Nada que ver con lo previo.";
    expect(painted(original, current)).toEqual(["ajuste.", "Nada que ver con lo previo."]);
  });

  it("la sintaxis Markdown no cuenta ni se pinta", () => {
    expect(painted("- uno dos tres", "* uno dos tres")).toEqual([]);
    expect(painted("# Título largo aquí", "## Título largo aquí")).toEqual([]);
  });

  it("las celdas de tabla son frases separadas", () => {
    const original = "| Fase | Estado |\n| --- | --- |\n| Diseño | Hecho |";
    const current = "| Fase | Estado |\n| --- | --- |\n| Diseño | Pendiente |";
    expect(painted(original, current)).toEqual(["Pendiente"]);
  });

  it("un párrafo nuevo se pinta entero", () => {
    expect(painted("Uno.", "Uno.\n\nUn párrafo completamente nuevo.")).toEqual([
      "Un párrafo completamente nuevo.",
    ]);
  });
});

describe("vista renderizada y coherencia entre vistas", () => {
  const original = "Primera frase igual. Segunda frase con cambio. Tercera frase muy distinta.";
  const current = "Primera frase igual. Segunda frase con ajuste. Nada que ver con lo previo.";

  it("pinta por frase dentro de un mismo párrafo", async () => {
    const { newPane } = await setupCompare({ initialContent: original, compareContent: current });
    await expectHighlighted(newPane, ["ajuste.", "Nada que ver con lo previo."]);
  });

  it("un párrafo con una frase intacta no se pinta entero aunque el resto cambie mucho", async () => {
    const { newPane } = await setupCompare({
      initialContent: "Esta frase queda igual siempre. Aquella otra era la original del texto.",
      compareContent: "Esta frase queda igual siempre. Todo lo demás fue reescrito desde cero hoy.",
    });
    await expectHighlighted(newPane, ["Todo lo demás fue reescrito desde cero hoy."]);
    expect(newPane.querySelector("[data-compare='added']")).toBeNull();
  });

  it("las dos vistas pintan las mismas frases enteras", async () => {
    const { newPane } = await setupCompare({ initialContent: original, compareContent: current });
    await expectHighlighted(newPane, ["ajuste.", "Nada que ver con lo previo."]);
    await userEvent.click(screen.getByRole("button", { name: "Ver código Markdown" }));
    const layerMarks = highlighted(screen.getByRole("group", { name: /^Contenido nuevo/ }));
    expect(layerMarks).toEqual(["ajuste.", "Nada que ver con lo previo."]);
  });

  it("los bloques de código siguen pintando solo las líneas cambiadas", async () => {
    const { newPane } = await setupCompare({
      initialContent: "```js\nconst a = 1;\nconst b = 2;\n```",
      compareContent: "```js\nconst a = 1;\nconst b = 3;\n```",
    });
    // El resaltado de sintaxis parte la marca en varios nodos: se compara el texto unido.
    await waitFor(() => expect(highlighted(newPane).join("")).toBe("const b = 3;"));
  });
});

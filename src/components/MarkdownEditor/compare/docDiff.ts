import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { matchSequences } from "./diffSequences";
import type { DiffSummary } from "./textDiff";

/** Palabra (o línea, en bloques de código) con su rango en el documento. */
interface Token {
  key: string;
  from: number;
  to: number;
}

/** Contenedor que se resalta entero si todo lo que contiene es nuevo. */
interface Container {
  pos: number;
  nodeSize: number;
  total: number;
  added: number;
}

/** Bloque de texto o bloque hoja (imagen, regla, HTML) del documento. */
export interface Unit {
  pos: number;
  nodeSize: number;
  typeName: string;
  /** Tipo + atributos + contexto de ancestros: si difiere, cambia el bloque entero. */
  shape: string;
  tokens: Token[];
  /** Igualdad exacta de bloque (forma + palabras). */
  key: string;
  isLeaf: boolean;
  containers: Container[];
}

export interface DocDiff {
  /** Rangos de texto nuevos o distintos (resaltado inline). */
  marks: Array<[number, number]>;
  /** Elementos enteros nuevos (resaltado de bloque). */
  blocks: Array<[number, number]>;
  summary: DiffSummary;
}

export interface CollectedUnits {
  units: Unit[];
  containers: Container[];
}

const CONTAINER_TYPES = new Set(["tableRow", "listItem", "taskItem"]);
/** Por debajo de este reparto de palabras comunes, dos bloques se consideran distintos. */
const SIMILARITY_THRESHOLD = 0.5;
/** Tope de comparaciones de emparejado por hueco (tiempo acotado en reescrituras totales). */
const MAX_PAIR_CHECKS = 40_000;

function contextOf(ancestors: readonly ProseMirrorNode[]): string {
  return ancestors
    .map((ancestor) =>
      ancestor.type.name === "taskItem"
        ? `taskItem:${String(ancestor.attrs["checked"])}`
        : ancestor.type.name,
    )
    .join(">");
}

function textTokens(block: ProseMirrorNode, contentStart: number): Token[] {
  const tokens: Token[] = [];
  block.forEach((inline, offset) => {
    const start = contentStart + offset;
    if (!inline.isText || inline.text === undefined) {
      tokens.push({
        key: `#${inline.type.name}${JSON.stringify(inline.attrs)}`,
        from: start,
        to: start + inline.nodeSize,
      });
      return;
    }
    const signature = inline.marks
      .map((mark) => `${mark.type.name}${JSON.stringify(mark.attrs)}`)
      .sort()
      .join(",");
    for (const match of inline.text.matchAll(/\S+/g)) {
      tokens.push({
        key: `${signature}§${match[0]}`,
        from: start + match.index,
        to: start + match.index + match[0].length,
      });
    }
  });
  return tokens;
}

function codeTokens(block: ProseMirrorNode, contentStart: number): Token[] {
  const tokens: Token[] = [];
  let offset = 0;
  for (const line of block.textContent.split("\n")) {
    if (line.trim() !== "") {
      tokens.push({
        key: line,
        from: contentStart + offset,
        to: contentStart + offset + line.length,
      });
    }
    offset += line.length + 1;
  }
  return tokens;
}

/** Recorre el documento y lista sus bloques de texto y bloques hoja no vacíos. */
export function collectUnits(doc: ProseMirrorNode): CollectedUnits {
  const units: Unit[] = [];
  const allContainers: Container[] = [];

  const visit = (
    parent: ProseMirrorNode,
    contentStart: number,
    ancestors: readonly ProseMirrorNode[],
    containers: readonly Container[],
  ) => {
    parent.forEach((child, offset) => {
      const pos = contentStart + offset;

      if (child.isTextblock || (child.isLeaf && child.isBlock)) {
        const isText = child.isTextblock;
        if (isText && child.content.size === 0) return;
        const tokens = !isText
          ? []
          : child.type.spec.code === true
            ? codeTokens(child, pos + 1)
            : textTokens(child, pos + 1);
        if (isText && tokens.length === 0) return;
        const shape = `${child.type.name}|${JSON.stringify(child.attrs)}|${contextOf(ancestors)}`;
        units.push({
          pos,
          nodeSize: child.nodeSize,
          typeName: child.type.name,
          shape,
          tokens,
          key: `${shape}|${tokens.map((token) => token.key).join("\u0001")}`,
          isLeaf: !isText,
          containers: [...containers],
        });
        for (const container of containers) container.total++;
        return;
      }

      let nextContainers = containers;
      if (CONTAINER_TYPES.has(child.type.name)) {
        const container: Container = {
          pos,
          nodeSize: child.nodeSize,
          total: 0,
          added: 0,
        };
        allContainers.push(container);
        nextContainers = [...containers, container];
      }
      visit(child, pos + 1, [...ancestors, child], nextContainers);
    });
  };

  visit(doc, 0, [], []);
  return { units, containers: allContainers };
}

function similarity(
  matched: number,
  oldCount: number,
  newCount: number,
): number {
  const total = oldCount + newCount;
  return total === 0 ? 1 : (2 * matched) / total;
}

interface PairingHandlers {
  /** Unidades idénticas (coincidencia exacta). */
  exact(oldIndex: number, newIndex: number): void;
  /** Unidades parecidas emparejadas dentro de un hueco, con sus palabras comunes. */
  paired(oldIndex: number, newIndex: number, tokenPairs: Array<[number, number]>): void;
  /** Unidad actual sin contraparte. */
  added(newIndex: number): void;
  /** Unidad original sin contraparte. */
  removed(oldIndex: number): void;
}

/**
 * Empareja las unidades originales con las actuales: coincidencias exactas por
 * bloque (Myers) y, dentro de cada hueco, emparejado en orden por similitud de
 * palabras. Informa de cada resultado a `handlers`.
 */
function walkPairing(
  oldUnits: readonly Unit[],
  newUnits: readonly Unit[],
  handlers: PairingHandlers,
): void {
  const exact = matchSequences(
    oldUnits.map((unit) => unit.key),
    newUnits.map((unit) => unit.key),
  );

  const pairGap = (oldFrom: number, oldTo: number, newFrom: number, newTo: number) => {
    const withinBudget = (oldTo - oldFrom) * (newTo - newFrom) <= MAX_PAIR_CHECKS;
    let pointer = oldFrom;
    const usedOld = new Set<number>();

    for (let n = newFrom; n < newTo; n++) {
      const newUnit = newUnits[n] as Unit;
      let paired = false;
      if (withinBudget && !newUnit.isLeaf) {
        for (let o = pointer; o < oldTo; o++) {
          const oldUnit = oldUnits[o] as Unit;
          if (oldUnit.typeName !== newUnit.typeName) continue;
          const pairs = matchSequences(
            oldUnit.tokens.map((token) => token.key),
            newUnit.tokens.map((token) => token.key),
            300,
          );
          if (
            similarity(pairs.length, oldUnit.tokens.length, newUnit.tokens.length) >=
            SIMILARITY_THRESHOLD
          ) {
            handlers.paired(o, n, pairs);
            usedOld.add(o);
            pointer = o + 1;
            paired = true;
            break;
          }
        }
      }
      if (!paired) handlers.added(n);
    }

    for (let o = oldFrom; o < oldTo; o++) {
      if (!usedOld.has(o)) handlers.removed(o);
    }
  };

  let oldIndex = 0;
  let newIndex = 0;
  for (const [i, j] of [...exact, [oldUnits.length, newUnits.length] as [number, number]]) {
    pairGap(oldIndex, i, newIndex, j);
    if (i < oldUnits.length && j < newUnits.length) handlers.exact(i, j);
    oldIndex = i + 1;
    newIndex = j + 1;
  }
}

/**
 * Correspondencia entre las unidades originales y las actuales, en orden de
 * documento: `[índice original, índice actual]` para cada pareja (idénticas o
 * parecidas). Es la base de la sincronización del desplazamiento.
 */
export function pairUnits(
  originalUnits: readonly Unit[],
  currentUnits: readonly Unit[],
): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  walkPairing(originalUnits, currentUnits, {
    exact: (i, j) => pairs.push([i, j]),
    paired: (i, j) => pairs.push([i, j]),
    added: () => undefined,
    removed: () => undefined,
  });
  return pairs.sort((a, b) => a[0] - b[0]);
}

/**
 * Compara el documento original (ya reducido a unidades) con el actual y
 * calcula qué resaltar en el actual (ver research §5): coincidencias exactas por
 * bloque (Myers), emparejado en orden dentro de cada hueco por similitud de
 * palabras, diferencias de palabra en bloques emparejados y bloques enteros
 * para lo nuevo.
 */
export function diffDocs(
  originalUnits: readonly Unit[],
  current: CollectedUnits,
): DocDiff {
  const newUnits = current.units;

  const marks: Array<[number, number]> = [];
  const blocks: Array<[number, number]> = [];
  let changed = false;
  let count = 0;

  const markAdded = (unit: Unit) => {
    changed = true;
    count++;
    blocks.push([unit.pos, unit.pos + unit.nodeSize]);
    if (!unit.isLeaf) marks.push([unit.pos + 1, unit.pos + unit.nodeSize - 1]);
    for (const container of unit.containers) container.added++;
  };

  const markPaired = (oldUnit: Unit, newUnit: Unit, pairs: Array<[number, number]>) => {
    if (oldUnit.shape !== newUnit.shape) {
      markAdded(newUnit);
      return;
    }
    if (pairs.length < oldUnit.tokens.length) changed = true;
    if (pairs.length === newUnit.tokens.length) return;
    changed = true;
    const matched = new Set(pairs.map(([, j]) => j));
    const isCode = newUnit.typeName === "codeBlock";
    let open: [number, number] | null = null;
    newUnit.tokens.forEach((token, index) => {
      if (matched.has(index)) {
        open = null;
      } else if (open !== null && !isCode) {
        open[1] = token.to;
      } else {
        open = [token.from, token.to];
        marks.push(open);
        count++;
      }
    });
  };

  walkPairing(originalUnits, newUnits, {
    exact: () => undefined,
    paired: (o, n, pairs) =>
      markPaired(originalUnits[o] as Unit, newUnits[n] as Unit, pairs),
    added: (n) => markAdded(newUnits[n] as Unit),
    removed: () => {
      changed = true;
    },
  });

  for (const container of current.containers) {
    if (container.total > 0 && container.added === container.total) {
      blocks.push([container.pos, container.pos + container.nodeSize]);
    }
  }

  return {
    marks,
    blocks,
    summary: { changed, count },
  };
}

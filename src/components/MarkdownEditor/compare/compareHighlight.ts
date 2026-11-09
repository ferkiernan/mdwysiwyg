import { Extension, createDocument, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { markdownToEditorContent } from "../markdown/tiptapMarkdownBridge";
import { collectUnits, diffDocs, type Unit } from "./docDiff";
import type { DiffSummary } from "./textDiff";

interface HighlightState {
  /** Unidades del documento original; `null` fuera del modo de comparación. */
  original: readonly Unit[] | null;
  decorations: DecorationSet;
  summary: DiffSummary;
}

interface HighlightMeta {
  original: readonly Unit[] | null;
}

export interface CompareHighlightOptions {
  /** Clase del `<mark>` que envuelve las palabras nuevas o cambiadas. */
  markClass: string;
  /** Clase de los elementos enteros nuevos (párrafo, fila, elemento de lista, código…). */
  blockClass: string;
}

const NO_DIFFERENCES: DiffSummary = { changed: false, count: 0 };

const compareHighlightKey = new PluginKey<HighlightState>(
  "mdwCompareHighlight",
);

function inactiveState(): HighlightState {
  return {
    original: null,
    decorations: DecorationSet.empty,
    summary: NO_DIFFERENCES,
  };
}

function compute(
  doc: ProseMirrorNode,
  original: readonly Unit[],
  options: CompareHighlightOptions,
): HighlightState {
  const diff = diffDocs(original, collectUnits(doc));
  const decorations = [
    ...diff.blocks.map(([from, to]) =>
      Decoration.node(from, to, {
        class: options.blockClass,
        "data-compare": "added",
      }),
    ),
    ...diff.marks
      .filter(([from, to]) => to > from)
      .map(([from, to]) =>
        Decoration.inline(from, to, {
          nodeName: "mark",
          class: options.markClass,
          "data-compare": "changed",
        }),
      ),
  ];
  return {
    original,
    decorations: DecorationSet.create(doc, decorations),
    summary: diff.summary,
  };
}

/**
 * Resalta en el editor lo que es nuevo o distinto respecto de un documento
 * original (ver `setCompareOriginal`). Sin original no hace nada: el conjunto
 * de decoraciones está vacío y el modo normal no se ve afectado.
 */
export const CompareHighlight = Extension.create<CompareHighlightOptions>({
  name: "compareHighlight",

  addOptions() {
    return { markClass: "", blockClass: "" };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    return [
      new Plugin<HighlightState>({
        key: compareHighlightKey,
        state: {
          init: inactiveState,
          apply(transaction, previous, _oldState, newState) {
            const meta = transaction.getMeta(compareHighlightKey) as
              | HighlightMeta
              | undefined;
            if (meta === undefined && !transaction.docChanged) return previous;
            const original =
              meta === undefined ? previous.original : meta.original;
            return original === null
              ? inactiveState()
              : compute(newState.doc, original, options);
          },
        },
        props: {
          decorations(state) {
            return compareHighlightKey.getState(state)?.decorations;
          },
        },
      }),
    ];
  },
});

/**
 * Fija (o, con `null`, quita) el Markdown original frente al que se resalta el
 * documento del editor. Solo envía metadatos: no cambia el documento, no
 * dispara `onUpdate` y no entra en el historial.
 */
export function setCompareOriginal(
  editor: Editor,
  markdown: string | null,
): void {
  if (editor.isDestroyed) return;
  // Sin original y sin original previo no hay nada que cambiar: no se emite
  // ninguna transacción en el modo normal.
  if (markdown === null && compareHighlightKey.getState(editor.state)?.original === null) {
    return;
  }
  const original =
    markdown === null
      ? null
      : collectUnits(
          createDocument(markdownToEditorContent(markdown), editor.schema),
        ).units;
  const meta: HighlightMeta = { original };
  // `preventUpdate`: otras extensiones pueden añadir contenido auxiliar tras
  // cualquier transacción (p. ej. la línea final); no debe contar como edición.
  editor.view.dispatch(
    editor.state.tr
      .setMeta(compareHighlightKey, meta)
      .setMeta("addToHistory", false)
      .setMeta("preventUpdate", true),
  );
}

/** Resumen de diferencias actual del editor (sin diferencias si no hay comparación). */
export function getCompareSummary(editor: Editor): DiffSummary {
  return compareHighlightKey.getState(editor.state)?.summary ?? NO_DIFFERENCES;
}

import { forwardRef, useRef, type ReactNode, type UIEvent } from "react";
import { MarkdownSourceView } from "../views/MarkdownSourceView";
import styles from "../MarkdownEditor.module.css";

export interface HighlightedSourceProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  /**
   * Rangos `[desde, hasta)` de `value` a resaltar. `null` = sin capa de
   * resaltado (modo normal).
   */
  ranges: ReadonlyArray<readonly [number, number]> | null;
  /** Ajusta el alto al contenido (ver `MarkdownSourceView`). */
  autoSize?: boolean;
}

function segments(value: string, ranges: HighlightedSourceProps["ranges"]): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  (ranges ?? []).forEach(([from, to], index) => {
    if (from > cursor) nodes.push(value.slice(cursor, from));
    nodes.push(
      <mark
        key={index}
        className={styles["compareMark"]}
        data-compare="changed"
      >
        {value.slice(from, to)}
      </mark>,
    );
    cursor = to;
  });
  nodes.push(value.slice(cursor));
  return nodes;
}

/**
 * Área de texto de la vista Markdown con, en modo de comparación, una capa de
 * resaltado detrás: un `div` con la misma tipografía y ajuste de línea que el
 * `textarea` (que es transparente) y con las palabras nuevas o cambiadas dentro
 * de `<mark>`. La capa se desplaza a la vez que el texto.
 */
export const HighlightedSource = forwardRef<
  HTMLTextAreaElement,
  HighlightedSourceProps
>(function HighlightedSource({ value, onChange, readOnly, ranges, autoSize }, ref) {
  const layerRef = useRef<HTMLDivElement>(null);

  const syncScroll = (event: UIEvent<HTMLDivElement>) => {
    const layer = layerRef.current;
    if (layer === null || !(event.target instanceof HTMLTextAreaElement)) return;
    layer.scrollTop = event.target.scrollTop;
    layer.scrollLeft = event.target.scrollLeft;
  };

  return (
    <div
      className={styles["sourceWrap"]}
      // El scroll no burbujea: se captura el del textarea.
      onScrollCapture={syncScroll}
    >
      {ranges !== null && (
        <div ref={layerRef} className={styles["sourceLayer"]} aria-hidden="true">
          {segments(value, ranges)}
          {"​"}
        </div>
      )}
      <MarkdownSourceView
        ref={ref}
        value={value}
        onChange={onChange}
        {...(readOnly !== undefined ? { readOnly } : {})}
        {...(autoSize !== undefined ? { autoSize } : {})}
      />
    </div>
  );
});

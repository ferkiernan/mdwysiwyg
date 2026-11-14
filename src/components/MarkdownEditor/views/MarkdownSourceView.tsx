import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";
import styles from "../MarkdownEditor.module.css";

export interface MarkdownSourceViewProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  /** Nombre accesible. Default: "Código fuente Markdown". */
  ariaLabel?: string;
  /**
   * Ajusta el alto del área de texto a su contenido (sin barra de desplazamiento
   * vertical). Lo usa `autoHeight`. Default: false.
   */
  autoSize?: boolean;
  /** Cambia cuando el tamaño del texto cambia (zoom): con `autoSize` se reajusta el alto. */
  refitKey?: unknown;
}

/** Ajusta el alto de `textarea` a su contenido. */
function fitToContent(textarea: HTMLTextAreaElement): void {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export const MarkdownSourceView = forwardRef<
  HTMLTextAreaElement,
  MarkdownSourceViewProps
>(function MarkdownSourceView(
  {
    value,
    onChange,
    readOnly = false,
    ariaLabel = "Código fuente Markdown",
    autoSize = false,
    refitKey,
  },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

  // El contenido cambia: se recalcula el alto.
  useLayoutEffect(() => {
    const textarea = innerRef.current;
    if (textarea === null) return;
    if (autoSize) fitToContent(textarea);
    else textarea.style.height = "";
  }, [autoSize, value, refitKey]);

  // Cambia el ancho (las líneas se reacomodan): también.
  useLayoutEffect(() => {
    const textarea = innerRef.current;
    if (!autoSize || textarea === null || typeof ResizeObserver === "undefined") {
      return;
    }
    let width = textarea.clientWidth;
    const observer = new ResizeObserver(() => {
      if (textarea.clientWidth === width) return;
      width = textarea.clientWidth;
      fitToContent(textarea);
    });
    observer.observe(textarea);
    return () => observer.disconnect();
  }, [autoSize]);

  return (
    <textarea
      ref={innerRef}
      className={styles["source"]}
      aria-label={ariaLabel}
      spellCheck={false}
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
    />
  );
});

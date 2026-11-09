import { forwardRef } from "react";
import styles from "../MarkdownEditor.module.css";

export interface MarkdownSourceViewProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  /** Nombre accesible. Default: "Código fuente Markdown". */
  ariaLabel?: string;
}

export const MarkdownSourceView = forwardRef<
  HTMLTextAreaElement,
  MarkdownSourceViewProps
>(function MarkdownSourceView(
  { value, onChange, readOnly = false, ariaLabel = "Código fuente Markdown" },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={styles["source"]}
      aria-label={ariaLabel}
      spellCheck={false}
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
    />
  );
});

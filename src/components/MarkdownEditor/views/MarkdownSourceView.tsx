import { forwardRef } from "react";
import styles from "../MarkdownEditor.module.css";

export interface MarkdownSourceViewProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export const MarkdownSourceView = forwardRef<
  HTMLTextAreaElement,
  MarkdownSourceViewProps
>(function MarkdownSourceView({ value, onChange, readOnly = false }, ref) {
  return (
    <textarea
      ref={ref}
      className={styles["source"]}
      aria-label="Código fuente Markdown"
      spellCheck={false}
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
    />
  );
});

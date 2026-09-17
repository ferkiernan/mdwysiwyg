import styles from "../MarkdownEditor.module.css";

export interface MarkdownSourceViewProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function MarkdownSourceView({
  value,
  onChange,
  readOnly = false,
}: MarkdownSourceViewProps) {
  return (
    <textarea
      className={styles["source"]}
      aria-label="Código fuente Markdown"
      spellCheck={false}
      value={value}
      readOnly={readOnly}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

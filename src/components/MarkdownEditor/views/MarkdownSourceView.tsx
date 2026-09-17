import styles from "../MarkdownEditor.module.css";

export interface MarkdownSourceViewProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownSourceView({ value, onChange }: MarkdownSourceViewProps) {
  return (
    <textarea
      className={styles["source"]}
      aria-label="Código fuente Markdown"
      spellCheck={false}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

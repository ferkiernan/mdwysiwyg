import { useEffect, useId, useRef, useState } from "react";
import styles from "../../MarkdownEditor.module.css";

export const CODE_LANGUAGES = [
  { value: "json", label: "JSON" },
  { value: "sql", label: "SQL" },
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "java", label: "Java" },
] as const;

export type CodeLanguageValue =
  | (typeof CODE_LANGUAGES)[number]["value"]
  | "other";

export interface CodeLanguagePickerProps {
  /** Lenguaje actualmente aplicado al bloque de código (o null si no hay uno activo). */
  currentLanguage: string | null;
  onSelect: (language: string) => void;
  onClose: () => void;
}

export function CodeLanguagePicker({
  currentLanguage,
  onSelect,
  onClose,
}: CodeLanguagePickerProps) {
  const isKnown = CODE_LANGUAGES.some(
    (lang) => lang.value === currentLanguage,
  );
  const [choice, setChoice] = useState<CodeLanguageValue>(
    isKnown ? (currentLanguage as CodeLanguageValue) : "other",
  );
  const [otherValue, setOtherValue] = useState(
    !isKnown && currentLanguage ? currentLanguage : "",
  );
  const formRef = useRef<HTMLFormElement>(null);
  const otherFieldId = useId();

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>("select")?.focus();
  }, []);

  const submit = () => {
    const language = choice === "other" ? otherValue.trim() : choice;
    if (language) onSelect(language);
  };

  return (
    <form
      ref={formRef}
      className={styles["dialog"]}
      role="dialog"
      aria-label="Lenguaje del bloque de código"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className={styles["dialogField"]}>
        <label htmlFor="mdw-code-language">Lenguaje</label>
        <select
          id="mdw-code-language"
          value={choice}
          onChange={(event) =>
            setChoice(event.target.value as CodeLanguageValue)
          }
        >
          {CODE_LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
          <option value="other">Otro…</option>
        </select>
      </div>
      {choice === "other" && (
        <div className={styles["dialogField"]}>
          <label htmlFor={otherFieldId}>Especificar lenguaje</label>
          <input
            id={otherFieldId}
            type="text"
            value={otherValue}
            onChange={(event) => setOtherValue(event.target.value)}
          />
        </div>
      )}
      <div className={styles["dialogActions"]}>
        <button
          type="button"
          className={`${styles["button"]} ${styles["textButton"]}`}
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={`${styles["button"]} ${styles["textButton"]}`}
        >
          Aplicar
        </button>
      </div>
    </form>
  );
}

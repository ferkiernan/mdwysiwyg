import { useEffect, useId, useRef, useState } from "react";
import { ensureProtocol } from "../../markdown/links";
import styles from "../../MarkdownEditor.module.css";

export interface LinkPopoverProps {
  url: string;
  onlyView: boolean;
  onNavigate: () => void;
  onCopy: () => void;
  onSave: (newUrl: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function LinkPopover({
  url,
  onlyView,
  onNavigate,
  onCopy,
  onSave,
  onRemove,
  onClose,
}: LinkPopoverProps) {
  const [mode, setMode] = useState<"menu" | "edit">("menu");
  const [inputValue, setInputValue] = useState(url);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (mode === "edit") {
      rootRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    }
  }, [mode]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        rootRef.current !== null &&
        !rootRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onClose]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
  };

  const save = () => {
    if (!inputValue) return;
    onSave(ensureProtocol(inputValue));
  };

  if (mode === "edit") {
    return (
      <div
        ref={rootRef}
        className={styles["dialog"]}
        role="dialog"
        aria-label="Editar enlace"
        onKeyDown={handleKeyDown}
      >
        <div className={styles["dialogField"]}>
          <label htmlFor={inputId}>URL del enlace</label>
          <input
            id={inputId}
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
          />
        </div>
        <button
          type="button"
          className={styles["dangerLink"]}
          onClick={onRemove}
        >
          Eliminar link
        </button>
        <div className={styles["dialogActions"]}>
          <button
            type="button"
            className={`${styles["button"]} ${styles["textButton"]}`}
            onClick={save}
          >
            Guardar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      role="menu"
      aria-label="Acciones del enlace"
      className={styles["menu"]}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        role="menuitem"
        className={styles["menuItem"]}
        onClick={onNavigate}
      >
        Ir a la url
      </button>
      <button
        type="button"
        role="menuitem"
        className={styles["menuItem"]}
        onClick={onCopy}
      >
        Copiar url
      </button>
      {!onlyView && (
        <>
          <hr className={styles["menuSeparator"]} />
          <button
            type="button"
            role="menuitem"
            className={styles["menuItem"]}
            onClick={() => setMode("edit")}
          >
            Editar url
          </button>
        </>
      )}
    </div>
  );
}

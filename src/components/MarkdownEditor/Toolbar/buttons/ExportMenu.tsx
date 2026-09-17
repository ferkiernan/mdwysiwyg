import { useRef, useState } from "react";
import { markdownToHtml } from "../../markdown/pipeline";
import { IconDownload } from "./icons";
import styles from "../../MarkdownEditor.module.css";

export interface ExportMenuProps {
  source: string;
  sanitize: boolean;
}

export function ExportMenu({ source, sanitize }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const copy = (content: string) => {
    void navigator.clipboard.writeText(content);
    close();
  };

  return (
    <div
      className={styles["dialogAnchor"]}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          close();
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles["button"]}
        aria-label="Export"
        title="Export"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <IconDownload />
      </button>
      {open && (
        <div role="menu" aria-label="Exportar contenido" className={styles["menu"]}>
          <button
            type="button"
            role="menuitem"
            className={styles["menuItem"]}
            onClick={() => copy(source)}
          >
            Copiar como Markdown
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles["menuItem"]}
            onClick={() => copy(markdownToHtml(source, { sanitize }))}
          >
            Copiar como HTML
          </button>
        </div>
      )}
    </div>
  );
}

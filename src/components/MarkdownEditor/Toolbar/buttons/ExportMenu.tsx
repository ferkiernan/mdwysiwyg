import { useRef, useState } from "react";
import { markdownToHtml } from "../../markdown/pipeline";
import { IconDownload } from "./icons";
import { FloatingPanel } from "./FloatingPanel";
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
    <>
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
        <FloatingPanel anchor={buttonRef.current} align="end" autoFocus>
          <div
            role="menu"
            aria-label="Exportar contenido"
            className={styles["menu"]}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.stopPropagation();
                close();
              }
            }}
          >
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
        </FloatingPanel>
      )}
    </>
  );
}

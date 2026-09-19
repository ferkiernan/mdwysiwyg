import { Fragment, useEffect, useRef } from "react";
import styles from "../../MarkdownEditor.module.css";

export interface TableMenuAction {
  label: string;
  onSelect: () => void;
  /** Inserta un separador visual antes de esta acción. */
  separatorBefore?: boolean;
}

export interface TableContextMenuProps {
  ariaLabel: string;
  actions: TableMenuAction[];
  onClose: () => void;
}

/**
 * Menú flotante genérico de acciones sobre una tabla (columna o fila). Sigue
 * el mismo patrón de `LinkPopover` en modo "menu": cierre con Escape o clic
 * fuera, sin aplicar ninguna acción (Principio IV, VI).
 */
export function TableContextMenu({
  ariaLabel,
  actions,
  onClose,
}: TableContextMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={rootRef}
      role="menu"
      aria-label={ariaLabel}
      className={styles["menu"]}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      {actions.map((action) => (
        <Fragment key={action.label}>
          {action.separatorBefore === true && (
            <hr className={styles["menuSeparator"]} />
          )}
          <button
            type="button"
            role="menuitem"
            className={styles["menuItem"]}
            onClick={action.onSelect}
          >
            {action.label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

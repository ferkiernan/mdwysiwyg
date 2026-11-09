import { useLayoutEffect, useState } from "react";
import styles from "../MarkdownEditor.module.css";

export interface TableCellTriggerProps {
  /** Celda (`th`/`td`) sobre la que se superpone el disparador. */
  cell: HTMLElement;
  /** Contenedor con scroll y `position: relative` donde se posiciona. */
  container: HTMLElement;
  /** `true` mientras el menú de esta celda está abierto. */
  expanded: boolean;
  /** Se invoca con un clic: el padre abre el menú de la celda. */
  onActivate: () => void;
  /** Cambia cuando el contenido se edita, para volver a medir la celda. */
  remeasureKey: string;
}

interface Placement {
  top: number;
  left: number;
}

/**
 * Disparador del menú de columna/fila: un botón con forma de triángulo
 * rectángulo superpuesto a la esquina superior derecha de la celda. Vive fuera
 * del documento de ProseMirror, por lo que nunca se serializa a Markdown ni
 * interfiere con la selección de texto.
 */
export function TableCellTrigger({
  cell,
  container,
  expanded,
  onActivate,
  remeasureKey,
}: TableCellTriggerProps) {
  const [placement, setPlacement] = useState<Placement | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      // 1px hacia dentro para quedar dentro del borde de la celda.
      setPlacement({
        top: cellRect.top - containerRect.top + container.scrollTop + 1,
        left: cellRect.right - containerRect.left + container.scrollLeft - 1,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [cell, container, remeasureKey]);

  if (placement === null) return null;

  const isHeader = cell.tagName === "TH";

  return (
    <button
      type="button"
      tabIndex={-1}
      data-table-menu-trigger=""
      className={styles["tableMenuTrigger"]}
      style={{ top: placement.top, left: placement.left }}
      aria-label={isHeader ? "Abrir acciones de columna" : "Abrir acciones de fila"}
      aria-haspopup="menu"
      aria-expanded={expanded}
      // Evita que el clic robe el foco o altere la selección de la celda.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onActivate}
    />
  );
}

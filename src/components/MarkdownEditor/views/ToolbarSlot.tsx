import { useLayoutEffect, useRef, type ReactNode } from "react";
import styles from "../MarkdownEditor.module.css";

export interface ToolbarSlotProps {
  children: ReactNode;
  /**
   * Se invoca cuando el slot se desmonta mientras un control de su interior
   * tenía el foco, para que el padre lo devuelva a un destino válido.
   */
  onFocusLost: () => void;
}

/**
 * Envoltorio sin caja (`display: contents`) de la barra de herramientas. Al
 * ocultar la barra se desmonta; el cleanup de un layout effect corre antes de
 * retirar los nodos del DOM, así que `document.activeElement` aún es válido y
 * se puede detectar que el foco estaba dentro.
 */
export function ToolbarSlot({ children, onFocusLost }: ToolbarSlotProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onFocusLostRef = useRef(onFocusLost);
  onFocusLostRef.current = onFocusLost;

  useLayoutEffect(() => {
    const root = rootRef.current;
    return () => {
      if (root !== null && root.contains(document.activeElement)) {
        onFocusLostRef.current();
      }
    };
  }, []);

  return (
    <div ref={rootRef} className={styles["toolbarSlot"]}>
      {children}
    </div>
  );
}

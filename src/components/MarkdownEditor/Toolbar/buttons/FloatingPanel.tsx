import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "../../MarkdownEditor.module.css";

export interface FloatingPanelProps {
  /** Elemento ancla (normalmente el botón que abrió el panel). */
  anchor: HTMLElement | null;
  /** Alineación horizontal del panel respecto al ancla. */
  align?: "start" | "end";
  /** Enfoca el primer elemento interactivo del contenido al montarse. */
  autoFocus?: boolean;
  children: ReactNode;
}

/**
 * Renderiza su contenido en un portal a `document.body`, posicionado con
 * `position: fixed` a partir del rect del ancla. Evita que el panel quede
 * recortado por el `overflow` de la toolbar (necesario para el scroll
 * horizontal de la barra) o del contenedor raíz del componente.
 */
export function FloatingPanel({
  anchor,
  align = "start",
  autoFocus = false,
  children,
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<{
    top: number;
    left?: number;
    right?: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    if (align === "end") {
      setStyle({
        top: rect.bottom,
        right: Math.max(0, window.innerWidth - rect.right),
      });
    } else {
      setStyle({ top: rect.bottom, left: rect.left });
    }
  }, [anchor, align]);

  useLayoutEffect(() => {
    if (style === null || !autoFocus) return;
    panelRef.current
      ?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      ?.focus();
    // Solo al aparecer: no queremos robar el foco en cada reposicionamiento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style !== null]);

  if (style === null) return null;

  return createPortal(
    <div
      ref={panelRef}
      className={styles["root"]}
      style={{
        position: "fixed",
        top: style.top,
        left: style.left,
        right: style.right,
        zIndex: 1000,
        // El wrapper solo restablece las custom properties/tipografía del
        // componente para el contenido portado; no debe verse como una caja.
        border: "none",
        overflow: "visible",
        background: "transparent",
        width: "auto",
        height: "auto",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

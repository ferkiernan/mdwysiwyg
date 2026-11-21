import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "../../MarkdownEditor.module.css";
import { copyThemeTokens } from "../../theme/themeTokens";

export interface FloatingPanelProps {
  /** Elemento ancla (normalmente el botón que abrió el panel). */
  anchor: HTMLElement | null;
  /** Alineación horizontal del panel respecto al ancla. */
  align?: "start" | "end";
  /** Enfoca el primer elemento interactivo del contenido al montarse. */
  autoFocus?: boolean;
  /**
   * Se invoca al presionar el puntero fuera del panel y de su ancla (spec 028):
   * el panel se descarta como con Cancelar. El clic no se consume, así que
   * sigue haciendo lo suyo (ubicar el cursor, pulsar otro botón). El ancla se
   * excluye para que su propio clic alterne el panel.
   */
  onDismiss?: () => void;
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
  onDismiss,
  children,
}: FloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const dismissible = onDismiss !== undefined;

  useEffect(() => {
    if (!dismissible) return;
    const doc = anchor?.ownerDocument ?? document;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target) || anchor?.contains(target)) return;
      onDismissRef.current?.();
    };
    doc.addEventListener("pointerdown", handlePointerDown, true);
    return () => doc.removeEventListener("pointerdown", handlePointerDown, true);
  }, [dismissible, anchor]);
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

  // El panel vive en `document.body`: no hereda los valores de tema que el host
  // declaró en la clase del componente o en un contenedor. Se copian al abrir.
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const rootClass = styles["root"];
    if (style === null || panel === null || anchor === null || rootClass === undefined) {
      return;
    }
    const source = anchor.closest(`.${CSS.escape(rootClass)}`);
    if (source !== null) copyThemeTokens(source, panel);
  }, [style === null, anchor]);

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
      data-mdw-floating=""
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

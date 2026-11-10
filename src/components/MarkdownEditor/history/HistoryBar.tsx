import styles from "../MarkdownEditor.module.css";

export interface HistoryBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onConfirm: () => void;
  onBack: () => void;
}

const BAR_CLASS = [styles["toolbar"], styles["historyBar"]]
  .filter(Boolean)
  .join(" ");
const BUTTON_CLASS = [styles["button"], styles["textButton"]]
  .filter(Boolean)
  .join(" ");

/**
 * Barra del modo historial: Undo / Redo recorren las versiones; Confirm
 * conserva la versión mostrada y Cancel (back to last version) vuelve al
 * contenido previo.
 *
 * Undo y Redo usan `aria-disabled` (no `disabled`) para no perder el foco del
 * teclado al llegar a la primera o la última versión.
 */
export function HistoryBar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onConfirm,
  onBack,
}: HistoryBarProps) {
  return (
    <div role="toolbar" aria-label="Barra de historial" className={BAR_CLASS}>
      <button
        type="button"
        className={BUTTON_CLASS}
        aria-disabled={!canUndo}
        onClick={() => {
          if (canUndo) onUndo();
        }}
      >
        <span aria-hidden="true">&larr;&nbsp;</span>Undo
      </button>
      <button
        type="button"
        className={BUTTON_CLASS}
        aria-disabled={!canRedo}
        onClick={() => {
          if (canRedo) onRedo();
        }}
      >
        Redo<span aria-hidden="true">&nbsp;&rarr;</span>
      </button>
      <span className={styles["separator"]} aria-hidden="true" />
      <button type="button" className={BUTTON_CLASS} onClick={onConfirm}>
        Confirm
      </button>
      <button type="button" className={BUTTON_CLASS} onClick={onBack}>
        Cancel (back to last version)
      </button>
    </div>
  );
}

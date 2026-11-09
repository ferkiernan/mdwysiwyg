import styles from "../MarkdownEditor.module.css";

export interface CompareBarProps {
  /** Aceptar y rechazar solo tienen sentido si el contenido nuevo difiere del original. */
  canDecide: boolean;
  /** El panel nuevo difiere del contenido nuevo proporcionado: se ofrece "Restaurar". */
  modified: boolean;
  onReject: () => void;
  onAccept: () => void;
  onRestore: () => void;
}

const BAR_CLASS = [styles["toolbar"], styles["compareBar"]]
  .filter(Boolean)
  .join(" ");
const BUTTON_CLASS = [styles["button"], styles["textButton"]]
  .filter(Boolean)
  .join(" ");

/** Segunda barra del modo de comparación: rechazar, aceptar y restaurar el cambio. */
export function CompareBar({
  canDecide,
  modified,
  onReject,
  onAccept,
  onRestore,
}: CompareBarProps) {
  return (
    <div role="toolbar" aria-label="Barra de comparación" className={BAR_CLASS}>
      <button
        type="button"
        className={BUTTON_CLASS}
        disabled={!canDecide}
        onClick={onReject}
      >
        Rechazar cambio
      </button>
      <button
        type="button"
        className={BUTTON_CLASS}
        disabled={!canDecide}
        onClick={onAccept}
      >
        Aceptar cambio
      </button>
      {modified && (
        <>
          <span className={styles["separator"]} aria-hidden="true" />
          <button type="button" className={BUTTON_CLASS} onClick={onRestore}>
            Restaurar
          </button>
        </>
      )}
    </div>
  );
}

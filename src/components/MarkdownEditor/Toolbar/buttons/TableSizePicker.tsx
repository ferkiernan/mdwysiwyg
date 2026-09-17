import { useEffect, useRef, useState } from "react";
import styles from "../../MarkdownEditor.module.css";

/** Convención: columnas × filas. "3 × 4" significa 3 columnas y 4 filas. */
export interface TableSize {
  cols: number;
  rows: number;
}

export interface TableSizePickerProps {
  /** Columnas máximas de la cuadrícula. Default: 10. */
  maxCols?: number;
  /** Filas máximas de la cuadrícula. Default: 10. */
  maxRows?: number;
  /** Invocado al confirmar (clic o Enter) con la dimensión elegida. */
  onSelect: (size: TableSize) => void;
  /** Invocado al cancelar (Escape). */
  onClose: () => void;
}

export function TableSizePicker({
  maxCols = 10,
  maxRows = 10,
  onSelect,
  onClose,
}: TableSizePickerProps) {
  // null = ninguna celda seleccionada inicialmente
  const [size, setSize] = useState<TableSize | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gridRef.current?.focus();
  }, []);

  const clamp = (value: number, max: number) =>
    Math.min(Math.max(value, 1), max);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (size !== null) onSelect(size);
      return;
    }
    const deltas: Record<string, [number, number]> = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
    };
    const delta = deltas[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const current = size ?? { cols: 0, rows: 0 };
    setSize({
      cols: clamp(current.cols + delta[0], maxCols),
      rows: clamp(current.rows + delta[1], maxRows),
    });
  };

  const label =
    size === null ? "Selecciona el tamaño" : `${size.cols} × ${size.rows}`;

  return (
    <div
      className={`${styles["dialog"]} ${styles["tablePicker"]}`}
      role="dialog"
      aria-label="Insertar tabla"
    >
      <div className={styles["tablePickerLabel"]} aria-live="polite">
        {label}
      </div>
      <div
        ref={gridRef}
        className={styles["tablePickerGrid"]}
        style={{ gridTemplateColumns: `repeat(${maxCols}, 16px)` }}
        tabIndex={0}
        role="group"
        aria-label="Tamaño de la tabla (columnas × filas)"
        onKeyDown={handleKeyDown}
      >
        {Array.from({ length: maxRows }, (_, rowIndex) =>
          Array.from({ length: maxCols }, (_, colIndex) => {
            const cell: TableSize = {
              cols: colIndex + 1,
              rows: rowIndex + 1,
            };
            const selected =
              size !== null &&
              cell.cols <= size.cols &&
              cell.rows <= size.rows;
            return (
              <div
                key={`${cell.cols}x${cell.rows}`}
                className={styles["tablePickerCell"]}
                data-cell={`${cell.cols}x${cell.rows}`}
                data-selected={selected ? "true" : "false"}
                aria-hidden="true"
                onMouseEnter={() => setSize(cell)}
                onClick={() => onSelect(cell)}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}

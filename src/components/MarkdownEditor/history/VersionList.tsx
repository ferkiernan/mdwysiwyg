import { useEffect, useRef } from "react";
import type { Version } from "./versionHistory";
import styles from "../MarkdownEditor.module.css";

export interface VersionListProps {
  versions: readonly Version[];
  /** Índice de la versión mostrada. */
  viewed: number;
  /** Se activa una entrada: pasa a ser la versión mostrada. */
  onSelect: (index: number) => void;
}

/** Hora local de una versión con horas, minutos y segundos. */
export function formatVersionTime(savedAt: number): string {
  return new Date(savedAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Panel derecho del modo historial: las versiones con su hora, la más
 * reciente arriba. Cada entrada es un botón que lleva a esa versión. La
 * mostrada se marca (`aria-current`, negrita y viñeta, no solo color) y se
 * mantiene a la vista al deshacer, rehacer o elegir.
 */
export function VersionList({ versions, viewed, onSelect }: VersionListProps) {
  const currentRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // jsdom no implementa scrollIntoView.
    currentRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [viewed]);

  const items = versions.map((version, index) => ({ version, index }));
  items.reverse();

  return (
    <nav aria-label="Historial de versiones" className={styles["versionList"]}>
      <ol className={styles["versionItems"]}>
        {items.map(({ version, index }) => {
          const current = index === viewed;
          return (
            <li key={index} className={styles["versionRow"]}>
              <button
                type="button"
                ref={current ? currentRef : undefined}
                aria-current={current ? "true" : undefined}
                className={
                  current
                    ? [styles["versionItem"], styles["versionCurrent"]]
                        .filter(Boolean)
                        .join(" ")
                    : styles["versionItem"]
                }
                onClick={() => onSelect(index)}
              >
                <span aria-hidden="true" className={styles["versionMarker"]}>
                  {current ? "●" : ""}
                </span>
                <time dateTime={new Date(version.savedAt).toISOString()}>
                  {formatVersionTime(version.savedAt)}
                </time>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

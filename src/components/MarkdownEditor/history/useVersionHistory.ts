import { useEffect, useReducer, type Dispatch } from "react";
import {
  INACTIVITY_MS,
  INITIAL_HISTORY,
  historyReducer,
  type HistoryAction,
  type HistoryState,
} from "./versionHistory";

export interface UseVersionHistoryOptions {
  /** Si es `false` no hay temporizadores ni se guardan versiones. */
  recording: boolean;
  /** Contenido Markdown actual del documento. */
  source: string;
}

export interface VersionHistory {
  state: HistoryState;
  dispatch: Dispatch<HistoryAction>;
}

/**
 * Guarda una versión del documento tras `INACTIVITY_MS` sin cambios (un cambio
 * reinicia la espera) y expone el estado del modo historial.
 */
export function useVersionHistory({
  recording,
  source,
}: UseVersionHistoryOptions): VersionHistory {
  const [state, dispatch] = useReducer(historyReducer, INITIAL_HISTORY);
  const latest = state.versions.at(-1)?.markdown;
  const empty = state.versions.length === 0;
  // Con el modo historial abierto el contenido mostrado no es una edición.
  const active = recording && state.viewed === null;

  useEffect(() => {
    if (!active) return;
    if (empty) {
      // Primera versión: el contenido al empezar a grabar.
      dispatch({ type: "record", markdown: source, now: Date.now() });
      return;
    }
    if (latest === source) return;
    const timer = setTimeout(() => {
      dispatch({ type: "record", markdown: source, now: Date.now() });
    }, INACTIVITY_MS);
    return () => clearTimeout(timer);
  }, [active, source, latest, empty]);

  return { state, dispatch };
}

/** Tiempo sin cambios tras el cual se guarda una versión. */
export const INACTIVITY_MS = 3000;

/** Máximo de versiones en memoria; al superarlo se descartan las más antiguas. */
export const MAX_VERSIONS = 200;

/** Instantánea del documento completo. */
export interface Version {
  markdown: string;
  /** Instante en que se guardó (epoch en ms). */
  savedAt: number;
}

export interface HistoryState {
  /** De la más antigua a la más reciente. */
  versions: readonly Version[];
  /** Índice mostrado en modo historial; `null` si el modo historial está cerrado. */
  viewed: number | null;
  /** Contenido que tenía el documento al abrir el modo historial. */
  entry: string | null;
}

export type HistoryAction =
  | { type: "record"; markdown: string; now: number }
  | { type: "open"; markdown: string; now: number }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "select"; index: number }
  | { type: "close" }
  | { type: "confirm"; now: number }
  | { type: "reset" };

export const INITIAL_HISTORY: HistoryState = {
  versions: [],
  viewed: null,
  entry: null,
};

/** Añade una versión salvo que sea igual a la última; aplica el tope. */
function append(
  versions: readonly Version[],
  markdown: string,
  now: number,
): readonly Version[] {
  if (versions.at(-1)?.markdown === markdown) return versions;
  const next = [...versions, { markdown, savedAt: now }];
  return next.length > MAX_VERSIONS
    ? next.slice(next.length - MAX_VERSIONS)
    : next;
}

export function historyReducer(
  state: HistoryState,
  action: HistoryAction,
): HistoryState {
  switch (action.type) {
    case "record": {
      // Con el modo historial abierto el contenido mostrado no es una edición.
      if (state.viewed !== null) return state;
      const versions = append(state.versions, action.markdown, action.now);
      return versions === state.versions ? state : { ...state, versions };
    }
    case "open": {
      const versions = append(state.versions, action.markdown, action.now);
      return {
        versions,
        viewed: versions.length - 1,
        entry: action.markdown,
      };
    }
    case "undo": {
      if (state.viewed === null || state.viewed === 0) return state;
      return { ...state, viewed: state.viewed - 1 };
    }
    case "redo": {
      if (state.viewed === null || state.viewed >= state.versions.length - 1) {
        return state;
      }
      return { ...state, viewed: state.viewed + 1 };
    }
    case "select": {
      if (
        state.viewed === null ||
        action.index === state.viewed ||
        action.index < 0 ||
        action.index >= state.versions.length
      ) {
        return state;
      }
      return { ...state, viewed: action.index };
    }
    case "close":
      return state.viewed === null
        ? state
        : { versions: state.versions, viewed: null, entry: null };
    case "confirm": {
      if (state.viewed === null) return state;
      const viewed = state.versions[state.viewed];
      const versions =
        viewed === undefined
          ? state.versions
          : append(state.versions, viewed.markdown, action.now);
      return { versions, viewed: null, entry: null };
    }
    case "reset":
      return INITIAL_HISTORY;
  }
}

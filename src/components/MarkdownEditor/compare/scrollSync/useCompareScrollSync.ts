import { useEffect, useRef, type RefObject } from "react";
import type { Editor } from "@tiptap/core";
import { collectUnits, pairUnits } from "../docDiff";
import type { ViewMode } from "../../types";
import {
  lineAnchors,
  measureLineTops,
  measureUnitTop,
  unitAnchors,
} from "./anchors";
import {
  mapScroll,
  normalizeAlignment,
  type Alignment,
  type Anchor,
  type Axis,
} from "./scrollMap";

export interface CompareScrollSyncOptions {
  /** Hay una comparación en curso (solo entonces se observa qué panel se desplazó). */
  active: boolean;
  /** El anfitrión no desactivó la sincronización (`compareSyncScroll`). */
  enabled: boolean;
  viewMode: ViewMode;
  /** Cambia al girar la disposición de los paneles (solo fuerza un reajuste). */
  orientation: string;
  originalRoot: RefObject<HTMLElement | null>;
  currentRoot: RefObject<HTMLElement | null>;
  originalEditor: Editor | null;
  currentEditor: Editor | null;
  originalMarkdown: string;
  /** Markdown del panel nuevo (cambia con cada edición). */
  source: string;
}

interface Guard {
  el: HTMLElement;
  value: number;
}

interface SyncState {
  leader: Axis;
  guard: Guard | null;
  alignment: Alignment | null;
  dirty: boolean;
  /** Reconstruye la correspondencia y recoloca el panel seguidor. */
  realign: (() => void) | null;
}

const other = (axis: Axis): Axis => (axis === "original" ? "current" : "original");

/** Elemento que se desplaza: el área de texto en la vista Markdown, el panel en la renderizada. */
function resolveScroller(
  root: HTMLElement | null,
  viewMode: ViewMode,
): HTMLElement | null {
  if (root === null) return null;
  return viewMode === "markdown" ? root.querySelector("textarea") : root;
}

/**
 * Mantiene los dos paneles del modo comparación sobre el mismo contenido: el
 * último que se desplazó guía y el otro lo sigue (ver
 * specs/012-compare-scroll-sync/research.md). Solo lee y escribe `scrollTop`.
 * Sin `active` no registra nada; con `active` pero sin `enabled` solo anota qué
 * panel se desplazó en último lugar (para alinear al activarla), sin escribir,
 * medir ni observar nada.
 */
export function useCompareScrollSync(options: CompareScrollSyncOptions): void {
  const { active, enabled, viewMode, orientation, originalMarkdown, source } =
    options;
  const latest = useRef(options);
  latest.current = options;
  const state = useRef<SyncState>({
    leader: "current",
    guard: null,
    alignment: null,
    dirty: true,
    realign: null,
  });

  const { currentEditor } = options;

  useEffect(() => {
    const st = state.current;
    if (!active) {
      st.leader = "current";
      st.guard = null;
      st.alignment = null;
      st.dirty = true;
      st.realign = null;
      return;
    }
    st.alignment = null;
    st.dirty = true;
    st.guard = null;
    const scrollers: Record<Axis, HTMLElement | null> = {
      original: resolveScroller(latest.current.originalRoot.current, viewMode),
      current: resolveScroller(latest.current.currentRoot.current, viewMode),
    };
    const originalScroller = scrollers.original;
    const currentScroller = scrollers.current;
    if (originalScroller === null || currentScroller === null) return;
    const panes: Record<Axis, HTMLElement> = {
      original: originalScroller,
      current: currentScroller,
    };

    const build = (): Alignment => {
      const { originalEditor, currentEditor: editor } = latest.current;
      let anchors: Anchor[] = [];
      if (viewMode === "markdown") {
        if (
          originalScroller instanceof HTMLTextAreaElement &&
          currentScroller instanceof HTMLTextAreaElement
        ) {
          anchors = lineAnchors(
            originalScroller.value,
            currentScroller.value,
            measureLineTops(originalScroller, originalScroller.value),
            measureLineTops(currentScroller, currentScroller.value),
          );
        }
      } else if (
        originalEditor !== null &&
        editor !== null &&
        !originalEditor.isDestroyed &&
        !editor.isDestroyed
      ) {
        const originalUnits = collectUnits(originalEditor.state.doc).units;
        const currentUnits = collectUnits(editor.state.doc).units;
        anchors = unitAnchors({
          pairs: pairUnits(originalUnits, currentUnits),
          originalUnits,
          currentUnits,
          measureOriginal: (unit) =>
            measureUnitTop(originalEditor, originalScroller, unit),
          measureCurrent: (unit) =>
            measureUnitTop(editor, currentScroller, unit),
        });
      }
      return normalizeAlignment(
        anchors,
        originalScroller.scrollHeight - originalScroller.clientHeight,
        currentScroller.scrollHeight - currentScroller.clientHeight,
      );
    };

    const alignment = (): Alignment => {
      if (st.dirty || st.alignment === null) {
        st.alignment = build();
        st.dirty = false;
      }
      return st.alignment;
    };

    /** Coloca el panel `target` según el desplazamiento del otro. */
    const follow = (target: Axis) => {
      const reference = panes[other(target)];
      const follower = panes[target];
      const wanted = mapScroll(alignment(), other(target), reference.scrollTop);
      const before = follower.scrollTop;
      follower.scrollTop = wanted;
      // Solo se arma si el valor cambió: si no, el navegador no emite `scroll`.
      if (follower.scrollTop !== before) {
        st.guard = { el: follower, value: follower.scrollTop };
      }
    };

    const onScroll = (axis: Axis) => () => {
      if (!enabled) {
        st.leader = axis;
        return;
      }
      const guard = st.guard;
      if (guard !== null && guard.el === panes[axis]) {
        st.guard = null;
        // Eco de nuestra propia escritura: ni guía ni contraescroll.
        if (Math.abs(panes[axis].scrollTop - guard.value) < 1) return;
      }
      st.leader = axis;
      follow(other(axis));
    };
    const onOriginalScroll = onScroll("original");
    const onCurrentScroll = onScroll("current");

    st.realign = enabled
      ? () => {
          st.dirty = true;
          follow(other(st.leader));
        }
      : null;

    // Una edición en el panel nuevo lo convierte en guía: nunca se mueve el
    // panel en el que se escribe.
    const onEdit = () => {
      st.leader = "current";
    };

    originalScroller.addEventListener("scroll", onOriginalScroll);
    currentScroller.addEventListener("scroll", onCurrentScroll);
    if (enabled) {
      currentScroller.addEventListener("input", onEdit);
      currentEditor?.on("update", onEdit);
    }

    let observer: ResizeObserver | null = null;
    if (enabled && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => st.realign?.());
      for (const scroller of [originalScroller, currentScroller]) {
        observer.observe(scroller);
        if (scroller.firstElementChild !== null && scroller.firstElementChild !== scroller) {
          observer.observe(scroller.firstElementChild);
        }
      }
    }

    return () => {
      originalScroller.removeEventListener("scroll", onOriginalScroll);
      currentScroller.removeEventListener("scroll", onCurrentScroll);
      currentScroller.removeEventListener("input", onEdit);
      currentEditor?.off("update", onEdit);
      observer?.disconnect();
      st.realign = null;
    };
  }, [active, enabled, viewMode, currentEditor]);

  // Contenido, vista, orientación o editor distintos (o sincronización recién
  // activada): se recoloca el seguidor sobre el contenido coincidente.
  useEffect(() => {
    if (!active || !enabled) return;
    state.current.realign?.();
  }, [
    active,
    enabled,
    viewMode,
    orientation,
    originalMarkdown,
    source,
    options.originalEditor,
    currentEditor,
  ]);
}

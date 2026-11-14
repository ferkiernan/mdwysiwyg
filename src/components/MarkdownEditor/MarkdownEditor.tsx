import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useEditor, useEditorState, type Editor } from "@tiptap/react";
import { getMarkRange, type Range } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import {
  createEditorExtensions,
  editorToMarkdown,
  markdownToEditorContent,
} from "./markdown/tiptapMarkdownBridge";
import {
  markdownOffsetToProseMirrorPos,
  proseMirrorPosToMarkdownOffset,
} from "./markdown/cursorMapping";
import { moveCurrentColumn, moveCurrentRow } from "./markdown/tableCommands";
import {
  ensureTrailingParagraph,
  handleBlankAreaMouseDown,
} from "./markdown/trailingLine";
import {
  CompareHighlight,
  getCompareSummary,
  setCompareOriginal,
} from "./compare/compareHighlight";
import { diffText, type DiffSummary } from "./compare/textDiff";
import { CompareBar } from "./compare/CompareBar";
import { OriginalPane } from "./compare/OriginalPane";
import { useCompareScrollSync } from "./compare/scrollSync/useCompareScrollSync";
import { HighlightedSource } from "./compare/HighlightedSource";
import { historyReducer } from "./history/versionHistory";
import { useVersionHistory } from "./history/useVersionHistory";
import { HistoryBar } from "./history/HistoryBar";
import { VersionList, formatVersionTime } from "./history/VersionList";
import { RenderedView } from "./views/RenderedView";
import { TableCellTrigger } from "./views/TableCellTrigger";
import { ToolbarSlot } from "./views/ToolbarSlot";
import { Toolbar } from "./Toolbar/Toolbar";
import { LinkPopover } from "./Toolbar/buttons/LinkPopover";
import { TableContextMenu } from "./Toolbar/buttons/TableContextMenu";
import { FloatingPanel } from "./Toolbar/buttons/FloatingPanel";
import type {
  MarkdownEditorHandle,
  MarkdownEditorProps,
  ViewMode,
} from "./types";
import styles from "./MarkdownEditor.module.css";

interface LinkPopoverState {
  url: string;
  range: Range;
  anchor: HTMLElement;
  /** Enlace que no se puede editar (panel original, HTML embebido): menú de solo lectura. */
  readOnly?: boolean;
}

interface TableMenuState {
  kind: "column" | "row";
  anchor: HTMLElement;
}

/** Comparación en curso: contenido original y contenido nuevo proporcionado. */
interface CompareSession {
  original: string;
  provided: string;
}

interface CompareState {
  /** Último `compareContent` visto mientras la comparación estaba solicitada. */
  key: string | null;
  /** Sesión activa; `null` en modo normal o tras aceptar/rechazar. */
  session: CompareSession | null;
}

const NO_DIFFERENCES: DiffSummary = { changed: false, count: 0 };

/** Zoom del contenido: límites, paso y desplazamiento de rueda por paso (spec 021). */
const CONTENT_ZOOM_MIN = 0.5;
const CONTENT_ZOOM_MAX = 3;
const CONTENT_ZOOM_STEP = 0.1;
const WHEEL_STEP_DELTA = 100;

function toCssSize(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}

/**
 * Transición del estado de comparación cuando cambia lo solicitado por el host
 * (`requested`: el `compareContent` si el modo es válido, si no `null`).
 */
function nextCompareState(
  previous: CompareState,
  requested: string | null,
  currentContent: string,
): CompareState {
  if (requested === null) return { key: null, session: null };
  if (previous.session !== null) {
    // Mismo original; el panel nuevo pasa a ser el contenido proporcionado.
    return {
      key: requested,
      session: { original: previous.session.original, provided: requested },
    };
  }
  return {
    key: requested,
    session: { original: currentContent, provided: requested },
  };
}

function describeDifferences({ changed, count }: DiffSummary): string {
  if (!changed) return "Sin diferencias";
  if (count === 0) return "Solo hay contenido eliminado";
  return count === 1 ? "1 diferencia resaltada" : `${count} diferencias resaltadas`;
}

export const MarkdownEditor = forwardRef<
  MarkdownEditorHandle,
  MarkdownEditorProps
>(function MarkdownEditor(
  {
    initialContent = "",
    onChange,
    width = 700,
    height = 500,
    sanitizeEmbeddedHtml = true,
    className,
    onlyView = false,
    showToolbar = true,
    autoHideBar = false,
    allowContentZoom = false,
    resizable = true,
    autoHeight = false,
    onlyViewNotice,
    resolveImageSrc,
    mode = "default",
    compareOrientation,
    compareContent,
    onCompareDecision,
    historyUndo = false,
    compareSyncScroll = true,
  },
  ref,
) {
  // Contenido que tenía el documento al abrir el modo historial (o `null`):
  // si empieza una comparación con el modo historial abierto, el original es ese
  // contenido y no la versión que se esté mostrando.
  const historyEntryRef = useRef<string | null>(null);
  // El modo de comparación se activa con contenido nuevo (la orientación por
  // defecto es "side-to-side").
  const requestedContent =
    mode === "compare" && compareContent !== undefined
      ? compareContent
      : null;
  const [source, setSource] = useState(requestedContent ?? initialContent);
  const [compareState, setCompareState] = useState<CompareState>(() =>
    requestedContent === null
      ? { key: null, session: null }
      : {
          key: requestedContent,
          session: { original: initialContent, provided: requestedContent },
        },
  );
  let currentCompare = compareState;
  if (compareState.key !== requestedContent) {
    // Derivado de las props durante el render (patrón admitido por React).
    currentCompare = nextCompareState(
      compareState,
      requestedContent,
      historyEntryRef.current ?? source,
    );
    setCompareState(currentCompare);
  }
  const session = currentCompare.session;
  const historyAvailable = historyUndo && !onlyView && session === null;
  const { state: history, dispatch: dispatchHistory } = useVersionHistory({
    recording: historyAvailable,
    source,
  });
  historyEntryRef.current = history.entry;
  const historyOpen =
    history.viewed !== null && historyAvailable && showToolbar;
  const historyRef = useRef(history);
  historyRef.current = history;
  const descriptionId = useId();
  const [providedCanonical, setProvidedCanonical] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("wysiwyg");
  const effectiveViewMode: ViewMode = onlyView ? "wysiwyg" : viewMode;
  const [linkPopover, setLinkPopover] = useState<LinkPopoverState | null>(
    null,
  );
  const [tableMenu, setTableMenu] = useState<TableMenuState | null>(null);
  // Celda de tabla bajo el puntero: sobre ella se muestra el disparador del
  // menú de columna/fila.
  const [hoveredCell, setHoveredCell] = useState<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // Panel original (modo comparación) y su editor, para sincronizar el desplazamiento.
  const originalPaneRef = useRef<HTMLDivElement>(null);
  const [originalEditor, setOriginalEditor] = useState<Editor | null>(null);
  // Valor con el que se montó el componente: referencia para reset()/
  // isModified() (FR-015, FR-016).
  const originalContentRef = useRef(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Refs keep the editor's onUpdate closure valid across renders without
  // recreating the editor when onChange or source change.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const sourceRef = useRef(source);
  sourceRef.current = source;
  const onCompareDecisionRef = useRef(onCompareDecision);
  onCompareDecisionRef.current = onCompareDecision;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const providedCanonicalRef = useRef(providedCanonical);
  providedCanonicalRef.current = providedCanonical;
  const resolveImageSrcRef = useRef(resolveImageSrc);
  resolveImageSrcRef.current = resolveImageSrc;
  const hasImageResolver = resolveImageSrc !== undefined;
  const getImageResolver = useCallback(() => resolveImageSrcRef.current, []);

  const extensions = useMemo(
    () => [
      ...createEditorExtensions({
        sanitizeEmbeddedHtml,
        resolveImageSrc: hasImageResolver ? getImageResolver : undefined,
      }),
      CompareHighlight.configure({
        markClass: styles["compareMark"] ?? "",
        blockClass: styles["compareBlock"] ?? "",
      }),
    ],
    [sanitizeEmbeddedHtml, hasImageResolver, getImageResolver],
  );

  const editor = useEditor(
    {
      extensions,
      // Si el modo historial está a punto de cerrarse a la fuerza, un editor
      // recreado (p. ej. por `onlyView`) nace ya con el contenido previo.
      content: markdownToEditorContent(
        history.viewed !== null && !historyOpen && history.entry !== null
          ? history.entry
          : sourceRef.current,
      ),
      editable: !onlyView,
      editorProps: {
        attributes: {
          role: "textbox",
          "aria-multiline": "true",
          "aria-label": "Editor de texto enriquecido",
        },
        handleDOMEvents: {
          // Clic en el área libre tras el último bloque → línea posterior.
          mousedown: handleBlankAreaMouseDown,
          click(view, event) {
            const target = event.target;
            if (!(target instanceof Element)) return false;

            // El menú de tabla ya no se abre con clics sobre la celda: lo abre
            // el disparador de su esquina (ver TableCellTrigger).
            const anchorEl = target.closest("a");
            if (anchorEl === null || !view.dom.contains(anchorEl)) {
              return false;
            }
            const linkType = view.state.schema.marks["link"];
            if (!linkType) return false;
            const pos = view.posAtDOM(anchorEl, 0);
            const $pos = view.state.doc.resolve(
              Math.min(pos + 1, view.state.doc.content.size),
            );
            const range = getMarkRange($pos, linkType);
            if (!range) return false;
            const mark = $pos
              .marks()
              .find((candidate) => candidate.type === linkType);
            const href = mark?.attrs["href"] as string | undefined;
            if (href === undefined) return false;
            event.preventDefault();
            setLinkPopover({ url: href, range, anchor: anchorEl });
            return true;
          },
        },
      },
      onCreate({ editor: createdEditor }) {
        ensureTrailingParagraph(createdEditor);
      },
      onUpdate({ editor: currentEditor }) {
        const markdown = editorToMarkdown(currentEditor);
        sourceRef.current = markdown;
        setSource(markdown);
        onChangeRef.current?.(markdown);
      },
    },
    [sanitizeEmbeddedHtml, onlyView],
  );

  const toggleView = () => {
    if (viewMode === "wysiwyg") {
      // Posición del cursor en el documento → offset equivalente en el texto
      // fuente, aplicado tras el cambio de vista (FR-006).
      const offset =
        editor === null
          ? 0
          : proseMirrorPosToMarkdownOffset(
              editor,
              editor.state.selection.from,
              sourceRef.current,
            );
      setViewMode("markdown");
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (textarea === null) return;
        textarea.focus();
        textarea.setSelectionRange(offset, offset);
      });
    } else {
      const offset = textareaRef.current?.selectionStart ?? 0;
      // emitUpdate=false: cambiar de vista nunca dispara onChange (FR-004)
      editor?.commands.setContent(markdownToEditorContent(sourceRef.current), {
        emitUpdate: false,
      });
      setViewMode("wysiwyg");
      if (editor !== null) {
        const pos = markdownOffsetToProseMirrorPos(
          sourceRef.current,
          offset,
          editor.state.doc,
        );
        editor.commands.setTextSelection(pos);
        editor.commands.focus();
      }
    }
  };

  const handleSourceChange = (value: string) => {
    sourceRef.current = value;
    setSource(value);
    onChangeRef.current?.(value);
  };

  /** Carga Markdown en el editor y en el texto fuente sin notificar a `onChange`. */
  const loadContent = (markdown: string) => {
    sourceRef.current = markdown;
    setSource(markdown);
    editor?.commands.setContent(markdownToEditorContent(markdown), {
      emitUpdate: false,
    });
  };

  /** Devuelve el foco al panel editable (el nuevo en comparación). */
  const focusNewPane = () => {
    if (effectiveViewMode === "markdown") textareaRef.current?.focus();
    else editor?.view.focus();
  };

  // --- Historial de versiones -------------------------------------------

  /** Abre el modo historial mostrando la versión más reciente. */
  const openHistory = () => {
    dispatchHistory({
      type: "open",
      markdown: sourceRef.current,
      now: Date.now(),
    });
  };

  /** Muestra la versión anterior (-1) o siguiente (1) sin notificar a `onChange`. */
  const moveVersion = (direction: -1 | 1) => {
    const current = historyRef.current;
    if (current.viewed === null) return;
    const target = current.versions[current.viewed + direction];
    if (target === undefined) return;
    dispatchHistory({ type: direction < 0 ? "undo" : "redo" });
    loadContent(target.markdown);
  };

  /** Muestra la versión elegida en la lista sin notificar a `onChange`. */
  const selectVersion = (index: number) => {
    const current = historyRef.current;
    if (current.viewed === null || index === current.viewed) return;
    const target = current.versions[index];
    if (target === undefined) return;
    dispatchHistory({ type: "select", index });
    loadContent(target.markdown);
  };

  /**
   * Cierra el modo historial devolviendo el documento al contenido que tenía al
   * abrirlo. Sin notificar a `onChange`. Es el cierre de "Cancel (back to last
   * version)" y de todos los cierres forzados.
   */
  const closeHistory = () => {
    const current = historyRef.current;
    if (current.viewed === null) return;
    if (current.entry !== null && current.entry !== sourceRef.current) {
      loadContent(current.entry);
    }
    // Editable antes de que se desmonte la barra: el foco vuelve al documento.
    editor?.setEditable(!onlyView, false);
    historyRef.current = historyReducer(current, { type: "close" });
    dispatchHistory({ type: "close" });
  };
  const closeHistoryRef = useRef(closeHistory);
  closeHistoryRef.current = closeHistory;

  /** Conserva la versión mostrada y cierra el modo historial. */
  const confirmHistory = () => {
    const current = historyRef.current;
    if (current.viewed === null) return;
    const viewed = current.versions[current.viewed];
    const changed = viewed !== undefined && viewed.markdown !== current.entry;
    editor?.setEditable(!onlyView, false);
    const action = { type: "confirm", now: Date.now() } as const;
    historyRef.current = historyReducer(current, action);
    dispatchHistory(action);
    if (changed) onChangeRef.current?.(viewed.markdown);
  };

  // Cierre forzado: si el modo historial ya no puede estar abierto (propiedad
  // desactivada, solo lectura, comparación o barra oculta) se restaura el
  // contenido previo sin aplicar nada. Va antes de los efectos de comparación
  // para que el original de una comparación sea el contenido previo.
  const historyVersionCount = history.versions.length;
  useLayoutEffect(() => {
    if (history.viewed !== null && !historyOpen) closeHistoryRef.current();
    if (!historyUndo && historyVersionCount > 0) {
      dispatchHistory({ type: "reset" });
    }
    // `dispatchHistory` es estable; `closeHistoryRef` siempre apunta al último.
  }, [history.viewed, historyOpen, historyUndo, historyVersionCount, editor, dispatchHistory]);

  // El documento es de solo lectura mientras se recorre el historial.
  useLayoutEffect(() => {
    if (editor === null) return;
    const editable = !onlyView && !historyOpen;
    if (editor.isEditable !== editable) editor.setEditable(editable, false);
  }, [editor, onlyView, historyOpen]);

  const handleHistoryKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    const key = event.key.toLowerCase();
    let direction: -1 | 1 | null = null;
    if (key === "z") direction = event.shiftKey ? 1 : -1;
    else if (key === "y" && !event.shiftKey) direction = 1;
    if (direction === null) return;
    // En captura, antes que el deshacer de texto del editor o del textarea.
    event.preventDefault();
    event.stopPropagation();
    moveVersion(direction);
  };

  // Al empezar una sesión o cambiar su contenido nuevo, el panel editable pasa
  // a mostrarlo; `providedCanonical` es su serialización (para saber si el
  // usuario lo ha dejado igual a mano).
  const appliedSessionRef = useRef<CompareSession | null>(session);
  const canonicalForRef = useRef<CompareSession | null>(null);
  // `true` cuando la sesión terminó por una decisión del usuario (Aceptar /
  // Rechazar). Si termina por otra causa (el host sale del modo o retira
  // `compareContent`), el original NO se pisa: se vuelve a él.
  const decidedRef = useRef(false);
  useLayoutEffect(() => {
    if (session === null) {
      const ended = appliedSessionRef.current;
      if (ended !== null && !decidedRef.current && editor !== null) {
        const changed = sourceRef.current !== ended.original;
        loadContent(ended.original);
        if (changed) onChangeRef.current?.(ended.original);
      }
      decidedRef.current = false;
      appliedSessionRef.current = null;
      canonicalForRef.current = null;
      setProvidedCanonical(null);
      return;
    }
    if (editor === null) return;
    if (appliedSessionRef.current !== session) {
      loadContent(session.provided);
      appliedSessionRef.current = session;
    }
    if (canonicalForRef.current !== session) {
      canonicalForRef.current = session;
      setProvidedCanonical(editorToMarkdown(editor));
    }
    // `loadContent` solo usa `editor` y refs/estado estables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, editor]);

  // El editor resalta lo distinto frente al original de la sesión; si se
  // recrea (p. ej. cambia `onlyView`) hay que volver a indicárselo.
  const originalMarkdown = session?.original ?? null;
  useLayoutEffect(() => {
    if (editor === null) return;
    setCompareOriginal(editor, originalMarkdown);
  }, [editor, originalMarkdown]);

  // Los dos paneles de la comparación se mantienen sobre el mismo contenido.
  useCompareScrollSync({
    active: session !== null,
    enabled: compareSyncScroll,
    viewMode: effectiveViewMode,
    orientation: compareOrientation ?? "side-to-side",
    originalRoot: originalPaneRef,
    currentRoot: contentRef,
    originalEditor,
    currentEditor: editor,
    originalMarkdown: originalMarkdown ?? "",
    source,
  });

  const renderedSummary =
    useEditorState({
      editor,
      selector: ({ editor: current }) =>
        current === null ? NO_DIFFERENCES : getCompareSummary(current),
      equalityFn: (a, b) =>
        b !== null && a.changed === b.changed && a.count === b.count,
    }) ?? NO_DIFFERENCES;
  const textDiff = useMemo(
    () =>
      session !== null && effectiveViewMode === "markdown"
        ? diffText(session.original, source)
        : null,
    [session, effectiveViewMode, source],
  );
  const summary =
    session === null ? NO_DIFFERENCES : (textDiff?.summary ?? renderedSummary);
  const modified =
    session !== null &&
    source !== session.provided &&
    source !== providedCanonical;

  /** Termina la comparación sin cambiar lo solicitado: no se reinicia sola. */
  const endCompare = () => {
    decidedRef.current = true;
    sessionRef.current = null;
    setCompareState((previous) => ({ ...previous, session: null }));
  };

  const acceptChange = () => {
    if (sessionRef.current === null) return;
    const markdown = sourceRef.current;
    endCompare();
    onChangeRef.current?.(markdown);
    onCompareDecisionRef.current?.({ decision: "accepted", markdown });
  };

  const rejectChange = () => {
    const current = sessionRef.current;
    if (current === null) return;
    loadContent(current.original);
    endCompare();
    onChangeRef.current?.(current.original);
    onCompareDecisionRef.current?.({
      decision: "rejected",
      markdown: current.original,
    });
  };

  const restoreProvided = (moveFocus: boolean) => {
    const current = sessionRef.current;
    if (current === null) return;
    loadContent(current.provided);
    onChangeRef.current?.(current.provided);
    if (moveFocus) focusNewPane();
  };
  const restoreRef = useRef(restoreProvided);
  restoreRef.current = restoreProvided;

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        closeHistoryRef.current();
        if (sessionRef.current !== null) {
          // En comparación, reset() equivale a "Restaurar".
          restoreRef.current(false);
          return;
        }
        const original = originalContentRef.current;
        sourceRef.current = original;
        setSource(original);
        editor?.commands.setContent(markdownToEditorContent(original), {
          emitUpdate: false,
        });
      },
      isModified() {
        // Con el modo historial abierto cuenta el contenido previo, no la versión mostrada.
        const content = historyRef.current.entry ?? sourceRef.current;
        const current = sessionRef.current;
        if (current !== null) {
          return (
            content !== current.provided &&
            content !== providedCanonicalRef.current
          );
        }
        return content !== originalContentRef.current;
      },
      insertMarkdown(markdown: string) {
        closeHistoryRef.current();
        const textarea = textareaRef.current;
        if (effectiveViewMode === "markdown" && textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const current = sourceRef.current;
          handleSourceChange(current.slice(0, start) + markdown + current.slice(end));
          return;
        }
        editor
          ?.chain()
          .focus()
          .insertContent(markdownToEditorContent(markdown))
          .run();
      },
      setMarkdown(markdown: string) {
        closeHistoryRef.current();
        sourceRef.current = markdown;
        setSource(markdown);
        editor?.commands.setContent(markdownToEditorContent(markdown), {
          emitUpdate: false,
        });
        onChangeRef.current?.(markdown);
      },
    }),
    [editor, effectiveViewMode],
  );

  const closeLinkPopover = () => setLinkPopover(null);

  const closeTableMenu = () => setTableMenu(null);

  /** Ejecuta una acción del menú de tabla y cierra el menú. */
  const runTableAction = (action: () => void) => {
    action();
    closeTableMenu();
  };

  const tableTriggerEnabled =
    editor !== null &&
    !onlyView &&
    !historyOpen &&
    effectiveViewMode === "wysiwyg";

  // El hover no sobrevive a un cambio de vista ni a la eliminación de la celda.
  useEffect(() => {
    setHoveredCell(null);
  }, [effectiveViewMode, onlyView]);
  useEffect(() => {
    if (hoveredCell !== null && !hoveredCell.isConnected) setHoveredCell(null);
  }, [hoveredCell, source]);

  /**
   * Abre el menú de columna (encabezado) o fila (celda de datos) de `cell`.
   * Ancla la selección dentro de la celda: los comandos de tabla
   * (addColumnAfter, selectedRect, …) operan sobre la posición del cursor.
   */
  const openTableMenuForCell = (cell: HTMLElement) => {
    if (editor === null) return;
    const { view } = editor;
    const cellPos = view.posAtDOM(cell, 0);
    view.dispatch(
      view.state.tr.setSelection(
        TextSelection.near(view.state.doc.resolve(cellPos + 1)),
      ),
    );
    setTableMenu({
      kind: cell.tagName === "TH" ? "column" : "row",
      anchor: cell,
    });
  };

  const handleContentMouseOver = (event: MouseEvent<HTMLDivElement>) => {
    if (!tableTriggerEnabled || !(event.target instanceof Element)) return;
    const cell = event.target.closest("th, td");
    if (cell instanceof HTMLElement && cell.closest(".ProseMirror") !== null) {
      setHoveredCell(cell);
    }
  };

  const handleContentMouseOut = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target instanceof Element)) return;
    const zone = "th, td, [data-table-menu-trigger]";
    if (event.target.closest(zone) === null) return;
    // Pasar de la celda a su disparador (o entre elementos de la misma zona)
    // no cuenta como salir.
    const next = event.relatedTarget;
    if (next instanceof Element && next.closest(zone) !== null) return;
    setHoveredCell(null);
  };

  const handleContentKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const opensMenu =
      event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey);
    if (!opensMenu || !tableTriggerEnabled || editor === null) return;
    const { node } = editor.view.domAtPos(editor.state.selection.from);
    const element = node instanceof Element ? node : node.parentElement;
    const cell = element?.closest("th, td");
    if (
      cell instanceof HTMLElement &&
      editor.view.dom.contains(cell)
    ) {
      event.preventDefault();
      openTableMenuForCell(cell);
    }
  };

  const triggerCell = tableMenu?.anchor ?? hoveredCell;

  const saveLinkPopover = (newUrl: string) => {
    if (!editor || !linkPopover) return;
    editor
      .chain()
      .focus()
      .setTextSelection(linkPopover.range)
      .extendMarkRange("link")
      .setLink({ href: newUrl })
      .run();
    closeLinkPopover();
  };

  const removeLinkPopover = () => {
    if (!editor || !linkPopover) return;
    editor
      .chain()
      .focus()
      .setTextSelection(linkPopover.range)
      .extendMarkRange("link")
      .unsetLink()
      .run();
    closeLinkPopover();
  };

  // `autoHideBar`: ¿está el foco dentro del componente? Los eventos de foco de
  // React recorren el árbol de componentes, así que los paneles flotantes (en
  // portal) cuentan como "dentro". Una salida se confirma en la siguiente tarea:
  // si llega antes un foco interno (moverse entre partes), se cancela.
  const rootRef = useRef<HTMLDivElement>(null);
  const [focusInside, setFocusInside] = useState(false);
  const focusOutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleFocusIn = () => {
    if (focusOutTimer.current !== null) {
      clearTimeout(focusOutTimer.current);
      focusOutTimer.current = null;
    }
    setFocusInside(true);
  };
  const handleFocusOut = () => {
    if (focusOutTimer.current !== null) clearTimeout(focusOutTimer.current);
    focusOutTimer.current = setTimeout(() => {
      focusOutTimer.current = null;
      setFocusInside(false);
    }, 0);
  };
  useLayoutEffect(() => {
    if (!autoHideBar) return;
    const root = rootRef.current;
    setFocusInside(root !== null && root.contains(document.activeElement));
  }, [autoHideBar]);
  useEffect(
    () => () => {
      if (focusOutTimer.current !== null) clearTimeout(focusOutTimer.current);
    },
    [],
  );

  // --- Zoom del contenido (spec 021) ----------------------------------------
  // El nivel elegido por el usuario se escribe en línea como `--mdw-content-zoom`
  // en el elemento raíz; sin él vale el que declare el host (o 1).
  const [zoomOverride, setZoomOverride] = useState<number | null>(null);
  const [zoomAnnouncement, setZoomAnnouncement] = useState("");
  const zoomOverrideRef = useRef(zoomOverride);
  zoomOverrideRef.current = zoomOverride;
  const announceZoomRef = useRef(false);
  const hostZoom = (): number => {
    const root = rootRef.current;
    if (root === null) return 1;
    const value = parseFloat(getComputedStyle(root).getPropertyValue("--mdw-content-zoom"));
    return Number.isFinite(value) && value > 0 ? value : 1;
  };
  const stepZoom = (direction: 1 | -1) => {
    const current = zoomOverrideRef.current ?? hostZoom();
    const next = Math.min(
      CONTENT_ZOOM_MAX,
      Math.max(CONTENT_ZOOM_MIN, Math.round((current + direction * CONTENT_ZOOM_STEP) * 10) / 10),
    );
    if (next === current) return;
    announceZoomRef.current = true;
    // Al instante: varios pasos seguidos (rueda rápida) parten del último valor.
    zoomOverrideRef.current = next;
    setZoomOverride(next);
  };
  const resetZoom = () => {
    announceZoomRef.current = true;
    zoomOverrideRef.current = null;
    setZoomOverride(null);
  };
  const stepZoomRef = useRef(stepZoom);
  stepZoomRef.current = stepZoom;
  const resetZoomRef = useRef(resetZoom);
  resetZoomRef.current = resetZoom;

  // Tras cada cambio del usuario se anuncia el nivel efectivo.
  useEffect(() => {
    if (!announceZoomRef.current) return;
    announceZoomRef.current = false;
    setZoomAnnouncement(`Zoom ${Math.round((zoomOverride ?? hostZoom()) * 100)} %`);
    // `hostZoom` lee el estilo computado ya aplicado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomOverride]);

  // Desactivar el zoom vuelve al nivel del host.
  useEffect(() => {
    if (!allowContentZoom) {
      setZoomOverride(null);
      setZoomAnnouncement("");
    }
  }, [allowContentZoom]);

  // Ctrl/Cmd + rueda sobre el contenido y Ctrl/Cmd + +/-/0 con el foco dentro.
  useEffect(() => {
    const root = rootRef.current;
    const contentClass = styles["content"];
    if (!allowContentZoom || root === null || contentClass === undefined) return;
    const inContent = (target: EventTarget | null) =>
      target instanceof Element && target.closest(`.${CSS.escape(contentClass)}`) !== null;
    let accumulated = 0;
    const onWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey) || !inContent(event.target)) return;
      event.preventDefault();
      if (event.deltaMode !== 0) {
        if (event.deltaY !== 0) stepZoomRef.current(event.deltaY < 0 ? 1 : -1);
        return;
      }
      accumulated += event.deltaY;
      if (Math.abs(accumulated) >= WHEEL_STEP_DELTA) {
        stepZoomRef.current(accumulated < 0 ? 1 : -1);
        accumulated = 0;
      }
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey || !inContent(event.target)) return;
      let handled = true;
      if (event.key === "+" || event.key === "=") stepZoomRef.current(1);
      else if (event.key === "-" || event.key === "_") stepZoomRef.current(-1);
      else if (event.key === "0") resetZoomRef.current();
      else handled = false;
      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("keydown", onKeyDown, true);
    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("keydown", onKeyDown, true);
    };
  }, [allowContentZoom]);

  // --- Enlaces: un clic nunca abre la dirección (spec 022) -----------------
  // El editor principal ya muestra su menú; aquí se cubren el panel original de
  // la comparación, los enlaces dentro de HTML embebido, los clics con Ctrl/Cmd/
  // Shift y el botón central, y Enter sobre un enlace con foco.
  useEffect(() => {
    const root = rootRef.current;
    const contentClass = styles["content"];
    if (root === null || contentClass === undefined) return;
    const linkIn = (target: EventTarget | null): HTMLAnchorElement | null => {
      if (!(target instanceof Element)) return null;
      const anchor = target.closest("a");
      if (anchor === null || anchor.closest(`.${CSS.escape(contentClass)}`) === null) return null;
      return anchor;
    };
    /** ¿Lo maneja el editor principal con su menú completo? */
    const handledByEditor = (anchor: HTMLAnchorElement) => {
      const dom = editor?.view.dom;
      return dom !== undefined && dom.contains(anchor) && anchor.closest("[data-html-block]") === null;
    };
    const openReadOnlyMenu = (anchor: HTMLAnchorElement) => {
      setLinkPopover({
        url: anchor.getAttribute("href") ?? "",
        range: { from: 0, to: 0 },
        anchor,
        readOnly: true,
      });
    };
    const onClick = (event: globalThis.MouseEvent) => {
      const anchor = linkIn(event.target);
      if (anchor === null) return;
      event.preventDefault();
      if (!handledByEditor(anchor)) {
        event.stopPropagation();
        openReadOnlyMenu(anchor);
      }
    };
    const onAuxClick = (event: globalThis.MouseEvent) => {
      if (linkIn(event.target) !== null) event.preventDefault();
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Enter") return;
      const anchor = linkIn(event.target);
      if (anchor === null || event.target !== anchor) return;
      event.preventDefault();
      event.stopPropagation();
      openReadOnlyMenu(anchor);
    };
    root.addEventListener("click", onClick, true);
    root.addEventListener("auxclick", onAuxClick, true);
    root.addEventListener("keydown", onKeyDown, true);
    return () => {
      root.removeEventListener("click", onClick, true);
      root.removeEventListener("auxclick", onAuxClick, true);
      root.removeEventListener("keydown", onKeyDown, true);
    };
  }, [editor]);

  const rootClassName = [
    styles["root"],
    resizable && !autoHeight ? styles["resizable"] : undefined,
    autoHeight ? styles["autoHeight"] : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const orientation = compareOrientation ?? "side-to-side";
  const toolbarVisible = showToolbar && (!autoHideBar || focusInside);
  const panesClassName = [
    styles["panes"],
    session !== null ? styles["panesCompare"] : undefined,
    session !== null
      ? orientation === "up-and-down"
        ? styles["upAndDown"]
        : styles["sideToSide"]
      : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClassName}
      style={
        {
          width: toCssSize(width),
          ...(autoHeight ? { minHeight: toCssSize(height) } : { height: toCssSize(height) }),
          ...(zoomOverride !== null ? { "--mdw-content-zoom": String(zoomOverride) } : {}),
        } as CSSProperties
      }
      {...(historyOpen ? { onKeyDownCapture: handleHistoryKeyDown } : {})}
      {...(autoHideBar ? { onFocus: handleFocusIn, onBlur: handleFocusOut } : {})}
      ref={rootRef}
    >
      {toolbarVisible && (
        <ToolbarSlot onFocusLost={() => editor?.view.focus()}>
          <Toolbar
            editor={editor}
            viewMode={effectiveViewMode}
            onToggleView={toggleView}
            source={source}
            sanitizeEmbeddedHtml={sanitizeEmbeddedHtml}
            onlyView={onlyView}
            {...(onlyViewNotice !== undefined ? { onlyViewNotice } : {})}
            historyEnabled={historyAvailable}
            historyOpen={historyOpen}
            onToggleHistory={historyOpen ? closeHistory : openHistory}
            locked={historyOpen}
          />
        </ToolbarSlot>
      )}
      {historyOpen && (
        <ToolbarSlot onFocusLost={focusNewPane}>
          <HistoryBar
            canUndo={history.viewed !== null && history.viewed > 0}
            canRedo={
              history.viewed !== null &&
              history.viewed < history.versions.length - 1
            }
            onUndo={() => moveVersion(-1)}
            onRedo={() => moveVersion(1)}
            onConfirm={confirmHistory}
            onBack={closeHistory}
          />
        </ToolbarSlot>
      )}
      {showToolbar && session !== null && (
        <ToolbarSlot onFocusLost={focusNewPane}>
          <CompareBar
            canDecide={summary.changed}
            modified={modified}
            onReject={rejectChange}
            onAccept={acceptChange}
            onRestore={() => restoreProvided(true)}
          />
        </ToolbarSlot>
      )}
      <div
        className={
          historyOpen
            ? [styles["historyLayout"], styles["historyLayoutOpen"]]
                .filter(Boolean)
                .join(" ")
            : styles["historyLayout"]
        }
      >
      <div
        className={panesClassName}
        {...(session !== null
          ? { "data-compare-orientation": orientation }
          : {})}
      >
        {session !== null && (
          <OriginalPane
            ref={originalPaneRef}
            onEditor={setOriginalEditor}
            autoSize={autoHeight}
            refitKey={zoomOverride}
            markdown={session.original}
            viewMode={effectiveViewMode}
            sanitizeEmbeddedHtml={sanitizeEmbeddedHtml}
            {...(hasImageResolver ? { resolveImageSrc: getImageResolver } : {})}
          />
        )}
        <div
          ref={contentRef}
          className={styles["content"]}
          {...(session !== null
            ? {
                role: "group",
                "aria-label": onlyView
                  ? "Contenido nuevo (solo lectura)"
                  : "Contenido nuevo (editable)",
                "aria-describedby": descriptionId,
              }
            : historyOpen
              ? {
                  role: "group",
                  "aria-label": "Historial: contenido en solo lectura",
                }
              : {})}
          onMouseOver={handleContentMouseOver}
          onMouseOut={handleContentMouseOut}
          onKeyDown={handleContentKeyDown}
        >
          {effectiveViewMode === "wysiwyg" ? (
            <RenderedView editor={editor} />
          ) : (
            <HighlightedSource
              ref={textareaRef}
              value={source}
              onChange={handleSourceChange}
              readOnly={onlyView || historyOpen}
              ranges={session !== null ? (textDiff?.ranges ?? []) : null}
              autoSize={autoHeight}
              refitKey={zoomOverride}
            />
          )}
          {tableTriggerEnabled &&
            triggerCell !== null &&
            triggerCell.isConnected &&
            contentRef.current !== null && (
              <TableCellTrigger
                cell={triggerCell}
                container={contentRef.current}
                expanded={tableMenu !== null}
                remeasureKey={source}
                onActivate={() => openTableMenuForCell(triggerCell)}
              />
            )}
        </div>
        {session !== null && (
          <span id={descriptionId} className={styles["visuallyHidden"]}>
            {describeDifferences(summary)}
          </span>
        )}
      </div>
      {allowContentZoom && (
        <span role="status" className={styles["visuallyHidden"]}>
          {zoomAnnouncement}
        </span>
      )}
      {historyOpen && history.viewed !== null && (
        <span role="status" className={styles["visuallyHidden"]}>
          {`Versión ${history.viewed + 1} de ${history.versions.length}`}
          {history.versions[history.viewed] !== undefined
            ? ` — ${formatVersionTime(history.versions[history.viewed]?.savedAt ?? 0)}`
            : ""}
        </span>
      )}
      {historyOpen && history.viewed !== null && (
        <VersionList
          versions={history.versions}
          viewed={history.viewed}
          onSelect={selectVersion}
        />
      )}
      </div>
      {linkPopover !== null && (
        <FloatingPanel anchor={linkPopover.anchor} autoFocus>
          <LinkPopover
            url={linkPopover.url}
            onlyView={onlyView || historyOpen || linkPopover.readOnly === true}
            onNavigate={() => {
              window.open(linkPopover.url, "_blank", "noopener,noreferrer");
              closeLinkPopover();
            }}
            onCopy={() => {
              void navigator.clipboard.writeText(linkPopover.url);
              closeLinkPopover();
            }}
            onSave={saveLinkPopover}
            onRemove={removeLinkPopover}
            onClose={closeLinkPopover}
          />
        </FloatingPanel>
      )}
      {tableMenu !== null && editor !== null && (
        <FloatingPanel anchor={tableMenu.anchor} autoFocus>
          {tableMenu.kind === "column" ? (
            <TableContextMenu
              ariaLabel="Acciones de columna"
              onClose={closeTableMenu}
              actions={[
                {
                  label: "Añadir columna a la derecha",
                  onSelect: () =>
                    runTableAction(() =>
                      editor.chain().focus().addColumnAfter().run(),
                    ),
                },
                {
                  label: "Añadir columna a la izquierda",
                  onSelect: () =>
                    runTableAction(() =>
                      editor.chain().focus().addColumnBefore().run(),
                    ),
                },
                {
                  label: "Mover columna a la derecha",
                  separatorBefore: true,
                  onSelect: () =>
                    runTableAction(() => moveCurrentColumn(editor, "after")),
                },
                {
                  label: "Mover columna a la izquierda",
                  onSelect: () =>
                    runTableAction(() => moveCurrentColumn(editor, "before")),
                },
                {
                  label: "Eliminar esta columna",
                  separatorBefore: true,
                  onSelect: () =>
                    runTableAction(() =>
                      editor.chain().focus().deleteColumn().run(),
                    ),
                },
              ]}
            />
          ) : (
            <TableContextMenu
              ariaLabel="Acciones de fila"
              onClose={closeTableMenu}
              actions={[
                {
                  label: "Añadir fila arriba",
                  onSelect: () =>
                    runTableAction(() =>
                      editor.chain().focus().addRowBefore().run(),
                    ),
                },
                {
                  label: "Añadir fila abajo",
                  onSelect: () =>
                    runTableAction(() =>
                      editor.chain().focus().addRowAfter().run(),
                    ),
                },
                {
                  label: "Subir esta fila",
                  separatorBefore: true,
                  onSelect: () =>
                    runTableAction(() => moveCurrentRow(editor, "before")),
                },
                {
                  label: "Bajar esta fila",
                  onSelect: () =>
                    runTableAction(() => moveCurrentRow(editor, "after")),
                },
                {
                  label: "Eliminar esta fila",
                  separatorBefore: true,
                  onSelect: () =>
                    runTableAction(() =>
                      editor.chain().focus().deleteRow().run(),
                    ),
                },
              ]}
            />
          )}
        </FloatingPanel>
      )}
    </div>
  );
});

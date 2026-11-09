import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useEditor } from "@tiptap/react";
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
import { RenderedView } from "./views/RenderedView";
import { MarkdownSourceView } from "./views/MarkdownSourceView";
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
}

interface TableMenuState {
  kind: "column" | "row";
  anchor: HTMLElement;
}

function toCssSize(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
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
    resizable = true,
    onlyViewNotice,
    resolveImageSrc,
  },
  ref,
) {
  const [source, setSource] = useState(initialContent);
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
  const resolveImageSrcRef = useRef(resolveImageSrc);
  resolveImageSrcRef.current = resolveImageSrc;
  const hasImageResolver = resolveImageSrc !== undefined;

  const extensions = useMemo(
    () =>
      createEditorExtensions({
        sanitizeEmbeddedHtml,
        resolveImageSrc: hasImageResolver ? () => resolveImageSrcRef.current : undefined,
      }),
    [sanitizeEmbeddedHtml, hasImageResolver],
  );

  const editor = useEditor(
    {
      extensions,
      content: markdownToEditorContent(sourceRef.current),
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

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        const original = originalContentRef.current;
        sourceRef.current = original;
        setSource(original);
        editor?.commands.setContent(markdownToEditorContent(original), {
          emitUpdate: false,
        });
      },
      isModified() {
        return sourceRef.current !== originalContentRef.current;
      },
      insertMarkdown(markdown: string) {
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
    editor !== null && !onlyView && effectiveViewMode === "wysiwyg";

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

  const rootClassName = [
    styles["root"],
    resizable ? styles["resizable"] : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClassName}
      style={{ width: toCssSize(width), height: toCssSize(height) }}
    >
      {showToolbar && (
        <ToolbarSlot onFocusLost={() => editor?.view.focus()}>
          <Toolbar
            editor={editor}
            viewMode={effectiveViewMode}
            onToggleView={toggleView}
            source={source}
            sanitizeEmbeddedHtml={sanitizeEmbeddedHtml}
            onlyView={onlyView}
            {...(onlyViewNotice !== undefined ? { onlyViewNotice } : {})}
          />
        </ToolbarSlot>
      )}
      <div
        ref={contentRef}
        className={styles["content"]}
        onMouseOver={handleContentMouseOver}
        onMouseOut={handleContentMouseOut}
        onKeyDown={handleContentKeyDown}
      >
        {effectiveViewMode === "wysiwyg" ? (
          <RenderedView editor={editor} />
        ) : (
          <MarkdownSourceView
            ref={textareaRef}
            value={source}
            onChange={handleSourceChange}
            readOnly={onlyView}
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
      {linkPopover !== null && (
        <FloatingPanel anchor={linkPopover.anchor} autoFocus>
          <LinkPopover
            url={linkPopover.url}
            onlyView={onlyView}
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

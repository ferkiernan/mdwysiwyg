import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
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
import { RenderedView } from "./views/RenderedView";
import { MarkdownSourceView } from "./views/MarkdownSourceView";
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
    resizable = true,
    onlyViewNotice,
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
  // Celda de tabla que tenía el cursor antes del clic actual: un segundo clic
  // sobre la misma celda abre el menú en vez de solo reposicionar (FR-002).
  const lastFocusedCellPosRef = useRef<number | null>(null);
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

  const extensions = useMemo(
    () => createEditorExtensions({ sanitizeEmbeddedHtml }),
    [sanitizeEmbeddedHtml],
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
          click(view, event) {
            const target = event.target;
            if (!(target instanceof Element)) return false;

            // --- Tabla: segundo clic sobre la celda ya enfocada abre el menú
            const cellEl = target.closest("th, td");
            if (cellEl !== null && view.dom.contains(cellEl)) {
              // Un arrastre para seleccionar texto también dispara "click":
              // con una selección no vacía, el usuario está seleccionando
              // contenido, no pidiendo el menú contextual.
              if (!view.state.selection.empty) {
                lastFocusedCellPosRef.current = null;
                return false;
              }
              const cellPos = view.posAtDOM(cellEl, 0);
              if (lastFocusedCellPosRef.current === cellPos) {
                event.preventDefault();
                // Anclar la selección dentro de la celda: los comandos de
                // tabla (addColumnAfter, selectedRect, …) operan sobre la
                // posición del cursor, y `preventDefault` impide que
                // ProseMirror la fije por su cuenta.
                const tr = view.state.tr.setSelection(
                  TextSelection.near(view.state.doc.resolve(cellPos + 1)),
                );
                view.dispatch(tr);
                setTableMenu({
                  kind: cellEl.tagName === "TH" ? "column" : "row",
                  anchor: cellEl as HTMLElement,
                });
                return true;
              }
              lastFocusedCellPosRef.current = cellPos;
              return false;
            }
            // Clic fuera de cualquier celda: el próximo clic en una celda
            // cuenta como "primer clic" (edge case de la spec).
            lastFocusedCellPosRef.current = null;

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
      editor?.commands.setContent(
        markdownToEditorContent(sourceRef.current),
        false,
      );
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
        editor?.commands.setContent(markdownToEditorContent(original), false);
      },
      isModified() {
        return sourceRef.current !== originalContentRef.current;
      },
    }),
    [editor],
  );

  const closeLinkPopover = () => setLinkPopover(null);

  const closeTableMenu = () => setTableMenu(null);

  /** Ejecuta una acción del menú de tabla y cierra el menú. */
  const runTableAction = (action: () => void) => {
    action();
    closeTableMenu();
  };

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
      <Toolbar
        editor={editor}
        viewMode={effectiveViewMode}
        onToggleView={toggleView}
        source={source}
        sanitizeEmbeddedHtml={sanitizeEmbeddedHtml}
        onlyView={onlyView}
        {...(onlyViewNotice !== undefined ? { onlyViewNotice } : {})}
      />
      <div className={styles["content"]}>
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

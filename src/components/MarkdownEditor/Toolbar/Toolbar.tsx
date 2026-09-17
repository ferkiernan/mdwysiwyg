import { useEffect, useReducer, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { ViewMode } from "../types";
import { ToolbarButton } from "./buttons/ToolbarButton";
import { InsertDialog, type DialogKind } from "./buttons/InsertDialogs";
import { ExportMenu } from "./buttons/ExportMenu";
import styles from "../MarkdownEditor.module.css";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
const HEADING_LEVELS: readonly HeadingLevel[] = [1, 2, 3, 4, 5, 6];

export interface ToolbarProps {
  editor: Editor | null;
  viewMode: ViewMode;
  onToggleView: () => void;
  source: string;
  sanitizeEmbeddedHtml: boolean;
}

export function Toolbar({
  editor,
  viewMode,
  onToggleView,
  source,
  sanitizeEmbeddedHtml,
}: ToolbarProps) {
  const [, forceUpdate] = useReducer((count: number) => count + 1, 0);
  const [openDialog, setOpenDialog] = useState<DialogKind | null>(null);

  useEffect(() => {
    if (!editor) return;
    editor.on("transaction", forceUpdate);
    return () => {
      editor.off("transaction", forceUpdate);
    };
  }, [editor]);

  const canFormat = viewMode === "wysiwyg" && editor !== null;

  const activeHeading = canFormat
    ? (HEADING_LEVELS.find((level) =>
        editor.isActive("heading", { level }),
      ) ?? null)
    : null;

  const listItemType =
    canFormat && editor.isActive("taskItem") ? "taskItem" : "listItem";

  const closeDialog = () => setOpenDialog(null);

  return (
    <div role="toolbar" aria-label="Barra de herramientas" className={styles["toolbar"]}>
      <div className={styles["toolbarGroup"]}>
        <select
          className={styles["headingSelect"]}
          aria-label="Nivel de encabezado"
          disabled={!canFormat}
          value={activeHeading === null ? "p" : `h${activeHeading}`}
          onChange={(event) => {
            if (!editor) return;
            const value = event.target.value;
            if (value === "p") {
              editor.chain().focus().setParagraph().run();
            } else {
              const level = Number(value.slice(1)) as HeadingLevel;
              editor.chain().focus().setHeading({ level }).run();
            }
          }}
        >
          <option value="p">Párrafo</option>
          {HEADING_LEVELS.map((level) => (
            <option key={level} value={`h${level}`}>
              Encabezado {level}
            </option>
          ))}
        </select>
        <ToolbarButton
          label="Negrita"
          disabled={!canFormat}
          pressed={canFormat && editor.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          label="Cursiva"
          disabled={!canFormat}
          pressed={canFormat && editor.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          label="Tachado"
          disabled={!canFormat}
          pressed={canFormat && editor.isActive("strike")}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <s>S</s>
        </ToolbarButton>
      </div>

      <div className={styles["toolbarGroup"]}>
        <ToolbarButton
          label="Lista ordenada"
          disabled={!canFormat}
          pressed={canFormat && editor.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          1.
        </ToolbarButton>
        <ToolbarButton
          label="Lista con viñetas"
          disabled={!canFormat}
          pressed={canFormat && editor.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          •
        </ToolbarButton>
        <ToolbarButton
          label="Lista de tareas"
          disabled={!canFormat}
          pressed={canFormat && editor.isActive("taskList")}
          onClick={() => editor?.chain().focus().toggleTaskList().run()}
        >
          [ ]
        </ToolbarButton>
        <ToolbarButton
          label="Aumentar sangría"
          disabled={!canFormat || !editor.can().sinkListItem(listItemType)}
          onClick={() =>
            editor?.chain().focus().sinkListItem(listItemType).run()
          }
        >
          ⇥
        </ToolbarButton>
        <ToolbarButton
          label="Disminuir sangría"
          disabled={!canFormat || !editor.can().liftListItem(listItemType)}
          onClick={() =>
            editor?.chain().focus().liftListItem(listItemType).run()
          }
        >
          ⇤
        </ToolbarButton>
      </div>

      <div className={`${styles["toolbarGroup"]} ${styles["dialogAnchor"]}`}>
        <ToolbarButton
          label="Bloque de código"
          disabled={!canFormat}
          pressed={canFormat && editor.isActive("codeBlock")}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        >
          {"{ }"}
        </ToolbarButton>
        <ToolbarButton
          label="Línea horizontal"
          disabled={!canFormat}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        >
          —
        </ToolbarButton>
        <ToolbarButton
          label="Insertar imagen"
          disabled={!canFormat}
          onClick={() => setOpenDialog("image")}
        >
          Img
        </ToolbarButton>
        <ToolbarButton
          label="Insertar enlace"
          disabled={!canFormat}
          pressed={canFormat && editor.isActive("link")}
          onClick={() => setOpenDialog("link")}
        >
          Enlace
        </ToolbarButton>
        <ToolbarButton
          label="Insertar tabla"
          disabled={!canFormat}
          onClick={() => setOpenDialog("table")}
        >
          Tabla
        </ToolbarButton>
        <ToolbarButton
          label="Insertar HTML"
          disabled={!canFormat}
          onClick={() => setOpenDialog("html")}
        >
          HTML
        </ToolbarButton>
        {openDialog !== null && editor !== null && (
          <InsertDialog kind={openDialog} editor={editor} onClose={closeDialog} />
        )}
      </div>

      <div className={styles["toolbarGroup"]}>
        <ToolbarButton
          label="Ver código Markdown"
          pressed={viewMode === "markdown"}
          onClick={onToggleView}
        >
          {"</>"}
        </ToolbarButton>
        <ExportMenu source={source} sanitize={sanitizeEmbeddedHtml} />
      </div>
    </div>
  );
}

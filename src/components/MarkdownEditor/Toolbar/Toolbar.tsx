import { useEffect, useReducer, useState } from "react";
import type { Editor } from "@tiptap/core";
import type { ViewMode } from "../types";
import { ToolbarButton } from "./buttons/ToolbarButton";
import { InsertDialog, type DialogKind } from "./buttons/InsertDialogs";
import { TableSizePicker } from "./buttons/TableSizePicker";
import { CodeLanguagePicker } from "./buttons/CodeLanguagePicker";
import { ExportMenu } from "./buttons/ExportMenu";
import {
  IconCode,
  IconCodeBlock,
  IconBullets,
  IconNumbered,
  IconChecklist,
  IconIndent,
  IconOutdent,
  IconQuote,
  IconTable,
  IconLink,
  IconImage,
  IconHr,
} from "./buttons/icons";
import styles from "../MarkdownEditor.module.css";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
const HEADING_LEVELS: readonly HeadingLevel[] = [1, 2, 3, 4, 5, 6];

function Separator() {
  return <span className={styles["separator"]} aria-hidden="true" />;
}

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
  const [openDialog, setOpenDialog] = useState<
    DialogKind | "table" | "codeLanguage" | null
  >(null);

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
    <div
      role="toolbar"
      aria-label="Barra de herramientas"
      className={styles["toolbar"]}
    >
      <ToolbarButton
        label="Ver código Markdown"
        pressed={viewMode === "markdown"}
        onClick={onToggleView}
      >
        <IconCode />
      </ToolbarButton>

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
        className={styles["boldGlyph"]}
        disabled={!canFormat}
        pressed={canFormat && editor.isActive("bold")}
        onClick={() => editor?.chain().focus().toggleBold().run()}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        label="Cursiva"
        className={styles["italicGlyph"]}
        disabled={!canFormat}
        pressed={canFormat && editor.isActive("italic")}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
      >
        i
      </ToolbarButton>
      <ToolbarButton
        label="Tachado"
        className={styles["strikeGlyph"]}
        disabled={!canFormat}
        pressed={canFormat && editor.isActive("strike")}
        onClick={() => editor?.chain().focus().toggleStrike().run()}
      >
        S
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        label="Lista con viñetas"
        disabled={!canFormat}
        pressed={canFormat && editor.isActive("bulletList")}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
      >
        <IconBullets />
      </ToolbarButton>
      <ToolbarButton
        label="Lista ordenada"
        disabled={!canFormat}
        pressed={canFormat && editor.isActive("orderedList")}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
      >
        <IconNumbered />
      </ToolbarButton>
      <ToolbarButton
        label="Lista de tareas"
        disabled={!canFormat}
        pressed={canFormat && editor.isActive("taskList")}
        onClick={() => editor?.chain().focus().toggleTaskList().run()}
      >
        <IconChecklist />
      </ToolbarButton>
      <ToolbarButton
        label="Aumentar sangría"
        disabled={!canFormat || !editor.can().sinkListItem(listItemType)}
        onClick={() => editor?.chain().focus().sinkListItem(listItemType).run()}
      >
        <IconIndent />
      </ToolbarButton>
      <ToolbarButton
        label="Disminuir sangría"
        disabled={!canFormat || !editor.can().liftListItem(listItemType)}
        onClick={() => editor?.chain().focus().liftListItem(listItemType).run()}
      >
        <IconOutdent />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        label="Bloque de código"
        disabled={!canFormat}
        pressed={canFormat && editor.isActive("codeBlock")}
        onClick={() => setOpenDialog("codeLanguage")}
      >
        <IconCodeBlock />
      </ToolbarButton>
      <ToolbarButton
        label="Cita"
        disabled={!canFormat}
        pressed={canFormat && editor.isActive("blockquote")}
        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
      >
        <IconQuote />
      </ToolbarButton>
      <ToolbarButton
        label="Insertar tabla"
        disabled={!canFormat}
        onClick={() => setOpenDialog("table")}
      >
        <IconTable />
      </ToolbarButton>
      <ToolbarButton
        label="Línea horizontal"
        disabled={!canFormat}
        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
      >
        <IconHr />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        label="Insertar enlace"
        disabled={!canFormat}
        pressed={canFormat && editor.isActive("link")}
        onClick={() => setOpenDialog("link")}
      >
        <IconLink />
      </ToolbarButton>
      <ToolbarButton
        label="Insertar imagen"
        disabled={!canFormat}
        onClick={() => setOpenDialog("image")}
      >
        <IconImage />
      </ToolbarButton>
      <ToolbarButton
        label="Insertar HTML"
        disabled={!canFormat}
        onClick={() => setOpenDialog("html")}
      >
        <span className={styles["htmlIcon"]}>HTML</span>
      </ToolbarButton>

      <div className={`${styles["spacer"]} ${styles["dialogAnchor"]}`}>
        <ExportMenu source={source} sanitize={sanitizeEmbeddedHtml} />
      </div>

      {openDialog === "table" && editor !== null && (
        <TableSizePicker
          onSelect={({ cols, rows }) => {
            editor
              .chain()
              .focus()
              .insertTable({ rows, cols, withHeaderRow: true })
              .run();
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}
      {openDialog === "codeLanguage" && editor !== null && (
        <CodeLanguagePicker
          currentLanguage={
            (editor.getAttributes("codeBlock")["language"] as
              | string
              | undefined) ?? null
          }
          onSelect={(language) => {
            if (editor.isActive("codeBlock")) {
              editor
                .chain()
                .focus()
                .updateAttributes("codeBlock", { language })
                .run();
            } else {
              editor.chain().focus().toggleCodeBlock({ language }).run();
            }
            closeDialog();
          }}
          onClose={closeDialog}
        />
      )}
      {openDialog !== null &&
        openDialog !== "table" &&
        openDialog !== "codeLanguage" &&
        editor !== null && (
          <InsertDialog kind={openDialog} editor={editor} onClose={closeDialog} />
        )}
    </div>
  );
}

import { useMemo, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
import {
  createEditorExtensions,
  editorToMarkdown,
  markdownToEditorContent,
} from "./markdown/tiptapMarkdownBridge";
import { RenderedView } from "./views/RenderedView";
import { MarkdownSourceView } from "./views/MarkdownSourceView";
import { Toolbar } from "./Toolbar/Toolbar";
import type { MarkdownEditorProps, ViewMode } from "./types";
import styles from "./MarkdownEditor.module.css";

function toCssSize(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}

export function MarkdownEditor({
  initialContent = "",
  onChange,
  width = 700,
  height = 500,
  sanitizeEmbeddedHtml = true,
  className,
  onlyView = false,
  resizable = true,
}: MarkdownEditorProps) {
  const [source, setSource] = useState(initialContent);
  const [viewMode, setViewMode] = useState<ViewMode>("wysiwyg");
  const effectiveViewMode: ViewMode = onlyView ? "wysiwyg" : viewMode;

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
      setViewMode("markdown");
    } else {
      // emitUpdate=false: cambiar de vista nunca dispara onChange (FR-004)
      editor?.commands.setContent(
        markdownToEditorContent(sourceRef.current),
        false,
      );
      setViewMode("wysiwyg");
    }
  };

  const handleSourceChange = (value: string) => {
    sourceRef.current = value;
    setSource(value);
    onChangeRef.current?.(value);
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
      />
      <div className={styles["content"]}>
        {effectiveViewMode === "wysiwyg" ? (
          <RenderedView editor={editor} />
        ) : (
          <MarkdownSourceView
            value={source}
            onChange={handleSourceChange}
            readOnly={onlyView}
          />
        )}
      </div>
    </div>
  );
}

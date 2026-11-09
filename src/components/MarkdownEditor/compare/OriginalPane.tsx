import { useMemo } from "react";
import { useEditor } from "@tiptap/react";
import {
  createEditorExtensions,
  markdownToEditorContent,
} from "../markdown/tiptapMarkdownBridge";
import { RenderedView } from "../views/RenderedView";
import { MarkdownSourceView } from "../views/MarkdownSourceView";
import type { ViewMode } from "../types";
import styles from "../MarkdownEditor.module.css";

export interface OriginalPaneProps {
  /** Markdown original (solo lectura). */
  markdown: string;
  viewMode: ViewMode;
  sanitizeEmbeddedHtml: boolean;
  resolveImageSrc?: () => ((src: string) => string) | undefined;
}

function noop(): void {
  // El panel original no admite edición.
}

/**
 * Panel del contenido original en modo de comparación: un editor de solo
 * lectura con las mismas extensiones (se ve igual que el panel nuevo) o, en la
 * vista Markdown, un área de texto de solo lectura.
 */
export function OriginalPane({
  markdown,
  viewMode,
  sanitizeEmbeddedHtml,
  resolveImageSrc,
}: OriginalPaneProps) {
  const hasImageResolver = resolveImageSrc !== undefined;
  const extensions = useMemo(
    () =>
      createEditorExtensions({
        sanitizeEmbeddedHtml,
        resolveImageSrc: hasImageResolver ? resolveImageSrc : undefined,
      }),
    // `resolveImageSrc` es un lector estable: solo importa si existe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sanitizeEmbeddedHtml, hasImageResolver],
  );

  const editor = useEditor(
    {
      extensions,
      content: markdownToEditorContent(markdown),
      editable: false,
      editorProps: {
        attributes: {
          role: "textbox",
          "aria-multiline": "true",
          "aria-readonly": "true",
          "aria-label": "Texto original (solo lectura)",
        },
      },
    },
    [extensions, markdown],
  );

  return (
    <div
      className={[styles["content"], styles["paneOriginal"]]
        .filter(Boolean)
        .join(" ")}
      role="group"
      aria-label="Contenido original (solo lectura)"
    >
      {viewMode === "wysiwyg" ? (
        <RenderedView editor={editor} />
      ) : (
        <MarkdownSourceView
          value={markdown}
          onChange={noop}
          readOnly
          ariaLabel="Código fuente Markdown original (solo lectura)"
        />
      )}
    </div>
  );
}

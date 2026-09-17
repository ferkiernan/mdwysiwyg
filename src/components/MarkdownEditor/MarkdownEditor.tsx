import { useMemo, useRef, useState } from "react";
import { useEditor } from "@tiptap/react";
import { getMarkRange, type Range } from "@tiptap/core";
import {
  createEditorExtensions,
  editorToMarkdown,
  markdownToEditorContent,
} from "./markdown/tiptapMarkdownBridge";
import { RenderedView } from "./views/RenderedView";
import { MarkdownSourceView } from "./views/MarkdownSourceView";
import { Toolbar } from "./Toolbar/Toolbar";
import { LinkPopover } from "./Toolbar/buttons/LinkPopover";
import { FloatingPanel } from "./Toolbar/buttons/FloatingPanel";
import type { MarkdownEditorProps, ViewMode } from "./types";
import styles from "./MarkdownEditor.module.css";

interface LinkPopoverState {
  url: string;
  range: Range;
  anchor: HTMLElement;
}

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
  const [linkPopover, setLinkPopover] = useState<LinkPopoverState | null>(
    null,
  );

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

  const closeLinkPopover = () => setLinkPopover(null);

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
    </div>
  );
}

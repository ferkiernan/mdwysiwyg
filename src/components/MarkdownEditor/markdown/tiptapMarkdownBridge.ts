import { Node, type Extensions, type Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  editorHtmlToMarkdown,
  markdownToEditorHtml,
  sanitizeHtmlFragment,
} from "./pipeline";

export interface HtmlBlockOptions {
  sanitize: boolean;
}

/**
 * Atom node that carries an embedded raw-HTML block byte-exact through the
 * editor (FR-020): the source lives in an encoded attribute so WYSIWYG edits
 * elsewhere never rewrite it, and the node view renders it sanitized unless
 * the consumer opted out (FR-022, FR-023).
 */
export const HtmlBlock = Node.create<HtmlBlockOptions>({
  name: "htmlBlock",
  group: "block",
  atom: true,

  addOptions() {
    return { sanitize: true };
  },

  addAttributes() {
    return { content: { default: "" } };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-raw-html]",
        getAttrs: (element) => {
          const raw = (element as HTMLElement).getAttribute("data-raw-html");
          return raw === null ? false : { content: decodeURIComponent(raw) };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const content = node.attrs["content"] as string;
    return ["div", { "data-raw-html": encodeURIComponent(content) }];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.setAttribute("data-html-block", "");
      const raw = node.attrs["content"] as string;
      dom.innerHTML = this.options.sanitize ? sanitizeHtmlFragment(raw) : raw;
      return { dom };
    };
  },
});

export interface EditorExtensionOptions {
  sanitizeEmbeddedHtml: boolean;
}

export function createEditorExtensions(
  options: EditorExtensionOptions,
): Extensions {
  return [
    StarterKit,
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    Link.configure({ openOnClick: false }),
    Image,
    HtmlBlock.configure({ sanitize: options.sanitizeEmbeddedHtml }),
  ];
}

/** Markdown (GFM) → contenido HTML para `editor.commands.setContent`. */
export function markdownToEditorContent(markdown: string): string {
  return markdownToEditorHtml(markdown);
}

/** Documento actual del editor → Markdown (GFM). */
export function editorToMarkdown(editor: Editor): string {
  return editorHtmlToMarkdown(editor.getHTML());
}

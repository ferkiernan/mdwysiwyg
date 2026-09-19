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
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import json from "highlight.js/lib/languages/json";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import java from "highlight.js/lib/languages/java";
import {
  editorHtmlToMarkdown,
  markdownToEditorHtml,
  sanitizeHtmlFragment,
} from "./pipeline";
import { renderMermaid } from "./mermaid";

/**
 * Registro selectivo: solo los 5 lenguajes ya ofrecidos por el selector de
 * lenguaje de bloque de código, en vez de `createLowlight(all)` (~190
 * gramáticas), para mantener el bundle acotado (Principio VIII).
 */
export const lowlight = createLowlight();
lowlight.register({ json, sql, typescript, javascript, java });

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

/**
 * Bloque de código con renderizado de diagramas Mermaid: cuando el lenguaje
 * del bloque es "mermaid", el node view monta un contenedor y sustituye su
 * contenido por el SVG renderizado de forma asíncrona. Con sintaxis inválida
 * cae al texto fuente legible (FR-007, FR-008). Es puramente presentacional:
 * el nodo del documento (y por tanto el Markdown) nunca se modifica (FR-010).
 */
const CodeBlockWithMermaid = CodeBlockLowlight.extend({
  addNodeView() {
    const parentNodeView = this.parent?.();

    return (props) => {
      if (props.node.attrs["language"] !== "mermaid") {
        if (parentNodeView) return parentNodeView(props);
        // Sin node view heredado: `pre > code` editable estándar, para que el
        // resaltado por plugin de lowlight siga funcionando igual que antes.
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        const language = props.node.attrs["language"];
        if (typeof language === "string" && language !== "") {
          code.classList.add(`language-${language}`);
        }
        pre.appendChild(code);
        return { dom: pre, contentDOM: code };
      }

      const dom = document.createElement("div");
      dom.setAttribute("data-mermaid-block", "");

      let lastRenderedSource: string | null = null;

      const paintFallback = (source: string) => {
        dom.replaceChildren();
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.textContent = source;
        pre.appendChild(code);
        dom.appendChild(pre);
      };

      const paint = (source: string) => {
        if (source === lastRenderedSource) return;
        lastRenderedSource = source;
        void renderMermaid(source).then((svg) => {
          // Descartar resultados obsoletos si el contenido cambió mientras
          // el render estaba en vuelo.
          if (lastRenderedSource !== source) return;
          if (svg === null) {
            paintFallback(source);
            return;
          }
          dom.innerHTML = svg;
          const svgEl = dom.querySelector("svg");
          svgEl?.setAttribute("role", "img");
          svgEl?.setAttribute("aria-label", "Diagrama Mermaid");
        });
      };

      paintFallback(props.node.textContent);
      paint(props.node.textContent);

      return {
        dom,
        // Nodo atómico a efectos de renderizado: el contenido se edita desde
        // la vista Markdown; aquí solo se muestra el diagrama.
        ignoreMutation: () => true,
        update(updatedNode) {
          if (updatedNode.type.name !== props.node.type.name) return false;
          if (updatedNode.attrs["language"] !== "mermaid") return false;
          paint(updatedNode.textContent);
          return true;
        },
      };
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
    StarterKit.configure({ codeBlock: false }),
    CodeBlockWithMermaid.configure({ lowlight }),
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

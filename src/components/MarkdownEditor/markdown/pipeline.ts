import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import remarkStringify from "remark-stringify";
import rehypeStringify from "rehype-stringify";
import rehypeParse from "rehype-parse";
import rehypeRaw from "rehype-raw";
import rehypeRemark from "rehype-remark";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { visit } from "unist-util-visit";
import type { Root as MdastRoot, RootContent } from "mdast";
import type { Root as HastRoot, Element, ElementContent } from "hast";
import type { State } from "hast-util-to-mdast";
import json from "highlight.js/lib/languages/json";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import java from "highlight.js/lib/languages/java";

const HIGHLIGHT_LANGUAGES = { json, sql, typescript, javascript, java };

/**
 * `rehype-sanitize`'s default (GFM) schema strips `class` from `code`/`span`,
 * which would silently discard the `hljs-*` classes rehype-highlight just
 * added. Extend it explicitly so exported HTML keeps the highlighting.
 */
const sanitizeSchemaWithHighlight = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    span: [...(defaultSchema.attributes?.span ?? []), "className"],
  },
};

export interface PipelineOptions {
  sanitize: boolean;
}

const STRINGIFY_OPTIONS = {
  bullet: "-",
  listItemIndent: "one",
  fences: true,
  rule: "-",
} as const;

function isElement(node: ElementContent | HastRoot): node is Element {
  return node.type === "element";
}

/**
 * Replaces mdast raw-html nodes before remark-rehype so the WYSIWYG editor
 * can round-trip them byte-exact: block HTML becomes a placeholder element
 * carrying the encoded source; inline HTML degrades to visible plain text
 * (best effort, never executed).
 */
function embedRawHtml() {
  return (tree: MdastRoot): void => {
    visit(tree, "html", (node, index, parent) => {
      if (parent === undefined || index === undefined) return;
      if (parent.type === "paragraph") {
        parent.children[index] = { type: "text", value: node.value };
      } else {
        const placeholder = {
          type: "htmlEmbed",
          data: {
            hName: "div",
            hProperties: { dataRawHtml: encodeURIComponent(node.value) },
          },
        };
        parent.children[index] = placeholder as unknown as RootContent;
      }
    });
  };
}

/**
 * remark-gfm emits `<li class="task-list-item"><input …>` but Tiptap's
 * TaskList/TaskItem extensions only parse `data-type` attributes, so GFM
 * checklists would silently downgrade to plain lists without this rewrite.
 */
function taskListsToTiptap() {
  return (tree: HastRoot): void => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "li") return;
      const classes = Array.isArray(node.properties.className)
        ? node.properties.className
        : [];
      if (!classes.includes("task-list-item")) return;

      let checked = false;
      node.children = node.children.filter((child) => {
        if (isElement(child) && child.tagName === "input") {
          checked = child.properties.checked === true;
          return false;
        }
        return true;
      });
      node.properties.dataType = "taskItem";
      node.properties.dataChecked = String(checked);
      node.properties.className = undefined;
    });
    visit(tree, "element", (node) => {
      if (node.tagName !== "ul") return;
      const hasTaskItem = node.children.some(
        (child) => isElement(child) && child.properties.dataType === "taskItem",
      );
      if (hasTaskItem) {
        node.properties.dataType = "taskList";
        node.properties.className = undefined;
      }
    });
  };
}

/**
 * Inverse of taskListsToTiptap: Tiptap wraps task item content in
 * `<label><input …></label><div>…</div>`, which hast-util-to-mdast does not
 * recognize as a GFM task item. Rewrites to `<li><input …> content`.
 */
function tiptapTaskListsToGfm() {
  return (tree: HastRoot): void => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "li" || node.properties.dataType !== "taskItem") {
        return;
      }
      const checked = node.properties.dataChecked === "true";
      const content: ElementContent[] = [];
      for (const child of node.children) {
        if (isElement(child) && child.tagName === "label") continue;
        if (isElement(child) && child.tagName === "div") {
          content.push(...child.children);
        } else {
          content.push(child);
        }
      }
      const checkbox: Element = {
        type: "element",
        tagName: "input",
        properties: { type: "checkbox", checked, disabled: true },
        children: [],
      };
      node.children = [checkbox, ...content];
    });
  };
}

/**
 * Tiptap wraps every list item's content in `<p>`, which hast-util-to-mdast
 * interprets as a loose list (blank lines between items). Unwrapping the
 * single paragraph keeps serialized lists tight/canonical.
 */
function tightenListItems() {
  return (tree: HastRoot): void => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "li") return;
      const paragraphs = node.children.filter(
        (child) => isElement(child) && child.tagName === "p",
      );
      if (paragraphs.length !== 1) return;
      node.children = node.children.flatMap((child) =>
        isElement(child) && child.tagName === "p" ? child.children : [child],
      );
    });
  };
}

/** Markdown (GFM) → HTML listo para `editor.commands.setContent`. */
export function markdownToEditorHtml(markdown: string): string {
  const file = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(embedRawHtml)
    .use(remarkRehype)
    .use(taskListsToTiptap)
    .use(rehypeStringify)
    .processSync(markdown);
  return String(file);
}

/** HTML emitido por Tiptap (`editor.getHTML()`) → Markdown (GFM). */
export function editorHtmlToMarkdown(html: string): string {
  const file = unified()
    .use(rehypeParse, { fragment: true })
    .use(tiptapTaskListsToGfm)
    .use(tightenListItems)
    .use(rehypeRemark, {
      handlers: {
        div(state: State, node: Element) {
          const raw = node.properties.dataRawHtml;
          if (typeof raw === "string") {
            return { type: "html" as const, value: decodeURIComponent(raw) };
          }
          return state.all(node);
        },
      },
    })
    .use(remarkGfm)
    .use(remarkStringify, STRINGIFY_OPTIONS)
    .processSync(html);
  return String(file);
}

/** Markdown (GFM) → HTML completo para exportación (FR-013, FR-017). */
export function markdownToHtml(
  markdown: string,
  options: PipelineOptions,
): string {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight, {
      languages: HIGHLIGHT_LANGUAGES,
      ignoreMissing: true,
    });
  const withSanitize = options.sanitize
    ? processor.use(rehypeSanitize, sanitizeSchemaWithHighlight)
    : processor;
  const file = withSanitize.use(rehypeStringify).processSync(markdown);
  return String(file);
}

/** Sanitiza un fragmento HTML aislado (bloques de HTML embebido, FR-022). */
export function sanitizeHtmlFragment(html: string): string {
  const file = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .processSync(html);
  return String(file);
}

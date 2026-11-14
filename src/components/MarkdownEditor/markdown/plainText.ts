import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type {
  ListItem,
  PhrasingContent,
  Root,
  RootContent,
  TableCell,
} from "mdast";

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/** Texto visible de un fragmento HTML: sin etiquetas y con las entidades básicas resueltas. */
function htmlText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity);
}

function inline(nodes: readonly PhrasingContent[]): string {
  return nodes.map(inlineNode).join("");
}

function inlineNode(node: PhrasingContent): string {
  switch (node.type) {
    case "text":
    case "inlineCode":
      return node.value;
    case "emphasis":
    case "strong":
    case "delete":
      return inline(node.children);
    case "break":
      return "\n";
    case "link": {
      const text = inline(node.children);
      return text === "" ? node.url : text === node.url ? text : `${text} (${node.url})`;
    }
    case "linkReference":
      return inline(node.children);
    case "image":
    case "imageReference":
      return node.alt ?? "";
    case "html":
      return htmlText(node.value);
    default:
      return "";
  }
}

function cellText(cell: TableCell): string {
  return inline(cell.children).replace(/\s*\n\s*/g, " ");
}

function listItem(item: ListItem, marker: string, depth: number): string {
  const indent = "  ".repeat(depth);
  const task = item.checked === true ? "[x] " : item.checked === false ? "[ ] " : "";
  const parts: string[] = [];
  item.children.forEach((child, index) => {
    if (child.type === "list") {
      parts.push(list(child.children, child.ordered === true, child.start ?? 1, depth + 1));
      return;
    }
    const text = block(child, depth + 1);
    if (text === "") return;
    parts.push(index === 0 ? `${indent}${marker}${task}${text}` : `${indent}  ${text}`);
  });
  if (parts.length === 0) parts.push(`${indent}${marker}${task}`.trimEnd());
  return parts.join("\n");
}

function list(items: readonly ListItem[], ordered: boolean, start: number, depth: number): string {
  return items
    .map((item, index) => listItem(item, ordered ? `${start + index}. ` : "- ", depth))
    .join("\n");
}

function block(node: RootContent, depth = 0): string {
  switch (node.type) {
    case "paragraph":
    case "heading":
      return inline(node.children);
    case "blockquote":
      return blocks(node.children);
    case "list":
      return list(node.children, node.ordered === true, node.start ?? 1, depth);
    case "code":
      return node.value;
    case "table":
      return node.children
        .map((row) => row.children.map(cellText).join("\t"))
        .join("\n");
    case "thematicBreak":
      return "";
    case "html":
      return htmlText(node.value).trim();
    default:
      return "";
  }
}

function blocks(nodes: readonly RootContent[]): string {
  return nodes.map((node) => block(node)).join("\n\n");
}

/**
 * Texto plano legible a partir de Markdown (GFM): sin sintaxis Markdown ni
 * etiquetas HTML. Bloques separados por una línea en blanco; listas con `-`,
 * `1.` o `[ ]`/`[x]` y dos espacios de sangría por nivel; tablas con las celdas
 * separadas por tabuladores; enlaces como «texto (dirección)»; imágenes como su
 * texto alternativo; código tal cual.
 */
export function markdownToPlainText(markdown: string): string {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  return blocks(tree.children)
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, (trailing) => (trailing.includes("\t") ? trailing : "")))
    .join("\n")
    // Una regla horizontal deja una línea en blanco extra; nunca más de dos seguidas.
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

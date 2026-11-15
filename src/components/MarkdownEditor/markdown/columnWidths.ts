import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Root as MdastRoot, Table } from "mdast";
import type { Root as HastRoot, Element } from "hast";

/**
 * Ancho de columna en la fila separadora de una tabla GFM (spec 023).
 *
 * Cada guion de la fila separadora (`| ------ |`) equivale a {@link DASH_PX}
 * píxeles de ancho de columna. Para no cambiar las tablas que ya existen, los
 * guiones solo cuentan como ancho cuando son más de 3 y difieren de los que
 * pondría el relleno automático (el ancho de la celda más larga): es decir,
 * cuando alguien los fijó a propósito.
 */
export const DASH_PX = 8;
/** Ancho mínimo al arrastrar (≈ 3 caracteres): 5 guiones. */
export const MIN_COLUMN_PX = 40;

export const pxToDashes = (px: number): number => Math.max(MIN_COLUMN_PX / DASH_PX, Math.round(px / DASH_PX));
export const dashesToPx = (dashes: number): number => dashes * DASH_PX;

/** Divide una fila de tabla en celdas (sin las barras de los extremos), respetando `\|`. */
export function splitRow(line: string): string[] {
  let text = line.trim();
  if (text.startsWith("|")) text = text.slice(1);
  if (text.endsWith("|") && !text.endsWith("\\|")) text = text.slice(0, -1);
  const cells: string[] = [];
  let current = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "\\" && i + 1 < text.length) {
      current += char + text[i + 1];
      i++;
    } else if (char === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

const dashCount = (cell: string): number => (cell.match(/-/g) ?? []).length;

/** Guiones que pondría el relleno automático: max(3, celda más larga) por columna. */
function automaticDashes(rows: string[][], columns: number): number[] {
  return Array.from({ length: columns }, (_, column) =>
    Math.max(3, ...rows.map((row) => (row[column] ?? "").length)),
  );
}

/** Líneas del documento que ocupa la tabla, sin el prefijo de contenedor (`> `, sangría). */
function tableLines(table: Table, lines: string[]): { index: number; prefix: string; body: string }[] | null {
  const start = table.position?.start;
  const end = table.position?.end;
  if (start === undefined || end === undefined) return null;
  const result = [];
  for (let line = start.line; line <= end.line; line++) {
    const text = lines[line - 1];
    if (text === undefined) return null;
    const prefix = text.slice(0, start.column - 1);
    result.push({ index: line - 1, prefix, body: text.slice(start.column - 1) });
  }
  return result;
}

/**
 * Anchos explícitos (en píxeles, o `null` si es automático) de cada columna de
 * `table`, leídos de su fila separadora en el texto fuente.
 */
export function explicitWidths(table: Table, source: string): (number | null)[] {
  const columns = table.children[0]?.children.length ?? 0;
  const lines = tableLines(table, source.split(/\r?\n/));
  const separator = lines?.[1];
  if (lines === null || separator === undefined) return Array<null>(columns).fill(null);
  const delimiter = splitRow(separator.body);
  const content = lines.filter((_, i) => i !== 1).map((line) => splitRow(line.body));
  const automatic = automaticDashes(content, columns);
  return Array.from({ length: columns }, (_, column) => {
    const dashes = dashCount(delimiter[column] ?? "");
    return dashes > 3 && dashes !== automatic[column] ? dashesToPx(dashes) : null;
  });
}

/**
 * Plugin remark (Markdown → editor): pone `colwidth` en las celdas de las
 * columnas con ancho explícito, para que Tiptap lo lea como ancho de columna.
 */
export function remarkColumnWidths() {
  return (tree: MdastRoot, file: { value: unknown }) => {
    const source = String(file.value);
    visit(tree, "table", (table: Table) => {
      const widths = explicitWidths(table, source);
      if (widths.every((width) => width === null)) return;
      for (const row of table.children) {
        row.children.forEach((cell, column) => {
          const width = widths[column];
          if (width === null || width === undefined) return;
          cell.data = { ...cell.data, hProperties: { ...cell.data?.hProperties, colwidth: String(width) } };
        });
      }
    });
  };
}

function colwidthOf(cell: Element): number | null {
  const raw = cell.properties["colwidth"] ?? cell.properties["colWidth"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const width = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(width) && width > 0 ? width : null;
}

/**
 * Plugin rehype (editor → Markdown): reúne, en orden de documento, los anchos
 * de columna de cada tabla (según la primera fila) en `collected`.
 */
export function rehypeCollectColumnWidths(collected: (number | null)[][]) {
  return () => (tree: HastRoot) => {
    visit(tree, "element", (node: Element) => {
      if (node.properties["dataRawHtml"] !== undefined) return "skip";
      if (node.tagName !== "table") return undefined;
      let firstRow: Element | undefined;
      visit(node, "element", (child: Element) => {
        if (firstRow === undefined && child.tagName === "tr") firstRow = child;
      });
      const widths: (number | null)[] = [];
      for (const cell of firstRow?.children ?? []) {
        if (cell.type !== "element" || (cell.tagName !== "th" && cell.tagName !== "td")) continue;
        const span = Number(cell.properties["colSpan"] ?? 1) || 1;
        const raw = cell.properties["colwidth"] ?? cell.properties["colWidth"];
        const parts = String(Array.isArray(raw) ? raw.join(",") : (raw ?? "")).split(",");
        for (let j = 0; j < span; j++) {
          const width = Number.parseInt(parts[j] ?? "", 10);
          widths.push(Number.isFinite(width) && width > 0 ? width : j === 0 ? colwidthOf(cell) : null);
        }
      }
      collected.push(widths);
      return "skip";
    });
  };
}

function pad(text: string, size: number, align: "left" | "right" | "center"): string {
  const missing = size - text.length;
  if (missing <= 0) return text;
  if (align === "right") return " ".repeat(missing) + text;
  if (align === "center") {
    const left = Math.floor(missing / 2);
    return " ".repeat(left) + text + " ".repeat(missing - left);
  }
  return text + " ".repeat(missing);
}

/**
 * Escribe en la fila separadora de cada tabla de `markdown` los anchos
 * explícitos de `widths` (una lista por tabla, en orden de documento) y alinea
 * las barras de esas columnas. Las columnas sin ancho quedan como están.
 */
export function applyColumnWidths(markdown: string, widths: (number | null)[][]): string {
  if (!widths.some((table) => table.some((width) => width !== null))) return markdown;
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MdastRoot;
  const lines = markdown.split("\n");
  let tableIndex = 0;
  visit(tree, "table", (table: Table) => {
    const tableWidths = widths[tableIndex++];
    if (tableWidths === undefined || tableWidths.every((width) => width === null)) return;
    const located = tableLines(table, lines);
    if (located === null || located.length < 2) return;
    const rows = located.map((line) => splitRow(line.body));
    const delimiter = rows[1] ?? [];
    const content = rows.filter((_, i) => i !== 1);
    const automatic = automaticDashes(content, delimiter.length);
    const aligns = delimiter.map((cell) => {
      const left = cell.startsWith(":");
      const right = cell.endsWith(":");
      return left && right ? "center" : right ? "right" : "left";
    }) as ("left" | "right" | "center")[];
    tableWidths.forEach((width, column) => {
      const cell = delimiter[column];
      if (width === null || cell === undefined) return;
      let dashes = pxToDashes(width);
      // Si coincide con el relleno automático, al releerlo se tomaría como automático.
      if (dashes === automatic[column]) dashes += 1;
      delimiter[column] = (cell.startsWith(":") ? ":" : "") + "-".repeat(dashes) + (cell.endsWith(":") ? ":" : "");
    });
    rows.forEach((row, r) => {
      const cells = row.map((cell, column) =>
        r === 1 ? cell : pad(cell, (delimiter[column] ?? "").length, aligns[column] ?? "left"),
      );
      const line = located[r];
      if (line !== undefined) lines[line.index] = `${line.prefix}| ${cells.join(" | ")} |`;
    });
  });
  return lines.join("\n");
}

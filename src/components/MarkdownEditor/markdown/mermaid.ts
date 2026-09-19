/**
 * Carga perezosa de `mermaid`: la librería es pesada y solo hace falta cuando
 * un documento contiene diagramas, así que nunca se importa estáticamente
 * (Principios VIII y XII, research.md §4).
 */

type MermaidModule = typeof import("mermaid").default;

let mermaidPromise: Promise<MermaidModule> | null = null;

/** Carga (una sola vez) e inicializa mermaid con configuración segura. */
export async function loadMermaid(): Promise<MermaidModule> {
  if (mermaidPromise === null) {
    mermaidPromise = import("mermaid").then((module) => {
      const mermaid = module.default;
      // `strict` escapa el HTML de las etiquetas y deshabilita los callbacks
      // de clic: el contenido puede venir de HTML pegado por el usuario, así
      // que se trata como no confiable (research.md §3).
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });
      return mermaid;
    });
  }
  return mermaidPromise;
}

/**
 * Filtro barato previo: evita cargar la librería completa de Mermaid en el
 * caso común (pegar HTML que claramente no es un diagrama). No decide por sí
 * solo — lo que confirma es siempre `mermaid.parse` (research.md §4).
 */
const MERMAID_KEYWORDS =
  /^\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(-v2)?|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|quadrantChart|requirementDiagram|C4Context|sankey(-beta)?|xychart(-beta)?|block(-beta)?|packet(-beta)?|architecture(-beta)?|kanban|radar|treemap)\b/;

/** `true` si el texto es un diagrama Mermaid sintácticamente válido. */
export async function isMermaidSyntax(text: string): Promise<boolean> {
  const trimmed = text.trim();
  if (trimmed === "") return false;
  if (!MERMAID_KEYWORDS.test(trimmed)) return false;
  try {
    const mermaid = await loadMermaid();
    const result = await mermaid.parse(trimmed, { suppressErrors: true });
    return result !== false;
  } catch {
    return false;
  }
}

let renderCounter = 0;

/**
 * Renderiza `source` a SVG. Devuelve `null` si la sintaxis es inválida, para
 * que el llamador degrade a texto legible sin romper el documento (FR-008).
 */
export async function renderMermaid(source: string): Promise<string | null> {
  const trimmed = source.trim();
  if (trimmed === "") return null;
  if (!MERMAID_KEYWORDS.test(trimmed)) return null;
  try {
    const mermaid = await loadMermaid();
    const valid = await mermaid.parse(trimmed, { suppressErrors: true });
    if (valid === false) return null;
    renderCounter += 1;
    const { svg } = await mermaid.render(`mdw-mermaid-${renderCounter}`, trimmed);
    return svg;
  } catch {
    return null;
  }
}

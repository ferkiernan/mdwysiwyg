import type { Editor } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

/**
 * Garantiza un párrafo vacío editable tras un bloque final (tabla, código,
 * Mermaid, cita, lista…). La extensión `trailingNode` de StarterKit solo
 * actúa tras una transacción, así que el contenido inicial que termina en
 * bloque quedaba sin línea posterior (FR-001). La inserción no emite
 * `onUpdate`, no entra en el historial y no cambia el Markdown, porque el
 * pipeline descarta los párrafos vacíos finales (FR-008, FR-010).
 */
export function ensureTrailingParagraph(editor: Editor): void {
  if (!editor.isEditable) return;
  const { state, view } = editor;
  const paragraph = state.schema.nodes["paragraph"];
  if (!paragraph) return;
  if (state.doc.lastChild?.type === paragraph) return;
  view.dispatch(
    state.tr
      .insert(state.doc.content.size, paragraph.create())
      .setMeta("preventUpdate", true)
      .setMeta("addToHistory", false),
  );
}

/** Un clic sobre la barra de scroll del wrapper no debe tratarse como área libre. */
function isOnScrollbar(element: Element, event: MouseEvent): boolean {
  const rect = element.getBoundingClientRect();
  return (
    (element.clientWidth > 0 &&
      event.clientX - rect.left >= element.clientWidth) ||
    (element.clientHeight > 0 &&
      event.clientY - rect.top >= element.clientHeight)
  );
}

/**
 * `mousedown` sobre el área libre tras el último bloque (a su derecha o
 * debajo): lleva el cursor al párrafo final en vez de dejar que ProseMirror
 * lo resuelva hacia la última celda o el interior del bloque (FR-002).
 * Devuelve `true` si gestionó el evento. Los clics dentro de celdas, código o
 * diagramas no coinciden con estas condiciones y conservan su comportamiento
 * (FR-006); en solo lectura no hace nada (FR-009).
 */
export function handleBlankAreaMouseDown(
  view: EditorView,
  event: MouseEvent,
): boolean {
  if (!view.editable || event.button !== 0 || event.shiftKey) return false;
  const target = event.target;
  if (!(target instanceof Element)) return false;

  const { doc } = view.state;
  const last = doc.lastChild;
  const lastEl = view.dom.lastElementChild;
  if (last === null || lastEl === null || last.type.name !== "paragraph") {
    return false;
  }
  const lastIsEmpty = last.content.size === 0;

  let inBlankArea = false;
  if (target === view.dom) {
    // Con línea posterior vacía, el área libre incluye el lateral del bloque
    // que la precede; si no, solo lo que queda bajo el último párrafo.
    const before = doc.childCount > 1 ? doc.child(doc.childCount - 2) : null;
    const beforeEl = lastEl.previousElementSibling;
    const thresholdEl =
      lastIsEmpty && before?.type.name !== "paragraph" && beforeEl !== null
        ? beforeEl
        : lastEl;
    const rect = thresholdEl.getBoundingClientRect();
    inBlankArea = lastIsEmpty
      ? event.clientY >= rect.top
      : event.clientY >= rect.bottom;
  } else if (
    lastIsEmpty &&
    target.classList.contains("tableWrapper") &&
    target.nextElementSibling === lastEl
  ) {
    inBlankArea = !isOnScrollbar(target, event);
  }
  if (!inBlankArea) return false;

  event.preventDefault();
  view.dispatch(
    view.state.tr.setSelection(TextSelection.atEnd(doc)).scrollIntoView(),
  );
  view.focus();
  return true;
}

import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { vi } from "vitest";
import { MarkdownEditor } from "../../src";
import type { MarkdownEditorHandle, MarkdownEditorProps } from "../../src";

export async function setupEditor(props: MarkdownEditorProps = {}) {
  const onChange = vi.fn();
  const view = render(<MarkdownEditor onChange={onChange} {...props} />);
  const pm = await screen.findByRole("textbox", {
    name: "Editor de texto enriquecido",
  });
  return { onChange, pm, view };
}

/** Selecciona todo el contenido vía el atajo Mod-A que maneja ProseMirror. */
export function selectAll(pm: HTMLElement): void {
  fireEvent.keyDown(pm, { key: "a", ctrlKey: true });
}

/** Pasa el puntero sobre la celda y hace clic en su disparador de menú. */
export async function openTableMenuViaTrigger(
  cell: HTMLElement,
): Promise<void> {
  await userEvent.hover(cell);
  await userEvent.click(
    await screen.findByRole("button", {
      name: /^Abrir acciones de (columna|fila)$/,
    }),
  );
}

/**
 * Coloca el cursor dentro de `element`. jsdom no tiene layout, así que un clic
 * no resuelve la posición del documento: se fija la selección del DOM y se
 * notifica a ProseMirror, como haría el navegador.
 */
export async function placeCaretIn(element: HTMLElement): Promise<void> {
  await userEvent.click(element);
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const text = walker.nextNode();
  if (text === null) throw new Error("placeCaretIn: el elemento no tiene texto");
  window.getSelection()?.setBaseAndExtent(text, 0, text, 0);
  document.dispatchEvent(new Event("selectionchange"));
}

export const ORIGINAL_PANE = { name: "Contenido original (solo lectura)" };
export const NEW_PANE = { name: "Contenido nuevo (editable)" };

/** Monta el componente en modo comparación y espera a que ambos paneles existan. */
export async function setupCompare(props: MarkdownEditorProps = {}) {
  const onChange = vi.fn();
  const onCompareDecision = vi.fn();
  const merged: MarkdownEditorProps = {
    mode: "compare",
    compareOrientation: "side-to-side",
    ...props,
  };
  const view = render(
    <MarkdownEditor
      onChange={onChange}
      onCompareDecision={onCompareDecision}
      {...merged}
    />,
  );
  const update = (next: MarkdownEditorProps) =>
    view.rerender(
      <MarkdownEditor
        onChange={onChange}
        onCompareDecision={onCompareDecision}
        {...merged}
        {...next}
      />,
    );
  const originalPane = await screen.findByRole("group", ORIGINAL_PANE);
  const newPane = await screen.findByRole("group", { name: /^Contenido nuevo/ });
  return { onChange, onCompareDecision, update, view, originalPane, newPane };
}

/** Textos resaltados (`<mark>`) dentro de un panel. */
export function highlighted(pane: HTMLElement): string[] {
  return Array.from(pane.querySelectorAll("mark")).map(
    (mark) => mark.textContent ?? "",
  );
}

/** Espera a que los textos resaltados de un panel sean exactamente `expected`. */
export async function expectHighlighted(
  pane: HTMLElement,
  expected: string[],
): Promise<void> {
  await waitFor(() => expect(highlighted(pane)).toEqual(expected));
}

/** Hora de una versión tal como la muestra la lista del historial. */
export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Avanza el reloj simulado `ms` milisegundos dentro de `act`. */
export async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

/** Deja pasar el periodo de inactividad tras el cual se guarda una versión. */
export const advanceIdle = () => advance(3000);

export const HISTORY_BUTTON = { name: "Historial de versiones" };

/**
 * Monta el editor con `historyUndo` y un reloj simulado. El llamador debe
 * restaurar los temporizadores reales (`vi.useRealTimers()`) al terminar.
 */
export async function setupHistory(props: MarkdownEditorProps = {}) {
  vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date(2026, 10, 9, 10, 0, 0) });
  const onChange = vi.fn();
  const handle = createRef<MarkdownEditorHandle>();
  const element = (next: MarkdownEditorProps) => (
    <MarkdownEditor
      ref={handle}
      onChange={onChange}
      historyUndo
      {...props}
      {...next}
    />
  );
  const view = render(element({}));
  const update = (next: MarkdownEditorProps) => view.rerender(element(next));
  const pm = await screen.findByRole("textbox", {
    name: "Editor de texto enriquecido",
  });
  return { onChange, pm, view, update, handle };
}

/** Escribe `text` al final del documento en la vista renderizada. */
export async function typeInEditor(pm: HTMLElement, text: string): Promise<void> {
  await userEvent.type(pm, text);
}

export const HISTORY_BAR = { name: "Barra de historial" };

export function versionItems(): HTMLElement[] {
  return within(screen.getByRole("navigation", HISTORY_BUTTON)).getAllByRole(
    "listitem",
  );
}

/** Índice (0 = más reciente) de la versión marcada como mostrada. */
export function viewedPosition(): number {
  return versionItems().findIndex(
    (item) =>
      item.querySelector('button[aria-current="true"]') !== null,
  );
}

/** Escribe una letra por versión, esperando la pausa; devuelve el texto tras cada una (el primero, el inicial). */
export async function makeVersions(
  pm: HTMLElement,
  letters: string,
): Promise<string[]> {
  const texts = [pm.textContent ?? ""];
  for (const letter of letters) {
    await typeInEditor(pm, letter);
    await advanceIdle();
    texts.push(pm.textContent ?? "");
  }
  return texts;
}

export const openHistoryMode = () =>
  userEvent.click(screen.getByRole("button", HISTORY_BUTTON));

export { within };

// ---------------------------------------------------------------------------
// Desplazamiento sincronizado (modo comparación). jsdom no tiene layout: la
// geometría se simula de forma determinista.
// ---------------------------------------------------------------------------

const NEWLINE = String.fromCharCode(10);

export interface ScrollGeometry {
  /** Alto de cada bloque de primer nivel de la vista renderizada. Default: 100. */
  rowHeight?: number;
  /** Alto de línea del `<textarea>` (sin ajuste de línea). Default: 20. */
  lineHeight?: number;
  /** Alto visible de cada panel. Default: 300. */
  viewport?: number;
}

function isRenderedScroller(el: Element): boolean {
  return (
    el.getAttribute("role") === "group" &&
    el.querySelector(":scope > div > .ProseMirror, :scope > .ProseMirror") !== null
  );
}

/**
 * Simula el layout: `scrollHeight`/`clientHeight`/`scrollTop` (con tope como en un
 * navegador) de los paneles y de los `<textarea>`, las posiciones de los bloques de
 * la vista renderizada (`getBoundingClientRect`) y las filas del espejo de medición
 * (`offsetTop`). Devuelve la función que lo restaura.
 */
export function installScrollGeometry(
  geometry: ScrollGeometry = {},
): () => void {
  const rowHeight = geometry.rowHeight ?? 100;
  const lineHeight = geometry.lineHeight ?? 20;
  const viewport = geometry.viewport ?? 300;

  const scrollHeightOf = (el: Element): number => {
    if (el instanceof HTMLTextAreaElement) {
      return el.value.split(NEWLINE).length * lineHeight;
    }
    if (isRenderedScroller(el)) {
      const pm = el.querySelector(".ProseMirror");
      return (pm?.childElementCount ?? 0) * rowHeight;
    }
    return 0;
  };
  const clientHeightOf = (el: Element): number =>
    el instanceof HTMLTextAreaElement || isRenderedScroller(el) ? viewport : 0;

  const tops = new WeakMap<Element, number>();
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const define = (
    target: object,
    key: string,
    descriptor: PropertyDescriptor,
  ) => {
    originals.set(key + (target === Element.prototype ? ":E" : ":H"),
      Object.getOwnPropertyDescriptor(target, key));
    Object.defineProperty(target, key, { configurable: true, ...descriptor });
  };

  define(Element.prototype, "scrollHeight", {
    get(this: Element) {
      return scrollHeightOf(this);
    },
  });
  define(Element.prototype, "clientHeight", {
    get(this: Element) {
      return clientHeightOf(this);
    },
  });
  define(Element.prototype, "clientWidth", {
    get(this: Element) {
      return clientHeightOf(this) > 0 ? 400 : 0;
    },
  });
  define(Element.prototype, "scrollTop", {
    get(this: Element) {
      return tops.get(this) ?? 0;
    },
    set(this: Element, value: number) {
      const max = Math.max(0, scrollHeightOf(this) - clientHeightOf(this));
      tops.set(this, Math.min(max, Math.max(0, value)));
    },
  });
  define(HTMLElement.prototype, "offsetTop", {
    get(this: HTMLElement) {
      const parent = this.parentElement;
      if (
        parent === null ||
        parent.getAttribute("aria-hidden") !== "true" ||
        parent.parentElement !== document.body
      ) {
        return 0;
      }
      return Array.prototype.indexOf.call(parent.children, this) * lineHeight;
    },
  });

  const realRect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const parent = this.parentElement;
    if (parent !== null && parent.classList.contains("ProseMirror")) {
      const scroller = this.closest("[role=group]");
      const index = Array.prototype.indexOf.call(parent.children, this);
      const scrollTop = scroller === null ? 0 : (tops.get(scroller) ?? 0);
      return {
        top: index * rowHeight - scrollTop,
        bottom: (index + 1) * rowHeight - scrollTop,
        left: 0,
        right: 100,
        width: 100,
        height: rowHeight,
        x: 0,
        y: index * rowHeight - scrollTop,
        toJSON: () => ({}),
      } as DOMRect;
    }
    return realRect.call(this);
  };

  return () => {
    Element.prototype.getBoundingClientRect = realRect;
    for (const [key, descriptor] of originals) {
      const [name, where] = key.split(":");
      const target = where === "E" ? Element.prototype : HTMLElement.prototype;
      if (descriptor === undefined) {
        delete (target as unknown as Record<string, unknown>)[name as string];
      } else {
        Object.defineProperty(target, name as string, descriptor);
      }
    }
  };
}

/** Texto Markdown con `count` párrafos `"<prefix> n"` separados por línea en blanco. */
export function paragraphs(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix} ${index}`);
}

export const toMarkdown = (blocks: string[]): string =>
  blocks.join(NEWLINE + NEWLINE) + NEWLINE;

/** Fija `scrollTop` de un panel y emite el evento `scroll`, como haría el usuario. */
export function scrollPane(el: HTMLElement, top: number): void {
  el.scrollTop = top;
  fireEvent.scroll(el);
}

/** Espera a que el panel tenga su editor (`.ProseMirror`) montado. */
export async function whenRendered(pane: HTMLElement): Promise<void> {
  await waitFor(() =>
    expect(pane.querySelector(".ProseMirror")).not.toBeNull(),
  );
}

/** Monta la comparación con la geometría simulada y ambos editores listos. */
export async function setupCompareScroll(
  props: MarkdownEditorProps = {},
  geometry: ScrollGeometry = {},
) {
  const restore = installScrollGeometry(geometry);
  const result = await setupCompare(props);
  await whenRendered(result.originalPane);
  await whenRendered(result.newPane);
  return { ...result, restore };
}

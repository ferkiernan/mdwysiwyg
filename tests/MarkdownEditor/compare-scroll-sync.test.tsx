import { afterEach, describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../../src";
import type { MarkdownEditorProps } from "../../src";
import {
  scrollPane,
  setupCompareScroll,
  toMarkdown,
  typeInEditor,
} from "./helpers";

const restores: Array<() => void> = [];

afterEach(() => {
  while (restores.length > 0) restores.pop()?.();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Párrafos únicos `p0`, `p1`… (cada bloque mide 100 px en la geometría simulada). */
const blocks = (prefix: string, count: number, from = 0): string[] =>
  Array.from({ length: count }, (_, index) => `${prefix}${from + index}x`);

async function setup(
  original: string[],
  current: string[],
  props: MarkdownEditorProps = {},
) {
  const result = await setupCompareScroll({
    initialContent: toMarkdown(original),
    compareContent: toMarkdown(current),
    ...props,
  });
  restores.push(result.restore);
  return result;
}

const maxScroll = (el: HTMLElement) => el.scrollHeight - el.clientHeight;

/** Cuenta las escrituras de `scrollTop` sobre un elemento. */
function countWrites(el: HTMLElement): { count: () => number } {
  const proto = Object.getOwnPropertyDescriptor(Element.prototype, "scrollTop");
  let writes = 0;
  Object.defineProperty(el, "scrollTop", {
    configurable: true,
    get() {
      return proto?.get?.call(el) as number;
    },
    set(value: number) {
      writes++;
      proto?.set?.call(el, value);
    },
  });
  return { count: () => writes };
}

describe("US1: el otro panel sigue el contenido que se está viendo", () => {
  const original = blocks("p", 20);
  // Tres bloques nuevos al principio desplazan todo lo demás 300 px.
  const current = [...blocks("new", 3), ...original];

  it("desplazar el original lleva el nuevo al mismo párrafo, no al mismo porcentaje", async () => {
    const { originalPane, newPane } = await setup(original, current);

    scrollPane(originalPane, 800); // arriba del párrafo p8
    expect(newPane.scrollTop).toBe(1100); // p8 está en la posición 11 del nuevo
  });

  it("desplazar el nuevo lleva el original al párrafo correspondiente", async () => {
    const { originalPane, newPane } = await setup(original, current);

    scrollPane(newPane, 1100);
    expect(originalPane.scrollTop).toBe(800);
  });

  it("tras 20 bloques añadidos antes, sigue siendo el mismo pasaje (SC-002)", async () => {
    const many = [...blocks("new", 20), ...blocks("p", 40)];
    const { originalPane, newPane } = await setup(blocks("p", 40), many);

    for (const k of [3, 12, 25, 33]) {
      scrollPane(originalPane, k * 100);
      expect(newPane.scrollTop).toBe((k + 20) * 100);
    }
  });

  it("recorre un tramo que solo existe en un lado de forma proporcional y monótona", async () => {
    // El nuevo añade seis bloques entre p4 y p5.
    const withGap = [...blocks("p", 5), ...blocks("add", 6), ...blocks("p", 15, 5)];
    const { originalPane, newPane } = await setup(original, withGap);

    scrollPane(newPane, 400); // arriba de p4
    expect(originalPane.scrollTop).toBe(400);

    const seen: number[] = [];
    let previousNew = 400;
    for (let top = 410; top <= 1100; top += 10) {
      scrollPane(newPane, top);
      // Ningún salto mayor que el alto visible (300 px) y nunca retrocede (SC-008).
      expect(originalPane.scrollTop - (seen.at(-1) ?? 400)).toBeGreaterThanOrEqual(0);
      expect(originalPane.scrollTop - (seen.at(-1) ?? 400)).toBeLessThanOrEqual(300);
      seen.push(originalPane.scrollTop);
      expect(top).toBeGreaterThan(previousNew);
      previousNew = top;
    }
    scrollPane(newPane, 750); // a mitad del tramo añadido
    expect(originalPane.scrollTop).toBe(450);
    scrollPane(newPane, 1100); // llega a p5: coincide exactamente
    expect(originalPane.scrollTop).toBe(500);
  });

  it("arriba con arriba y abajo con abajo", async () => {
    const { originalPane, newPane } = await setup(original, current);

    scrollPane(originalPane, 800);
    scrollPane(originalPane, 0);
    expect(newPane.scrollTop).toBe(0);

    scrollPane(originalPane, maxScroll(originalPane));
    expect(newPane.scrollTop).toBe(maxScroll(newPane));

    scrollPane(newPane, 0);
    expect(originalPane.scrollTop).toBe(0);
    scrollPane(newPane, maxScroll(newPane));
    expect(originalPane.scrollTop).toBe(maxScroll(originalPane));
  });

  it("casi sin contenido común sigue el progreso proporcional (FR-004)", async () => {
    const { originalPane, newPane } = await setup(
      Array.from({ length: 20 }, (_, i) => `aa${i}bb`),
      Array.from({ length: 30 }, (_, i) => `cc${i}dd`),
    );

    scrollPane(originalPane, maxScroll(originalPane) / 2);
    expect(newPane.scrollTop).toBeCloseTo(maxScroll(newPane) / 2, 5);
  });
});

describe("US1: sin bucles de retroalimentación (FR-008)", () => {
  const original = blocks("p", 20);
  const current = [...blocks("new", 3), ...original];

  it("el eco del panel seguidor no vuelve a escribir en el guía", async () => {
    const { originalPane, newPane } = await setup(original, current);
    const originalWrites = countWrites(originalPane);

    scrollPane(originalPane, 800);
    expect(newPane.scrollTop).toBe(1100);

    const writesBeforeEcho = originalWrites.count();
    fireEvent.scroll(newPane); // el navegador emite el evento del desplazamiento programático
    expect(originalWrites.count()).toBe(writesBeforeEcho);
    expect(originalPane.scrollTop).toBe(800);
    expect(newPane.scrollTop).toBe(1100);
  });

  it("un desplazamiento real del seguidor pasa a guiar", async () => {
    const { originalPane, newPane } = await setup(original, current);

    scrollPane(originalPane, 800);
    fireEvent.scroll(newPane); // eco
    scrollPane(newPane, 1500); // el usuario mueve ahora el panel nuevo
    expect(originalPane.scrollTop).toBe(1200);
  });

  it("un panel sin nada que desplazar no falla", async () => {
    const { originalPane, newPane } = await setup(["a0x"], ["a0x", "b0x"]);

    expect(() => scrollPane(originalPane, 50)).not.toThrow();
    expect(newPane.scrollTop).toBe(0);
  });
});

describe("US1: fuera del modo comparación no hay sincronización (FR-010)", () => {
  it("el modo normal no registra ningún oyente de scroll en el editor", () => {
    const targets: EventTarget[] = [];
    const add = Element.prototype.addEventListener;
    vi.spyOn(Element.prototype, "addEventListener").mockImplementation(function (
      this: Element,
      ...args: Parameters<Element["addEventListener"]>
    ) {
      if (args[0] === "scroll") targets.push(this);
      return add.apply(this, args);
    });

    const { container } = render(<MarkdownEditor initialContent={toMarkdown(blocks("p", 5))} />);

    const inside = targets.filter((el) => el !== container && container.contains(el as Node));
    expect(inside).toEqual([]);
  });
});

const TOGGLE = { name: "Ver código Markdown" };

/** Pasa a la vista Markdown y devuelve las áreas de texto original y nueva. */
async function openMarkdownView() {
  await userEvent.click(screen.getByRole("button", TOGGLE));
  return {
    originalText: screen.getByLabelText(
      "Código fuente Markdown original (solo lectura)",
    ) as HTMLTextAreaElement,
    newText: screen.getByLabelText("Código fuente Markdown") as HTMLTextAreaElement,
  };
}

describe("US2: orientaciones y vistas", () => {
  const original = blocks("p", 20);
  const current = [...blocks("new", 3), ...original];

  it("arriba y abajo se comporta igual que lado a lado", async () => {
    const { originalPane, newPane } = await setup(original, current, {
      compareOrientation: "up-and-down",
    });

    scrollPane(originalPane, 800);
    expect(newPane.scrollTop).toBe(1100);
    scrollPane(newPane, 500);
    expect(originalPane.scrollTop).toBe(200);
  });

  it("vista Markdown: sigue las líneas coincidentes de cada área de texto", async () => {
    await setup(original, current);
    const { originalText, newText } = await openMarkdownView();

    // El bloque p8 está en la línea 16 del original (320 px) y en la 22 del nuevo (440 px).
    scrollPane(originalText, 320);
    expect(newText.scrollTop).toBe(440);

    scrollPane(newText, 600); // línea 30 del nuevo = p12 (línea 24 del original = 480 px)
    expect(originalText.scrollTop).toBe(480);
  });

  it("vista Markdown: extremos y respaldo proporcional", async () => {
    await setup(
      Array.from({ length: 20 }, (_, i) => `aa${i}bb`),
      Array.from({ length: 30 }, (_, i) => `cc${i}dd`),
    );
    const { originalText, newText } = await openMarkdownView();

    scrollPane(originalText, maxScroll(originalText));
    expect(newText.scrollTop).toBe(maxScroll(newText));
    scrollPane(originalText, maxScroll(originalText) / 2);
    expect(newText.scrollTop).toBeCloseTo(maxScroll(newText) / 2, 5);
  });

  it("cambiar de vista mantiene los paneles alineados", async () => {
    await setup(original, current);
    scrollPane(screen.getByRole("group", { name: /^Contenido original/ }), 800);

    const { originalText, newText } = await openMarkdownView();
    scrollPane(originalText, 160); // p4: línea 8 del original, línea 14 (280 px) del nuevo
    expect(newText.scrollTop).toBe(280);

    await userEvent.click(screen.getByRole("button", TOGGLE)); // vuelve a la vista renderizada
    const originalPane = screen.getByRole("group", { name: /^Contenido original/ });
    const newPane = screen.getByRole("group", { name: /^Contenido nuevo/ });
    scrollPane(originalPane, 800);
    expect(newPane.scrollTop).toBe(1100);
  });

  it("al cambiar la orientación el seguidor se recoloca sobre el contenido", async () => {
    const { originalPane, newPane, update } = await setup(original, current);

    scrollPane(originalPane, 800);
    newPane.scrollTop = 0; // algo lo descoloca sin pasar por el guía
    update({ compareOrientation: "up-and-down" });

    expect(originalPane.scrollTop).toBe(800);
    expect(newPane.scrollTop).toBe(1100);
  });
});

describe("US3: edición, cambios de contenido y de layout", () => {
  const original = blocks("p", 20);
  const current = [...blocks("new", 3), ...original];

  it("el desplazamiento del panel nuevo al seguir el cursor mueve el original", async () => {
    const { originalPane, newPane } = await setup(original, current);
    const pm = newPane.querySelector(".ProseMirror") as HTMLElement;

    await typeInEditor(pm, "z");
    scrollPane(newPane, 1100); // el navegador desplaza el panel para mostrar el cursor
    expect(originalPane.scrollTop).toBe(800);
  });

  it("escribir en el nuevo lo convierte en guía y nunca lo mueve", async () => {
    const { originalPane, newPane } = await setup(original, current);
    scrollPane(originalPane, 800); // guía: el original
    newPane.scrollTop = 1500; // el usuario lo desplazó sin evento
    const newWrites = countWrites(newPane);

    await typeInEditor(newPane.querySelector(".ProseMirror") as HTMLElement, "z");

    expect(newWrites.count()).toBe(0);
    expect(newPane.scrollTop).toBe(1500);
    expect(originalPane.scrollTop).toBe(1200);
  });

  it("en la vista Markdown escribir en el nuevo tampoco lo mueve", async () => {
    await setup(original, current);
    const { originalText, newText } = await openMarkdownView();
    scrollPane(originalText, 320);
    newText.scrollTop = 600;
    const writes = countWrites(newText);

    await userEvent.type(newText, "z");

    expect(writes.count()).toBe(0);
    expect(newText.scrollTop).toBe(600);
    expect(originalText.scrollTop).toBe(480);
  });

  it("al cambiar el contenido nuevo el seguidor se recoloca (el guía no se mueve)", async () => {
    const { originalPane, newPane, update } = await setup(original, current);
    scrollPane(originalPane, 800);
    expect(newPane.scrollTop).toBe(1100);

    update({ compareContent: toMarkdown([...blocks("new", 5), ...original]) });

    await waitFor(() => expect(newPane.scrollTop).toBe(1300));
    expect(originalPane.scrollTop).toBe(800);
  });

  it("un cambio de tamaño (imágenes, diagramas) recoloca el seguidor", async () => {
    const callbacks: Array<() => void> = [];
    const observed: Element[] = [];
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          callbacks.push(callback);
        }
        observe(el: Element) {
          observed.push(el);
        }
        unobserve() {}
        disconnect = disconnect;
      },
    );
    const { originalPane, newPane, view } = await setup(original, current);
    expect(observed).toContain(originalPane);
    expect(observed).toContain(newPane);

    scrollPane(originalPane, 800);
    newPane.scrollTop = 0; // el layout cambió y el seguidor quedó desalineado
    act(() => callbacks.forEach((callback) => callback()));
    expect(newPane.scrollTop).toBe(1100);

    view.unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});

describe("US4: el anfitrión puede desactivar la sincronización", () => {
  const original = blocks("p", 20);
  const current = [...blocks("new", 3), ...original];

  /** Sustituye `ResizeObserver` y cuenta las instancias creadas. */
  function stubResizeObserver() {
    const instances: unknown[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor() {
          instances.push(this);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    return instances;
  }

  it("por defecto (sin la prop) está activada", async () => {
    const { originalPane, newPane } = await setup(original, current);

    scrollPane(originalPane, 800);
    expect(newPane.scrollTop).toBe(1100);
  });

  it("desactivada: los paneles se desplazan por separado y no se mide ni observa nada", async () => {
    const observers = stubResizeObserver();
    const { originalPane, newPane } = await setup(original, current, {
      compareSyncScroll: false,
    });
    const newWrites = countWrites(newPane);
    const originalWrites = countWrites(originalPane);
    const bodyChildren = document.body.children.length;

    scrollPane(originalPane, 800);
    scrollPane(newPane, 500);

    expect(newPane.scrollTop).toBe(500);
    expect(originalPane.scrollTop).toBe(800);
    // Solo se escribieron los desplazamientos del propio test.
    expect(newWrites.count()).toBe(1);
    expect(originalWrites.count()).toBe(1);
    expect(observers).toEqual([]);
    expect(document.body.children.length).toBe(bodyChildren);
  });

  it("activarla alinea con el panel desplazado en último lugar, sin mover a este", async () => {
    const { originalPane, newPane, update } = await setup(original, current, {
      compareSyncScroll: false,
    });
    scrollPane(originalPane, 800);
    expect(newPane.scrollTop).toBe(0);
    const originalWrites = countWrites(originalPane);

    update({ compareSyncScroll: true });

    expect(newPane.scrollTop).toBe(1100);
    expect(originalPane.scrollTop).toBe(800);
    expect(originalWrites.count()).toBe(0);

    scrollPane(newPane, 1500); // y los siguientes desplazamientos se sincronizan
    expect(originalPane.scrollTop).toBe(1200);
  });

  it("activarla sin desplazamientos previos alinea con el panel editable", async () => {
    const { originalPane, newPane, update } = await setup(original, current, {
      compareSyncScroll: false,
    });
    newPane.scrollTop = 1100; // sin evento: nadie se desplazó "oficialmente"
    originalPane.scrollTop = 0;

    update({ compareSyncScroll: true });

    expect(newPane.scrollTop).toBe(1100);
    expect(originalPane.scrollTop).toBe(800);
  });

  it("desactivarla no mueve nada en ese instante y deja de seguir", async () => {
    const { originalPane, newPane, update } = await setup(original, current);
    scrollPane(originalPane, 800);
    expect(newPane.scrollTop).toBe(1100);

    update({ compareSyncScroll: false });
    expect(originalPane.scrollTop).toBe(800);
    expect(newPane.scrollTop).toBe(1100);

    scrollPane(originalPane, 1000);
    expect(newPane.scrollTop).toBe(1100);
  });

  it("cambiarla no altera contenido, resaltado ni notificaciones", async () => {
    const { originalPane, newPane, update, onChange } = await setup(original, current);
    const before = newPane.textContent;
    const marks = newPane.querySelectorAll("[data-compare]").length;
    scrollPane(originalPane, 800);

    update({ compareSyncScroll: false });
    update({ compareSyncScroll: true });

    expect(newPane.textContent).toBe(before);
    expect(newPane.querySelectorAll("[data-compare]").length).toBe(marks);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("al terminar la comparación (aceptar) se retira todo", async () => {
    const disconnects: number[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {
          disconnects.push(1);
        }
      },
    );
    const { onCompareDecision } = await setup(original, current);
    expect(disconnects).toEqual([]);

    await userEvent.click(screen.getByRole("button", { name: "Aceptar cambio" }));

    expect(onCompareDecision).toHaveBeenCalled();
    expect(disconnects.length).toBeGreaterThan(0);
    expect(screen.queryByRole("group", { name: /^Contenido original/ })).toBeNull();
  });

  it("también sincroniza con onlyView y sin barra de herramientas", async () => {
    const { originalPane, newPane } = await setup(original, current, {
      onlyView: true,
      showToolbar: false,
    });

    scrollPane(originalPane, 800);
    expect(newPane.scrollTop).toBe(1100);
  });
});

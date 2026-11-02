import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MarkdownEditor } from "../../src";
import type { MarkdownEditorHandle } from "../../src";
import { setupEditor } from "./helpers";

// Mermaid se mockea igual que en mermaid.test.tsx: aquí solo importa el
// comportamiento del cursor, no el motor de renderizado.
vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    parse: vi.fn().mockResolvedValue(false),
    render: vi.fn(),
  },
}));

const TABLE_MD = "| A | B |\n| - | - |\n| 1 | 2 |\n";
const CODE_MD = "```js\nconst a = 1\n```\n";
const MERMAID_MD = "```mermaid\ngraph TD\nA-->B\n```\n";

function lastChild(pm: HTMLElement): Element {
  return pm.lastElementChild as Element;
}

function expectTrailingEmptyParagraph(pm: HTMLElement): void {
  const last = lastChild(pm);
  expect(last.tagName).toBe("P");
  expect(last.textContent).toBe("");
}

/** `mousedown` sobre el área libre del contenedor de edición (debajo del contenido). */
function clickBlankArea(pm: HTMLElement): void {
  fireEvent.mouseDown(pm);
}

describe("US1: línea posterior tras una tabla final", () => {
  it("añade un párrafo vacío tras la tabla al cargar sin emitir onChange", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: TABLE_MD });

    expect(pm.children[0]?.querySelector("table")).not.toBeNull();
    expectTrailingEmptyParagraph(pm);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clic a la derecha de la tabla (wrapper) coloca el cursor tras la tabla", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: TABLE_MD });

    const wrapper = pm.querySelector(".tableWrapper") as HTMLElement;
    fireEvent.mouseDown(wrapper);
    await userEvent.keyboard("hola");

    expect(onChange).toHaveBeenLastCalledWith(`${TABLE_MD}\nhola\n`);
    expect(pm.querySelector("td")?.textContent).toBe("1");
  });

  it("clic debajo de la tabla coloca el cursor tras la tabla", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: TABLE_MD });

    clickBlankArea(pm);
    await userEvent.keyboard("hola");

    expect(onChange).toHaveBeenLastCalledWith(`${TABLE_MD}\nhola\n`);
  });

  it("Enter desde la línea posterior crea otra línea en blanco sin alterar el Markdown", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: TABLE_MD });
    const before = pm.children.length;

    clickBlankArea(pm);
    await userEvent.keyboard("{Enter}");

    expect(pm.children.length).toBe(before + 1);
    expectTrailingEmptyParagraph(pm);
    expect(lastChild(pm).previousElementSibling?.tagName).toBe("P");

    await userEvent.keyboard("fin");
    expect(onChange).toHaveBeenLastCalledWith(`${TABLE_MD}\nfin\n`);
  });
});

describe("US2: línea posterior tras código y Mermaid finales", () => {
  it("bloque de código final: clic libre + escribir queda fuera del bloque", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: CODE_MD });
    expectTrailingEmptyParagraph(pm);
    const codeBefore = pm.querySelector("pre")?.textContent;

    clickBlankArea(pm);
    await userEvent.keyboard("hola");

    expect(onChange).toHaveBeenLastCalledWith(`${CODE_MD}\nhola\n`);
    expect(pm.querySelector("pre")?.textContent).toBe(codeBefore);
  });

  it("bloque de código final: Enter desde la línea posterior no altera el bloque", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: CODE_MD });
    const codeBefore = pm.querySelector("pre")?.textContent;

    clickBlankArea(pm);
    await userEvent.keyboard("{Enter}{Enter}fin");

    expect(onChange).toHaveBeenLastCalledWith(`${CODE_MD}\nfin\n`);
    expect(pm.querySelector("pre")?.textContent).toBe(codeBefore);
  });

  it("diagrama Mermaid final: clic libre + escribir queda fuera del diagrama", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: MERMAID_MD });
    expectTrailingEmptyParagraph(pm);

    clickBlankArea(pm);
    await userEvent.keyboard("hola");

    expect(onChange).toHaveBeenLastCalledWith(`${MERMAID_MD}\nhola\n`);
    expect(pm.querySelector("[data-mermaid-block]")).not.toBeNull();
  });
});

describe("US3: línea posterior tras otros bloques finales", () => {
  it.each([
    ["cita", "> hi\n", "blockquote"],
    ["regla horizontal", "texto\n\n---\n", "hr"],
    ["imagen", "![a](http://x/y.png)\n", "img"],
    ["lista", "- a\n- b\n", "ul"],
  ])("%s final: clic libre + escribir queda tras el elemento", async (_n, md, selector) => {
    const { onChange, pm } = await setupEditor({ initialContent: md });
    expectTrailingEmptyParagraph(pm);
    expect(pm.querySelector(selector)).not.toBeNull();

    clickBlankArea(pm);
    await userEvent.keyboard("hola");

    const result = onChange.mock.lastCall?.[0] as string;
    expect(result.endsWith("\nhola\n")).toBe(true);
    expect(pm.querySelector(selector)?.textContent ?? "").not.toContain("hola");
  });

  it("lista final: Enter desde la línea posterior no anida ni altera la lista", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: "- a\n- b\n" });

    clickBlankArea(pm);
    await userEvent.keyboard("{Enter}fin");

    expect(onChange).toHaveBeenLastCalledWith("- a\n- b\n\nfin\n");
  });
});

describe("US4: sin efectos secundarios", () => {
  it("documento terminado en párrafo: no añade párrafo extra y escribe al final de ese párrafo", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: "hola\n" });
    expect(pm.children.length).toBe(1);

    clickBlankArea(pm);
    await userEvent.keyboard(" mundo");

    expect(pm.children.length).toBe(1);
    expect(onChange).toHaveBeenLastCalledWith("hola mundo\n");
  });

  it("clic libre sin escribir no emite onChange ni marca el documento como modificado", async () => {
    const ref = createRef<MarkdownEditorHandle>();
    const onChange = vi.fn();
    render(
      <MarkdownEditor ref={ref} initialContent={TABLE_MD} onChange={onChange} />,
    );
    const pm = await screen.findByRole("textbox", {
      name: "Editor de texto enriquecido",
    });

    clickBlankArea(pm);
    fireEvent.mouseDown(pm.querySelector(".tableWrapper") as HTMLElement);

    expect(onChange).not.toHaveBeenCalled();
    expect(ref.current?.isModified()).toBe(false);
  });

  it("en onlyView no hay línea posterior auxiliar", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD, onlyView: true });

    expect(lastChild(pm).querySelector("table")).not.toBeNull();
    expect(pm.querySelector(":scope > p")).toBeNull();
  });

  it("mousedown dentro de una celda no se redirige", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    // fireEvent devuelve false cuando el manejador llamó a preventDefault.
    expect(fireEvent.mouseDown(pm.querySelector("td") as HTMLElement)).toBe(
      true,
    );
    expect(fireEvent.mouseDown(pm.querySelector("th") as HTMLElement)).toBe(
      true,
    );
  });

  it("mousedown en el área libre sí se redirige a la línea posterior", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    expect(fireEvent.mouseDown(pm)).toBe(false);
    expect(
      fireEvent.mouseDown(pm.querySelector(".tableWrapper") as HTMLElement),
    ).toBe(false);
  });

  it("si ya existe un párrafo vacío posterior no se crea otro", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    const count = pm.children.length;

    clickBlankArea(pm);
    fireEvent.mouseDown(pm.querySelector(".tableWrapper") as HTMLElement);

    expect(pm.children.length).toBe(count);
  });

  it("deshacer tras escribir en la línea posterior no daña el bloque", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: TABLE_MD });

    clickBlankArea(pm);
    await userEvent.keyboard("hola");
    await userEvent.keyboard("{Control>}z{/Control}");

    expect(pm.querySelector("td")?.textContent).toBe("1");
    expect(onChange).toHaveBeenLastCalledWith(TABLE_MD);
  });
});

function rect(top: number, bottom: number): DOMRect {
  return {
    top,
    bottom,
    left: 0,
    right: 0,
    width: 0,
    height: bottom - top,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
}

function stubRect(el: Element, top: number, bottom: number): void {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue(rect(top, bottom));
}

describe("US5: línea entre una tabla y el bloque siguiente (no final)", () => {
  const TABLE_THEN_CODE = `${TABLE_MD}\n${CODE_MD}`;

  it("clic a la derecha de la tabla deja un cursor de hueco antes del bloque siguiente", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_THEN_CODE });
    const wrapper = pm.querySelector(".tableWrapper") as HTMLElement;

    fireEvent.mouseDown(wrapper);

    const gap = pm.querySelector(".ProseMirror-gapcursor");
    expect(gap).not.toBeNull();
    expect(wrapper.nextElementSibling).toBe(gap);
    expect(gap?.nextElementSibling?.tagName).toBe("PRE");
  });

  it("Enter desde ese cursor añade una línea en blanco entre la tabla y el código", async () => {
    const { onChange, pm } = await setupEditor({
      initialContent: TABLE_THEN_CODE,
    });
    const wrapper = pm.querySelector(".tableWrapper") as HTMLElement;

    fireEvent.mouseDown(wrapper);
    await userEvent.keyboard("{Enter}");

    const between = wrapper.nextElementSibling;
    expect(between?.tagName).toBe("P");
    expect(between?.textContent).toBe("");
    expect(between?.nextElementSibling?.tagName).toBe("PRE");

    await userEvent.keyboard("hola");
    expect(onChange).toHaveBeenLastCalledWith(
      `${TABLE_MD}\nhola\n\n${CODE_MD}`,
    );
  });

  it("clic a la derecha de la tabla seguida de texto: Enter inserta la línea entre ambos", async () => {
    const { onChange, pm } = await setupEditor({
      initialContent: `${TABLE_MD}\ntexto\n`,
    });

    fireEvent.mouseDown(pm.querySelector(".tableWrapper") as HTMLElement);
    await userEvent.keyboard("{Enter}nuevo");

    expect(onChange).toHaveBeenLastCalledWith(
      `${TABLE_MD}\nnuevo\n\ntexto\n`,
    );
  });

  it("clic sobre el margen superior de una tabla inicial permite escribir antes de ella", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: TABLE_MD });
    const wrapper = pm.querySelector(".tableWrapper") as HTMLElement;
    stubRect(wrapper.querySelector("table") as HTMLElement, 100, 200);

    fireEvent.mouseDown(wrapper, { clientY: 50 });
    await userEvent.keyboard("{Enter}arriba");

    expect(onChange).toHaveBeenLastCalledWith(`arriba\n\n${TABLE_MD}`);
  });

  it("clic en el hueco entre la tabla y el bloque siguiente (fuera de ambos) deja el cursor de hueco", async () => {
    const { pm } = await setupEditor({
      initialContent: `${TABLE_MD}\n${CODE_MD}`,
    });
    const [wrapper, pre, trailing] = Array.from(pm.children);
    stubRect(wrapper as Element, 0, 100);
    stubRect(pre as Element, 120, 200);
    stubRect(trailing as Element, 210, 230);

    expect(fireEvent.mouseDown(pm, { clientY: 110 })).toBe(false);

    expect(pm.querySelector(".ProseMirror-gapcursor")).not.toBeNull();
  });

  it("clic en el hueco entre dos párrafos no se redirige", async () => {
    const { pm } = await setupEditor({ initialContent: "uno\n\ndos\n" });
    const [p1, p2] = Array.from(pm.children);
    stubRect(p1 as Element, 0, 20);
    stubRect(p2 as Element, 40, 60);

    expect(fireEvent.mouseDown(pm, { clientY: 30 })).toBe(true);
  });
});

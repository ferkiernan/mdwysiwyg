import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupEditor, openTableMenuViaTrigger, placeCaretIn } from "./helpers";

const TABLE_MD = [
  "| A | B |",
  "| - | - |",
  "| 1 | 2 |",
  "| 3 | 4 |",
  "",
].join("\n");

const ROW_TRIGGER = { name: "Abrir acciones de fila" };
const COLUMN_TRIGGER = { name: "Abrir acciones de columna" };
const ROW_MENU = { name: "Acciones de fila" };
const COLUMN_MENU = { name: "Acciones de columna" };

function dataRows(pm: HTMLElement): HTMLElement[] {
  return Array.from(pm.querySelectorAll("tr")).filter(
    (row) => row.querySelector("td") !== null,
  ) as HTMLElement[];
}

function dataCell(pm: HTMLElement, row: number, col = 0): HTMLElement {
  return dataRows(pm)[row]?.querySelectorAll("td")[col] as HTMLElement;
}

function headerCell(pm: HTMLElement, col = 0): HTMLElement {
  return pm.querySelectorAll("th")[col] as HTMLElement;
}

function firstColumnTexts(pm: HTMLElement): string[] {
  return dataRows(pm).map((row) => row.querySelector("td")?.textContent ?? "");
}

describe("US1: disparador de menú en la esquina de la celda", () => {
  describe("visibilidad al pasar el puntero", () => {
    it("celda de datos: muestra el disparador de fila", async () => {
      const { pm } = await setupEditor({ initialContent: TABLE_MD });
      expect(screen.queryByRole("button", ROW_TRIGGER)).toBeNull();

      await userEvent.hover(dataCell(pm, 0));

      expect(screen.getByRole("button", ROW_TRIGGER)).toBeInTheDocument();
      expect(screen.queryByRole("button", COLUMN_TRIGGER)).toBeNull();
    });

    it("celda de encabezado: muestra el disparador de columna", async () => {
      const { pm } = await setupEditor({ initialContent: TABLE_MD });

      await userEvent.hover(headerCell(pm));

      expect(screen.getByRole("button", COLUMN_TRIGGER)).toBeInTheDocument();
      expect(screen.queryByRole("button", ROW_TRIGGER)).toBeNull();
    });

    it("se oculta al salir de la celda", async () => {
      const { pm } = await setupEditor({ initialContent: TABLE_MD });
      const cell = dataCell(pm, 0);
      await userEvent.hover(cell);
      expect(screen.getByRole("button", ROW_TRIGGER)).toBeInTheDocument();

      await userEvent.unhover(cell);

      expect(screen.queryByRole("button", ROW_TRIGGER)).toBeNull();
    });

    it("sigue visible al pasar de la celda al propio disparador", async () => {
      const { pm } = await setupEditor({ initialContent: TABLE_MD });
      const cell = dataCell(pm, 0);
      await userEvent.hover(cell);
      const trigger = screen.getByRole("button", ROW_TRIGGER);

      fireEvent.mouseOut(cell, { relatedTarget: trigger });

      expect(screen.getByRole("button", ROW_TRIGGER)).toBeInTheDocument();
    });

    it("cambia a la celda sobre la que está el puntero", async () => {
      const { pm } = await setupEditor({ initialContent: TABLE_MD });
      await userEvent.hover(dataCell(pm, 0));
      await userEvent.hover(headerCell(pm));

      expect(screen.getByRole("button", COLUMN_TRIGGER)).toBeInTheDocument();
      expect(screen.queryByRole("button", ROW_TRIGGER)).toBeNull();
    });

    it("no aparece fuera de las tablas", async () => {
      const { pm } = await setupEditor({
        initialContent: `Texto previo\n\n${TABLE_MD}`,
      });

      await userEvent.hover(pm.querySelector("p") as HTMLElement);

      expect(screen.queryByRole("button", ROW_TRIGGER)).toBeNull();
      expect(screen.queryByRole("button", COLUMN_TRIGGER)).toBeNull();
    });
  });

  describe("apertura del menú con un clic", () => {
    it("encabezado: abre 'Acciones de columna' con las 5 acciones en orden", async () => {
      const { pm } = await setupEditor({ initialContent: TABLE_MD });
      await openTableMenuViaTrigger(headerCell(pm));

      await screen.findByRole("menu", COLUMN_MENU);
      expect(
        screen.getAllByRole("menuitem").map((item) => item.textContent),
      ).toEqual([
        "Añadir columna a la derecha",
        "Añadir columna a la izquierda",
        "Mover columna a la derecha",
        "Mover columna a la izquierda",
        "Eliminar esta columna",
      ]);
    });

    it("celda de datos: abre 'Acciones de fila' con las 5 acciones en orden", async () => {
      const { pm } = await setupEditor({ initialContent: TABLE_MD });
      await openTableMenuViaTrigger(dataCell(pm, 0));

      await screen.findByRole("menu", ROW_MENU);
      expect(
        screen.getAllByRole("menuitem").map((item) => item.textContent),
      ).toEqual([
        "Añadir fila arriba",
        "Añadir fila abajo",
        "Subir esta fila",
        "Bajar esta fila",
        "Eliminar esta fila",
      ]);
    });

    it("expone aria-haspopup y aria-expanded según el estado del menú", async () => {
      const { pm } = await setupEditor({ initialContent: TABLE_MD });
      await userEvent.hover(dataCell(pm, 0));
      const trigger = screen.getByRole("button", ROW_TRIGGER);
      expect(trigger).toHaveAttribute("aria-haspopup", "menu");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await userEvent.click(trigger);

      await screen.findByRole("menu", ROW_MENU);
      expect(screen.getByRole("button", ROW_TRIGGER)).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    it("el disparador sigue visible mientras su menú está abierto", async () => {
      const { pm } = await setupEditor({ initialContent: TABLE_MD });
      const cell = dataCell(pm, 0);
      await openTableMenuViaTrigger(cell);
      await screen.findByRole("menu", ROW_MENU);

      await userEvent.unhover(cell);

      expect(screen.getByRole("button", ROW_TRIGGER)).toBeInTheDocument();
    });

    it("no requiere un clic previo en la celda ni modifica su contenido", async () => {
      const { pm, onChange } = await setupEditor({ initialContent: TABLE_MD });
      await openTableMenuViaTrigger(dataCell(pm, 0));

      await screen.findByRole("menu", ROW_MENU);
      expect(onChange).not.toHaveBeenCalled();
      expect(dataCell(pm, 0).textContent).toBe("1");
    });
  });

  describe("la acción se aplica a la celda del disparador", () => {
    it("'Añadir fila abajo' desde la segunda fila inserta tras la segunda fila", async () => {
      const { pm } = await setupEditor({ initialContent: TABLE_MD });
      await openTableMenuViaTrigger(dataCell(pm, 1));
      await userEvent.click(
        await screen.findByRole("menuitem", { name: "Añadir fila abajo" }),
      );

      expect(firstColumnTexts(pm)).toEqual(["1", "3", ""]);
    });

    it("'Añadir columna a la derecha' desde el segundo encabezado inserta tras B", async () => {
      const { pm } = await setupEditor({ initialContent: TABLE_MD });
      await openTableMenuViaTrigger(headerCell(pm, 1));
      await userEvent.click(
        await screen.findByRole("menuitem", {
          name: "Añadir columna a la derecha",
        }),
      );

      expect(
        Array.from(pm.querySelectorAll("th")).map((th) => th.textContent),
      ).toEqual(["A", "B", ""]);
    });
  });

  describe("no forma parte del documento", () => {
    it("no aparece con onlyView", async () => {
      const { pm } = await setupEditor({
        initialContent: TABLE_MD,
        onlyView: true,
      });

      await userEvent.hover(dataCell(pm, 0));
      await userEvent.hover(headerCell(pm));

      expect(screen.queryByRole("button", ROW_TRIGGER)).toBeNull();
      expect(screen.queryByRole("button", COLUMN_TRIGGER)).toBeNull();
    });

    it("desaparece al cambiar a la vista Markdown", async () => {
      const { pm } = await setupEditor({ initialContent: TABLE_MD });
      await userEvent.hover(dataCell(pm, 0));
      expect(screen.getByRole("button", ROW_TRIGGER)).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", { name: "Ver código Markdown" }),
      );

      expect(screen.queryByRole("button", ROW_TRIGGER)).toBeNull();
    });

    it("el Markdown emitido nunca contiene el disparador", async () => {
      const { pm, onChange } = await setupEditor({ initialContent: TABLE_MD });
      await openTableMenuViaTrigger(dataCell(pm, 0));
      await userEvent.click(
        await screen.findByRole("menuitem", { name: "Añadir fila abajo" }),
      );

      expect(onChange).toHaveBeenCalled();
      for (const [markdown] of onChange.mock.calls as [string][]) {
        expect(markdown).not.toContain("Abrir acciones");
      }
      expect(pm.textContent).not.toContain("Abrir acciones");
    });
  });

  describe("acceso por teclado", () => {
    it("Shift+F10 con el cursor en una celda de datos abre el menú de fila", async () => {
      const { pm } = await setupEditor({ initialContent: TABLE_MD });
      await placeCaretIn(dataCell(pm, 0));

      fireEvent.keyDown(pm, { key: "F10", shiftKey: true });

      await screen.findByRole("menu", ROW_MENU);
      expect(
        screen.getByRole("menuitem", { name: "Añadir fila arriba" }),
      ).toHaveFocus();
    });

    it("la tecla ContextMenu con el cursor en un encabezado abre el menú de columna", async () => {
      const { pm } = await setupEditor({ initialContent: TABLE_MD });
      await placeCaretIn(headerCell(pm));

      fireEvent.keyDown(pm, { key: "ContextMenu" });

      await screen.findByRole("menu", COLUMN_MENU);
    });

    it("con el cursor fuera de una tabla no abre ningún menú", async () => {
      const { pm } = await setupEditor({
        initialContent: `Texto previo\n\n${TABLE_MD}`,
      });
      await placeCaretIn(pm.querySelector("p") as HTMLElement);

      fireEvent.keyDown(pm, { key: "F10", shiftKey: true });
      fireEvent.keyDown(pm, { key: "ContextMenu" });

      expect(screen.queryByRole("menu")).toBeNull();
    });
  });
});

describe("US2: el segundo clic ya no abre el menú", () => {
  it("dos clics sobre la misma celda de encabezado no abren ningún menú", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    const th = headerCell(pm);

    await userEvent.click(th);
    await userEvent.click(th);

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("dos clics sobre la misma celda de datos no abren ningún menú", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    const td = dataCell(pm, 0);

    await userEvent.click(td);
    await userEvent.click(td);

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("doble clic sobre el texto de una celda no abre ningún menú", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });

    await userEvent.dblClick(dataCell(pm, 0));

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("un enlace dentro de una celda abre el popover de enlace", async () => {
    const { pm } = await setupEditor({
      initialContent: [
        "| A | B |",
        "| - | - |",
        "| [sitio](https://ejemplo.com) | 2 |",
        "",
      ].join("\n"),
    });

    await userEvent.click(pm.querySelector("td a") as HTMLElement);

    expect(
      screen.getByRole("menuitem", { name: "Ir a la url" }),
    ).toBeInTheDocument();
  });
});

describe("US3: afordancia del triángulo", () => {
  it("el puntero sobre el disparador es el de enlace (pointer)", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    await userEvent.hover(dataCell(pm, 0));

    const trigger = screen.getByRole("button", ROW_TRIGGER);

    expect(getComputedStyle(trigger).cursor).toBe("pointer");
  });

  it("tiene forma de triángulo rectángulo con el ángulo recto arriba a la derecha", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    await userEvent.hover(dataCell(pm, 0));

    const trigger = screen.getByRole("button", ROW_TRIGGER);

    expect(getComputedStyle(trigger).clipPath.replace(/\s+/g, "")).toBe(
      "polygon(00,100%0,100%100%)",
    );
  });
});

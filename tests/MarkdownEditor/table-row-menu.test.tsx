import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupEditor, selectAll } from "./helpers";

const TABLE_MD = [
  "| A | B |",
  "| - | - |",
  "| 1 | 2 |",
  "| 3 | 4 |",
  "",
].join("\n");

const MENU = { name: "Acciones de fila" };

/** Primera celda de datos de la fila `index` (0 = primera fila de datos). */
function dataCell(pm: HTMLElement, index: number): HTMLElement {
  const dataRows = Array.from(pm.querySelectorAll("tr")).filter(
    (row) => row.querySelector("td") !== null,
  );
  return dataRows[index]?.querySelector("td") as HTMLElement;
}

describe("US2: menú de fila (celda de datos)", () => {
  it("el primer clic sobre una celda de datos no abre el menú", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    await userEvent.click(dataCell(pm, 0));

    expect(screen.queryByRole("menu", MENU)).toBeNull();
  });

  it("el segundo clic sobre la misma celda abre el menú con las 5 acciones en orden", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    const cell = dataCell(pm, 0);
    await userEvent.click(cell);
    await userEvent.click(cell);

    await screen.findByRole("menu", MENU);
    const items = screen.getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Añadir fila arriba",
      "Añadir fila abajo",
      "Subir esta fila",
      "Bajar esta fila",
      "Eliminar esta fila",
    ]);
  });

  it("con contenido seleccionado (arrastre) el segundo clic no abre el menú", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    const cell = dataCell(pm, 0);
    await userEvent.click(cell);
    selectAll(pm);
    await userEvent.click(cell);

    expect(screen.queryByRole("menu", MENU)).toBeNull();
  });

  it("'Añadir fila abajo' inserta una fila nueva", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    const cell = dataCell(pm, 0);
    await userEvent.click(cell);
    await userEvent.click(cell);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Añadir fila abajo" }),
    );

    expect(pm.querySelectorAll("tr")).toHaveLength(4);
    expect(screen.queryByRole("menu", MENU)).toBeNull();
  });

  it("'Eliminar esta fila' elimina la fila completa", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: TABLE_MD });
    const cell = dataCell(pm, 0);
    await userEvent.click(cell);
    await userEvent.click(cell);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Eliminar esta fila" }),
    );

    expect(pm.querySelectorAll("tr")).toHaveLength(2);
    const markdown = onChange.mock.lastCall?.[0] as string;
    expect(markdown).not.toContain("| 1 ");
  });

  it("'Bajar esta fila' intercambia con la fila siguiente", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    const cell = dataCell(pm, 0);
    await userEvent.click(cell);
    await userEvent.click(cell);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Bajar esta fila" }),
    );

    expect(dataCell(pm, 0).textContent).toBe("3");
    expect(dataCell(pm, 1).textContent).toBe("1");
  });

  it("subir la primera fila de datos no la mueve al encabezado", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    const cell = dataCell(pm, 0);
    await userEvent.click(cell);
    await userEvent.click(cell);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Subir esta fila" }),
    );

    expect(Array.from(pm.querySelectorAll("th")).map((c) => c.textContent))
      .toEqual(["A", "B"]);
    expect(dataCell(pm, 0).textContent).toBe("1");
  });
});

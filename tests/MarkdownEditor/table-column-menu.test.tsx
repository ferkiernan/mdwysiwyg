import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupEditor, openTableMenuViaTrigger } from "./helpers";

const TABLE_MD = [
  "| A | B | C |",
  "| - | - | - |",
  "| 1 | 2 | 3 |",
  "",
].join("\n");

const MENU = { name: "Acciones de columna" };

describe("US2: menú de columna (celda de encabezado)", () => {
  it("'Añadir columna a la derecha' inserta una columna nueva", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    const th = pm.querySelectorAll("th")[0] as HTMLElement;
    await openTableMenuViaTrigger(th);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Añadir columna a la derecha" }),
    );

    expect(pm.querySelectorAll("th")).toHaveLength(4);
    expect(screen.queryByRole("menu", MENU)).toBeNull();
  });

  it("'Eliminar esta columna' elimina encabezado y celdas de esa columna", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: TABLE_MD });
    const th = pm.querySelectorAll("th")[0] as HTMLElement;
    await openTableMenuViaTrigger(th);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Eliminar esta columna" }),
    );

    expect(pm.querySelectorAll("th")).toHaveLength(2);
    const markdown = onChange.mock.lastCall?.[0] as string;
    expect(markdown).not.toContain("| A ");
  });

  it("'Mover columna a la derecha' intercambia con la columna adyacente", async () => {
    const { onChange, pm } = await setupEditor({ initialContent: TABLE_MD });
    const th = pm.querySelectorAll("th")[0] as HTMLElement;
    await openTableMenuViaTrigger(th);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Mover columna a la derecha" }),
    );

    const headers = Array.from(pm.querySelectorAll("th")).map(
      (cell) => cell.textContent,
    );
    expect(headers).toEqual(["B", "A", "C"]);
    expect(onChange).toHaveBeenCalled();
  });

  it("mover la primera columna a la izquierda no tiene efecto", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    const th = pm.querySelectorAll("th")[0] as HTMLElement;
    await openTableMenuViaTrigger(th);
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Mover columna a la izquierda" }),
    );

    const headers = Array.from(pm.querySelectorAll("th")).map(
      (cell) => cell.textContent,
    );
    expect(headers).toEqual(["A", "B", "C"]);
  });

  it("Escape cierra el menú sin aplicar cambios", async () => {
    const { pm } = await setupEditor({ initialContent: TABLE_MD });
    const th = pm.querySelectorAll("th")[0] as HTMLElement;
    await openTableMenuViaTrigger(th);
    await screen.findByRole("menu", MENU);

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("menu", MENU)).toBeNull();
    expect(pm.querySelectorAll("th")).toHaveLength(3);
  });
});

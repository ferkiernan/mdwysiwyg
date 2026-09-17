import { render, fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { vi } from "vitest";
import { TableSizePicker } from "../../src/components/MarkdownEditor/Toolbar/buttons/TableSizePicker";

// Convención: columnas × filas — "3 × 4" = 3 columnas y 4 filas
describe("TableSizePicker (componente reutilizable)", () => {
  function setup() {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const { container } = render(
      <TableSizePicker onSelect={onSelect} onClose={onClose} />,
    );
    const cell = (cols: number, rows: number) =>
      container.querySelector(`[data-cell="${cols}x${rows}"]`) as HTMLElement;
    const selected = () =>
      container.querySelectorAll('[data-selected="true"]');
    return { onSelect, onClose, container, cell, selected };
  }

  it("inicia sin ninguna celda seleccionada", () => {
    const { selected } = setup();
    expect(selected()).toHaveLength(0);
    expect(screen.getByText("Selecciona el tamaño")).toBeInTheDocument();
  });

  it("renderiza una cuadrícula de 10×10", () => {
    const { container } = setup();
    expect(container.querySelectorAll("[data-cell]")).toHaveLength(100);
  });

  it("al pasar por la celda (3,4) resalta 3 columnas × 4 filas y muestra '3 × 4'", () => {
    const { cell, selected } = setup();
    fireEvent.mouseEnter(cell(3, 4));
    expect(selected()).toHaveLength(12);
    expect(cell(3, 4).dataset["selected"]).toBe("true");
    expect(cell(4, 4).dataset["selected"]).toBe("false");
    expect(cell(3, 5).dataset["selected"]).toBe("false");
    expect(screen.getByText("3 × 4")).toBeInTheDocument();
  });

  it("mantiene la última selección al salir de la cuadrícula", () => {
    const { container, cell, selected } = setup();
    fireEvent.mouseEnter(cell(2, 2));
    const grid = container.querySelector('[role="group"]') as HTMLElement;
    fireEvent.mouseLeave(grid);
    expect(selected()).toHaveLength(4);
    expect(screen.getByText("2 × 2")).toBeInTheDocument();
  });

  it("al hacer clic confirma columnas × filas de la celda", () => {
    const { onSelect, cell } = setup();
    fireEvent.mouseEnter(cell(3, 4));
    fireEvent.click(cell(3, 4));
    expect(onSelect).toHaveBeenCalledWith({ cols: 3, rows: 4 });
  });

  it("es operable por teclado: flechas ajustan, Enter confirma", () => {
    const { onSelect, container } = setup();
    const grid = container.querySelector('[role="group"]') as HTMLElement;
    // La primera flecha parte de la celda 1×1
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(screen.getByText("1 × 1")).toBeInTheDocument();
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    expect(screen.getByText("2 × 2")).toBeInTheDocument();
    fireEvent.keyDown(grid, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith({ cols: 2, rows: 2 });
  });

  it("Escape cierra sin seleccionar", () => {
    const { onSelect, onClose, container } = setup();
    const grid = container.querySelector('[role="group"]') as HTMLElement;
    fireEvent.keyDown(grid, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});

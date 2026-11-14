import { afterEach, describe, it, expect, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupCompare, setupEditor } from "./helpers";

const LINK_MD = "Visitá [nuestro sitio](https://ejemplo.com)\n";
const MENU = { name: "Acciones del enlace" };

afterEach(() => vi.restoreAllMocks());

/** Dispara un clic cancelable y devuelve si se evitó la acción por defecto (navegar). */
function click(target: Element, init: MouseEventInit = {}): boolean {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init });
  target.dispatchEvent(event);
  return event.defaultPrevented;
}

const items = () => screen.getAllByRole("menuitem").map((item) => item.textContent);

describe("US1: un clic en un enlace nunca abre la dirección", () => {
  it("editor principal: clic simple y con Ctrl/Cmd/Shift muestran el menú completo sin navegar", async () => {
    const { pm } = await setupEditor({ initialContent: LINK_MD });
    const link = pm.querySelector("a") as HTMLElement;
    for (const modifiers of [{}, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) {
      expect(click(link, modifiers)).toBe(true);
      expect(await screen.findByRole("menu", MENU)).toBeInTheDocument();
      expect(items()).toContain("Editar url");
      fireEvent.keyDown(screen.getByRole("menu", MENU), { key: "Escape" });
    }
  });

  it("clic con la rueda: no abre nada", async () => {
    const { pm } = await setupEditor({ initialContent: LINK_MD });
    const link = pm.querySelector("a") as HTMLElement;
    const event = new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(screen.queryByRole("menu", MENU)).toBeNull();
  });

  it("panel original de la comparación: menú de solo lectura, sin navegar", async () => {
    const { originalPane } = await setupCompare({
      initialContent: LINK_MD,
      compareContent: "Visitá [otro sitio](https://otro.com)\n",
    });
    const link = originalPane.querySelector("a") as HTMLElement;
    expect(click(link)).toBe(true);
    expect(await screen.findByRole("menu", MENU)).toBeInTheDocument();
    expect(items()).toEqual(["Ir a la url", "Copiar url"]);
  });

  it("enlace dentro de HTML embebido: menú de solo lectura con su dirección", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const { pm } = await setupEditor({
      initialContent: '<div>Ver <a href="https://html.example">el sitio</a></div>\n',
    });
    const link = pm.querySelector("[data-html-block] a") as HTMLElement;
    expect(link).not.toBeNull();
    expect(click(link)).toBe(true);
    expect(await screen.findByRole("menu", MENU)).toBeInTheDocument();
    expect(items()).toEqual(["Ir a la url", "Copiar url"]);
    expect(openSpy).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("menuitem", { name: "Ir a la url" }));
    expect(openSpy).toHaveBeenCalledWith("https://html.example", "_blank", "noopener,noreferrer");
  });

  it("Enter sobre un enlace con foco muestra el menú en lugar de abrirlo", async () => {
    const { pm } = await setupEditor({
      initialContent: '<div><a href="https://html.example">foco</a></div>\n',
    });
    const link = pm.querySelector("[data-html-block] a") as HTMLElement;
    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(await screen.findByRole("menu", MENU)).toBeInTheDocument();
  });

  it("el clic derecho no se intercepta", async () => {
    const { pm } = await setupEditor({ initialContent: LINK_MD });
    const link = pm.querySelector("a") as HTMLElement;
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});

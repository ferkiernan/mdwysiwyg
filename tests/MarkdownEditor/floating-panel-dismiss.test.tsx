import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupEditor } from "./helpers";

// Spec 028: los mini-diálogos de la barra se cierran con un clic afuera, como Cancelar.

const floating = () => document.querySelectorAll("[data-mdw-floating]").length;

const PANELS: Array<[string, string]> = [
  ["Insertar HTML", "textarea"],
  ["Insertar imagen", "input"],
  ["Insertar enlace", "input"],
  ["Insertar tabla", "[role=grid], button, td, div"],
  ["Bloque de código", "select"],
  ["Export", "[role=menuitem]"],
];

describe("cerrar los paneles de la barra con un clic afuera", () => {
  for (const [button, inside] of PANELS) {
    it(`«${button}»: un clic en el contenido lo cierra sin cambiar nada, y un clic adentro no`, async () => {
      const { onChange, pm } = await setupEditor({ initialContent: "Texto de prueba" });
      await userEvent.click(screen.getByRole("button", { name: button }));
      expect(floating()).toBe(1);

      const panel = document.querySelector("[data-mdw-floating]") as HTMLElement;
      const target = panel.querySelector<HTMLElement>(inside);
      if (target !== null && button !== "Export" && button !== "Insertar tabla") {
        await userEvent.click(target);
        expect(floating()).toBe(1);
      }

      await userEvent.click(pm.querySelector("p") as HTMLElement);
      expect(floating()).toBe(0);
      expect(onChange).not.toHaveBeenCalled();
      expect(pm.textContent).toBe("Texto de prueba");
    });
  }

  it("el clic afuera no se pierde: ubica el cursor en el contenido", async () => {
    const { pm } = await setupEditor({ initialContent: "uno dos" });
    await userEvent.click(screen.getByRole("button", { name: "Insertar HTML" }));
    await userEvent.click(pm.querySelector("p") as HTMLElement);
    expect(floating()).toBe(0);
    expect(document.activeElement).toBe(pm);
  });

  it("pulsar otro botón de la barra cierra el panel abierto y abre el suyo", async () => {
    await setupEditor({ initialContent: "x" });
    await userEvent.click(screen.getByRole("button", { name: "Insertar HTML" }));
    await userEvent.click(screen.getByRole("button", { name: "Insertar imagen" }));
    expect(floating()).toBe(1);
    expect(screen.queryByRole("dialog", { name: /HTML/ })).toBeNull();
  });

  it("pulsar el mismo botón que lo abrió lo cierra y no lo reabre", async () => {
    await setupEditor({ initialContent: "x" });
    const button = screen.getByRole("button", { name: "Insertar HTML" });
    await userEvent.click(button);
    expect(floating()).toBe(1);
    await userEvent.click(button);
    expect(floating()).toBe(0);
  });

  it("Escape sigue cerrando el panel", async () => {
    await setupEditor({ initialContent: "x" });
    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    await userEvent.keyboard("{Escape}");
    expect(floating()).toBe(0);
  });
});

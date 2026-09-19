import { screen } from "@testing-library/react";
import { setupEditor } from "./helpers";

describe("US1: aviso configurable en modo de solo lectura", () => {
  it("muestra el texto por defecto cuando no se personaliza", async () => {
    await setupEditor({ onlyView: true, initialContent: "Hola" });
    expect(screen.getByText("Edición desactivada")).toBeInTheDocument();
  });

  it("muestra el texto personalizado en lugar del aviso genérico", async () => {
    await setupEditor({
      onlyView: true,
      onlyViewNotice: "informe-final.md",
      initialContent: "Hola",
    });
    expect(screen.getByText("informe-final.md")).toBeInTheDocument();
    expect(screen.queryByText("Edición desactivada")).not.toBeInTheDocument();
  });

  it("no muestra ningún aviso cuando onlyView está desactivado", async () => {
    await setupEditor({ onlyViewNotice: "informe-final.md" });
    expect(screen.queryByText("informe-final.md")).not.toBeInTheDocument();
  });
});

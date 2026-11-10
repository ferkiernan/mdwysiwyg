import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../../src";
import {
  HISTORY_BAR,
  HISTORY_BUTTON,
  formatTime,
  makeVersions,
  openHistoryMode,
  setupHistory,
  typeInEditor,
  advanceIdle,
  versionItems,
  viewedPosition,
} from "./helpers";

afterEach(() => {
  vi.useRealTimers();
});

const undoButton = () => screen.getByRole("button", { name: "Undo" });
const redoButton = () => screen.getByRole("button", { name: "Redo" });

describe("history icon and opening (US2)", () => {
  it("sits right after the HTML button, before Export, and exposes its state", async () => {
    await setupHistory();
    const toolbar = screen.getByRole("toolbar", { name: "Barra de herramientas" });
    const names = within(toolbar)
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label"));
    const html = names.indexOf("Insertar HTML");
    expect(html).toBeGreaterThan(-1);
    expect(names[html + 1]).toBe("Historial de versiones");
    expect(names[html + 2]).toBe("Export");
    expect(names[names.length - 1]).toBe("Export");

    const icon = screen.getByRole("button", HISTORY_BUTTON);
    expect(icon).toHaveAttribute("aria-pressed", "false");
    await openHistoryMode();
    expect(icon).toHaveAttribute("aria-pressed", "true");
  });

  it("is absent with onlyView, without the prop, with the toolbar hidden and in compare mode", async () => {
    const { update } = await setupHistory({ onlyView: true });
    expect(screen.queryByRole("button", HISTORY_BUTTON)).not.toBeInTheDocument();
    update({ onlyView: false });
    expect(await screen.findByRole("button", HISTORY_BUTTON)).toBeInTheDocument();
    update({ showToolbar: false });
    expect(screen.queryByRole("button", HISTORY_BUTTON)).not.toBeInTheDocument();
    update({ showToolbar: true, mode: "compare", compareOrientation: "side-to-side", compareContent: "otro" });
    await screen.findByRole("group", { name: "Contenido original (solo lectura)" });
    expect(screen.queryByRole("button", HISTORY_BUTTON)).not.toBeInTheDocument();
  });

  it("opens the bar under the toolbar and the list on the right, and closes on a second click", async () => {
    await setupHistory();
    expect(screen.queryByRole("toolbar", HISTORY_BAR)).not.toBeInTheDocument();
    await openHistoryMode();

    const bar = screen.getByRole("toolbar", HISTORY_BAR);
    for (const name of ["Undo", "Redo", "Confirm", "Cancel (back to last version)"]) {
      expect(within(bar).getByRole("button", { name })).toBeInTheDocument();
    }
    const toolbar = screen.getByRole("toolbar", { name: "Barra de herramientas" });
    expect(
      toolbar.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const list = screen.getByRole("navigation", HISTORY_BUTTON);
    const content = screen.getByRole("group", { name: /^Historial: contenido/ });
    expect(
      content.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await openHistoryMode();
    expect(screen.queryByRole("toolbar", HISTORY_BAR)).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", HISTORY_BUTTON)).not.toBeInTheDocument();
  });

  it("saves a pending change as a version before opening", async () => {
    const { pm } = await setupHistory();
    await typeInEditor(pm, "z");
    await openHistoryMode();
    expect(versionItems()).toHaveLength(2);
  });
});

describe("undo and redo (US3)", () => {
  it("starts on the latest version, with Redo unavailable", async () => {
    const { pm } = await setupHistory();
    await makeVersions(pm, "ab");
    await openHistoryMode();
    expect(versionItems()).toHaveLength(3);
    expect(viewedPosition()).toBe(0);
    expect(redoButton()).toHaveAttribute("aria-disabled", "true");
    expect(undoButton()).toHaveAttribute("aria-disabled", "false");
  });

  it("moves through the versions, showing each one's content and highlighting it", async () => {
    const { pm } = await setupHistory();
    const texts = await makeVersions(pm, "abc");
    await openHistoryMode();

    await userEvent.click(undoButton());
    expect(pm).toHaveTextContent(texts[2] ?? "", { normalizeWhitespace: true });
    expect(viewedPosition()).toBe(1);

    await userEvent.click(undoButton());
    expect(pm.textContent).toBe(texts[1]);
    expect(viewedPosition()).toBe(2);

    await userEvent.click(redoButton());
    expect(pm.textContent).toBe(texts[2]);
    expect(viewedPosition()).toBe(1);
  });

  it("disables Undo at the first version without losing keyboard focus", async () => {
    const { pm } = await setupHistory();
    await makeVersions(pm, "a");
    await openHistoryMode();
    undoButton().focus();
    await userEvent.keyboard("{Enter}");
    expect(undoButton()).toHaveAttribute("aria-disabled", "true");
    expect(undoButton()).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(viewedPosition()).toBe(1);
  });

  it("shows the local time of each version", async () => {
    const { pm } = await setupHistory();
    await makeVersions(pm, "ab");
    await openHistoryMode();
    for (const item of versionItems()) {
      const time = within(item).getByText(/\d+:\d{2}:\d{2}/);
      const iso = time.getAttribute("datetime") ?? "";
      expect(time.textContent).toBe(formatTime(new Date(iso).getTime()));
    }
  });

  it("never calls onChange while browsing and announces the position", async () => {
    const { pm, onChange } = await setupHistory();
    await makeVersions(pm, "abc");
    await openHistoryMode();
    const calls = onChange.mock.calls.length;
    expect(screen.getByRole("status")).toHaveTextContent(/^Versión 4 de 4/);
    await userEvent.click(undoButton());
    await userEvent.click(undoButton());
    expect(screen.getByRole("status")).toHaveTextContent(/^Versión 2 de 4/);
    await userEvent.click(redoButton());
    expect(onChange).toHaveBeenCalledTimes(calls);
  });

  it("makes the document read-only in both views and disables the editing controls", async () => {
    const { pm, onChange } = await setupHistory();
    const texts = await makeVersions(pm, "ab");
    await openHistoryMode();
    await userEvent.click(undoButton());
    const calls = onChange.mock.calls.length;

    expect(pm).toHaveAttribute("contenteditable", "false");
    await userEvent.type(pm, "intento");
    expect(pm.textContent).toBe(texts[1]);
    expect(screen.getByRole("button", { name: "Negrita" })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: "Nivel de encabezado" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Insertar tabla" })).toBeDisabled();

    // La vista Markdown sigue disponible y muestra la versión mostrada, en solo lectura.
    await userEvent.click(screen.getByRole("button", { name: "Ver código Markdown" }));
    const source = await screen.findByRole("textbox", { name: "Código fuente Markdown" });
    expect(source).toHaveAttribute("readonly");
    expect((source as HTMLTextAreaElement).value.trim()).toBe(texts[1]);
    await userEvent.type(source, "intento");
    expect((source as HTMLTextAreaElement).value.trim()).toBe(texts[1]);

    // Y recorrer versiones actualiza el texto fuente.
    await userEvent.click(undoButton());
    expect((source as HTMLTextAreaElement).value.trim()).toBe(texts[0]);
    expect(onChange).toHaveBeenCalledTimes(calls);
  });

  it("maps Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl+Y to Undo and Redo while open", async () => {
    const { pm } = await setupHistory();
    await makeVersions(pm, "abc");
    await openHistoryMode();

    fireEvent.keyDown(pm, { key: "z", ctrlKey: true });
    expect(viewedPosition()).toBe(1);
    fireEvent.keyDown(undoButton(), { key: "z", metaKey: true });
    expect(viewedPosition()).toBe(2);
    fireEvent.keyDown(pm, { key: "z", ctrlKey: true, shiftKey: true });
    expect(viewedPosition()).toBe(1);
    fireEvent.keyDown(pm, { key: "y", ctrlKey: true });
    expect(viewedPosition()).toBe(0);
    // En el límite no pasa nada.
    fireEvent.keyDown(pm, { key: "y", ctrlKey: true });
    expect(viewedPosition()).toBe(0);
  });

  it("leaves the shortcuts alone when history mode is closed", async () => {
    const { pm } = await setupHistory();
    await makeVersions(pm, "a");
    const proceeded = fireEvent.keyDown(pm, { key: "y", ctrlKey: true });
    expect(screen.queryByRole("navigation", HISTORY_BUTTON)).not.toBeInTheDocument();
    expect(proceeded).toBe(true);
  });
});

describe("version list (US5)", () => {
  it("lists newest first, keeps the viewed entry in view and shows versions saved meanwhile", async () => {
    const original = Element.prototype.scrollIntoView;
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      const { pm } = await setupHistory();
      await makeVersions(pm, "abcdefghijkl");
      await openHistoryMode();
      expect(versionItems()).toHaveLength(13);
      expect(viewedPosition()).toBe(0);

      scrollIntoView.mockClear();
      await userEvent.click(undoButton());
      await userEvent.click(undoButton());
      expect(scrollIntoView).toHaveBeenCalledTimes(2);
      expect(scrollIntoView.mock.contexts.at(-1)).toBe(
        versionItems()[viewedPosition()]?.querySelector("button"),
      );

      await userEvent.click(screen.getByRole("button", { name: "Cancel (back to last version)" }));
      await typeInEditor(pm, "m");
      await advanceIdle();
      await openHistoryMode();
      expect(versionItems()).toHaveLength(14);
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });
});

describe("jumping through the version list (US5, FR-022)", () => {
  const entry = (position: number) =>
    within(versionItems()[position] as HTMLElement).getByRole("button");

  it("shows the clicked version's content and continues from there with Undo / Redo", async () => {
    const { pm, onChange } = await setupHistory();
    const texts = await makeVersions(pm, "abcd");
    await openHistoryMode();
    const calls = onChange.mock.calls.length;

    // Posición 3 desde arriba = versión de índice 1.
    await userEvent.click(entry(3));
    expect(pm.textContent).toBe(texts[1]);
    expect(viewedPosition()).toBe(3);
    expect(redoButton()).toHaveAttribute("aria-disabled", "false");
    expect(screen.getByRole("status")).toHaveTextContent(/^Versión 2 de 5/);

    await userEvent.click(undoButton());
    expect(pm.textContent).toBe(texts[0]);
    expect(undoButton()).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(entry(0));
    expect(pm.textContent).toBe(texts[4]);
    expect(redoButton()).toHaveAttribute("aria-disabled", "true");
    expect(onChange).toHaveBeenCalledTimes(calls);
  });

  it("does nothing when the viewed entry is clicked and works with the keyboard", async () => {
    const { pm } = await setupHistory();
    const texts = await makeVersions(pm, "ab");
    await openHistoryMode();
    await userEvent.click(entry(0));
    expect(viewedPosition()).toBe(0);
    expect(pm.textContent).toBe(texts[2]);

    entry(2).focus();
    await userEvent.keyboard("{Enter}");
    expect(viewedPosition()).toBe(2);
    expect(pm.textContent).toBe(texts[0]);
    entry(1).focus();
    await userEvent.keyboard(" ");
    expect(viewedPosition()).toBe(1);
    expect(pm.textContent).toBe(texts[1]);
  });
});

describe("regression", () => {
  it("renders no history UI by default", () => {
    render(<MarkdownEditor />);
    expect(screen.queryByRole("button", HISTORY_BUTTON)).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  HISTORY_BAR,
  HISTORY_BUTTON,
  advanceIdle,
  makeVersions,
  openHistoryMode,
  setupHistory,
  versionItems,
  viewedPosition,
} from "./helpers";

afterEach(() => {
  vi.useRealTimers();
});

const undoButton = () => screen.getByRole("button", { name: "Undo" });
const confirmButton = () => screen.getByRole("button", { name: "Confirm" });
const backButton = () => screen.getByRole("button", { name: "Cancel (back to last version)" });
const editorBox = () =>
  screen.getByRole("textbox", { name: "Editor de texto enriquecido" });

const historyClosed = () => {
  expect(screen.queryByRole("toolbar", HISTORY_BAR)).not.toBeInTheDocument();
  expect(screen.queryByRole("navigation", HISTORY_BUTTON)).not.toBeInTheDocument();
};

describe("Confirm (US4)", () => {
  it("keeps an older version, notifies once, closes and re-enables editing", async () => {
    const { pm, onChange } = await setupHistory();
    const texts = await makeVersions(pm, "abc");
    await openHistoryMode();
    await userEvent.click(undoButton());
    await userEvent.click(undoButton());
    const calls = onChange.mock.calls.length;

    await userEvent.click(confirmButton());

    expect(pm.textContent).toBe(texts[1]);
    expect(onChange).toHaveBeenCalledTimes(calls + 1);
    expect(onChange.mock.lastCall?.[0]).toContain(texts[1] ?? "");
    historyClosed();
    expect(pm).toHaveAttribute("contenteditable", "true");
    expect(pm).toHaveFocus();

    // El contenido confirmado queda como la versión más reciente y las demás se conservan.
    await openHistoryMode();
    expect(versionItems()).toHaveLength(5);
    expect(viewedPosition()).toBe(0);
    await userEvent.click(undoButton());
    expect(pm.textContent).toBe(texts[3]);
  });

  it("keeps the version picked in the list, and Cancel restores the content from before", async () => {
    const { pm, onChange } = await setupHistory();
    const texts = await makeVersions(pm, "abc");
    await openHistoryMode();
    await userEvent.click(
      within(versionItems()[2] as HTMLElement).getByRole("button"),
    );
    expect(pm.textContent).toBe(texts[1]);

    await userEvent.click(backButton());
    expect(pm.textContent).toBe(texts[3]);

    await openHistoryMode();
    await userEvent.click(
      within(versionItems()[2] as HTMLElement).getByRole("button"),
    );
    const calls = onChange.mock.calls.length;
    await userEvent.click(confirmButton());
    expect(pm.textContent).toBe(texts[1]);
    expect(onChange).toHaveBeenCalledTimes(calls + 1);
  });

  it("closes without notifying or adding a version when the latest version is viewed", async () => {
    const { pm, onChange } = await setupHistory();
    await makeVersions(pm, "ab");
    await openHistoryMode();
    const calls = onChange.mock.calls.length;
    await userEvent.click(confirmButton());
    expect(onChange).toHaveBeenCalledTimes(calls);
    historyClosed();
    await openHistoryMode();
    expect(versionItems()).toHaveLength(3);
  });
});

describe("Cancel (back to last version) (US4)", () => {
  it("restores the content from before opening and notifies nothing", async () => {
    const { pm, onChange } = await setupHistory();
    const texts = await makeVersions(pm, "abc");
    await openHistoryMode();
    await userEvent.click(undoButton());
    await userEvent.click(undoButton());
    expect(pm.textContent).toBe(texts[1]);
    const calls = onChange.mock.calls.length;

    await userEvent.click(backButton());

    expect(pm.textContent).toBe(texts[3]);
    expect(onChange).toHaveBeenCalledTimes(calls);
    historyClosed();
    expect(pm).toHaveAttribute("contenteditable", "true");
    expect(pm).toHaveFocus();
  });

  it("is what a second click on the icon does", async () => {
    const { pm, onChange } = await setupHistory();
    const texts = await makeVersions(pm, "ab");
    await openHistoryMode();
    await userEvent.click(undoButton());
    const calls = onChange.mock.calls.length;
    await openHistoryMode();
    expect(pm.textContent).toBe(texts[2]);
    expect(onChange).toHaveBeenCalledTimes(calls);
    historyClosed();
  });
});

describe("forced closes (FR-017)", () => {
  async function openAtOlderVersion() {
    const setup = await setupHistory();
    const texts = await makeVersions(setup.pm, "ab");
    await openHistoryMode();
    await userEvent.click(undoButton());
    await userEvent.click(undoButton());
    expect(setup.pm.textContent).toBe(texts[0]);
    return { ...setup, texts, calls: setup.onChange.mock.calls.length };
  }

  it("closes and restores the content when historyUndo turns off", async () => {
    const { pm, update, onChange, texts, calls } = await openAtOlderVersion();
    update({ historyUndo: false });
    expect(screen.queryByRole("button", HISTORY_BUTTON)).not.toBeInTheDocument();
    historyClosed();
    expect(pm.textContent).toBe(texts[2]);
    expect(onChange).toHaveBeenCalledTimes(calls);
  });

  it("closes and restores the content when onlyView turns on", async () => {
    const { update, onChange, texts, calls } = await openAtOlderVersion();
    update({ onlyView: true });
    historyClosed();
    expect(editorBox().textContent).toBe(texts[2]);
    expect(onChange).toHaveBeenCalledTimes(calls);
    update({ onlyView: false });
    expect(await screen.findByRole("button", HISTORY_BUTTON)).toBeInTheDocument();
  });

  it("closes when the toolbar is hidden and stays closed when it comes back", async () => {
    const { update, pm, onChange, texts, calls } = await openAtOlderVersion();
    update({ showToolbar: false });
    historyClosed();
    expect(pm.textContent).toBe(texts[2]);
    update({ showToolbar: true });
    historyClosed();
    expect(await screen.findByRole("button", HISTORY_BUTTON)).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(onChange).toHaveBeenCalledTimes(calls);
  });

  it("closes when compare mode starts and compares against the content from before opening", async () => {
    const { update, texts, onChange, calls } = await openAtOlderVersion();
    update({
      mode: "compare",
      compareOrientation: "side-to-side",
      compareContent: "contenido nuevo",
    });
    const original = await screen.findByRole("textbox", {
      name: "Texto original (solo lectura)",
    });
    historyClosed();
    expect(original.textContent).toBe(texts[2]);
    expect(screen.queryByRole("button", HISTORY_BUTTON)).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledTimes(calls);
  });
});

describe("imperative API while history mode is open", () => {
  it("setMarkdown closes history mode first and then applies", async () => {
    const { pm, handle, onChange } = await setupHistory();
    await makeVersions(pm, "ab");
    await openHistoryMode();
    await userEvent.click(undoButton());
    act(() => handle.current?.setMarkdown("reemplazo"));
    historyClosed();
    expect(pm.textContent).toBe("reemplazo");
    expect(pm).toHaveAttribute("contenteditable", "true");
    expect(onChange).toHaveBeenLastCalledWith("reemplazo");
  });

  it("insertMarkdown closes history mode first and then inserts", async () => {
    const { pm, handle } = await setupHistory();
    await makeVersions(pm, "a");
    await openHistoryMode();
    await userEvent.click(undoButton());
    act(() => handle.current?.insertMarkdown("insertado"));
    historyClosed();
    expect(pm.textContent).toContain("insertado");
    expect(pm.textContent).toContain("a");
  });

  it("reset closes history mode and restores the mounted content", async () => {
    const { pm, handle } = await setupHistory({ initialContent: "base" });
    await makeVersions(pm, "a");
    await openHistoryMode();
    act(() => handle.current?.reset());
    historyClosed();
    expect(pm.textContent).toBe("base");
  });

  it("isModified compares the content from before opening, not the viewed version", async () => {
    const { pm, handle } = await setupHistory({ initialContent: "base" });
    await makeVersions(pm, "a");
    expect(handle.current?.isModified()).toBe(true);
    await openHistoryMode();
    await userEvent.click(undoButton());
    expect(pm.textContent).toBe("base");
    expect(handle.current?.isModified()).toBe(true);
    await userEvent.click(backButton());
    await advanceIdle();
    expect(handle.current?.isModified()).toBe(true);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useVersionHistory } from "../../src/components/MarkdownEditor/history/useVersionHistory";
import { MAX_VERSIONS } from "../../src/components/MarkdownEditor/history/versionHistory";
import {
  HISTORY_BUTTON,
  advance,
  advanceIdle,
  setupEditor,
  setupHistory,
  typeInEditor,
} from "./helpers";

afterEach(() => {
  vi.useRealTimers();
});

function useHistoryHarness(initial: { recording: boolean; source: string }) {
  vi.useFakeTimers({ now: new Date(2026, 10, 9, 10, 0, 0) });
  return renderHook((props) => useVersionHistory(props), {
    initialProps: initial,
  });
}

describe("recording versions (hook)", () => {
  it("stores the content at the start as the first version, immediately", () => {
    const { result } = useHistoryHarness({ recording: true, source: "a" });
    expect(result.current.state.versions).toEqual([
      { markdown: "a", savedAt: new Date(2026, 10, 9, 10, 0, 0).getTime() },
    ]);
  });

  it("saves one version, with its time, after 3 s without changes", async () => {
    const { result, rerender } = useHistoryHarness({ recording: true, source: "a" });
    rerender({ recording: true, source: "b" });
    await advance(2999);
    expect(result.current.state.versions).toHaveLength(1);
    await advance(1);
    expect(result.current.state.versions.map((v) => v.markdown)).toEqual(["a", "b"]);
    expect(result.current.state.versions[1]?.savedAt).toBe(
      new Date(2026, 10, 9, 10, 0, 3).getTime(),
    );
  });

  it("creates a single version for a burst of changes", async () => {
    const { result, rerender } = useHistoryHarness({ recording: true, source: "a" });
    rerender({ recording: true, source: "b" });
    await advance(2000);
    rerender({ recording: true, source: "c" });
    await advance(2000);
    expect(result.current.state.versions).toHaveLength(1);
    await advance(1000);
    expect(result.current.state.versions.map((v) => v.markdown)).toEqual(["a", "c"]);
  });

  it("creates no version when the content returns to the latest one", async () => {
    const { result, rerender } = useHistoryHarness({ recording: true, source: "a" });
    rerender({ recording: true, source: "b" });
    await advance(1000);
    rerender({ recording: true, source: "a" });
    await advance(10000);
    expect(result.current.state.versions).toHaveLength(1);
  });

  it("keeps only the most recent versions beyond the cap", async () => {
    const { result, rerender } = useHistoryHarness({ recording: true, source: "v0" });
    for (let i = 1; i <= MAX_VERSIONS + 5; i += 1) {
      rerender({ recording: true, source: `v${i}` });
      await advance(3000);
    }
    const versions = result.current.state.versions;
    expect(versions).toHaveLength(MAX_VERSIONS);
    expect(versions.at(-1)?.markdown).toBe(`v${MAX_VERSIONS + 5}`);
    expect(versions[0]?.markdown).toBe("v6");
  });

  it("schedules no timers and stores nothing when not recording", async () => {
    const { result, rerender } = useHistoryHarness({ recording: false, source: "a" });
    rerender({ recording: false, source: "b" });
    expect(vi.getTimerCount()).toBe(0);
    await advance(5000);
    expect(result.current.state.versions).toHaveLength(0);
  });
});

function versionItems() {
  return within(screen.getByRole("navigation", HISTORY_BUTTON)).getAllByRole(
    "listitem",
  );
}

describe("recording versions (editor)", () => {
  it("does not show the history icon unless historyUndo is on (FR-016)", async () => {
    await setupEditor();
    expect(screen.queryByRole("button", HISTORY_BUTTON)).not.toBeInTheDocument();
  });

  it("records the edits of the rendered view, one per pause", async () => {
    const { pm } = await setupHistory();
    await typeInEditor(pm, "x");
    await advanceIdle();
    await typeInEditor(pm, "y");
    await advanceIdle();
    await userEvent.click(screen.getByRole("button", HISTORY_BUTTON));
    expect(versionItems()).toHaveLength(3);
  });

  it("records the edits of the Markdown view", async () => {
    await setupHistory();
    await userEvent.click(screen.getByRole("button", { name: "Ver código Markdown" }));
    const source = await screen.findByRole("textbox", { name: "Código fuente Markdown" });
    await userEvent.type(source, "hola");
    await advanceIdle();
    await userEvent.click(screen.getByRole("button", HISTORY_BUTTON));
    expect(versionItems()).toHaveLength(2);
  });

  it("starts recording from the current content when the prop turns on, and forgets when it turns off", async () => {
    const { pm, update } = await setupHistory({ historyUndo: false });
    await typeInEditor(pm, "antes");
    await advanceIdle();
    expect(screen.queryByRole("button", HISTORY_BUTTON)).not.toBeInTheDocument();

    update({ historyUndo: true });
    await userEvent.click(await screen.findByRole("button", HISTORY_BUTTON));
    expect(versionItems()).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", HISTORY_BUTTON));

    await typeInEditor(pm, "!");
    await advanceIdle();
    update({ historyUndo: false });
    expect(screen.queryByRole("button", HISTORY_BUTTON)).not.toBeInTheDocument();
    update({ historyUndo: true });
    await act(async () => {});
    await userEvent.click(await screen.findByRole("button", HISTORY_BUTTON));
    expect(versionItems()).toHaveLength(1);
  });
});

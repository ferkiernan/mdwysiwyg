import { describe, expect, it } from "vitest";
import {
  INITIAL_HISTORY,
  MAX_VERSIONS,
  historyReducer,
  type HistoryAction,
  type HistoryState,
} from "../../src/components/MarkdownEditor/history/versionHistory";

function run(actions: HistoryAction[], from: HistoryState = INITIAL_HISTORY) {
  return actions.reduce(historyReducer, from);
}

const record = (markdown: string, now = 0): HistoryAction => ({
  type: "record",
  markdown,
  now,
});

describe("historyReducer", () => {
  it("records versions with their time and ignores a value equal to the latest", () => {
    const state = run([record("a", 1), record("a", 2), record("b", 3)]);
    expect(state.versions).toEqual([
      { markdown: "a", savedAt: 1 },
      { markdown: "b", savedAt: 3 },
    ]);
    expect(state.viewed).toBeNull();
  });

  it("keeps the same state object when nothing changes", () => {
    const state = run([record("a")]);
    expect(historyReducer(state, record("a", 9))).toBe(state);
  });

  it("drops the oldest version beyond the cap", () => {
    const actions = Array.from({ length: MAX_VERSIONS + 5 }, (_, index) =>
      record(`v${index}`, index),
    );
    const state = run(actions);
    expect(state.versions).toHaveLength(MAX_VERSIONS);
    expect(state.versions[0]?.markdown).toBe("v5");
    expect(state.versions.at(-1)?.markdown).toBe(`v${MAX_VERSIONS + 4}`);
  });

  it("open saves the pending content and views the latest version", () => {
    const state = run([record("a", 1), { type: "open", markdown: "b", now: 2 }]);
    expect(state.versions.map((version) => version.markdown)).toEqual(["a", "b"]);
    expect(state.viewed).toBe(1);
    expect(state.entry).toBe("b");
  });

  it("open does not duplicate when the content already is the latest version", () => {
    const state = run([record("a", 1), { type: "open", markdown: "a", now: 2 }]);
    expect(state.versions).toHaveLength(1);
    expect(state.viewed).toBe(0);
  });

  it("undo and redo move the viewed index and clamp at both ends", () => {
    const opened = run([
      record("a", 1),
      record("b", 2),
      record("c", 3),
      { type: "open", markdown: "c", now: 4 },
    ]);
    expect(opened.viewed).toBe(2);
    expect(historyReducer(opened, { type: "redo" })).toBe(opened);
    const back = run([{ type: "undo" }, { type: "undo" }], opened);
    expect(back.viewed).toBe(0);
    expect(historyReducer(back, { type: "undo" })).toBe(back);
    expect(run([{ type: "redo" }], back).viewed).toBe(1);
  });

  it("select jumps to an index and ignores invalid or unchanged targets", () => {
    const opened = run([
      record("a", 1),
      record("b", 2),
      record("c", 3),
      { type: "open", markdown: "c", now: 4 },
    ]);
    expect(run([{ type: "select", index: 0 }], opened).viewed).toBe(0);
    expect(historyReducer(opened, { type: "select", index: 2 })).toBe(opened);
    expect(historyReducer(opened, { type: "select", index: 9 })).toBe(opened);
    expect(historyReducer(opened, { type: "select", index: -1 })).toBe(opened);
    const closed = run([record("a")]);
    expect(historyReducer(closed, { type: "select", index: 0 })).toBe(closed);
  });

  it("undo and redo do nothing while closed", () => {
    const state = run([record("a")]);
    expect(historyReducer(state, { type: "undo" })).toBe(state);
    expect(historyReducer(state, { type: "redo" })).toBe(state);
  });

  it("ignores record while history mode is open", () => {
    const opened = run([record("a", 1), { type: "open", markdown: "a", now: 2 }]);
    expect(historyReducer(opened, record("zzz", 3))).toBe(opened);
  });

  it("close leaves history mode and keeps the versions", () => {
    const state = run([
      record("a", 1),
      record("b", 2),
      { type: "open", markdown: "b", now: 3 },
      { type: "undo" },
      { type: "close" },
    ]);
    expect(state.viewed).toBeNull();
    expect(state.entry).toBeNull();
    expect(state.versions).toHaveLength(2);
  });

  it("confirm of an older version appends it as the newest and keeps the newer ones", () => {
    const state = run([
      record("v1", 1),
      record("v2", 2),
      record("v3", 3),
      { type: "open", markdown: "v3", now: 4 },
      { type: "undo" },
      { type: "undo" },
      { type: "confirm", now: 5 },
    ]);
    expect(state.versions.map((version) => version.markdown)).toEqual([
      "v1",
      "v2",
      "v3",
      "v1",
    ]);
    expect(state.versions.at(-1)?.savedAt).toBe(5);
    expect(state.viewed).toBeNull();
  });

  it("confirm of the latest version adds nothing", () => {
    const state = run([
      record("v1", 1),
      record("v2", 2),
      { type: "open", markdown: "v2", now: 3 },
      { type: "confirm", now: 4 },
    ]);
    expect(state.versions).toHaveLength(2);
    expect(state.viewed).toBeNull();
  });

  it("reset empties the history", () => {
    const state = run([record("a"), { type: "reset" }]);
    expect(state).toEqual(INITIAL_HISTORY);
  });
});

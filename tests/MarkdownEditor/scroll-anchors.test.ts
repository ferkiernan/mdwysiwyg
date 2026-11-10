import { afterEach, describe, it, expect, vi } from "vitest";
import {
  lineAnchors,
  measureLineTops,
  measureUnitTop,
  unitAnchors,
} from "../../src/components/MarkdownEditor/compare/scrollSync/anchors";
import {
  collectUnits,
  pairUnits,
  type Unit,
} from "../../src/components/MarkdownEditor/compare/docDiff";
import { createDocument } from "@tiptap/core";
import { getSchema } from "@tiptap/core";
import {
  createEditorExtensions,
  markdownToEditorContent,
} from "../../src/components/MarkdownEditor/markdown/tiptapMarkdownBridge";

const schema = getSchema(createEditorExtensions({ sanitizeEmbeddedHtml: true }));

function unitsOf(markdown: string): Unit[] {
  return collectUnits(createDocument(markdownToEditorContent(markdown), schema))
    .units;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pairUnits", () => {
  it("pairs identical units in order, shifting indexes for insertions", () => {
    const original = unitsOf("one\n\ntwo\n\nthree\n");
    const current = unitsOf("new top\n\none\n\ntwo\n\nthree\n");
    expect(pairUnits(original, current)).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
  });

  it("pairs similar edited units inside a gap", () => {
    const original = unitsOf("alpha beta gamma delta\n\nfixed\n");
    const current = unitsOf("alpha beta gamma delta epsilon\n\nfixed\n");
    expect(pairUnits(original, current)).toEqual([
      [0, 0],
      [1, 1],
    ]);
  });

  it("pairs repeated identical units in document order", () => {
    const original = unitsOf("dup\n\nmid\n\ndup\n");
    const current = unitsOf("dup\n\nmid\n\ndup\n\ndup\n");
    expect(pairUnits(original, current)).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
  });

  it("returns nothing for unrelated documents", () => {
    expect(
      pairUnits(unitsOf("aaa bbb ccc\n"), unitsOf("xxx yyy zzz\n")),
    ).toEqual([]);
  });
});

describe("unitAnchors", () => {
  it("builds anchors from measurable pairs and skips the rest", () => {
    const original = unitsOf("a1\n\nb1\n\nc1\n");
    const current = unitsOf("a1\n\nb1\n\nc1\n");
    const anchors = unitAnchors({
      pairs: [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      originalUnits: original,
      currentUnits: current,
      measureOriginal: (unit) => (unit === original[1] ? null : unit.pos * 10),
      measureCurrent: (unit) => unit.pos * 100,
    });
    expect(anchors).toEqual([
      { original: 0, current: 0 },
      { original: (original[2] as Unit).pos * 10, current: (current[2] as Unit).pos * 100 },
    ]);
  });
});

describe("measureUnitTop", () => {
  function fakeEditor(node: unknown, destroyed = false) {
    return {
      isDestroyed: destroyed,
      view: { nodeDOM: () => node },
    } as unknown as Parameters<typeof measureUnitTop>[0];
  }
  const unit = { pos: 0 } as Unit;

  it("measures relative to the scroll content", () => {
    const scroller = document.createElement("div");
    scroller.scrollTop = 40;
    vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue({ top: 100 } as DOMRect);
    const node = document.createElement("p");
    vi.spyOn(node, "getBoundingClientRect").mockReturnValue({
      top: 250,
      width: 10,
      height: 10,
    } as DOMRect);
    expect(measureUnitTop(fakeEditor(node), scroller, unit)).toBe(190);
  });

  it("returns null without an element, without size or when destroyed", () => {
    const scroller = document.createElement("div");
    expect(measureUnitTop(fakeEditor(null), scroller, unit)).toBeNull();
    const empty = document.createElement("p");
    expect(measureUnitTop(fakeEditor(empty), scroller, unit)).toBeNull();
    expect(measureUnitTop(fakeEditor(empty, true), scroller, unit)).toBeNull();
  });
});

describe("lineAnchors", () => {
  const tops = (count: number, step: number) =>
    Array.from({ length: count }, (_, index) => index * step);

  it("pairs identical non-empty lines in order and maps them to the tops", () => {
    const anchors = lineAnchors(
      "one\n\ntwo\nthree",
      "new\n\none\n\ntwo\nthree",
      tops(4, 10),
      tops(6, 20),
    );
    expect(anchors).toEqual([
      { original: 0, current: 40 },
      { original: 20, current: 80 },
      { original: 30, current: 100 },
    ]);
  });

  it("skips lines whose position was not measured", () => {
    expect(lineAnchors("a\nb", "a\nb", [0], [0, 20])).toEqual([
      { original: 0, current: 0 },
    ]);
  });

  it("returns nothing when no line is shared", () => {
    expect(lineAnchors("a", "b", [0], [0])).toEqual([]);
  });
});

describe("measureLineTops", () => {
  it("measures one top per line with an off-screen mirror and removes it", () => {
    const textarea = document.createElement("textarea");
    document.body.append(textarea);
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(
      function (this: HTMLElement) {
        const parent = this.parentElement;
        return parent === null ? 0 : Array.prototype.indexOf.call(parent.children, this) * 20;
      },
    );
    const before = document.body.children.length;
    expect(measureLineTops(textarea, "a\n\nb")).toEqual([0, 20, 40]);
    expect(document.body.children.length).toBe(before);
    textarea.remove();
  });
});

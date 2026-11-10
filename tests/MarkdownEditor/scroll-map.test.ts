import { describe, it, expect } from "vitest";
import {
  mapScroll,
  normalizeAlignment,
  type Anchor,
} from "../../src/components/MarkdownEditor/compare/scrollSync/scrollMap";

const a = (original: number, current: number): Anchor => ({ original, current });

describe("normalizeAlignment", () => {
  it("adds the start and end anchors", () => {
    expect(normalizeAlignment([], 100, 300)).toEqual([a(0, 0), a(100, 300)]);
  });

  it("sorts anchors by original", () => {
    const result = normalizeAlignment([a(60, 120), a(20, 40)], 100, 200);
    expect(result).toEqual([a(0, 0), a(20, 40), a(60, 120), a(100, 200)]);
  });

  it("drops anchors that break the order or fall outside the range", () => {
    const result = normalizeAlignment(
      [a(10, 50), a(20, 30), a(-5, 0), a(30, 400), a(150, 60), a(40, 70)],
      100,
      200,
    );
    expect(result).toEqual([a(0, 0), a(10, 50), a(40, 70), a(100, 200)]);
  });

  it("does not duplicate an end anchor already present", () => {
    expect(normalizeAlignment([a(100, 200)], 100, 200)).toEqual([
      a(0, 0),
      a(100, 200),
    ]);
  });

  it("copes with nothing to scroll", () => {
    expect(normalizeAlignment([], 0, 0)).toEqual([a(0, 0)]);
    expect(normalizeAlignment([], 0, 50)).toEqual([a(0, 0), a(0, 50)]);
  });
});

describe("mapScroll", () => {
  const alignment = normalizeAlignment([a(100, 300), a(200, 350)], 400, 600);

  it("is exact at anchors", () => {
    expect(mapScroll(alignment, "original", 100)).toBe(300);
    expect(mapScroll(alignment, "original", 200)).toBe(350);
    expect(mapScroll(alignment, "current", 300)).toBe(100);
  });

  it("interpolates linearly between anchors in both directions", () => {
    expect(mapScroll(alignment, "original", 50)).toBe(150);
    expect(mapScroll(alignment, "original", 150)).toBe(325);
    expect(mapScroll(alignment, "current", 325)).toBe(150);
  });

  it("maps top to top and bottom to bottom", () => {
    expect(mapScroll(alignment, "original", 0)).toBe(0);
    expect(mapScroll(alignment, "original", 400)).toBe(600);
    expect(mapScroll(alignment, "current", 0)).toBe(0);
    expect(mapScroll(alignment, "current", 600)).toBe(400);
    expect(mapScroll(alignment, "original", 9999)).toBe(600);
    expect(mapScroll(alignment, "original", -5)).toBe(0);
  });

  it("crosses a gap proportionally, monotonically and without large steps", () => {
    // Content only on the new side: original 100 -> 100, new 100 -> 400.
    const gap = normalizeAlignment([a(100, 100), a(100, 400)], 300, 700);
    let previous = mapScroll(gap, "original", 0);
    for (let top = 1; top <= 300; top++) {
      const value = mapScroll(gap, "original", top);
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
    expect(mapScroll(gap, "original", 100)).toBe(400);
    // Content only on the original side: new stays put while original advances.
    const removed = normalizeAlignment([a(100, 100), a(400, 100)], 600, 300);
    expect(mapScroll(removed, "current", 100)).toBe(400);
    expect(mapScroll(removed, "original", 250)).toBe(100);
  });

  it("falls back to proportional progress with only the end anchors", () => {
    const plain = normalizeAlignment([], 200, 800);
    expect(mapScroll(plain, "original", 50)).toBe(200);
    expect(mapScroll(plain, "current", 400)).toBe(100);
  });

  it("handles zero-length segments and nothing to scroll", () => {
    const flat = normalizeAlignment([], 0, 500);
    expect(mapScroll(flat, "original", 0)).toBe(0);
    expect(mapScroll(flat, "current", 250)).toBe(0);
    expect(mapScroll(normalizeAlignment([], 0, 0), "original", 10)).toBe(0);
  });

  it("round-trips on non-degenerate segments", () => {
    for (const top of [0, 30, 100, 170, 260, 399]) {
      const there = mapScroll(alignment, "original", top);
      expect(mapScroll(alignment, "current", there)).toBeCloseTo(top, 6);
    }
  });
});

import "@testing-library/jest-dom/vitest";

// ProseMirror usa APIs de layout que jsdom no implementa
const emptyRect: DOMRect = {
  x: 0,
  y: 0,
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  width: 0,
  height: 0,
  toJSON: () => ({}),
};

Range.prototype.getBoundingClientRect = () => emptyRect;
Range.prototype.getClientRects = () =>
  ({
    length: 0,
    item: () => null,
    [Symbol.iterator]: (): IterableIterator<DOMRect> =>
      [][Symbol.iterator](),
  }) as unknown as DOMRectList;

document.elementFromPoint = () => null;

if (Element.prototype.scrollIntoView === undefined) {
  Element.prototype.scrollIntoView = () => {};
}

import { ensureProtocol } from "../../src/components/MarkdownEditor/markdown/links";

describe("ensureProtocol", () => {
  it("antepone http:// a una URL con prefijo www sin protocolo", () => {
    expect(ensureProtocol("www.ejemplo.com")).toBe("http://www.ejemplo.com");
  });

  it("antepone http:// a una URL sin www y sin protocolo", () => {
    expect(ensureProtocol("ejemplo.com")).toBe("http://ejemplo.com");
  });

  it("conserva una URL que ya especifica https://", () => {
    expect(ensureProtocol("https://ejemplo.com")).toBe("https://ejemplo.com");
  });

  it("conserva cualquier protocolo explícito sin duplicarlo", () => {
    expect(ensureProtocol("ftp://x")).toBe("ftp://x");
    expect(ensureProtocol("http://ya-tiene.com")).toBe("http://ya-tiene.com");
  });
});

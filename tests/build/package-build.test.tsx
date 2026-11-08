// Behavior of the PUBLISHED artifact: builds the package like `npm publish` would and renders the
// component from `dist/`, not from `src/`. This is the check that was missing when 0.3.0 shipped unstyled
// (the demo and the other tests compile from source, where CSS Modules always worked).
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { ComponentType } from "react";
import { render } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

type EditorComponent = ComponentType<{ initialContent?: string; className?: string; onlyView?: boolean }>;

let MarkdownEditor: EditorComponent;
let css = "";

beforeAll(async () => {
  execSync("npm run build", { stdio: "pipe", timeout: 120_000 });
  css = readFileSync(resolve("dist/index.css"), "utf8");
  const url = pathToFileURL(resolve("dist/index.js")).href;
  MarkdownEditor = ((await import(/* @vite-ignore */ url)) as { MarkdownEditor: EditorComponent }).MarkdownEditor;
}, 180_000);

const moduleClasses = (root: Element) =>
  [...root.querySelectorAll("[class]"), root].flatMap((el) => [...el.classList]).filter((c) => c.startsWith("MarkdownEditor_"));

describe("paquete construido (dist/)", () => {
  it("la verificación del artefacto pasa", () => {
    expect(() => execSync("node scripts/verify-dist.mjs", { stdio: "pipe" })).not.toThrow();
  });

  it("el elemento raíz recibe la clase del módulo, definida en index.css", () => {
    const { container } = render(<MarkdownEditor initialContent="# Hola" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("MarkdownEditor_root")).toBe(true);
    expect(css).toMatch(/\.MarkdownEditor_root(?![\w-])/);
  });

  it("la barra de herramientas y el área de contenido también tienen sus clases (todas existen en index.css)", () => {
    const { container } = render(<MarkdownEditor initialContent="Texto" />);
    const used = new Set(moduleClasses(container));
    expect(used.size).toBeGreaterThanOrEqual(4);
    expect(used.has("MarkdownEditor_toolbar") || [...used].some((c) => /toolbar/i.test(c))).toBe(true);
    expect(used.has("MarkdownEditor_content")).toBe(true);
    for (const c of used) expect(css, c).toMatch(new RegExp(`\\.${c}(?![\\w-])`));
  });

  it("una className del consumidor se suma a la del módulo (los temas --mdw-* siguen funcionando)", () => {
    const { container } = render(<MarkdownEditor initialContent="x" className="mi-tema" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.classList.contains("mi-tema")).toBe(true);
    expect(root.classList.contains("MarkdownEditor_root")).toBe(true);
  });

  it("las variables de tema y los selectores globales de ProseMirror se conservan sin renombrar", () => {
    expect(css).toContain("--mdw-toolbar-gradient-from");
    expect(css).toContain("--mdw-content-bg");
    expect(css).toMatch(/\.ProseMirror(?![\w-])/);
    expect(css).not.toMatch(/\.MarkdownEditor_ProseMirror/);
  });
});

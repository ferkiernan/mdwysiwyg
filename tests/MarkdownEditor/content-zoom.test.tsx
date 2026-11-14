import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MarkdownEditor } from "../../src";
import type { MarkdownEditorProps } from "../../src";

const TEXTBOX = { name: "Editor de texto enriquecido" };

const css = readFileSync(
  resolve(__dirname, "../../src/components/MarkdownEditor/MarkdownEditor.module.css"),
  "utf8",
);

const styles: HTMLStyleElement[] = [];
afterEach(() => {
  while (styles.length > 0) styles.pop()?.remove();
});
function injectStyle(text: string) {
  const style = document.createElement("style");
  style.textContent = text;
  document.head.appendChild(style);
  styles.push(style);
}

async function setup(props: MarkdownEditorProps = {}) {
  const onChange = vi.fn();
  const view = render(<MarkdownEditor onChange={onChange} initialContent="Hola **mundo**" {...props} />);
  const box = await screen.findByRole("textbox", TEXTBOX);
  const root = view.container.firstElementChild as HTMLElement;
  const update = (next: MarkdownEditorProps) =>
    view.rerender(<MarkdownEditor onChange={onChange} initialContent="Hola **mundo**" {...props} {...next} />);
  return { box, root, onChange, update };
}

const zoomOf = (root: HTMLElement) => root.style.getPropertyValue("--mdw-content-zoom");

function wheel(target: Element, deltaY: number, modifiers: { ctrlKey?: boolean; metaKey?: boolean } = { ctrlKey: true }) {
  const event = new WheelEvent("wheel", { deltaY, bubbles: true, cancelable: true, ...modifiers });
  target.dispatchEvent(event);
  return event;
}

describe("US1: zoom del contenido", () => {
  it("desactivado por defecto: Ctrl + rueda no se intercepta", async () => {
    const { box, root } = await setup();
    const event = wheel(box, -100);
    expect(event.defaultPrevented).toBe(false);
    expect(zoomOf(root)).toBe("");
  });

  it("Ctrl + rueda sobre el contenido acerca y aleja un paso por tic, sin zoom de página", async () => {
    const { box, root } = await setup({ allowContentZoom: true });
    const event = wheel(box, -100);
    expect(event.defaultPrevented).toBe(true);
    await waitFor(() => expect(zoomOf(root)).toBe("1.1"));
    wheel(box, 100);
    wheel(box, 100);
    await waitFor(() => expect(zoomOf(root)).toBe("0.9"));
  });

  it("Cmd + rueda (macOS) también; rueda sin modificador se ignora", async () => {
    const { box, root } = await setup({ allowContentZoom: true });
    expect(wheel(box, -100, {}).defaultPrevented).toBe(false);
    wheel(box, -100, { metaKey: true });
    await waitFor(() => expect(zoomOf(root)).toBe("1.1"));
  });

  it("Ctrl + rueda fuera del contenido (sobre la barra) no se intercepta", async () => {
    await setup({ allowContentZoom: true });
    const toolbar = screen.getByRole("toolbar", { name: "Barra de herramientas" });
    expect(wheel(toolbar, -100).defaultPrevented).toBe(false);
  });

  it("atajos Ctrl/Cmd + + / - / 0 con el foco en el contenido, anunciados", async () => {
    const { box, root } = await setup({ allowContentZoom: true });
    await userEvent.click(box);
    fireEvent.keyDown(box, { key: "+", ctrlKey: true });
    await waitFor(() => expect(zoomOf(root)).toBe("1.1"));
    expect(await screen.findByText("Zoom 110 %")).toBeInTheDocument();
    fireEvent.keyDown(box, { key: "-", metaKey: true });
    fireEvent.keyDown(box, { key: "-", ctrlKey: true });
    await waitFor(() => expect(zoomOf(root)).toBe("0.9"));
    fireEvent.keyDown(box, { key: "0", ctrlKey: true });
    await waitFor(() => expect(zoomOf(root)).toBe(""));
    expect(await screen.findByText("Zoom 100 %")).toBeInTheDocument();
  });

  it("límites de 50 % y 300 %", async () => {
    const { box, root } = await setup({ allowContentZoom: true });
    for (let i = 0; i < 30; i++) wheel(box, 100);
    await waitFor(() => expect(zoomOf(root)).toBe("0.5"));
    for (let i = 0; i < 40; i++) wheel(box, -100);
    await waitFor(() => expect(zoomOf(root)).toBe("3"));
  });

  it("parte del zoom que declara el host en --mdw-content-zoom y restablece a él", async () => {
    injectStyle(".zoom-host { --mdw-content-zoom: 1.5; }");
    const { box, root } = await setup({ allowContentZoom: true, className: "zoom-host" });
    wheel(box, -100);
    await waitFor(() => expect(zoomOf(root)).toBe("1.6"));
    fireEvent.keyDown(box, { key: "0", ctrlKey: true });
    await waitFor(() => expect(zoomOf(root)).toBe(""));
    expect(getComputedStyle(root).getPropertyValue("--mdw-content-zoom").trim()).toBe("1.5");
  });

  it("no toca el contenido ni llama a onChange; desactivarlo vuelve al nivel del host", async () => {
    const { box, root, onChange, update } = await setup({ allowContentZoom: true });
    wheel(box, -100);
    await waitFor(() => expect(zoomOf(root)).toBe("1.1"));
    expect(box).toHaveTextContent("Hola mundo");
    expect(onChange).not.toHaveBeenCalled();
    update({ allowContentZoom: false });
    await waitFor(() => expect(zoomOf(root)).toBe(""));
    expect(wheel(box, -100).defaultPrevented).toBe(false);
  });
});

describe("US2/US3: CSS de zoom, tamaño base y tamaño de barra", () => {
  it("el texto de ambas vistas es tamaño base × zoom", () => {
    expect(css).toMatch(/font-size: calc\(var\(--_mdw-content-wysiwyg-font-size\) \* var\(--_mdw-content-zoom\)\)/);
    expect(css.match(/font-size: calc\(var\(--_mdw-content-markdown-font-size\) \* var\(--_mdw-content-zoom\)\)/g)).toHaveLength(2);
  });

  it("imágenes y diagramas escalan con el zoom; barra, barras de comparación/historial y paneles flotantes con --mdw-toolbar-scale", () => {
    expect(css).toMatch(/ProseMirror img\) \{\s*zoom: var\(--_mdw-content-zoom\)/);
    expect(css).toMatch(/data-mermaid-block\]\) \{\s*zoom: var\(--_mdw-content-zoom\)/);
    expect(css.match(/zoom: var\(--_mdw-toolbar-scale\)/g)).toHaveLength(3);
  });

  it("defaults: zoom 1, 14px / 13px, barra 1", () => {
    expect(css).toContain("--_mdw-content-zoom: var(--mdw-content-zoom, 1);");
    expect(css).toContain("--_mdw-content-wysiwyg-font-size: var(--mdw-content-wysiwyg-font-size, 14px);");
    expect(css).toContain("--_mdw-content-markdown-font-size: var(--mdw-content-markdown-font-size, 13px);");
    expect(css).toContain("--_mdw-toolbar-scale: var(--mdw-toolbar-scale, 1);");
  });

  it("los menús flotantes llevan la marca para seguir el tamaño de la barra", async () => {
    await setup();
    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    const menu = screen.getByRole("menu", { name: "Exportar contenido" });
    expect(menu.parentElement).toHaveAttribute("data-mdw-floating");
  });
});

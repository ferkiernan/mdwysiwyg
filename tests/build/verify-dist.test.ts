import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkDist } from "../../scripts/verify-dist.mjs";

const SCRIPT = resolve("scripts/verify-dist.mjs");

const js = (map: string) =>
  `// src/components/MarkdownEditor/views/Source.tsx\nimport x from "y";\n\n// src/components/MarkdownEditor/MarkdownEditor.module.css\nvar MarkdownEditor_default = ${map};\n\nexport {};\n`;
const GOOD_MAP = `{\n  root: "MarkdownEditor_root",\n  toolbar: "MarkdownEditor_toolbar",\n  "is-open": "MarkdownEditor_is-open"\n}`;
const GOOD_CSS = `.MarkdownEditor_root { color: red; }\n.MarkdownEditor_toolbar { display: flex; }\n.MarkdownEditor_is-open { opacity: 1; }`;

describe("checkDist (verificación del artefacto publicado)", () => {
  it("acepta un artefacto correcto y cuenta mapas y clases", () => {
    const r = checkDist({ esm: js(GOOD_MAP), cjs: js(GOOD_MAP), css: GOOD_CSS });
    expect(r).toEqual({ ok: true, problems: [], maps: 1, classes: 3 });
  });

  it("falla con un mapa de clases vacío (el defecto de 0.3.0)", () => {
    const r = checkDist({ esm: js("{}"), cjs: js("{}"), css: ".root { color: red; }" });
    expect(r.ok).toBe(false);
    expect(r.problems[0]).toMatch(/MarkdownEditor.*vacío/);
  });

  it("falla si una clase del mapa no existe en index.css", () => {
    const r = checkDist({ esm: js(GOOD_MAP), cjs: js(GOOD_MAP), css: ".MarkdownEditor_root { color: red; }" });
    expect(r.problems.join("\n")).toContain('la clase "MarkdownEditor_toolbar" no existe en index.css');
  });

  it("no confunde prefijos: .MarkdownEditor_rootX no satisface a MarkdownEditor_root", () => {
    const r = checkDist({
      esm: js(`{ root: "MarkdownEditor_root" }`),
      cjs: js(`{ root: "MarkdownEditor_root" }`),
      css: ".MarkdownEditor_rootX { color: red; }",
    });
    expect(r.ok).toBe(false);
  });

  it("falla si ESM y CJS difieren o falta el mapa en CJS", () => {
    const other = `{ root: "MarkdownEditor_root", toolbar: "MarkdownEditor_toolbar", "is-open": "OTRA" }`;
    expect(checkDist({ esm: js(GOOD_MAP), cjs: js(other), css: GOOD_CSS }).problems.join()).toMatch(/ESM y CJS/);
    expect(checkDist({ esm: js(GOOD_MAP), cjs: "// nada\n", css: GOOD_CSS }).problems.join()).toMatch(/falta el mapa en la salida CJS/);
  });

  it("falla si no hay ningún mapa o si index.css está vacío", () => {
    expect(checkDist({ esm: "export {};", cjs: "", css: GOOD_CSS }).problems.join()).toMatch(/ningún mapa/);
    expect(checkDist({ esm: js(GOOD_MAP), cjs: js(GOOD_MAP), css: "  \n" }).problems.join()).toMatch(/index.css está vacío/);
  });
});

describe("CLI verify-dist", () => {
  const dirs: string[] = [];
  afterEach(() => dirs.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

  const makeDist = (esm: string, cjs: string, css: string | null) => {
    const root = mkdtempSync(join(tmpdir(), "verify-dist-"));
    dirs.push(root);
    const dist = join(root, "dist");
    mkdirSync(dist);
    writeFileSync(join(dist, "index.js"), esm);
    writeFileSync(join(dist, "index.cjs"), cjs);
    if (css !== null) writeFileSync(join(dist, "index.css"), css);
    return dist;
  };
  const run = (dist: string) => spawnSync(process.execPath, [SCRIPT, "--dir", dist], { encoding: "utf8" });

  it("sale con 0 y resume el artefacto correcto", () => {
    const out = execFileSync(process.execPath, [SCRIPT, "--dir", makeDist(js(GOOD_MAP), js(GOOD_MAP), GOOD_CSS)], { encoding: "utf8" });
    expect(out).toContain("dist verificado: 1 mapa(s) de clases, 3 clase(s)");
  });

  it("sale con 1 y nombra el problema cuando el mapa está vacío", () => {
    const r = run(makeDist(js("{}"), js("{}"), GOOD_CSS));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("el mapa de clases está vacío");
  });

  it("sale con 2 si faltan archivos", () => {
    const r = run(makeDist(js(GOOD_MAP), js(GOOD_MAP), null));
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("index.css");
  });
});

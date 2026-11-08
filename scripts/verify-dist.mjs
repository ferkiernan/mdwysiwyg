#!/usr/bin/env node
// Verifies the build artifact (`dist/`) that gets published to npm.
//
// Why: in 0.3.0 the published package rendered unstyled because the bundler emitted the CSS Modules as
// global CSS and exported an EMPTY class map (`var MarkdownEditor_default = {}`), so `styles["root"]` was
// `undefined`. Nothing looked at the artifact: the demo builds from source and Vitest has its own CSS
// Modules pipeline. See specs/007-fix-css-modules-class-map/contracts/dist-verification.md.
//
// Usage: node scripts/verify-dist.mjs [--dir dist]
// Exit codes: 0 ok, 1 problems found, 2 missing files.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** `// src/.../Name.module.css` marks the class map that esbuild emits right after it. */
const MAP_RE = /\/\/ ([^\n]*?\.module\.css)\nvar (\w+)_default = (\{[\s\S]*?\});/g;
const ENTRY_RE = /(?:"([^"]+)"|([A-Za-z_$][\w$]*))\s*:\s*"([^"]+)"/g;

/** @param {string} js */
function parseMaps(js) {
  /** @type {Map<string, Record<string, string>>} */
  const maps = new Map();
  for (const m of js.matchAll(MAP_RE)) {
    const [, file, name, literal] = m;
    /** @type {Record<string, string>} */
    const entries = {};
    for (const e of (literal ?? "").matchAll(ENTRY_RE)) entries[e[1] ?? e[2] ?? ""] = e[3] ?? "";
    maps.set(`${name} (${file})`, entries);
  }
  return maps;
}

/** @param {string} s */
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Pure check over the texts of the artifact.
 * @param {{ esm: string, cjs: string, css: string }} input
 * @returns {{ ok: boolean, problems: string[], maps: number, classes: number }}
 */
export function checkDist({ esm, cjs, css }) {
  /** @type {string[]} */
  const problems = [];
  const esmMaps = parseMaps(esm);
  const cjsMaps = parseMaps(cjs);
  let classes = 0;

  if (css.trim().length === 0) problems.push("index.css está vacío");
  if (esmMaps.size === 0) problems.push("no se encontró ningún mapa de clases de CSS Modules en el JavaScript ESM");

  for (const [id, map] of esmMaps) {
    const keys = Object.keys(map);
    if (keys.length === 0) {
      problems.push(`${id}: el mapa de clases está vacío (styles["root"] sería undefined)`);
      continue;
    }
    for (const value of Object.values(map)) {
      classes++;
      if (!new RegExp(`\\.${escapeRegExp(value)}(?![\\w-])`).test(css)) {
        problems.push(`${id}: la clase "${value}" no existe en index.css`);
      }
    }
    const other = cjsMaps.get(id);
    if (!other) problems.push(`${id}: falta el mapa en la salida CJS`);
    else if (JSON.stringify(other) !== JSON.stringify(map)) problems.push(`${id}: ESM y CJS exponen clases distintas`);
  }
  for (const id of cjsMaps.keys()) if (!esmMaps.has(id)) problems.push(`${id}: el mapa solo existe en la salida CJS`);

  return { ok: problems.length === 0, problems, maps: esmMaps.size, classes };
}

function main() {
  const i = process.argv.indexOf("--dir");
  const dir = resolve(i >= 0 ? (process.argv[i + 1] ?? "dist") : "dist");
  const files = { esm: resolve(dir, "index.js"), cjs: resolve(dir, "index.cjs"), css: resolve(dir, "index.css") };
  const missing = Object.values(files).filter((f) => !existsSync(f));
  if (missing.length) {
    console.error(`✗ faltan archivos en ${dir}: ${missing.join(", ")}`);
    process.exit(2);
  }
  const result = checkDist({
    esm: readFileSync(files.esm, "utf8"),
    cjs: readFileSync(files.cjs, "utf8"),
    css: readFileSync(files.css, "utf8"),
  });
  if (!result.ok) {
    for (const p of result.problems) console.error(`✗ ${p}`);
    process.exit(1);
  }
  console.log(`✔ dist verificado: ${result.maps} mapa(s) de clases, ${result.classes} clase(s), ESM y CJS coherentes`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();

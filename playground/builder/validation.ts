import type { ThemeTokenKind } from "../../src/components/MarkdownEditor/theme/themeTokens";
import type { AttributeChoices, AttributeValue } from "./types";

const PROPERTY_FOR_KIND: Record<ThemeTokenKind, string> = {
  color: "color",
  background: "background",
  font: "font-family",
  shadow: "box-shadow",
  length: "width",
  padding: "padding",
};

/**
 * `true` si `value` es válido para el tipo de la variable. Las referencias a
 * otras variables (`var(--mdw-…)`) se aceptan. Sin `CSS.supports` (p. ej. en
 * entornos de prueba) solo se rechaza lo vacío o lo que contiene `;{}`.
 */
export function isValidCssValue(kind: ThemeTokenKind, value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === "" || /[;{}]/.test(trimmed)) return false;
  if (/var\(--/.test(trimmed)) return true;
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return true;
  return CSS.supports(PROPERTY_FOR_KIND[kind], trimmed);
}

/** Nombre de clase CSS simple (sin punto). */
export function isValidClassName(value: string): boolean {
  return /^-?[_a-zA-Z][_a-zA-Z0-9-]*$/.test(value);
}

/** Avisos de dependencia entre atributos, por nombre de atributo. */
export function dependencyNotes(choices: AttributeChoices): Record<string, string> {
  const get = (name: string, fallback: AttributeValue): AttributeValue =>
    choices[name] ?? fallback;
  const notes: Record<string, string> = {};
  const mode = get("mode", "default");
  const orientation = String(get("compareOrientation", ""));
  const content = String(get("compareContent", ""));
  if (mode === "compare" && content === "") {
    notes["mode"] =
      "La comparación solo se activa con compareContent; mientras falte se comporta como \"default\".";
  }
  if (mode !== "compare") {
    if (orientation !== "") notes["compareOrientation"] = "Solo tiene efecto con mode=\"compare\".";
    if (content !== "") notes["compareContent"] = "Solo tiene efecto con mode=\"compare\".";
    if (get("compareSyncScroll", true) === false) notes["compareSyncScroll"] = "Solo tiene efecto con mode=\"compare\".";
  }
  if (get("historyUndo", false) === true) {
    if (get("onlyView", false) === true) notes["historyUndo"] = "No tiene efecto con onlyView.";
    else if (mode === "compare") notes["historyUndo"] = "No tiene efecto en modo comparación.";
    else if (get("showToolbar", true) === false) notes["historyUndo"] = "Necesita la barra visible (showToolbar).";
  }
  if (get("autoHeight", false) === true) {
    notes["height"] = "Con autoHeight es el alto mínimo.";
    if (get("resizable", true) === true) notes["resizable"] = "Se ignora mientras autoHeight esté activo.";
  }
  if (get("autoHideBar", false) === true && get("showToolbar", true) === false) {
    notes["autoHideBar"] = "showToolbar={false} tiene prioridad: la barra no se muestra.";
  }
  if (get("onlyViewNotice", "") !== "" && get("onlyView", false) !== true) {
    notes["onlyViewNotice"] = "Solo se ve con onlyView.";
  }
  if (get("resolveImageSrc", false) === true) {
    notes["resolveImageSrc"] = "Debe pasarse desde el montaje del control.";
  }
  return notes;
}

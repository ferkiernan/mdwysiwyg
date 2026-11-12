# Research: Playground Link to the Host Styling Guide

## 1. Target URL

**Decision**: `https://github.com/ferkiernan/mdwysiwyg/blob/master/docs/THEMING.md` (015's guide), held in one constant.
Until 015 lands: `https://github.com/ferkiernan/mdwysiwyg/blob/master/src/components/MarkdownEditor/README.md#theming-css-custom-properties`
(the existing section, GitHub anchor of "## Theming (CSS Custom Properties)").

**Rationale**: the live demo runs on GitHub Pages without the repository files; GitHub renders Markdown with anchors; an
absolute URL is unaffected by the Pages sub-path (FR-003/004). The repo URL is the `repository` field of `package.json`.

**Alternatives**: a relative path to the file (breaks on Pages); bundling the guide into the demo (duplicate content, drifts);
the npm package page (shows only the root README).

## 2. Placement and label

Next to the theming `<h2>` (inline, small) and in a one-line intro at the top of the page:
"¿Querés adaptar el aspecto? Cómo implementar estilos en tu host →". Label text exactly "Cómo implementar estilos en tu host".

## 3. New tab and accessibility

`<a href target="_blank" rel="noopener noreferrer">` with a visually hidden "(se abre en una pestaña nueva)" appended to the
accessible name and an "↗" visual cue (`aria-hidden`). Keyboard focusable by default (FR-005, SC-003).

## 4. Keeping the target valid

If 015's `check:docs` is implemented, add the constant's file path to its "link target exists" check (warning). Otherwise the
quickstart verifies the URL manually.

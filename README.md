<div align="center">

# mdwysiwyg

**A free, open-source, fully customizable Markdown WYSIWYG editor for React.**

Dual-view editing (rich text ⇄ raw Markdown), GFM support, syntax-highlighted code blocks,
a visual table-size picker, read-only mode, resizable UI, and CSS-based theming — in one
dependency-light component.

[![npm version](https://img.shields.io/npm/v/mdwysiwyg.svg)](https://www.npmjs.com/package/mdwysiwyg)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

[**Live Demo**](https://ferkiernan.github.io/mdwysiwyg/) · [Documentation](./src/components/MarkdownEditor/README.md) · [Report a Bug](https://github.com/ferkiernan/mdwysiwyg/issues)

</div>

---

## Why mdwysiwyg?

Most React Markdown editors force a choice: either a heavy, opinionated WYSIWYG editor you can't
theme, or a raw textarea with a separate preview pane. **mdwysiwyg gives you both views of the
same document, always in sync, with Markdown as the single source of truth** — and it's free for
personal and commercial use under the MIT license.

- 🆓 **100% free, MIT-licensed** — use it in personal projects, open source, or commercial
  products, no strings attached.
- 🔄 **True dual-view editing** — a rich-text (WYSIWYG) view and a raw Markdown view of the
  *same* document. Edit either one; both stay perfectly in sync, byte-for-byte, even with
  non-canonical formatting.
- 🎨 **Fully themeable, no wrapper needed** — every toolbar color, gradient, font, and the
  content area background are CSS Custom Properties. Restyle it with plain CSS; no prop
  explosion, no `theme={{...}}` object to learn.
- 👁️ **Read-only viewer mode** — flip one prop (`onlyView`) to turn the exact same component
  into a clean, distraction-free document viewer.
- 📏 **Native resizing** — drag the bottom-right corner like a `<textarea>`, on by default,
  one prop to disable.
- 🖍️ **Syntax-highlighted code blocks** — JSON, SQL, TypeScript, JavaScript, Java out of the
  box, with graceful fallback for any other language.
- 📊 **Visual table picker** — a hover-to-size 10×10 grid, just like Excel/Google Sheets/Notion,
  instead of typing row/column counts into a form. Click a cell you're already in to add, move or
  delete columns and rows from a context menu.
- 📈 **Mermaid diagrams** — ` ```mermaid ` blocks render as real diagrams, with auto-detection when
  you paste diagram syntax. Lazy-loaded, so it costs nothing if you never use it.
- 🎛️ **Imperative API** — a `ref` with `reset()` and `isModified()`, so "discard changes" and
  "unsaved changes?" flows are three lines of code, not a remount hack.
- 🧩 **GitHub Flavored Markdown** — tables, task lists, strikethrough, and more, parsed and
  serialized through the same battle-tested `unified`/`remark`/`rehype` ecosystem used across
  the JS Markdown world.
- 🛡️ **Safe by default** — embedded HTML is sanitized automatically (XSS-safe), with an
  explicit opt-out for trusted content.
- 📦 **Tiny, honest dependency footprint** — every dependency is justified and documented; no
  kitchen-sink bundle. Ships as ESM + CJS + TypeScript declarations.
- ⌨️ **Accessible** — semantic HTML, ARIA labels/states on every toolbar control, full keyboard
  support on custom pickers.

## Installation

Install it as a dependency in any React 18+ project with your package manager of choice:

```bash
npm install mdwysiwyg
# or
pnpm add mdwysiwyg
# or
yarn add mdwysiwyg
```

`react` and `react-dom` are peer dependencies — the package doesn't ship its own copy of React,
it uses whatever version your project already has (18 or newer).

```tsx
import { MarkdownEditor } from "mdwysiwyg";
import "mdwysiwyg/styles.css";

export default function App() {
  return (
    <MarkdownEditor
      initialContent="# Hello world\n\nStart typing **here**."
      onChange={(markdown) => console.log(markdown)}
    />
  );
}
```

That's it — no configuration required. Full API reference, all props, theming variables, and
usage examples live in the [component documentation](./src/components/MarkdownEditor/README.md).

### Cloning the repository instead

If you want to contribute, run the test suite, or try the demo playground locally instead of
just consuming the published package:

```bash
git clone https://github.com/ferkiernan/mdwysiwyg.git
cd mdwysiwyg
npm install
npm run dev        # opens the demo playground at http://localhost:5173
npm test            # runs the test suite
npm run build        # builds the distributable package into dist/
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full development guide.

## Live Demo

Try it in your browser, no install required: **[ferkiernan.github.io/mdwysiwyg](https://ferkiernan.github.io/mdwysiwyg/)**

## What's inside

| Capability | Details |
| --- | --- |
| Formatting | Paragraphs, headings (H1–H6), bold, italic, strikethrough, blockquote |
| Lists | Ordered, unordered, nested, task lists (checklists) |
| Insert | Images (by URL), links (URL-only dialog when text is already selected, auto `http://` prefix), tables (visual size picker), horizontal rules, embedded HTML |
| Links | Click an existing link to open a quick popover: go to URL, copy URL, or edit/remove it inline |
| Tables | Click an already-focused cell again for a context menu: add/move/delete columns (header cells) or rows (data cells) |
| Code | Fenced code blocks with a language picker (JSON/SQL/TypeScript/JavaScript/Java/custom) and syntax highlighting |
| Diagrams | ` ```mermaid ` blocks render as live diagrams; pasted Mermaid syntax is auto-detected on HTML insert. Lazy-loaded, `securityLevel: strict` |
| Export | Copy as Markdown or as HTML, one click |
| Modes | Full editor (default) or read-only viewer (`onlyView`, with a configurable notice via `onlyViewNotice`) |
| Sizing | Fixed (`width`/`height` props) or user-resizable (`resizable`, default on) |
| Theming | CSS Custom Properties for toolbar colors/gradient/font, per-view content color & font, table header & code block backgrounds, scrollbar colors (including the toolbar's own auto-scroll), and content-area background (solid color, gradient, or image) |
| Imperative API | `ref` exposing `reset()` and `isModified()` for discard-changes / unsaved-warning flows |

## Tech under the hood

Built on [Tiptap](https://tiptap.dev/) (ProseMirror) for the rich-text engine and the
[unified](https://unifiedjs.com/) / [remark](https://github.com/remarkjs/remark) /
[rehype](https://github.com/rehypejs/rehype) ecosystem for GFM parsing, HTML export, and
sanitization — the same tools powering much of the modern Markdown tooling in JavaScript.
TypeScript strict, tested with Vitest + React Testing Library.

## Project status & specs

This project is developed spec-first: every feature has a written specification, implementation
plan, and task breakdown under [`specs/`](./specs/) before being built. See
[`specs/`](./specs/) for the full history of what's implemented and why.

## Contributing

Issues and pull requests are welcome. Please open an issue first for significant changes so we
can discuss the approach.

## License

[MIT](./LICENSE) © [FerK](https://github.com/ferkiernan) — free for personal and commercial use.
If you build something with it, a mention/credit is appreciated but not required beyond keeping
the license notice intact.

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  // tsup sends every `.css` import through its own plugin using this loader. The default ("css")
  // bundles `*.module.css` as GLOBAL css and leaves the exported class map EMPTY
  // (`styles["root"] === undefined`), so consumers of the published package got an unstyled editor
  // (0.3.0). "local-css" emits hashed class names (`MarkdownEditor_root`) and the matching JS map,
  // keeps `:global(...)` selectors and `--mdw-*` custom properties untouched.
  // `npm run verify:dist` (part of `prepublishOnly`) guards this. See specs/007-fix-css-modules-class-map.
  loader: { ".css": "local-css" },
});

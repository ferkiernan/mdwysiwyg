import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves project sites under /<repo>/, so the build needs that
// base path; the local dev server (npm run dev) keeps using "/".
const isBuild = process.env["npm_lifecycle_event"] === "build:demo";

export default defineConfig({
  base: isBuild ? "/mdwysiwyg/" : "/",
  plugins: [react()],
  build: {
    outDir: "dist",
  },
});

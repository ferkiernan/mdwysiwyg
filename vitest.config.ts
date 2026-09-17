import { defineConfig } from "vitest/config";

export default defineConfig({
  css: {
    modules: {
      // Stable class names in tests instead of hashed CSS Module identifiers
      generateScopedName: "[name]__[local]",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    css: true,
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});

import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
    vite: "src/vite/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  // Watch mode must not wipe dist/ while the example dashboard is importing it.
  clean: !process.argv.includes("--watch"),
  // Catalog JSON becomes separate chunks so packs lazy-load via import().
  splitting: true,
  platform: "node",
  external: ["react", "vite"],
});

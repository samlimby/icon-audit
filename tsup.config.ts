import { cpSync, mkdirSync } from "node:fs";
import path from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/core/index.ts",
    react: "src/react/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  external: ["react"],
  async onSuccess() {
    // Catalogs are fetched at runtime via
    // new URL("./generated/*.json", import.meta.url) from dist/chunk-*.js
    const src = path.resolve("src/core/icons/generated");
    const dest = path.resolve("dist/generated");
    mkdirSync(dest, { recursive: true });
    for (const file of ["lucide.json", "fontawesome.json", "iconoir.json"]) {
      cpSync(path.join(src, file), path.join(dest, file));
    }
  },
});

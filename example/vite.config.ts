import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Local package — edit src/ and hot-reload without publishing to npm
      "icon-audit/react": path.resolve(rootDir, "../src/react/IconAudit.tsx"),
      "icon-audit": path.resolve(rootDir, "../src/core/index.ts"),
    },
  },
  server: {
    port: 5173,
  },
});

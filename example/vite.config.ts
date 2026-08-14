import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { iconAudit } from "../src/vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(rootDir, "..");

export default defineConfig(({ mode }) => {
  const fromDist = mode === "dist";

  return {
    plugins: [react(), iconAudit()],
    define: {
      __ICON_AUDIT_FROM_DIST__: JSON.stringify(fromDist),
    },
    resolve: {
      alias: fromDist
        ? {
            // Same files npm would publish (package.json exports → dist/)
            "icon-audit/react": path.resolve(repoRoot, "dist/react.js"),
            "icon-audit": path.resolve(repoRoot, "dist/index.js"),
          }
        : {
            // Source — edit overlay CSS/JS and hot-reload without a rebuild
            "icon-audit/react": path.resolve(repoRoot, "src/react/IconAudit.tsx"),
            "icon-audit": path.resolve(repoRoot, "src/core/index.ts"),
          },
    },
    optimizeDeps: {
      exclude: ["icon-audit"],
    },
    server: {
      port: 5173,
      fs: {
        allow: [repoRoot],
      },
    },
  };
});

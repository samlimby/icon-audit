import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defineConfig, loadConfigFromFile, mergeConfig } from "vite";

const root = process.cwd();
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CONFIG_NAMES = [
  "vite.config.ts",
  "vite.config.mts",
  "vite.config.js",
  "vite.config.mjs",
  "vite.config.cjs",
  "vite.config.cts",
];

function findUserConfig(dir) {
  for (const name of CONFIG_NAMES) {
    const filePath = path.join(dir, name);
    if (fs.existsSync(filePath)) return filePath;
  }
  return undefined;
}

export default defineConfig(async (env) => {
  const configFile = findUserConfig(root);
  const loaded = configFile
    ? await loadConfigFromFile(env, configFile, root)
    : null;
  const user = loaded?.config ?? {};
  const withRoot = mergeConfig({ root }, user);
  try {
    const entry = pathToFileURL(path.join(packageRoot, "dist", "vite.js")).href;
    const { iconAudit } = await import(entry);
    return mergeConfig(withRoot, { plugins: [iconAudit()] });
  } catch {
    return withRoot;
  }
});

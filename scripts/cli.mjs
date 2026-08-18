#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mergeConfig = path.join(here, "dev-config.mjs");
const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
if (args[0] === "vite") args.shift();

function findViteJs(startDir) {
  try {
    return require.resolve("vite/bin/vite.js", { paths: [startDir, here] });
  } catch {
    // fall through and walk node_modules
  }
  let dir = startDir;
  while (true) {
    const candidate = path.join(dir, "node_modules", "vite", "bin", "vite.js");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const viteBin = findViteJs(process.cwd());
if (!viteBin) {
  console.error(
    "[icon-audit] vite was not found in this project. Install vite and retry."
  );
  process.exit(1);
}

const viteArgs = args.includes("--config")
  ? args
  : ["--config", mergeConfig, ...args];

const child = spawn(process.execPath, [viteBin, ...viteArgs], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

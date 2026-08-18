#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mergeConfig = path.join(here, "dev-config.mjs");
const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
if (args[0] === "vite") args.shift();

let viteBin;
try {
  viteBin = require.resolve("vite/bin/vite.js", { paths: [process.cwd()] });
} catch {
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

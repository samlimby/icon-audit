#!/usr/bin/env node
/**
 * Builds dist/, then runs tsup --watch alongside the example dashboard
 * pointed at that dist (the same files npm would publish).
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const children = [];

function run(command, args) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  children.push(child);
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(code);
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${child.spawnargs.join(" ")} exited ${code}`));
    });
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

await waitForExit(run("npm", ["run", "build"]));
children.length = 0;

run("npm", ["run", "dev"]);
run("npm", ["run", "dev", "--prefix", "example", "--", "--mode", "dist"]);

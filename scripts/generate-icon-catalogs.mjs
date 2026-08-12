#!/usr/bin/env node
/**
 * Builds searchable icon catalogs from Lucide, Font Awesome Free Solid,
 * and Iconoir into compact JSON consumed by the replace panel at runtime.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../src/core/icons/generated");

function toKebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function toPascal(kebab) {
  return kebab
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function attrsToString(attrs) {
  return Object.entries(attrs)
    .filter(([, v]) => v != null && v !== false)
    .map(([k, v]) => `${k}="${String(v).replace(/"/g, "&quot;")}"`)
    .join(" ");
}

function lucideNodeToPaths(nodes) {
  return nodes
    .map(([tag, attrs]) => {
      const a = attrsToString(attrs);
      return a ? `<${tag} ${a}/>` : `<${tag}/>`;
    })
    .join("");
}

function buildLucide() {
  const { icons } = require("lucide");
  /** @type {Array<[string, string, string, string]>} */
  const rows = [];
  for (const [exportName, node] of Object.entries(icons)) {
    if (!Array.isArray(node)) continue;
    const name = toKebab(exportName);
    rows.push([name, exportName, lucideNodeToPaths(node), "0 0 24 24"]);
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]));
  return rows;
}

function buildFontAwesome() {
  const fa = require("@fortawesome/free-solid-svg-icons");
  /** @type {Map<string, [string, string, string, string]>} */
  const byName = new Map();

  for (const [exportName, def] of Object.entries(fa)) {
    if (!exportName.startsWith("fa") || !def || !def.icon) continue;
    const [w, h, , , pathData] = def.icon;
    const parts = Array.isArray(pathData) ? pathData : [pathData];
    const paths = parts.map((d) => `<path d="${d}"/>`).join("");
    const name = def.iconName || toKebab(exportName.replace(/^fa/, ""));
    const canonical = `fa${toPascal(name)}`;
    const row = /** @type {[string, string, string, string]} */ ([
      name,
      exportName,
      paths,
      `0 0 ${w} ${h}`,
    ]);

    const existing = byName.get(name);
    if (!existing) {
      byName.set(name, row);
      continue;
    }
    // Prefer the canonical export (faAddressBook over faContactBook / faVcard).
    if (existing[1] !== canonical && exportName === canonical) {
      byName.set(name, row);
    }
  }

  return [...byName.values()].sort((a, b) => a[0].localeCompare(b[0]));
}

function buildIconoir() {
  const dir = path.resolve(__dirname, "../node_modules/iconoir/icons/regular");
  if (!fs.existsSync(dir)) {
    throw new Error(`Iconoir icons not found at ${dir}`);
  }
  /** @type {Array<[string, string, string, string]>} */
  const rows = [];
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".svg")) continue;
    const name = file.replace(/\.svg$/, "");
    const svg = fs.readFileSync(path.join(dir, file), "utf8");
    const viewBox =
      svg.match(/viewBox="([^"]+)"/)?.[1] || "0 0 24 24";
    const inner = svg
      .replace(/<\?xml[\s\S]*?\?>/g, "")
      .replace(/<svg[^>]*>/i, "")
      .replace(/<\/svg>/i, "")
      .trim();
    if (!inner) continue;
    rows.push([name, toPascal(name), inner, viewBox]);
  }
  rows.sort((a, b) => a[0].localeCompare(b[0]));
  return rows;
}

function writeCatalog(library, rows, meta) {
  const payload = {
    library,
    packageName: meta.packageName,
    render: meta.render,
    generatedAt: new Date().toISOString(),
    count: rows.length,
    icons: rows,
  };
  const file = path.join(outDir, `${library}.json`);
  fs.writeFileSync(file, JSON.stringify(payload));
  const kb = (Buffer.byteLength(JSON.stringify(payload)) / 1024).toFixed(1);
  console.log(`Wrote ${library}: ${rows.length} icons (${kb} KB)`);
}

fs.mkdirSync(outDir, { recursive: true });

writeCatalog("lucide", buildLucide(), {
  packageName: "lucide-react",
  render: "stroke",
});
writeCatalog("fontawesome", buildFontAwesome(), {
  packageName: "@fortawesome/free-solid-svg-icons",
  render: "fill",
});
writeCatalog("iconoir", buildIconoir(), {
  packageName: "iconoir-react",
  render: "stroke",
});

fs.writeFileSync(
  path.join(outDir, "index.ts"),
  `export type GeneratedLibrary = "lucide" | "fontawesome" | "iconoir";\n`
);

console.log("Done.");

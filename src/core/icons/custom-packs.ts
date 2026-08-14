import type { CatalogIcon } from "./catalog";

const STORAGE_KEY = "icon-audit:custom-packs";

export interface CustomPack {
  id: string;
  name: string;
  createdAt: number;
  icons: CatalogIcon[];
}

function slugify(value: string): string {
  return value
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "icon";
}

function toPascal(value: string): string {
  return slugify(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** Prefer nested path for uniqueness: `nav/home.svg` → `nav-home`. */
function iconNameFromFile(file: File): string {
  const relative =
    (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
    file.name;
  const withoutExt = relative.replace(/\.svg$/i, "");
  const parts = withoutExt.split(/[/\\]/).filter(Boolean);
  // Drop a single shared root folder segment later if needed; keep full path for uniqueness.
  return slugify(parts.join("-")) || "icon";
}

function packNameFromFiles(files: File[]): string {
  const relatives = files
    .map((f) => (f as File & { webkitRelativePath?: string }).webkitRelativePath)
    .filter((p): p is string => Boolean(p && p.includes("/")));

  if (relatives.length > 0) {
    const roots = relatives.map((p) => p.split("/")[0]).filter(Boolean);
    const root = roots[0];
    if (root && roots.every((r) => r === root)) {
      return toPascal(root) || root;
    }
  }

  if (files.length === 1) {
    return toPascal(files[0].name).replace(/Svg$/i, "") || "Uploaded pack";
  }

  return `Pack ${new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

function extractSvgInner(svgText: string): {
  paths: string;
  viewBox: string;
} | null {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  if (doc.querySelector("parsererror")) return null;
  const svg = doc.querySelector("svg");
  if (!svg) return null;

  const symbols = Array.from(svg.querySelectorAll("symbol"));
  if (symbols.length > 0) {
    // Sprite: caller handles multi-symbol via parseSvgSprite
    return null;
  }

  const viewBox =
    svg.getAttribute("viewBox") ||
    (() => {
      const w = svg.getAttribute("width") || "24";
      const h = svg.getAttribute("height") || "24";
      return `0 0 ${parseFloat(w) || 24} ${parseFloat(h) || 24}`;
    })();

  return { paths: svg.innerHTML.trim(), viewBox };
}

export function parseSvgSprite(
  svgText: string,
  packId: string
): CatalogIcon[] {
  const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
  if (doc.querySelector("parsererror")) return [];
  const symbols = Array.from(doc.querySelectorAll("symbol"));
  return symbols
    .map((symbol, index) => {
      const rawId = symbol.getAttribute("id") || `symbol-${index + 1}`;
      const name = slugify(rawId);
      const viewBox = symbol.getAttribute("viewBox") || "0 0 24 24";
      return {
        id: `${packId}-${name}`,
        name,
        library: "custom" as const,
        packageName: "custom-pack",
        exportName: toPascal(name),
        paths: symbol.innerHTML.trim(),
        viewBox,
      };
    })
    .filter((icon) => icon.paths);
}

function isSvgFile(file: File): boolean {
  return (
    file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")
  );
}

async function fileToCatalogIcon(
  file: File,
  packId: string
): Promise<CatalogIcon[]> {
  const text = await file.text();
  const spriteIcons = parseSvgSprite(text, packId);
  if (spriteIcons.length > 0) return spriteIcons;

  const parsed = extractSvgInner(text);
  if (!parsed?.paths) return [];

  const name = iconNameFromFile(file);
  return [
    {
      id: `${packId}-${name}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      library: "custom",
      packageName: "custom-pack",
      exportName: toPascal(name),
      paths: parsed.paths,
      viewBox: parsed.viewBox,
    },
  ];
}

export function loadCustomPacks(): CustomPack[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomPack[];
  } catch {
    return [];
  }
}

export function saveCustomPacks(packs: CustomPack[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(packs));
}

export async function createPackFromFiles(files: FileList | File[]): Promise<{
  pack: CustomPack | null;
  skipped: string[];
}> {
  const list = Array.from(files);
  const svgFiles = list.filter(isSvgFile);
  const skipped = list
    .filter((f) => !svgFiles.includes(f))
    .map((f) => f.name);

  if (svgFiles.length === 0) {
    return { pack: null, skipped };
  }

  const packId = `pack-${Date.now().toString(36)}`;
  const icons: CatalogIcon[] = [];
  for (const file of svgFiles) {
    icons.push(...(await fileToCatalogIcon(file, packId)));
  }

  if (icons.length === 0) {
    return { pack: null, skipped };
  }

  const pack: CustomPack = {
    id: packId,
    name: packNameFromFiles(svgFiles),
    createdAt: Date.now(),
    icons,
  };

  return { pack, skipped };
}

/**
 * Recursively read files from a dropped folder (or mixed file/folder drop)
 * via the File System Access / webkit entry APIs.
 */
export async function collectFilesFromDataTransfer(
  dataTransfer: DataTransfer
): Promise<File[]> {
  const items = Array.from(dataTransfer.items || []);
  if (items.length === 0) {
    return Array.from(dataTransfer.files || []);
  }

  const entries = items
    .map((item) => {
      const anyItem = item as DataTransferItem & {
        webkitGetAsEntry?: () => FileSystemEntry | null;
      };
      return anyItem.webkitGetAsEntry?.() ?? null;
    })
    .filter((e): e is FileSystemEntry => Boolean(e));

  if (entries.length === 0) {
    return Array.from(dataTransfer.files || []);
  }

  const files: File[] = [];
  for (const entry of entries) {
    await readEntry(entry, files, entry.name);
  }
  return files;
}

async function readEntry(
  entry: FileSystemEntry,
  out: File[],
  pathPrefix: string
): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File | null>((resolve) => {
      (entry as FileSystemFileEntry).file(
        (f) => resolve(f),
        () => resolve(null)
      );
    });
    if (!file) return;
    // Preserve folder structure for naming when the browser didn't set it.
    if (!(file as File & { webkitRelativePath?: string }).webkitRelativePath) {
      try {
        Object.defineProperty(file, "webkitRelativePath", {
          configurable: true,
          value: pathPrefix,
        });
      } catch {
        // ignore — some browsers freeze File objects
      }
    }
    out.push(file);
    return;
  }

  if (!entry.isDirectory) return;

  const reader = (entry as FileSystemDirectoryEntry).createReader();
  const children = await readAllDirectoryEntries(reader);
  for (const child of children) {
    const childPath = `${pathPrefix}/${child.name}`;
    await readEntry(child, out, childPath);
  }
}

function readAllDirectoryEntries(
  reader: FileSystemDirectoryReader
): Promise<FileSystemEntry[]> {
  return new Promise((resolve) => {
    const all: FileSystemEntry[] = [];
    const readBatch = () => {
      reader.readEntries(
        (batch) => {
          if (!batch.length) {
            resolve(all);
            return;
          }
          all.push(...batch);
          readBatch();
        },
        () => resolve(all)
      );
    };
    readBatch();
  });
}

export function formatPackMeta(
  pack: CustomPack,
  persist: "project" | "local" = "local"
): string {
  const count = pack.icons.length;
  const ageMs = Date.now() - pack.createdAt;
  const day = 24 * 60 * 60 * 1000;
  const when =
    ageMs < day
      ? "uploaded today"
      : ageMs < 2 * day
        ? "uploaded yesterday"
        : persist === "project"
          ? "saved in project"
          : "this browser";
  return `${count} icon${count === 1 ? "" : "s"} · ${when}`;
}

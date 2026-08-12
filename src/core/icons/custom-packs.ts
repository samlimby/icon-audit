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

async function fileToCatalogIcon(
  file: File,
  packId: string
): Promise<CatalogIcon[]> {
  const text = await file.text();
  const spriteIcons = parseSvgSprite(text, packId);
  if (spriteIcons.length > 0) return spriteIcons;

  const parsed = extractSvgInner(text);
  if (!parsed?.paths) return [];

  const name = slugify(file.name);
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
  const svgFiles = list.filter(
    (f) =>
      f.type === "image/svg+xml" ||
      f.name.toLowerCase().endsWith(".svg")
  );
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

  const name =
    svgFiles.length === 1
      ? toPascal(svgFiles[0].name).replace(/Svg$/i, "") || "Uploaded pack"
      : `Pack ${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  const pack: CustomPack = {
    id: packId,
    name,
    createdAt: Date.now(),
    icons,
  };

  return { pack, skipped };
}

export function formatPackMeta(pack: CustomPack): string {
  const count = pack.icons.length;
  const ageMs = Date.now() - pack.createdAt;
  const day = 24 * 60 * 60 * 1000;
  const when =
    ageMs < day
      ? "uploaded today"
      : ageMs < 2 * day
        ? "uploaded yesterday"
        : "localStorage";
  return `${count} icon${count === 1 ? "" : "s"} · ${when}`;
}

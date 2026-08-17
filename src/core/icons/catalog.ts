export type IconLibraryId = "lucide" | "fontawesome" | "iconoir" | "custom";

export type IconRenderMode = "stroke" | "fill";

export interface CatalogIcon {
  id: string;
  name: string;
  library: IconLibraryId;
  packageName: string;
  exportName: string;
  /** Inner SVG markup (paths only). */
  paths: string;
  /** Optional viewBox; defaults to 0 0 24 24. */
  viewBox?: string;
  render?: IconRenderMode;
  /** Presentation attributes copied from the original <svg> (custom packs). */
  svgAttrs?: Record<string, string>;
}

type GeneratedRow = [name: string, exportName: string, paths: string, viewBox: string];

interface GeneratedCatalogFile {
  library: string;
  packageName: string;
  render: IconRenderMode;
  count: number;
  icons: GeneratedRow[];
}

type BuiltinLibrary = Exclude<IconLibraryId, "custom">;

interface CachedCatalog {
  packageName: string;
  render: IconRenderMode;
  rows: GeneratedRow[];
}

const RESULT_LIMIT = 72;

/**
 * Static dynamic imports so consumer bundlers (Next, Vite, webpack) rewrite
 * and ship the catalogs. `fetch(new URL(...))` breaks once the package is
 * rebundled because import.meta.url no longer points at dist/generated.
 */
const loaders: Record<BuiltinLibrary, () => Promise<unknown>> = {
  lucide: () => import("./generated/lucide.json"),
  fontawesome: () => import("./generated/fontawesome.json"),
  iconoir: () => import("./generated/iconoir.json"),
};

const cache = new Map<BuiltinLibrary, CachedCatalog>();
const inflight = new Map<BuiltinLibrary, Promise<CachedCatalog>>();

function asCatalogFile(mod: unknown): GeneratedCatalogFile {
  const data =
    (mod as { default?: GeneratedCatalogFile }).default ??
    (mod as GeneratedCatalogFile);
  return {
    library: data.library,
    packageName: data.packageName,
    render: data.render === "fill" ? "fill" : "stroke",
    count: data.count,
    icons: data.icons as GeneratedRow[],
  };
}

function toCached(data: GeneratedCatalogFile): CachedCatalog {
  return {
    packageName: data.packageName,
    render: data.render,
    rows: data.icons,
  };
}

function rowToIcon(
  library: BuiltinLibrary,
  catalog: CachedCatalog,
  row: GeneratedRow
): CatalogIcon {
  const [name, exportName, paths, viewBox] = row;
  return {
    id: `${library}-${name}`,
    name,
    library,
    packageName: catalog.packageName,
    exportName,
    paths,
    viewBox,
    render: catalog.render,
  };
}

async function loadCatalogFile(
  library: BuiltinLibrary
): Promise<GeneratedCatalogFile> {
  return asCatalogFile(await loaders[library]());
}

async function loadCatalogRaw(library: BuiltinLibrary): Promise<CachedCatalog> {
  const hit = cache.get(library);
  if (hit) return hit;

  const pending = inflight.get(library);
  if (pending) return pending;

  const promise = (async () => {
    const data = await loadCatalogFile(library);
    const cached = toCached(data);
    cache.set(library, cached);
    inflight.delete(library);
    return cached;
  })().catch((err) => {
    inflight.delete(library);
    throw err;
  });

  inflight.set(library, promise);
  return promise;
}

export function isCatalogReady(library: BuiltinLibrary): boolean {
  return cache.has(library);
}

/** Warm a pack in the background so the replace panel opens instantly. */
export function preloadCatalog(library: BuiltinLibrary): Promise<void> {
  return loadCatalogRaw(library).then(() => undefined);
}

export function preloadBuiltinCatalogs(): void {
  void preloadCatalog("lucide");
}

export interface CatalogSearchResult {
  icons: CatalogIcon[];
  total: number;
  library: BuiltinLibrary;
}

export async function searchCatalog(
  library: BuiltinLibrary,
  query: string,
  limit = RESULT_LIMIT
): Promise<CatalogSearchResult> {
  const catalog = await loadCatalogRaw(library);
  const q = query.trim().toLowerCase();
  const filtered = !q
    ? catalog.rows
    : catalog.rows.filter(([name, exportName]) => {
        return (
          name.includes(q) ||
          exportName.toLowerCase().includes(q) ||
          `${library}-${name}`.includes(q)
        );
      });

  return {
    library,
    total: filtered.length,
    icons: filtered
      .slice(0, limit)
      .map((row) => rowToIcon(library, catalog, row)),
  };
}

const SVG_ROOT_ATTRS = [
  "fill",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
] as const;

export function renderModeFor(icon: CatalogIcon): IconRenderMode {
  if (icon.library === "custom") {
    return customRenderMode(icon.svgAttrs, icon.paths);
  }
  if (icon.render) return icon.render;
  if (icon.library === "fontawesome") return "fill";
  return "stroke";
}

function isPaint(value: string | undefined): boolean {
  if (!value) return false;
  return value.trim().toLowerCase() !== "none";
}

/** Custom packs with no stroke presentation are fill (SVG default), not outline. */
export function customRenderMode(
  svgAttrs: Record<string, string> | undefined,
  paths: string
): IconRenderMode {
  const rootFill = svgAttrs?.fill?.trim().toLowerCase();
  if (rootFill === "none") return "stroke";
  if (isPaint(svgAttrs?.stroke)) return "stroke";
  if (
    svgAttrs?.["stroke-width"] ||
    svgAttrs?.["stroke-linecap"] ||
    svgAttrs?.["stroke-linejoin"] ||
    svgAttrs?.["stroke-miterlimit"]
  ) {
    return "stroke";
  }
  if (/stroke=["'](?!none)[^"']+["']/i.test(paths)) return "stroke";
  if (/stroke-width=/i.test(paths)) return "stroke";
  return "fill";
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function customRootAttrs(icon: CatalogIcon, color: string): string | null {
  if (icon.library !== "custom") return null;
  const captured = icon.svgAttrs;
  if (!captured || Object.keys(captured).length === 0) return null;
  const parts: string[] = [];
  for (const key of SVG_ROOT_ATTRS) {
    let value = captured[key];
    if (!value) continue;
    if ((key === "fill" || key === "stroke") && value !== "none") {
      value = color;
    }
    parts.push(`${key}="${escapeAttr(value)}"`);
  }
  if (!captured.fill) {
    parts.unshift(
      renderModeFor(icon) === "stroke"
        ? `fill="none"`
        : `fill="${escapeAttr(color)}"`
    );
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

export function svgMarkupFor(
  icon: CatalogIcon,
  size = 22,
  color = "currentColor"
): string {
  const viewBox = icon.viewBox || "0 0 24 24";
  const customAttrs = customRootAttrs(icon, color);
  const mode = renderModeFor(icon);
  const strokeWidth =
    icon.svgAttrs?.["stroke-width"] ||
    (icon.library === "custom" ? "1.5" : "2");
  const attrs =
    customAttrs ??
    (mode === "fill"
      ? `fill="${color}"`
      : `fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`);
  return `<svg width="${size}" height="${size}" viewBox="${viewBox}" ${attrs} aria-hidden="true">${icon.paths}</svg>`;
}


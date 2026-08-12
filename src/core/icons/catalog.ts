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

/** Static so bundlers rewrite + emit the JSON next to the chunk. */
const catalogUrls: Record<BuiltinLibrary, URL> = {
  lucide: new URL("./generated/lucide.json", import.meta.url),
  fontawesome: new URL("./generated/fontawesome.json", import.meta.url),
  iconoir: new URL("./generated/iconoir.json", import.meta.url),
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

/**
 * Fetch raw JSON catalogs. In Vite this avoids transforming a ~0.5–1MB
 * JSON blob into a JS module (the main first-open delay).
 */
async function loadCatalogFile(
  library: BuiltinLibrary
): Promise<GeneratedCatalogFile> {
  const res = await fetch(catalogUrls[library]);
  if (!res.ok) {
    throw new Error(
      `icon-audit: failed to load ${library} catalog (${res.status})`
    );
  }
  return asCatalogFile(await res.json());
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

export function renderModeFor(icon: CatalogIcon): IconRenderMode {
  if (icon.render) return icon.render;
  if (icon.library === "fontawesome" || icon.library === "custom") return "fill";
  return "stroke";
}

export function svgMarkupFor(icon: CatalogIcon, size = 22): string {
  const viewBox = icon.viewBox || "0 0 24 24";
  const mode = renderModeFor(icon);
  const attrs =
    mode === "fill"
      ? `fill="currentColor"`
      : `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  return `<svg width="${size}" height="${size}" viewBox="${viewBox}" ${attrs}>${icon.paths}</svg>`;
}

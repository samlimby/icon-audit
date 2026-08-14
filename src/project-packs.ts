/** Dev-server endpoint the overlay calls when the Vite plugin is installed. */
export const PROJECT_PACKS_ENDPOINT = "/__icon-audit/custom-packs";

/** Response header that proves the payload came from the plugin, not an SPA fallback. */
export const PROJECT_PACKS_HEADER = "x-icon-audit-packs";

export const PROJECT_PACKS_DIR = ".icon-audit";
export const PROJECT_PACKS_FILENAME = "custom-packs.json";

export const PROJECT_PACKS_VERSION = 1;

export interface ProjectPacksFile {
  version: number;
  packs: unknown[];
}

function isPackShape(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const pack = value as Record<string, unknown>;
  return (
    typeof pack.id === "string" &&
    typeof pack.name === "string" &&
    Array.isArray(pack.icons)
  );
}

/** Returns valid pack objects, or null if the payload is not a packs file. */
export function parseProjectPacksPayload(data: unknown): unknown[] | null {
  if (!data || typeof data !== "object") return null;
  const packs = (data as { packs?: unknown }).packs;
  if (!Array.isArray(packs)) return null;
  return packs.filter(isPackShape);
}

export function serializeProjectPacks(packs: unknown[]): string {
  const body: ProjectPacksFile = {
    version: PROJECT_PACKS_VERSION,
    packs,
  };
  return `${JSON.stringify(body, null, 2)}\n`;
}

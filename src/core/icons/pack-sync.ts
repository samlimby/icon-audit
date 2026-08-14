import type { CustomPack } from "./custom-packs";
import { loadCustomPacks, saveCustomPacks } from "./custom-packs";
import {
  parseProjectPacksPayload,
  PROJECT_PACKS_ENDPOINT,
  PROJECT_PACKS_HEADER,
  PROJECT_PACKS_VERSION,
} from "../../project-packs";

export type PackPersist = "project" | "local";

let writeGeneration = 0;
let lastPersist: PackPersist = "local";

function asPacks(list: unknown[] | null): CustomPack[] {
  return (list ?? []) as CustomPack[];
}

function isPluginResponse(res: Response): boolean {
  return res.headers.get(PROJECT_PACKS_HEADER) === "1";
}

async function fetchProjectPacks(): Promise<
  | { ok: true; packs: CustomPack[] }
  | { ok: false; plugin: boolean }
> {
  try {
    const res = await fetch(PROJECT_PACKS_ENDPOINT, {
      headers: { Accept: "application/json" },
    });
    if (!isPluginResponse(res)) return { ok: false, plugin: false };
    if (!res.ok) return { ok: false, plugin: true };
    const packs = parseProjectPacksPayload(await res.json());
    if (!packs) return { ok: false, plugin: true };
    return { ok: true, packs: asPacks(packs) };
  } catch {
    return { ok: false, plugin: false };
  }
}

async function putProjectPacks(packs: CustomPack[]): Promise<boolean> {
  try {
    const res = await fetch(PROJECT_PACKS_ENDPOINT, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ version: PROJECT_PACKS_VERSION, packs }),
    });
    return res.ok && isPluginResponse(res);
  } catch {
    return false;
  }
}

/**
 * Load packs for this app: project file when the Vite plugin is present,
 * otherwise this origin's localStorage. Empty project files are seeded from
 * any packs already cached locally (first time the plugin is added).
 */
export async function syncCustomPacks(): Promise<{
  packs: CustomPack[];
  persist: PackPersist;
}> {
  const started = writeGeneration;
  const local = loadCustomPacks();
  const remote = await fetchProjectPacks();
  if (started !== writeGeneration) {
    return { packs: loadCustomPacks(), persist: lastPersist };
  }
  if (!remote.ok) {
    lastPersist = "local";
    return { packs: local, persist: lastPersist };
  }
  if (remote.packs.length === 0 && local.length > 0) {
    const saved = await putProjectPacks(local);
    if (started !== writeGeneration) {
      return { packs: loadCustomPacks(), persist: lastPersist };
    }
    lastPersist = saved ? "project" : "local";
    return { packs: local, persist: lastPersist };
  }
  saveCustomPacks(remote.packs);
  lastPersist = "project";
  return { packs: remote.packs, persist: lastPersist };
}

/** Cache to localStorage immediately, then write through to the project when possible. */
export async function persistCustomPacks(
  packs: CustomPack[]
): Promise<PackPersist> {
  writeGeneration += 1;
  saveCustomPacks(packs);
  const saved = await putProjectPacks(packs);
  lastPersist = saved ? "project" : "local";
  return lastPersist;
}

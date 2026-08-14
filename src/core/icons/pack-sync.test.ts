import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CustomPack } from "./custom-packs";
import { PROJECT_PACKS_ENDPOINT, PROJECT_PACKS_HEADER } from "../../project-packs";

const samplePack: CustomPack = {
  id: "pack-1",
  name: "Nav",
  createdAt: 1,
  icons: [
    {
      id: "pack-1-home",
      name: "home",
      library: "custom",
      packageName: "custom-pack",
      exportName: "Home",
      paths: "<path d='M0 0h24v24H0z'/>",
      viewBox: "0 0 24 24",
    },
  ],
};

function jsonResponse(body: unknown, init?: { ok?: boolean; plugin?: boolean }) {
  const headers = new Headers();
  if (init?.plugin !== false) headers.set(PROJECT_PACKS_HEADER, "1");
  return {
    ok: init?.ok ?? true,
    headers,
    json: async () => body,
  } as Response;
}

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
}

describe("pack-sync", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.stubGlobal("localStorage", memoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses localStorage when the Vite plugin is absent", async () => {
    localStorage.setItem(
      "icon-audit:custom-packs",
      JSON.stringify([samplePack])
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ html: true }, { plugin: false, ok: true }))
    );
    const { syncCustomPacks } = await import("./pack-sync");
    const result = await syncCustomPacks();
    expect(result.persist).toBe("local");
    expect(result.packs).toEqual([samplePack]);
  });

  it("seeds an empty project file from localStorage", async () => {
    localStorage.setItem(
      "icon-audit:custom-packs",
      JSON.stringify([samplePack])
    );
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      expect(url).toBe(PROJECT_PACKS_ENDPOINT);
      if ((init?.method ?? "GET") === "PUT") {
        return jsonResponse({ ok: true, packs: [samplePack] });
      }
      return jsonResponse({ version: 1, packs: [] });
    });
    vi.stubGlobal("fetch", fetchMock);
    const { syncCustomPacks } = await import("./pack-sync");
    const result = await syncCustomPacks();
    expect(result.persist).toBe("project");
    expect(result.packs).toEqual([samplePack]);
    expect(fetchMock).toHaveBeenCalledWith(
      PROJECT_PACKS_ENDPOINT,
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("prefers project packs over localStorage", async () => {
    localStorage.setItem(
      "icon-audit:custom-packs",
      JSON.stringify([samplePack])
    );
    const remote: CustomPack = { ...samplePack, id: "pack-remote", name: "Remote" };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ version: 1, packs: [remote] }))
    );
    const { syncCustomPacks } = await import("./pack-sync");
    const result = await syncCustomPacks();
    expect(result.persist).toBe("project");
    expect(result.packs).toEqual([remote]);
    expect(JSON.parse(localStorage.getItem("icon-audit:custom-packs")!)).toEqual([
      remote,
    ]);
  });

  it("writes through to the project on persist", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const { persistCustomPacks } = await import("./pack-sync");
    const persist = await persistCustomPacks([samplePack]);
    expect(persist).toBe("project");
    expect(JSON.parse(localStorage.getItem("icon-audit:custom-packs")!)).toEqual([
      samplePack,
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      PROJECT_PACKS_ENDPOINT,
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("falls back to localStorage when PUT fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      })
    );
    const { persistCustomPacks } = await import("./pack-sync");
    const persist = await persistCustomPacks([samplePack]);
    expect(persist).toBe("local");
    expect(JSON.parse(localStorage.getItem("icon-audit:custom-packs")!)).toEqual([
      samplePack,
    ]);
  });
});

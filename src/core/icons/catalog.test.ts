import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { searchCatalog, svgMarkupFor } from "./catalog";

const generatedDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "generated"
);

beforeAll(() => {
  // jsdom can't fetch module-adjacent JSON URLs; serve catalogs from disk.
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const href = String(input);
    const library = href.includes("fontawesome")
      ? "fontawesome"
      : href.includes("iconoir")
        ? "iconoir"
        : "lucide";
    const body = readFileSync(path.join(generatedDir, `${library}.json`), "utf8");
    return new Response(body, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
});

describe("icon catalogs", () => {
  it("searches lucide with stroke markup", async () => {
    const result = await searchCatalog("lucide", "settings");
    expect(result.total).toBeGreaterThan(0);
    const settings = result.icons.find((i) => i.name === "settings");
    expect(settings?.exportName).toBe("Settings");
    expect(settings?.packageName).toBe("lucide-react");
    const svg = svgMarkupFor(settings!, 22);
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('viewBox="0 0 24 24"');
  });

  it("searches fontawesome with fill markup", async () => {
    const result = await searchCatalog("fontawesome", "gear");
    expect(result.total).toBeGreaterThan(0);
    const gear = result.icons[0];
    expect(gear.exportName).toMatch(/^fa/i);
    expect(gear.packageName).toBe("@fortawesome/free-solid-svg-icons");
    expect(svgMarkupFor(gear, 22)).toContain('fill="currentColor"');
  });

  it("searches iconoir", async () => {
    const result = await searchCatalog("iconoir", "home");
    expect(result.total).toBeGreaterThan(0);
    expect(result.icons[0].packageName).toBe("iconoir-react");
  });

  it("limits empty-query results", async () => {
    const result = await searchCatalog("lucide", "");
    expect(result.total).toBeGreaterThan(72);
    expect(result.icons.length).toBeLessThanOrEqual(72);
  });

  it("dedupes fontawesome aliases to one row per icon name", async () => {
    const result = await searchCatalog("fontawesome", "address-book");
    const matches = result.icons.filter((i) => i.name === "address-book");
    expect(matches).toHaveLength(1);
    expect(matches[0].exportName).toBe("faAddressBook");
  });
});

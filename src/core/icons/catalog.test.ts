import { describe, expect, it } from "vitest";
import { searchCatalog, svgMarkupFor } from "./catalog";
import type { CatalogIcon } from "./catalog";

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

  it("previews custom outline packs as stroke, not filled shapes", () => {
    const icon: CatalogIcon = {
      id: "pack-bracket",
      name: "1st-bracket-square-stroke-rounded",
      library: "custom",
      packageName: "custom-pack",
      exportName: "FirstBracket",
      paths: `<path d="M6 4h4"/>`,
      viewBox: "0 0 24 24",
      svgAttrs: {
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      },
    };
    const svg = svgMarkupFor(icon, 22);
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('stroke-width="1.5"');
    expect(svg).not.toMatch(/<svg[^>]*fill="currentColor"/);
  });

  it("treats legacy custom packs with bare paths as stroke", () => {
    const icon: CatalogIcon = {
      id: "pack-legacy",
      name: "legacy-icon",
      library: "custom",
      packageName: "custom-pack",
      exportName: "Legacy",
      paths: `<path d="M6 4h4"/>`,
      viewBox: "0 0 24 24",
    };
    const svg = svgMarkupFor(icon, 22);
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke="currentColor"');
  });
});

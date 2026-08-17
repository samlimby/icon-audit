import { describe, expect, it } from "vitest";
import { createPackFromFiles, removeCustomPack, renameCustomPack } from "./custom-packs";
import { svgMarkupFor } from "./catalog";

describe("custom pack SVG capture", () => {
  it("keeps outline root attrs so Hugeicons-style files preview as stroke", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4v16M16 4v16"/></svg>`;
    const file = {
      name: "1st-bracket-stroke-rounded.svg",
      type: "image/svg+xml",
      text: async () => svg,
    } as File;
    const { pack } = await createPackFromFiles([file]);
    expect(pack).not.toBeNull();
    const icon = pack!.icons[0];
    expect(icon.render).toBe("stroke");
    expect(icon.svgAttrs?.fill).toBe("none");
    expect(icon.svgAttrs?.["stroke-width"]).toBe("1.5");
    const markup = svgMarkupFor(icon, 22);
    expect(markup).toContain('fill="none"');
    expect(markup).toContain('stroke-width="1.5"');
    expect(markup).not.toMatch(/<svg[^>]*fill="currentColor"/);
  });

  it("defaults packs with no stroke attrs to fill", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
    const file = {
      name: "home.svg",
      type: "image/svg+xml",
      text: async () => svg,
    } as File;
    const { pack } = await createPackFromFiles([file]);
    expect(pack).not.toBeNull();
    const icon = pack!.icons[0];
    expect(icon.render).toBe("fill");
    const markup = svgMarkupFor(icon, 22);
    expect(markup).toContain('fill="currentColor"');
    expect(markup).not.toContain('stroke="currentColor"');
  });

  it("treats fill packs that set stroke=none as fill", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="none"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
    const file = {
      name: "home-fill.svg",
      type: "image/svg+xml",
      text: async () => svg,
    } as File;
    const { pack } = await createPackFromFiles([file]);
    const icon = pack!.icons[0];
    expect(icon.render).toBe("fill");
    const markup = svgMarkupFor(icon, 22);
    expect(markup).toContain('fill="currentColor"');
    expect(markup).not.toContain('stroke="currentColor"');
  });
});

describe("renameCustomPack", () => {
  const packs = [
    {
      id: "pack-a",
      name: "CustomIcons",
      createdAt: 1,
      icons: [],
    },
    {
      id: "pack-b",
      name: "Other",
      createdAt: 2,
      icons: [],
    },
  ];

  it("updates the matching pack name and trims whitespace", () => {
    const next = renameCustomPack(packs, "pack-a", "  Brand Marks  ");
    expect(next[0].name).toBe("Brand Marks");
    expect(next[1].name).toBe("Other");
    expect(packs[0].name).toBe("CustomIcons");
  });

  it("ignores empty names", () => {
    expect(renameCustomPack(packs, "pack-a", "   ")).toBe(packs);
  });
});

describe("removeCustomPack", () => {
  const packs = [
    {
      id: "pack-a",
      name: "CustomIcons",
      createdAt: 1,
      icons: [],
    },
    {
      id: "pack-b",
      name: "Other",
      createdAt: 2,
      icons: [],
    },
  ];

  it("removes the matching pack", () => {
    const next = removeCustomPack(packs, "pack-a");
    expect(next).toEqual([packs[1]]);
    expect(packs).toHaveLength(2);
  });

  it("returns the same array when the id is missing", () => {
    expect(removeCustomPack(packs, "pack-z")).toBe(packs);
  });
});

import { describe, expect, it } from "vitest";
import {
  parseProjectPacksPayload,
  serializeProjectPacks,
} from "./project-packs";

describe("parseProjectPacksPayload", () => {
  it("reads a versioned packs file", () => {
    const packs = parseProjectPacksPayload({
      version: 1,
      packs: [
        { id: "pack-1", name: "Nav", createdAt: 1, icons: [] },
        { id: "nope" },
      ],
    });
    expect(packs).toEqual([
      { id: "pack-1", name: "Nav", createdAt: 1, icons: [] },
    ]);
  });

  it("rejects missing packs arrays", () => {
    expect(parseProjectPacksPayload(null)).toBeNull();
    expect(parseProjectPacksPayload({})).toBeNull();
    expect(parseProjectPacksPayload({ packs: "nope" })).toBeNull();
  });
});

describe("serializeProjectPacks", () => {
  it("round-trips through parse", () => {
    const packs = [{ id: "a", name: "A", createdAt: 2, icons: [] }];
    const parsed = parseProjectPacksPayload(
      JSON.parse(serializeProjectPacks(packs))
    );
    expect(parsed).toEqual(packs);
  });
});

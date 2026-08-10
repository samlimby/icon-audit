import { describe, expect, it } from "vitest";
import {
  classifyIcon,
  determineSourceKind,
  nameReasons,
  sizeReason,
} from "./classify";
import { DEFAULT_CLASSIFY_OPTIONS } from "./types";

describe("sizeReason", () => {
  it("flags a small square element", () => {
    expect(sizeReason({ width: 24, height: 24 }, DEFAULT_CLASSIFY_OPTIONS)).toMatchObject({
      kind: "size",
      width: 24,
      height: 24,
    });
  });

  it("flags a small non-square icon within the aspect ratio range", () => {
    expect(sizeReason({ width: 32, height: 16 }, DEFAULT_CLASSIFY_OPTIONS)).not.toBeNull();
  });

  it("does not flag a large image", () => {
    expect(sizeReason({ width: 800, height: 600 }, DEFAULT_CLASSIFY_OPTIONS)).toBeNull();
  });

  it("does not flag a zero-size (unrendered) element", () => {
    expect(sizeReason({ width: 0, height: 0 }, DEFAULT_CLASSIFY_OPTIONS)).toBeNull();
  });

  it("does not flag a small but very elongated element (e.g. a divider)", () => {
    expect(sizeReason({ width: 40, height: 2 }, DEFAULT_CLASSIFY_OPTIONS)).toBeNull();
  });

  it("respects a custom max size", () => {
    const opts = { ...DEFAULT_CLASSIFY_OPTIONS, iconMaxSize: 16 };
    expect(sizeReason({ width: 24, height: 24 }, opts)).toBeNull();
  });
});

describe("nameReasons", () => {
  it("matches icon-ish alt text", () => {
    const reasons = nameReasons({ alt: "Settings icon" }, DEFAULT_CLASSIFY_OPTIONS);
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toMatchObject({ kind: "name", field: "alt" });
  });

  it("matches icon-ish class names", () => {
    const reasons = nameReasons(
      { className: "btn btn--icon-chevron" },
      DEFAULT_CLASSIFY_OPTIONS
    );
    expect(reasons.length).toBeGreaterThan(0);
  });

  it("matches icon-ish filenames in src", () => {
    const reasons = nameReasons(
      { src: "https://cdn.example.com/assets/arrow-icon.svg" },
      DEFAULT_CLASSIFY_OPTIONS
    );
    expect(reasons.some((r) => r.kind === "name" && r.field === "src")).toBe(true);
  });

  it("returns no reasons for a plain photo", () => {
    const reasons = nameReasons(
      { alt: "Team photo from the offsite", src: "/photos/team-2026.jpg" },
      DEFAULT_CLASSIFY_OPTIONS
    );
    expect(reasons).toHaveLength(0);
  });

  it("ignores absent fields", () => {
    expect(nameReasons({}, DEFAULT_CLASSIFY_OPTIONS)).toHaveLength(0);
  });
});

describe("classifyIcon", () => {
  it("flags an inline svg icon by size alone", () => {
    const result = classifyIcon({
      rect: { width: 20, height: 20 },
      naming: {},
    });
    expect(result.isIcon).toBe(true);
  });

  it("flags a large img by naming alone", () => {
    const result = classifyIcon({
      rect: { width: 200, height: 200 },
      naming: { alt: "menu icon" },
    });
    expect(result.isIcon).toBe(true);
  });

  it("does not flag a large, plainly-named photo", () => {
    const result = classifyIcon({
      rect: { width: 1200, height: 800 },
      naming: { alt: "Hero banner", src: "/images/hero.jpg" },
    });
    expect(result.isIcon).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  it("collects reasons from both heuristics when both match", () => {
    const result = classifyIcon({
      rect: { width: 24, height: 24 },
      naming: { alt: "close icon" },
    });
    expect(result.reasons.length).toBeGreaterThanOrEqual(2);
  });
});

describe("determineSourceKind", () => {
  const origin = "https://app.example.com";

  it("classifies a relative path as local", () => {
    expect(determineSourceKind("/icons/arrow.svg", origin)).toBe("local");
  });

  it("classifies a same-origin absolute URL as local", () => {
    expect(determineSourceKind("https://app.example.com/icons/arrow.svg", origin)).toBe(
      "local"
    );
  });

  it("classifies a cross-origin URL as remote", () => {
    expect(determineSourceKind("https://cdn.figma.com/icons/arrow.svg", origin)).toBe(
      "remote"
    );
  });

  it("classifies a data URI", () => {
    expect(determineSourceKind("data:image/svg+xml;base64,AAAA", origin)).toBe("data-uri");
  });

  it("returns null for no src", () => {
    expect(determineSourceKind(null, origin)).toBeNull();
    expect(determineSourceKind(undefined, origin)).toBeNull();
  });
});

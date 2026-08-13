import { describe, expect, it } from "vitest";
import { buildAgentPrompt } from "./prompt";
import type { CatalogIcon } from "./icons/catalog";
import type { ScannedElement } from "./types";

const icon: CatalogIcon = {
  id: "lucide-settings",
  name: "settings",
  library: "lucide",
  packageName: "lucide-react",
  exportName: "Settings",
  paths: `<circle cx="12" cy="12" r="3"/>`,
  viewBox: "0 0 24 24",
  render: "stroke",
};

describe("buildAgentPrompt", () => {
  it("asks for raw SVG only — no npm icon packages", () => {
    const scanned = {
      element: document.createElement("img"),
      tag: "img",
      reasons: [],
      sourceKind: "remote",
      src: "/icons/copyContact.svg",
      snapshotHtml: `<img src="/icons/copyContact.svg" class="nav-icon" alt="Contacts">`,
      locator: {
        tag: "img",
        className: "nav-icon",
        alt: "Contacts",
        src: "/icons/copyContact.svg",
        parentChain: "nav.app-nav > button.contacts > img.nav-icon",
        searchTokens: ["nav-icon", "Contacts", "copyContact.svg"],
      },
    } as ScannedElement;

    const prompt = buildAgentPrompt(scanned, icon, { size: 16 });
    expect(prompt).toContain("Do NOT install npm icon packages");
    expect(prompt).not.toContain('import { Settings } from "lucide-react"');
    expect(prompt).not.toContain("@fortawesome");
    expect(prompt).toContain("Parent chain (outer → inner):");
    expect(prompt).toContain("copyContact.svg");
    expect(prompt).toContain("```svg");
    expect(prompt).toContain("<svg");
    expect(prompt).toContain('circle cx="12"');
    expect(prompt).toContain("do not search for data-ia-draft");
  });
});

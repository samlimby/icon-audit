import { describe, expect, it } from "vitest";
import {
  patchPackageScripts,
  setupSkipReason,
  wrapViteDevScript,
} from "../../scripts/wrap-dev-script.mjs";

describe("wrapViteDevScript", () => {
  it("rewrites a plain vite dev command", () => {
    expect(wrapViteDevScript("vite")).toEqual({
      script: "icon-audit",
      changed: true,
    });
    expect(wrapViteDevScript("vite --host")).toEqual({
      script: "icon-audit --host",
      changed: true,
    });
  });

  it("leaves production and preview commands alone", () => {
    expect(wrapViteDevScript("vite build").changed).toBe(false);
    expect(wrapViteDevScript("vite preview").changed).toBe(false);
    expect(wrapViteDevScript("vite build --mode prod").changed).toBe(false);
  });

  it("leaves non-vite and already-wired scripts alone", () => {
    expect(wrapViteDevScript("next dev").changed).toBe(false);
    expect(wrapViteDevScript("icon-audit --host").changed).toBe(false);
    expect(wrapViteDevScript("turbo run dev").changed).toBe(false);
  });
});

describe("patchPackageScripts", () => {
  it("rewrites dev and start when they are vite", () => {
    const { pkg, changed, patched } = patchPackageScripts({
      scripts: {
        dev: "vite",
        start: "vite --host",
        build: "vite build",
      },
    });
    expect(changed).toBe(true);
    expect(patched).toEqual(["dev", "start"]);
    expect(pkg.scripts?.dev).toBe("icon-audit");
    expect(pkg.scripts?.start).toBe("icon-audit --host");
    expect(pkg.scripts?.build).toBe("vite build");
  });
});

describe("setupSkipReason", () => {
  it("skips CI and this repo", () => {
    expect(setupSkipReason({ ci: true, consumerName: "app" })).toBe("ci");
    expect(setupSkipReason({ consumerName: "icon-audit" })).toBe("self");
    expect(setupSkipReason({ consumerName: "icon-audit-example" })).toBe(
      "example"
    );
    expect(setupSkipReason({ consumerName: "acme-web" })).toBeNull();
  });
});

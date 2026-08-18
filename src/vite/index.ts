import type { IncomingMessage, ServerResponse } from "node:http";
import { PROJECT_PACKS_DIR } from "../project-packs";
import {
  handlePacksRequest,
  packsFilePath,
} from "./packs-io";

export const ICON_AUDIT_MODULE = "icon-audit";
export const ICON_AUDIT_REACT_MODULE = "icon-audit/react";
export const ICON_AUDIT_STUB_ID = "\0icon-audit-stub";

export interface IconAuditInjectOptions {
  enabled?: boolean;
  shortcut?: string | null;
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  iconMaxSize?: number;
  iconAspectRatioRange?: [number, number];
}

export interface IconAuditViteOptions {
  /** Folder for custom-packs.json, relative to the Vite root. Default `.icon-audit`. */
  dir?: string;
  /**
   * Inject `mountIconAudit()` into the page during `vite` (dev server).
   * Production builds never see this script. Default true.
   */
  inject?: boolean;
  /** Options forwarded to `mountIconAudit()` when injecting. */
  mount?: IconAuditInjectOptions;
}

type NextFn = (err?: unknown) => void;

interface ViteLikeServer {
  config: { root: string };
  middlewares: {
    use: (
      fn: (req: IncomingMessage, res: ServerResponse, next: NextFn) => void
    ) => void;
  };
  watcher?: { unwatch: (id: string | string[]) => void };
}

interface HtmlTag {
  tag: string;
  attrs: Record<string, string>;
  children: string;
  injectTo: "body";
}

export function overlayInjectScript(mount?: IconAuditInjectOptions): string {
  const arg =
    mount && Object.keys(mount).length > 0 ? JSON.stringify(mount) : "";
  return `import { mountIconAudit } from "${ICON_AUDIT_MODULE}";\nmountIconAudit(${arg});\n`;
}

export function overlayStubModule(): string {
  return [
    "export function mountIconAudit() { return { rescan() {}, destroy() {} }; }",
    "export function IconAudit() { return null; }",
    "export function isDevEnvironment() { return false; }",
  ].join("\n");
}

function attachPacksMiddleware(server: ViteLikeServer, filePath: string) {
  server.watcher?.unwatch(filePath);
  server.middlewares.use((req, res, next) => {
    void handlePacksRequest(req, res, filePath).then((handled) => {
      if (!handled) next();
    });
  });
}

function isOverlayImport(id: string): boolean {
  return id === ICON_AUDIT_MODULE || id === ICON_AUDIT_REACT_MODULE;
}

/**
 * Vite plugin: mounts the overlay during `vite` (dev server) and keeps custom
 * packs in `.icon-audit/custom-packs.json`.
 *
 * Do not import `icon-audit` from application source — leftover imports are
 * stubbed during `vite build` so production CI does not bundle or resolve the
 * overlay. If the package is omitted from a production image, load this plugin
 * with a dynamic import so `vite.config` itself does not fail.
 */
export function iconAudit(options: IconAuditViteOptions = {}) {
  const dir = options.dir ?? PROJECT_PACKS_DIR;
  const inject = options.inject !== false;
  const ignored = [`**/${dir}/**`, `**/${dir}`];
  let isPreview = false;

  return [
    {
      name: "icon-audit",
      apply: "serve" as const,
      config() {
        return {
          server: {
            watch: { ignored },
          },
        };
      },
      configResolved(config: { isPreview?: boolean }) {
        isPreview = Boolean(config.isPreview);
      },
      configureServer(server: ViteLikeServer) {
        attachPacksMiddleware(server, packsFilePath(server.config.root, dir));
      },
      configurePreviewServer(server: ViteLikeServer) {
        attachPacksMiddleware(server, packsFilePath(server.config.root, dir));
      },
      resolveId(id: string) {
        // Leftover <IconAudit /> imports must not mount; the inject script does.
        if (id === ICON_AUDIT_REACT_MODULE) return ICON_AUDIT_STUB_ID;
        return undefined;
      },
      load(id: string) {
        if (id === ICON_AUDIT_STUB_ID) return overlayStubModule();
        return undefined;
      },
      transformIndexHtml(): HtmlTag[] {
        if (!inject || isPreview) return [];
        return [
          {
            tag: "script",
            attrs: { type: "module" },
            children: overlayInjectScript(options.mount),
            injectTo: "body",
          },
        ];
      },
    },
    {
      name: "icon-audit:build-stub",
      apply: "build" as const,
      enforce: "pre" as const,
      resolveId(id: string) {
        if (isOverlayImport(id)) return ICON_AUDIT_STUB_ID;
        return undefined;
      },
      load(id: string) {
        if (id === ICON_AUDIT_STUB_ID) return overlayStubModule();
        return undefined;
      },
    },
  ];
}

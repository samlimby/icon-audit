import type { IncomingMessage, ServerResponse } from "node:http";
import { PROJECT_PACKS_DIR } from "../project-packs";
import {
  handlePacksRequest,
  packsFilePath,
} from "./packs-io";

export interface IconAuditViteOptions {
  /** Folder for custom-packs.json, relative to the Vite root. Default `.icon-audit`. */
  dir?: string;
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

function attachPacksMiddleware(server: ViteLikeServer, filePath: string) {
  server.watcher?.unwatch(filePath);
  server.middlewares.use((req, res, next) => {
    void handlePacksRequest(req, res, filePath).then((handled) => {
      if (!handled) next();
    });
  });
}

/**
 * Optional Vite plugin. Writes custom icon packs to `.icon-audit/custom-packs.json`
 * so they persist across origins serving this project. Without it, packs stay in
 * this origin's localStorage.
 */
export function iconAudit(options: IconAuditViteOptions = {}) {
  const dir = options.dir ?? PROJECT_PACKS_DIR;
  const ignored = [`**/${dir}/**`, `**/${dir}`];

  return {
    name: "icon-audit",
    apply: "serve" as const,
    config() {
      return {
        server: {
          watch: { ignored },
        },
      };
    },
    configureServer(server: ViteLikeServer) {
      attachPacksMiddleware(server, packsFilePath(server.config.root, dir));
    },
    configurePreviewServer(server: ViteLikeServer) {
      attachPacksMiddleware(server, packsFilePath(server.config.root, dir));
    },
  };
}

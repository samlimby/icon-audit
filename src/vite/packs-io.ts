import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import {
  parseProjectPacksPayload,
  PROJECT_PACKS_DIR,
  PROJECT_PACKS_ENDPOINT,
  PROJECT_PACKS_FILENAME,
  PROJECT_PACKS_HEADER,
  serializeProjectPacks,
} from "../project-packs";

const MAX_BODY_BYTES = 10 * 1024 * 1024;

export function packsFilePath(root: string, dir = PROJECT_PACKS_DIR): string {
  return path.resolve(root, dir, PROJECT_PACKS_FILENAME);
}

export function readPacksFile(filePath: string): unknown[] {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = parseProjectPacksPayload(JSON.parse(raw));
  if (!parsed) {
    throw new Error(`Invalid icon-audit packs file: ${filePath}`);
  }
  return parsed;
}

export function writePacksFile(filePath: string, packs: unknown[]): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, serializeProjectPacks(packs), "utf8");
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader(PROJECT_PACKS_HEADER, "1");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(json);
}

function requestPath(req: IncomingMessage): string {
  const url = req.url ?? "/";
  try {
    return new URL(url, "http://icon-audit.local").pathname;
  } catch {
    return url.split("?")[0] ?? url;
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer | string) => {
      const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
      size += buf.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Pack payload too large"));
        req.destroy();
        return;
      }
      chunks.push(buf);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** Handle GET/PUT for the packs endpoint. Returns true when the request was consumed. */
export async function handlePacksRequest(
  req: IncomingMessage,
  res: ServerResponse,
  filePath: string
): Promise<boolean> {
  if (requestPath(req) !== PROJECT_PACKS_ENDPOINT) return false;

  const method = (req.method ?? "GET").toUpperCase();

  if (method === "GET" || method === "HEAD") {
    try {
      const packs = readPacksFile(filePath);
      sendJson(res, 200, { version: 1, packs });
    } catch {
      sendJson(res, 500, { error: "Failed to read custom packs" });
    }
    return true;
  }

  if (method === "PUT" || method === "POST") {
    try {
      const packs = parseProjectPacksPayload(JSON.parse(await readBody(req)));
      if (!packs) {
        sendJson(res, 400, { error: "Invalid packs payload" });
        return true;
      }
      writePacksFile(filePath, packs);
      sendJson(res, 200, { ok: true, packs });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save custom packs";
      const status = message.includes("too large") ? 413 : 500;
      sendJson(res, status, { error: message });
    }
    return true;
  }

  sendJson(res, 405, { error: "Method not allowed" });
  return true;
}

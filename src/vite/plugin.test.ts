import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { PROJECT_PACKS_ENDPOINT, PROJECT_PACKS_HEADER } from "../project-packs";
import {
  ICON_AUDIT_MODULE,
  ICON_AUDIT_REACT_MODULE,
  ICON_AUDIT_STUB_ID,
  ICON_AUDIT_VIRTUAL_HTML_SRC,
  ICON_AUDIT_VIRTUAL_ID,
  ICON_AUDIT_VIRTUAL_RESOLVED,
  iconAudit,
  overlayInjectScript,
  overlayStubModule,
} from "./index";
import {
  handlePacksRequest,
  packsFilePath,
  readPacksFile,
  writePacksFile,
} from "./packs-io";

const sample = [
  { id: "pack-1", name: "Nav", createdAt: 1, icons: [{ id: "home" }] },
];

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "icon-audit-packs-"));
}

describe("packs file helpers", () => {
  let dir = "";

  afterEach(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  it("writes and reads a packs file", () => {
    dir = tempDir();
    const filePath = packsFilePath(dir);
    writePacksFile(filePath, sample);
    expect(readPacksFile(filePath)).toEqual(sample);
    expect(fs.existsSync(path.join(dir, ".icon-audit", "custom-packs.json"))).toBe(
      true
    );
  });

  it("returns an empty list when the file is missing", () => {
    dir = tempDir();
    expect(readPacksFile(packsFilePath(dir))).toEqual([]);
  });
});

describe("iconAudit plugin", () => {
  it("injects a Vite-resolved virtual module instead of a bare import", () => {
    const [serve] = iconAudit();
    expect(serve.apply).toBe("serve");
    const tags = serve.transformIndexHtml!();
    expect(tags).toHaveLength(1);
    expect(tags[0].tag).toBe("script");
    expect(tags[0].attrs.type).toBe("module");
    expect(tags[0].attrs.src).toBe(ICON_AUDIT_VIRTUAL_HTML_SRC);
    expect(tags[0].children).toBeUndefined();
    expect(serve.resolveId!(ICON_AUDIT_VIRTUAL_ID)).toBe(
      ICON_AUDIT_VIRTUAL_RESOLVED
    );
    expect(serve.resolveId!(ICON_AUDIT_VIRTUAL_HTML_SRC)).toBe(
      ICON_AUDIT_VIRTUAL_RESOLVED
    );
    expect(serve.load!(ICON_AUDIT_VIRTUAL_RESOLVED)).toBe(overlayInjectScript());
    expect(serve.load!(ICON_AUDIT_VIRTUAL_RESOLVED)).toContain(
      `from "${ICON_AUDIT_MODULE}"`
    );
  });

  it("forwards JSON mount options into the virtual overlay module", () => {
    const [serve] = iconAudit({ mount: { position: "top-right" } });
    expect(serve.load!(ICON_AUDIT_VIRTUAL_RESOLVED)).toContain(
      'mountIconAudit({"position":"top-right"})'
    );
  });

  it("skips injection when inject is false", () => {
    const [serve] = iconAudit({ inject: false });
    expect(serve.transformIndexHtml!()).toEqual([]);
  });

  it("skips injection during vite preview", () => {
    const [serve] = iconAudit();
    serve.configResolved!({ isPreview: true });
    expect(serve.transformIndexHtml!()).toEqual([]);
  });

  it("stubs leftover <IconAudit /> imports during serve so they never mount", () => {
    const [serve] = iconAudit();
    expect(serve.resolveId!(ICON_AUDIT_REACT_MODULE)).toBe(ICON_AUDIT_STUB_ID);
    expect(serve.resolveId!(ICON_AUDIT_MODULE)).toBeUndefined();
    expect(serve.load!(ICON_AUDIT_STUB_ID)).toContain("export function IconAudit");
  });

  it("stubs leftover app imports during production builds", () => {
    const stub = iconAudit()[1];
    expect(stub.apply).toBe("build");
    expect(stub.resolveId!(ICON_AUDIT_MODULE)).toBe(ICON_AUDIT_STUB_ID);
    expect(stub.resolveId!(ICON_AUDIT_REACT_MODULE)).toBe(ICON_AUDIT_STUB_ID);
    expect(stub.resolveId!("react")).toBeUndefined();
    expect(stub.load!(ICON_AUDIT_STUB_ID)).toBe(overlayStubModule());
    expect(stub.load!(ICON_AUDIT_STUB_ID)).toContain("export function IconAudit");
    expect(stub.load!(ICON_AUDIT_STUB_ID)).toContain(
      "export function mountIconAudit"
    );
  });
});

describe("handlePacksRequest", () => {
  let dir = "";

  afterEach(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  it("ignores unrelated paths", async () => {
    dir = tempDir();
    const { req, res } = mockHttp("GET", "/other");
    expect(await handlePacksRequest(req, res, packsFilePath(dir))).toBe(false);
  });

  it("GET returns empty packs when the file does not exist", async () => {
    dir = tempDir();
    const { req, res } = mockHttp("GET", PROJECT_PACKS_ENDPOINT);
    expect(await handlePacksRequest(req, res, packsFilePath(dir))).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(res.headers[PROJECT_PACKS_HEADER]).toBe("1");
    expect(JSON.parse(res.body)).toEqual({ version: 1, packs: [] });
  });

  it("PUT writes packs and GET reads them back", async () => {
    dir = tempDir();
    const filePath = packsFilePath(dir);
    const put = mockHttp(
      "PUT",
      PROJECT_PACKS_ENDPOINT,
      JSON.stringify({ version: 1, packs: sample })
    );
    expect(await handlePacksRequest(put.req, put.res, filePath)).toBe(true);
    expect(put.res.statusCode).toBe(200);
    expect(readPacksFile(filePath)).toEqual(sample);

    const get = mockHttp("GET", PROJECT_PACKS_ENDPOINT);
    await handlePacksRequest(get.req, get.res, filePath);
    expect(JSON.parse(get.res.body).packs).toEqual(sample);
  });

  it("rejects invalid PUT payloads", async () => {
    dir = tempDir();
    const { req, res } = mockHttp(
      "PUT",
      PROJECT_PACKS_ENDPOINT,
      JSON.stringify({ nope: true })
    );
    await handlePacksRequest(req, res, packsFilePath(dir));
    expect(res.statusCode).toBe(400);
  });
});

function mockHttp(method: string, url: string, body?: string) {
  const req = new EventEmitter() as IncomingMessage & EventEmitter;
  req.method = method;
  req.url = url;
  const res = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: "",
    setHeader(key: string, value: string) {
      this.headers[key.toLowerCase()] = value;
    },
    end(data?: string) {
      this.body = data ?? "";
    },
  };
  queueMicrotask(() => {
    if (body) req.emit("data", Buffer.from(body));
    req.emit("end");
  });
  return { req, res: res as typeof res & ServerResponse };
}

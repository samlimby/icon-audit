import type { CatalogIcon } from "./icons/catalog";
import type { ScannedElement } from "./types";

export type PromptStatus = "draft" | "sent";

export interface QueuedPrompt {
  id: string;
  status: PromptStatus;
  createdAt: number;
  sentAt?: number;
  title: string;
  packageName: string;
  exportName: string;
  markdown: string;
  sourceLabel: string;
  locationHint: string;
}

export interface PromptTargetMeta {
  fileHint?: string;
  nearbyText?: string;
  componentName?: string;
  size: number;
}

function basenameFromSrc(src: string | null): string {
  if (!src) return "icon";
  try {
    const path = src.includes("://") ? new URL(src).pathname : src;
    const base = path.split("/").pop() || "icon";
    return base.split("?")[0] || "icon";
  } catch {
    return "icon.svg";
  }
}

function outerSnippet(el: Element): string {
  const clone = el.cloneNode(false) as Element;
  const html = clone.outerHTML;
  return html.length > 180 ? `${html.slice(0, 177)}…` : html;
}

export function buildAgentPrompt(
  scanned: ScannedElement,
  icon: CatalogIcon,
  meta: PromptTargetMeta
): string {
  const usage = `<${icon.exportName} size={${meta.size}} aria-label="${icon.exportName}" />`;
  const lines = [
    `Replace a remote <img> icon with ${icon.library === "lucide" ? "Lucide" : icon.packageName} in this app.`,
    "",
    `Package: ${icon.packageName}`,
    `Icon export: ${icon.exportName}`,
    `Suggested usage: ${usage}`,
    "",
    "Locate current usage using:",
  ];

  if (meta.fileHint) lines.push(`- File (best effort): ${meta.fileHint}`);
  lines.push(`- DOM: ${outerSnippet(scanned.element)}`);
  if (meta.nearbyText) lines.push(`- Nearby UI text: ${meta.nearbyText}`);
  if (meta.componentName) lines.push(`- Component: ${meta.componentName}`);
  lines.push(
    `- Classification: ${scanned.tag.toUpperCase()} · ${scanned.sourceKind ?? "unknown"} · flagged by icon-audit`
  );
  lines.push("");
  lines.push("Requirements:");
  lines.push("1. Remove the remote <img> (or equivalent asset import).");
  lines.push(`2. Import { ${icon.exportName} } from "${icon.packageName}".`);
  lines.push("3. Preserve size, accessible name, and layout.");
  lines.push("4. Do not change unrelated icons.");

  return lines.join("\n");
}

export function createQueuedPrompt(
  scanned: ScannedElement,
  icon: CatalogIcon,
  meta: PromptTargetMeta
): QueuedPrompt {
  const sourceName = basenameFromSrc(scanned.src);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "draft",
    createdAt: Date.now(),
    title: `${sourceName} → ${icon.exportName}`,
    packageName: icon.packageName,
    exportName: icon.exportName,
    markdown: buildAgentPrompt(scanned, icon, meta),
    sourceLabel: sourceName,
    locationHint: meta.fileHint ?? meta.nearbyText ?? scanned.src ?? "unknown",
  };
}

/** Best-effort React Fiber source location (DEV builds). */
export function readFiberMeta(element: Element): {
  fileHint?: string;
  componentName?: string;
} {
  const key = Object.keys(element).find((k) =>
    k.startsWith("__reactFiber$")
  );
  if (!key) return {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fiber: any = (element as any)[key];
  let componentName: string | undefined;
  let fileHint: string | undefined;

  for (let i = 0; i < 12 && fiber; i += 1) {
    if (!componentName && typeof fiber.type === "function") {
      componentName = fiber.type.displayName || fiber.type.name;
    }
    const src = fiber._debugSource;
    if (src?.fileName) {
      const file = String(src.fileName).replace(/^.*\/src\//, "src/");
      fileHint = `${file}:${src.lineNumber ?? "?"}`;
      break;
    }
    fiber = fiber.return;
  }

  return { fileHint, componentName };
}

export function nearbyText(element: Element): string | undefined {
  const parent = element.parentElement;
  if (!parent) return undefined;
  const text = (parent.textContent || "").replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  return text.length > 80 ? `${text.slice(0, 77)}…` : text;
}

const CURSOR_DEEPLINK_MAX = 8000;

/** Prefills Cursor chat via deeplink. Does not auto-submit. */
export function openInCursor(promptText: string): { ok: boolean; reason?: string } {
  const url = `cursor://anysphere.cursor-deeplink/prompt?text=${encodeURIComponent(promptText)}`;
  if (url.length > CURSOR_DEEPLINK_MAX) {
    return {
      ok: false,
      reason: "Prompt is too long for a Cursor deeplink — copied to clipboard instead.",
    };
  }

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return { ok: true };
}

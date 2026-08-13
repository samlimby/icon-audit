import type { CatalogIcon } from "./icons/catalog";
import { svgMarkupFor } from "./icons/catalog";
import type { DomLocator } from "./dom-context";
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
  /** CSS color baked into the inline SVG so drafts match the original icon. */
  color?: string;
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

function libraryLabel(icon: CatalogIcon): string {
  if (icon.library === "lucide") return "Lucide";
  if (icon.library === "fontawesome") return "Font Awesome";
  if (icon.library === "iconoir") return "Iconoir";
  if (icon.library === "custom") return "a custom pack";
  return icon.packageName;
}

function formatLocatorLines(locator: DomLocator): string[] {
  const lines = [
    `- Parent chain (outer → inner): ${locator.parentChain}`,
  ];
  if (locator.searchTokens.length > 0) {
    lines.push(
      `- Search the repo for these identifiers: ${locator.searchTokens
        .map((t) => `\`${t}\``)
        .join(", ")}`
    );
  }
  if (locator.id) lines.push(`- Element id: #${locator.id}`);
  if (locator.className) lines.push(`- Element class: ${locator.className}`);
  if (locator.alt) lines.push(`- alt: ${locator.alt}`);
  if (locator.ariaLabel) lines.push(`- aria-label: ${locator.ariaLabel}`);
  if (locator.src) lines.push(`- src: ${locator.src}`);
  return lines;
}

export function buildAgentPrompt(
  scanned: ScannedElement,
  icon: CatalogIcon,
  meta: PromptTargetMeta
): string {
  const rawSvg = svgMarkupFor(icon, meta.size, meta.color || "currentColor");
  const accessibleName =
    scanned.locator.alt ||
    scanned.locator.ariaLabel ||
    icon.exportName;

  const lines = [
    `Replace an <img>/icon in this app with inline SVG from ${libraryLabel(icon)} (${icon.exportName}).`,
    "",
    "Do NOT install npm icon packages (lucide-react, fontawesome, iconoir-react, etc.).",
    "Paste the raw SVG markup below directly into the component/JSX.",
    "",
    "Locate current usage using:",
  ];

  if (meta.fileHint) lines.push(`- File (best effort): ${meta.fileHint}`);
  if (meta.componentName) lines.push(`- React component: ${meta.componentName}`);
  lines.push(`- Original DOM snapshot: ${scanned.snapshotHtml}`);
  lines.push(...formatLocatorLines(scanned.locator));
  if (meta.nearbyText) lines.push(`- Nearby UI text: ${meta.nearbyText}`);
  lines.push(
    `- Classification: ${scanned.tag.toUpperCase()} · ${scanned.sourceKind ?? "unknown"} · flagged by icon-audit`
  );
  lines.push("");
  lines.push("Requirements:");
  lines.push(
    "1. Find the icon in source via the parent chain / identifiers above — do not search for data-ia-draft."
  );
  lines.push("2. Remove the remote <img> (or equivalent asset import).");
  lines.push(
    `3. Replace it with this inline SVG (keep ~${meta.size}px size; accessible name: "${accessibleName}"):`
  );
  lines.push("```svg");
  lines.push(rawSvg);
  lines.push("```");
  lines.push(
    "4. If the file is React/JSX, you may inline the SVG element as JSX (same attributes/paths) — still no new icon package deps."
  );
  lines.push("5. Preserve layout and do not change unrelated icons.");

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
    locationHint:
      meta.fileHint ??
      scanned.locator.parentChain ??
      meta.nearbyText ??
      scanned.src ??
      "unknown",
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

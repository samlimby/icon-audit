import { classifyIcon, determineSourceKind } from "./classify";
import {
  captureLocator,
  captureSnapshotHtml,
  readOriginSnapshot,
} from "./dom-context";
import {
  ClassifyOptions,
  DEFAULT_CLASSIFY_OPTIONS,
  ElementNamingInput,
  ElementTag,
  ScannedElement,
} from "./types";

function isRendered(el: Element): boolean {
  const style = window.getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden";
}

function buildNaming(el: Element, tag: ElementTag): ElementNamingInput {
  const src =
    tag === "img"
      ? (el as HTMLImageElement).currentSrc || el.getAttribute("src")
      : null;

  return {
    alt: el.getAttribute("alt"),
    ariaLabel: el.getAttribute("aria-label"),
    // SVGElement.className is an SVGAnimatedString, not a string - fall
    // back to the raw attribute so icon-ish class names are still read.
    className:
      typeof el.className === "string"
        ? el.className
        : el.getAttribute("class"),
    id: el.id || el.getAttribute("id"),
    src,
  };
}

/**
 * Walks `img, svg` under `root` (light DOM only - our own toolbar/overlay
 * live in a shadow root and are naturally excluded) and returns every
 * element that classifies as an icon, with its highlight reasons and
 * source info attached.
 */
export function scanPage(
  root: ParentNode = document.body,
  options: Partial<ClassifyOptions> = {}
): ScannedElement[] {
  const opts: ClassifyOptions = { ...DEFAULT_CLASSIFY_OPTIONS, ...options };
  const candidates = root.querySelectorAll("img, svg");
  const results: ScannedElement[] = [];

  candidates.forEach((el) => {
    const tag = el.tagName.toLowerCase() as ElementTag;
    if (tag !== "img" && tag !== "svg") return;
    if (!isRendered(el)) return;

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const naming = buildNaming(el, tag);
    const { isIcon, reasons } = classifyIcon({ rect, naming }, opts);
    if (!isIcon) return;

    const origin = readOriginSnapshot(el);
    const src = origin.src ?? naming.src ?? null;
    const snapshotHtml = origin.html ?? captureSnapshotHtml(el);
    const locator = captureLocator(el);
    if (origin.src) {
      const base = origin.src.split("/").pop()?.split("?")[0];
      if (base) {
        locator.searchTokens = [...new Set([base, ...locator.searchTokens])];
      }
    }

    results.push({
      element: el,
      tag,
      reasons,
      src,
      sourceKind:
        tag === "svg" && !origin.html
          ? "inline"
          : determineSourceKind(src),
      snapshotHtml,
      locator,
    });
  });

  return results;
}

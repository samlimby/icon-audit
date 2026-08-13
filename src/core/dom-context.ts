/** Attributes we persist on draft wrappers so prompts still point at the original icon. */
export const ORIGIN_HTML_ATTR = "data-ia-origin-html";
export const ORIGIN_SRC_ATTR = "data-ia-origin-src";
export const ORIGIN_TAG_ATTR = "data-ia-origin-tag";

export interface DomLocator {
  tag: string;
  id?: string;
  className?: string;
  alt?: string;
  ariaLabel?: string;
  src?: string;
  /** Outer → inner selectors, e.g. `nav.app-nav > button.settings > img.icon`. */
  parentChain: string;
  /** Individual identifiable tokens useful for ripgrep. */
  searchTokens: string[];
}

function attrClass(el: Element): string | undefined {
  const value =
    typeof (el as HTMLElement).className === "string"
      ? (el as HTMLElement).className
      : el.getAttribute("class");
  const trimmed = (value || "").trim();
  return trimmed || undefined;
}

/** Compact CSS-ish descriptor for one node: `button#save.icon-btn`. */
export function describeNode(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${CSS.escape(el.id)}` : "";
  const classes = (attrClass(el) || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((c) => `.${CSS.escape(c)}`)
    .join("");
  return `${tag}${id}${classes}`;
}

export function captureLocator(el: Element): DomLocator {
  const nodes: Element[] = [];
  let cur: Element | null = el;
  for (let i = 0; i < 6 && cur && cur !== document.documentElement; i += 1) {
    nodes.push(cur);
    cur = cur.parentElement;
  }
  nodes.reverse();

  const parentChain = nodes.map(describeNode).join(" > ");
  const className = attrClass(el);
  const id = el.id || undefined;
  const alt = el.getAttribute("alt") || undefined;
  const ariaLabel = el.getAttribute("aria-label") || undefined;
  const src =
    el instanceof HTMLImageElement
      ? el.currentSrc || el.getAttribute("src") || undefined
      : el.getAttribute("src") || undefined;

  const searchTokens = [
    id,
    ...(className ? className.split(/\s+/).filter(Boolean).slice(0, 6) : []),
    alt,
    ariaLabel,
    src ? src.split("/").pop()?.split("?")[0] : undefined,
  ].filter((t): t is string => Boolean(t && t.length > 1));

  return {
    tag: el.tagName.toLowerCase(),
    id,
    className,
    alt,
    ariaLabel,
    src,
    parentChain,
    searchTokens: [...new Set(searchTokens)],
  };
}

/** Shallow outerHTML snapshot for prompts (no children — avoids huge SVG trees). */
export function captureSnapshotHtml(el: Element): string {
  const clone = el.cloneNode(false) as Element;
  // Drop draft/origin bookkeeping from the snapshot so agents search for real markup.
  clone.removeAttribute("data-ia-draft");
  clone.removeAttribute(ORIGIN_HTML_ATTR);
  clone.removeAttribute(ORIGIN_SRC_ATTR);
  clone.removeAttribute(ORIGIN_TAG_ATTR);
  const html = clone.outerHTML;
  return html.length > 240 ? `${html.slice(0, 237)}…` : html;
}

export function readOriginSnapshot(el: Element): {
  html?: string;
  src?: string;
  tag?: string;
} {
  const root =
    el.closest(`[${ORIGIN_HTML_ATTR}]`) ||
    (el.hasAttribute(ORIGIN_HTML_ATTR) ? el : null);
  if (!root) return {};
  const html = root.getAttribute(ORIGIN_HTML_ATTR) || undefined;
  const src = root.getAttribute(ORIGIN_SRC_ATTR) || undefined;
  const tag = root.getAttribute(ORIGIN_TAG_ATTR) || undefined;
  return {
    html: html ? decodeURIComponent(html) : undefined,
    src: src || undefined,
    tag: tag || undefined,
  };
}

export function stampOrigin(target: Element, origin: {
  html: string;
  src: string | null;
  tag: string;
}): void {
  target.setAttribute(ORIGIN_HTML_ATTR, encodeURIComponent(origin.html));
  if (origin.src) target.setAttribute(ORIGIN_SRC_ATTR, origin.src);
  target.setAttribute(ORIGIN_TAG_ATTR, origin.tag);
}

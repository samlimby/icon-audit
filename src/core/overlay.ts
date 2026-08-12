import { ScannedElement } from "./types";

export const DRAFT_ATTR = "data-ia-draft";
/** @deprecated use DRAFT_ATTR */
export const PREVIEW_ATTR = DRAFT_ATTR;

const VIEWPORT_MARGIN = 8;
const TOOLTIP_GAP = 6;
const BADGE_GAP = 4;

export interface OverlayCallbacks {
  onSelect: (item: ScannedElement) => void;
}

export interface OverlayHandle {
  update: (scanned: ScannedElement[]) => void;
  clear: () => void;
  setSelected: (element: Element | null) => void;
  destroy: () => void;
}

function isDraft(element: Element): boolean {
  return Boolean(
    element.closest(`[${DRAFT_ATTR}]`) || element.hasAttribute(DRAFT_ATTR)
  );
}

function describe(item: ScannedElement): string {
  if (isDraft(item.element)) {
    return "Draft swap on the page — waiting for the agent to apply it in source";
  }

  const parts: string[] = [item.tag === "svg" ? "Inline SVG" : "<img> tag"];

  if (item.sourceKind === "remote") {
    parts.push("remote source — breaks if the URL moves or times out");
  } else if (item.sourceKind === "local") {
    parts.push("local file, but not an inline SVG");
  } else if (item.sourceKind === "data-uri") {
    parts.push("data URI");
  }

  if (item.src) parts.push(item.src);

  return parts.join(" · ");
}

/** Keep the tooltip fully inside the viewport by flipping and shifting as needed. */
function placeTooltip(box: HTMLElement, tooltip: HTMLElement) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const boxRect = box.getBoundingClientRect();

  const tipW = tooltip.offsetWidth;
  const tipH = tooltip.offsetHeight;

  const spaceBelow = vh - boxRect.bottom - TOOLTIP_GAP;
  const spaceAbove = boxRect.top - TOOLTIP_GAP;
  const placeAbove =
    tipH + VIEWPORT_MARGIN > spaceBelow && spaceAbove > spaceBelow;

  let top = placeAbove
    ? boxRect.top - TOOLTIP_GAP - tipH
    : boxRect.bottom + TOOLTIP_GAP;
  top = Math.min(
    Math.max(top, VIEWPORT_MARGIN),
    Math.max(VIEWPORT_MARGIN, vh - VIEWPORT_MARGIN - tipH)
  );

  let left = boxRect.left;
  left = Math.min(left, vw - VIEWPORT_MARGIN - tipW);
  left = Math.max(left, VIEWPORT_MARGIN);

  tooltip.style.top = `${Math.round(top)}px`;
  tooltip.style.left = `${Math.round(left)}px`;
}

/** Keep badges fully visible in the viewport (above the box when possible). */
function placeBadge(box: HTMLElement, badge: HTMLElement) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const boxRect = box.getBoundingClientRect();
  const badgeW = badge.offsetWidth;
  const badgeH = badge.offsetHeight;

  let top = boxRect.top - BADGE_GAP - badgeH;
  if (top < VIEWPORT_MARGIN) {
    top = boxRect.bottom + BADGE_GAP;
  }
  top = Math.min(
    Math.max(top, VIEWPORT_MARGIN),
    Math.max(VIEWPORT_MARGIN, vh - VIEWPORT_MARGIN - badgeH)
  );

  let left = boxRect.left - 2;
  left = Math.min(left, vw - VIEWPORT_MARGIN - badgeW);
  left = Math.max(left, VIEWPORT_MARGIN);

  badge.style.top = `${Math.round(top)}px`;
  badge.style.left = `${Math.round(left)}px`;
}

/** Creates the highlight-box layer inside `shadowRoot` and keeps it in sync with `update()`. */
export function createOverlay(
  shadowRoot: ShadowRoot,
  callbacks?: OverlayCallbacks
): OverlayHandle {
  const container = document.createElement("div");
  container.className = "ia-overlay-layer";
  shadowRoot.appendChild(container);

  const boxes = new Map<Element, HTMLDivElement>();
  const badges = new Map<Element, HTMLSpanElement>();
  const tooltips = new Map<Element, HTMLDivElement>();
  let scanned: ScannedElement[] = [];
  let selected: Element | null = null;
  let hoveredElement: Element | null = null;
  let rafId: number | null = null;

  function hideTooltip(el: Element) {
    const tip = tooltips.get(el);
    if (tip) tip.classList.remove("is-visible");
  }

  function showTooltip(el: Element) {
    const box = boxes.get(el);
    const tip = tooltips.get(el);
    if (!box || !tip) return;
    tip.classList.add("is-visible");
    placeTooltip(box, tip);
  }

  function syncBoxes() {
    const live = new Set(scanned.map((s) => s.element));
    for (const [el, box] of boxes) {
      if (!live.has(el)) {
        if (hoveredElement === el) hoveredElement = null;
        box.remove();
        boxes.delete(el);
        badges.get(el)?.remove();
        badges.delete(el);
        tooltips.get(el)?.remove();
        tooltips.delete(el);
      }
    }

    for (const item of scanned) {
      const draft = isDraft(item.element);
      const kind = draft ? "draft" : item.tag;
      let box = boxes.get(item.element);
      let badge = badges.get(item.element);
      let tooltip = tooltips.get(item.element);

      if (!box) {
        box = document.createElement("div");

        // Badge + tooltip live on the overlay layer so they aren't clipped by
        // the transformed highlight box and can be clamped to the viewport.
        badge = document.createElement("span");
        badge.className = "ia-badge";

        tooltip = document.createElement("div");
        tooltip.className = "ia-tooltip";

        box.addEventListener("mouseenter", () => {
          hoveredElement = item.element;
          showTooltip(item.element);
        });
        box.addEventListener("mouseleave", () => {
          if (hoveredElement === item.element) hoveredElement = null;
          hideTooltip(item.element);
        });

        box.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          callbacks?.onSelect(item);
        });

        container.appendChild(box);
        container.appendChild(badge);
        container.appendChild(tooltip);
        boxes.set(item.element, box);
        badges.set(item.element, badge);
        tooltips.set(item.element, tooltip);
      }

      box.className = `ia-box ia-box--${kind}`;
      box.classList.toggle("ia-box--selected", item.element === selected);

      if (badge) {
        badge.className = `ia-badge ia-badge--${kind}`;
        badge.textContent = draft ? "Draft" : item.tag.toUpperCase();
      }
      if (tooltip) {
        tooltip.textContent = describe(item);
      }
    }
  }

  function positionBoxes() {
    for (const item of scanned) {
      const box = boxes.get(item.element);
      const badge = badges.get(item.element);
      if (!box) continue;
      const rect = item.element.getBoundingClientRect();
      const pad = 4;
      box.style.transform = `translate(${rect.left - pad}px, ${rect.top - pad}px)`;
      box.style.width = `${Math.max(rect.width, 18) + pad * 2}px`;
      box.style.height = `${Math.max(rect.height, 18) + pad * 2}px`;
      if (badge) placeBadge(box, badge);
    }

    if (hoveredElement) {
      const box = boxes.get(hoveredElement);
      const tip = tooltips.get(hoveredElement);
      if (box && tip?.classList.contains("is-visible")) {
        placeTooltip(box, tip);
      }
    }
  }

  function loop() {
    positionBoxes();
    rafId = requestAnimationFrame(loop);
  }

  function update(next: ScannedElement[]) {
    scanned = next;
    if (selected && !scanned.some((s) => s.element === selected)) {
      selected = null;
    }
    syncBoxes();
    positionBoxes();
    if (rafId === null && scanned.length > 0) {
      rafId = requestAnimationFrame(loop);
    }
    if (scanned.length === 0 && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function setSelected(element: Element | null) {
    selected = element;
    syncBoxes();
  }

  function clear() {
    selected = null;
    hoveredElement = null;
    update([]);
  }

  function destroy() {
    clear();
    container.remove();
  }

  return { update, clear, setSelected, destroy };
}

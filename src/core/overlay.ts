import { ScannedElement } from "./types";

export const PREVIEW_ATTR = "data-ia-preview";

export interface OverlayCallbacks {
  onSelect: (item: ScannedElement) => void;
}

export interface OverlayHandle {
  update: (scanned: ScannedElement[]) => void;
  clear: () => void;
  setSelected: (element: Element | null) => void;
  destroy: () => void;
}

function isPreviewed(element: Element): boolean {
  return Boolean(
    element.closest(`[${PREVIEW_ATTR}]`) || element.hasAttribute(PREVIEW_ATTR)
  );
}

function describe(item: ScannedElement): string {
  if (isPreviewed(item.element)) {
    return "Live preview swap — not persisted to source yet";
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

/** Creates the highlight-box layer inside `shadowRoot` and keeps it in sync with `update()`. */
export function createOverlay(
  shadowRoot: ShadowRoot,
  callbacks?: OverlayCallbacks
): OverlayHandle {
  const container = document.createElement("div");
  container.className = "ia-overlay-layer";
  shadowRoot.appendChild(container);

  const boxes = new Map<Element, HTMLDivElement>();
  let scanned: ScannedElement[] = [];
  let selected: Element | null = null;
  let rafId: number | null = null;

  function syncBoxes() {
    const live = new Set(scanned.map((s) => s.element));
    for (const [el, box] of boxes) {
      if (!live.has(el)) {
        box.remove();
        boxes.delete(el);
      }
    }

    for (const item of scanned) {
      const preview = isPreviewed(item.element);
      let box = boxes.get(item.element);
      if (!box) {
        box = document.createElement("div");

        const badge = document.createElement("span");
        badge.className = "ia-badge";
        box.appendChild(badge);

        const tooltip = document.createElement("div");
        tooltip.className = "ia-tooltip";
        box.appendChild(tooltip);

        box.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          callbacks?.onSelect(item);
        });

        container.appendChild(box);
        boxes.set(item.element, box);
      }

      box.className = `ia-box ia-box--${preview ? "preview" : item.tag}`;
      box.classList.toggle("ia-box--selected", item.element === selected);

      const badge = box.querySelector(".ia-badge");
      if (badge) {
        badge.textContent = preview ? "Preview" : item.tag.toUpperCase();
      }
      const tooltip = box.querySelector(".ia-tooltip");
      if (tooltip) {
        tooltip.textContent = describe(item);
      }
    }
  }

  function positionBoxes() {
    for (const item of scanned) {
      const box = boxes.get(item.element);
      if (!box) continue;
      const rect = item.element.getBoundingClientRect();
      box.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
      box.style.width = `${Math.max(rect.width, 18)}px`;
      box.style.height = `${Math.max(rect.height, 18)}px`;
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
    update([]);
  }

  function destroy() {
    clear();
    container.remove();
  }

  return { update, clear, setSelected, destroy };
}

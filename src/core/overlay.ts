import { ScannedElement } from "./types";

export interface OverlayHandle {
  update: (scanned: ScannedElement[]) => void;
  clear: () => void;
  destroy: () => void;
}

function describe(item: ScannedElement): string {
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
export function createOverlay(shadowRoot: ShadowRoot): OverlayHandle {
  const container = document.createElement("div");
  container.className = "ia-overlay-layer";
  shadowRoot.appendChild(container);

  const boxes = new Map<Element, HTMLDivElement>();
  let scanned: ScannedElement[] = [];
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
      let box = boxes.get(item.element);
      if (!box) {
        box = document.createElement("div");
        box.className = `ia-box ia-box--${item.tag}`;

        const badge = document.createElement("span");
        badge.className = "ia-badge";
        badge.textContent = item.tag.toUpperCase();
        box.appendChild(badge);

        const tooltip = document.createElement("div");
        tooltip.className = "ia-tooltip";
        tooltip.textContent = describe(item);
        box.appendChild(tooltip);

        container.appendChild(box);
        boxes.set(item.element, box);
      }
    }
  }

  function positionBoxes() {
    for (const item of scanned) {
      const box = boxes.get(item.element);
      if (!box) continue;
      const rect = item.element.getBoundingClientRect();
      box.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
    }
  }

  function loop() {
    positionBoxes();
    rafId = requestAnimationFrame(loop);
  }

  function update(next: ScannedElement[]) {
    scanned = next;
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

  function clear() {
    update([]);
  }

  function destroy() {
    clear();
    container.remove();
  }

  return { update, clear, destroy };
}

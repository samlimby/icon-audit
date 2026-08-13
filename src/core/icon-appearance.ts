/**
 * Best-effort visual appearance of an icon element so draft SVGs
 * match the original <img> instead of inheriting black text color.
 */
export interface IconAppearance {
  color: string;
  opacity: string;
  filter: string;
}

function averageOpaqueColor(
  data: Uint8ClampedArray
): string | null {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 128) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    n += 1;
  }
  if (!n) return null;
  return `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
}

/** Sample painted pixels from an <img> (skips transparent). CORS may block remotes. */
function sampleImageColor(img: HTMLImageElement): string | null {
  try {
    const w = img.naturalWidth || Math.round(img.width) || 16;
    const h = img.naturalHeight || Math.round(img.height) || 16;
    if (w <= 0 || h <= 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    return averageOpaqueColor(ctx.getImageData(0, 0, w, h).data);
  } catch {
    return null;
  }
}

function sampleSvgColor(svg: SVGElement): string | null {
  const styled = svg.querySelectorAll("[fill], [stroke]");
  for (const node of styled) {
    const fill = node.getAttribute("fill");
    if (fill && fill !== "none" && fill !== "currentColor") return fill;
    const stroke = node.getAttribute("stroke");
    if (stroke && stroke !== "none" && stroke !== "currentColor") return stroke;
  }
  const computed = getComputedStyle(svg).color;
  return computed && computed !== "rgba(0, 0, 0, 0)" ? computed : null;
}

export function readIconAppearance(el: Element): IconAppearance {
  const style = getComputedStyle(el);
  let color: string | null = null;

  if (el instanceof HTMLImageElement) {
    color = sampleImageColor(el);
  } else if (el instanceof SVGElement) {
    color = sampleSvgColor(el);
  }

  if (!color) {
    // Walk parents for an explicit non-default text color used by icon buttons.
    let cur: Element | null = el.parentElement;
    for (let i = 0; i < 4 && cur; i += 1) {
      const c = getComputedStyle(cur).color;
      if (c && c !== "rgba(0, 0, 0, 0)") {
        color = c;
        break;
      }
      cur = cur.parentElement;
    }
  }

  return {
    color: color || style.color || "currentColor",
    opacity: style.opacity === "1" ? "" : style.opacity,
    filter: style.filter === "none" ? "" : style.filter,
  };
}

export function applyIconAppearance(
  target: HTMLElement,
  appearance: IconAppearance
): void {
  target.style.color = appearance.color;
  if (appearance.opacity) target.style.opacity = appearance.opacity;
  if (appearance.filter) target.style.filter = appearance.filter;
}

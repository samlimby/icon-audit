import {
  ClassificationReason,
  ClassifyOptions,
  DEFAULT_CLASSIFY_OPTIONS,
  ElementNamingInput,
  ElementRect,
  SourceKind,
} from "./types";

type NameField = "alt" | "aria-label" | "class" | "id" | "src";

const NAME_FIELDS: Array<{ field: NameField; key: keyof ElementNamingInput }> = [
  { field: "alt", key: "alt" },
  { field: "aria-label", key: "ariaLabel" },
  { field: "class", key: "className" },
  { field: "id", key: "id" },
  { field: "src", key: "src" },
];

function basename(src: string): string {
  const withoutQuery = src.split(/[?#]/)[0];
  const segments = withoutQuery.split("/");
  return segments[segments.length - 1] ?? withoutQuery;
}

/** Small, roughly-square bounding box reads as icon-sized. */
export function sizeReason(
  rect: ElementRect,
  opts: ClassifyOptions = DEFAULT_CLASSIFY_OPTIONS
): ClassificationReason | null {
  const { width, height } = rect;
  if (width <= 0 || height <= 0) return null;
  if (width > opts.iconMaxSize || height > opts.iconMaxSize) return null;

  const ratio = width / height;
  const [min, max] = opts.iconAspectRatioRange;
  if (ratio < min || ratio > max) return null;

  return { kind: "size", width, height };
}

/** Icon-ish wording in alt/aria-label/class/id/filename. */
export function nameReasons(
  naming: ElementNamingInput,
  opts: ClassifyOptions = DEFAULT_CLASSIFY_OPTIONS
): ClassificationReason[] {
  const reasons: ClassificationReason[] = [];

  for (const { field, key } of NAME_FIELDS) {
    const raw = naming[key];
    if (!raw) continue;

    const candidate = field === "src" ? basename(raw) : raw;
    const match = candidate.match(opts.iconNamePattern);
    if (match) {
      reasons.push({ kind: "name", field, match: match[0] });
    }
  }

  return reasons;
}

export interface ClassifyInput {
  rect: ElementRect;
  naming: ElementNamingInput;
}

export interface ClassifyResult {
  isIcon: boolean;
  reasons: ClassificationReason[];
}

/**
 * An element counts as an icon if it matches the size heuristic OR any
 * naming heuristic - either signal is enough (favors recall: better to
 * flag a borderline case than silently skip a broken icon).
 */
export function classifyIcon(
  input: ClassifyInput,
  options: Partial<ClassifyOptions> = {}
): ClassifyResult {
  const opts: ClassifyOptions = { ...DEFAULT_CLASSIFY_OPTIONS, ...options };

  const reasons: ClassificationReason[] = [];

  const bySize = sizeReason(input.rect, opts);
  if (bySize) reasons.push(bySize);

  reasons.push(...nameReasons(input.naming, opts));

  return { isIcon: reasons.length > 0, reasons };
}

/**
 * Classifies where an <img> icon's bytes actually come from, for the
 * hover tooltip. Doesn't affect highlight color (svg=green / img=red is
 * strict per-tag), just explains "why this is risky."
 */
export function determineSourceKind(
  src: string | null | undefined,
  currentOrigin: string = typeof window !== "undefined"
    ? window.location.origin
    : ""
): SourceKind | null {
  if (!src) return null;
  if (src.startsWith("data:")) return "data-uri";

  try {
    const resolved = new URL(src, currentOrigin || undefined);
    return resolved.origin === currentOrigin ? "local" : "remote";
  } catch {
    // Relative path with no usable base - treat as local.
    return "local";
  }
}

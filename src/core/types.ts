export type ElementTag = "svg" | "img";

export type SourceKind = "local" | "remote" | "data-uri" | "inline";

export interface ClassifyOptions {
  /** Max width/height (px) for an element to count as icon-sized. Default 48. */
  iconMaxSize: number;
  /** [min, max] width/height ratio allowed for an icon's bounding box. Default [0.4, 2.5]. */
  iconAspectRatioRange: [number, number];
  /** Pattern matched against alt/aria-label/class/id/filename to detect icon-ish naming. */
  iconNamePattern: RegExp;
}

export const DEFAULT_CLASSIFY_OPTIONS: ClassifyOptions = {
  iconMaxSize: 48,
  iconAspectRatioRange: [0.4, 2.5],
  iconNamePattern:
    /icon|glyph|chevron|caret|logo-mark|pictogram|ico-|-ico\b/i,
};

export interface ElementRect {
  width: number;
  height: number;
}

export interface ElementNamingInput {
  alt?: string | null;
  ariaLabel?: string | null;
  className?: string | null;
  id?: string | null;
  src?: string | null;
}

export interface ClassificationReasonSize {
  kind: "size";
  width: number;
  height: number;
}

export interface ClassificationReasonName {
  kind: "name";
  field: "alt" | "aria-label" | "class" | "id" | "src";
  match: string;
}

export type ClassificationReason =
  | ClassificationReasonSize
  | ClassificationReasonName;

export interface Classification {
  isIcon: boolean;
  reasons: ClassificationReason[];
}

export interface ScannedElement {
  element: Element;
  tag: ElementTag;
  reasons: ClassificationReason[];
  sourceKind: SourceKind | null;
  src: string | null;
}

export interface IconAuditOptions extends Partial<ClassifyOptions> {
  /** Force-enable or disable regardless of environment detection. */
  enabled?: boolean;
  /** Keyboard shortcut spec, e.g. "mod+shift+i". Set to null to disable. */
  shortcut?: string | null;
  /** Corner the floating toggle button docks to. Default "bottom-left". */
  position?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  /** Root element to scan. Defaults to document.body. */
  root?: ParentNode;
}

export interface IconAuditController {
  /** Re-run the scan against the current DOM and refresh highlights. */
  rescan: () => void;
  /** Remove all injected UI/listeners. */
  destroy: () => void;
}

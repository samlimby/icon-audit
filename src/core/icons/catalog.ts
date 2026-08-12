export type IconLibraryId = "lucide" | "fontawesome" | "iconoir" | "custom";

export interface CatalogIcon {
  id: string;
  name: string;
  library: IconLibraryId;
  packageName: string;
  exportName: string;
  /** Inner SVG markup (paths only) for a 24×24 viewBox. */
  paths: string;
  /** Optional viewBox for custom uploads; defaults to 0 0 24 24. */
  viewBox?: string;
}

/** Small local catalog for localhost demos — no npm icon packages required. */
export const ICON_CATALOG: CatalogIcon[] = [
  {
    id: "lucide-settings",
    name: "settings",
    library: "lucide",
    packageName: "lucide-react",
    exportName: "Settings",
    paths: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
  },
  {
    id: "lucide-sliders",
    name: "sliders",
    library: "lucide",
    packageName: "lucide-react",
    exportName: "Sliders",
    paths: `<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>`,
  },
  {
    id: "lucide-clock",
    name: "clock",
    library: "lucide",
    packageName: "lucide-react",
    exportName: "Clock",
    paths: `<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>`,
  },
  {
    id: "lucide-bell",
    name: "bell",
    library: "lucide",
    packageName: "lucide-react",
    exportName: "Bell",
    paths: `<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>`,
  },
  {
    id: "lucide-user",
    name: "user",
    library: "lucide",
    packageName: "lucide-react",
    exportName: "User",
    paths: `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
  },
  {
    id: "lucide-download",
    name: "download",
    library: "lucide",
    packageName: "lucide-react",
    exportName: "Download",
    paths: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`,
  },
  {
    id: "lucide-home",
    name: "home",
    library: "lucide",
    packageName: "lucide-react",
    exportName: "Home",
    paths: `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
  },
  {
    id: "lucide-wrench",
    name: "wrench",
    library: "lucide",
    packageName: "lucide-react",
    exportName: "Wrench",
    paths: `<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>`,
  },
  {
    id: "lucide-monitor",
    name: "monitor",
    library: "lucide",
    packageName: "lucide-react",
    exportName: "Monitor",
    paths: `<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>`,
  },
  {
    id: "lucide-box",
    name: "box",
    library: "lucide",
    packageName: "lucide-react",
    exportName: "Box",
    paths: `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>`,
  },
  {
    id: "lucide-pen",
    name: "pen",
    library: "lucide",
    packageName: "lucide-react",
    exportName: "Pen",
    paths: `<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>`,
  },
  {
    id: "lucide-more",
    name: "more",
    library: "lucide",
    packageName: "lucide-react",
    exportName: "MoreHorizontal",
    paths: `<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>`,
  },
  {
    id: "fa-cog",
    name: "cog",
    library: "fontawesome",
    packageName: "@fortawesome/free-solid-svg-icons",
    exportName: "faCog",
    paths: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
  },
  {
    id: "iconoir-download",
    name: "download",
    library: "iconoir",
    packageName: "iconoir-react",
    exportName: "Download",
    paths: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`,
  },
];

export function searchCatalog(
  library: IconLibraryId,
  query: string
): CatalogIcon[] {
  const q = query.trim().toLowerCase();
  return ICON_CATALOG.filter((icon) => {
    if (icon.library !== library) return false;
    if (!q) return true;
    return (
      icon.name.includes(q) ||
      icon.exportName.toLowerCase().includes(q) ||
      icon.id.includes(q)
    );
  });
}

export function svgMarkupFor(icon: CatalogIcon, size = 22): string {
  const viewBox = icon.viewBox || "0 0 24 24";
  const strokeAttrs =
    icon.library === "custom"
      ? `fill="currentColor"`
      : `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  return `<svg width="${size}" height="${size}" viewBox="${viewBox}" ${strokeAttrs}>${icon.paths}</svg>`;
}

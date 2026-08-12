import {
  CatalogIcon,
  IconLibraryId,
  searchCatalog,
  svgMarkupFor,
} from "./icons/catalog";
import {
  createPackFromFiles,
  CustomPack,
  formatPackMeta,
  loadCustomPacks,
  saveCustomPacks,
} from "./icons/custom-packs";
import type { ScannedElement } from "./types";

const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
const ICON_SEARCH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>`;
const ICON_UPLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
const ICON_PACK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
const ICON_TRAY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`;

export interface ReplacePanelCallbacks {
  onClose: () => void;
  onCopyPrompt: (icon: CatalogIcon) => void;
  onOpenInCursor: (icon: CatalogIcon) => void;
  onPreview: (icon: CatalogIcon) => void;
}

export interface ReplacePanelHandle {
  open: (scanned: ScannedElement) => void;
  close: () => void;
  isOpen: () => boolean;
  destroy: () => void;
}

function basename(src: string | null): string {
  if (!src) return "icon";
  try {
    const path = src.includes("://") ? new URL(src).pathname : src;
    return (path.split("/").pop() || "icon").split("?")[0];
  } catch {
    return "icon";
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type CustomMode = "manage" | "browse";

export function createReplacePanel(
  shadowRoot: ShadowRoot,
  callbacks: ReplacePanelCallbacks
): ReplacePanelHandle {
  const root = document.createElement("div");
  root.className = "ia-panel";
  root.hidden = true;

  let library: IconLibraryId = "lucide";
  let query = "settings";
  let selected: CatalogIcon | null = null;
  let current: ScannedElement | null = null;
  let packs: CustomPack[] = loadCustomPacks();
  let customMode: CustomMode = "manage";
  let browsingPackId: string | null = null;

  root.innerHTML = `
    <div class="ia-panel__header">
      <div class="ia-panel__title-row">
        <div class="ia-panel__title">Replace icon</div>
        <button type="button" class="ia-panel__icon-btn" data-close title="Close">${ICON_CLOSE}</button>
      </div>
      <div class="ia-panel__current" data-current></div>
    </div>
    <div class="ia-panel__tabs" data-tabs></div>
    <div class="ia-panel__library" data-library>
      <div class="ia-panel__search">
        <div class="ia-panel__search-box">
          ${ICON_SEARCH}
          <input class="ia-panel__search-input" data-search type="search" placeholder="Search icons" />
        </div>
      </div>
      <div class="ia-panel__meta">
        <span data-meta-count>0 matches</span>
        <button type="button" class="ia-panel__meta-link" data-back-packs hidden>← Packs</button>
        <span data-meta-style>Outline</span>
      </div>
      <div class="ia-panel__grid" data-grid></div>
    </div>
    <div class="ia-panel__custom" data-custom hidden>
      <div class="ia-dropzone" data-dropzone>
        <input type="file" data-file-input accept=".svg,image/svg+xml" multiple hidden />
        <div class="ia-dropzone__icon" aria-hidden>${ICON_UPLOAD}</div>
        <div class="ia-dropzone__title">Upload icon pack</div>
        <div class="ia-dropzone__sub">SVG files, ZIP, or sprite sheet</div>
        <button type="button" class="ia-dropzone__btn" data-choose>Choose files</button>
      </div>
      <div class="ia-packs">
        <div class="ia-packs__label">Installed packs</div>
        <div class="ia-packs__list" data-packs></div>
      </div>
    </div>
    <div class="ia-panel__footer" data-footer>
      <div class="ia-panel__actions" data-actions>
        <button type="button" class="ia-btn ia-btn--ghost" data-preview>Preview</button>
        <button type="button" class="ia-btn ia-btn--ghost" data-copy>Copy</button>
        <button type="button" class="ia-btn ia-btn--primary" data-open-cursor>Open in Cursor</button>
      </div>
      <div class="ia-panel__hint" data-hint>Open in Cursor prefills chat via deeplink — review and send there. Copy keeps the prompt on the clipboard.</div>
    </div>
  `;

  shadowRoot.appendChild(root);

  const tabsEl = root.querySelector("[data-tabs]") as HTMLElement;
  const libraryEl = root.querySelector("[data-library]") as HTMLElement;
  const customEl = root.querySelector("[data-custom]") as HTMLElement;
  const gridEl = root.querySelector("[data-grid]") as HTMLElement;
  const packsEl = root.querySelector("[data-packs]") as HTMLElement;
  const dropzone = root.querySelector("[data-dropzone]") as HTMLElement;
  const fileInput = root.querySelector("[data-file-input]") as HTMLInputElement;
  const searchInput = root.querySelector("[data-search]") as HTMLInputElement;
  const currentEl = root.querySelector("[data-current]") as HTMLElement;
  const metaCount = root.querySelector("[data-meta-count]") as HTMLElement;
  const metaStyle = root.querySelector("[data-meta-style]") as HTMLElement;
  const backPacksBtn = root.querySelector("[data-back-packs]") as HTMLButtonElement;
  const actionsEl = root.querySelector("[data-actions]") as HTMLElement;
  const hintEl = root.querySelector("[data-hint]") as HTMLElement;
  const closeBtn = root.querySelector("[data-close]") as HTMLButtonElement;
  const previewBtn = root.querySelector("[data-preview]") as HTMLButtonElement;
  const copyBtn = root.querySelector("[data-copy]") as HTMLButtonElement;
  const openCursorBtn = root.querySelector(
    "[data-open-cursor]"
  ) as HTMLButtonElement;
  const chooseBtn = root.querySelector("[data-choose]") as HTMLButtonElement;

  const libraries: { id: IconLibraryId; label: string }[] = [
    { id: "lucide", label: "Lucide" },
    { id: "fontawesome", label: "Font Awesome" },
    { id: "iconoir", label: "Iconoir" },
    { id: "custom", label: "Custom" },
  ];

  function browsingPack(): CustomPack | null {
    return packs.find((p) => p.id === browsingPackId) ?? null;
  }

  function customIcons(): CatalogIcon[] {
    const pack = browsingPack();
    const source = pack ? pack.icons : packs.flatMap((p) => p.icons);
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (icon) =>
        icon.name.includes(q) ||
        icon.exportName.toLowerCase().includes(q) ||
        icon.id.includes(q)
    );
  }

  function isCustomManage(): boolean {
    return library === "custom" && customMode === "manage";
  }

  function renderTabs() {
    tabsEl.innerHTML = libraries
      .map(
        (lib) =>
          `<button type="button" class="ia-chip${lib.id === library ? " is-active" : ""}" data-lib="${lib.id}">${lib.label}</button>`
      )
      .join("");
  }

  function renderCurrent() {
    if (!current) return;
    const name = basename(current.src);
    const size = Math.round(
      Math.max(
        current.element.getBoundingClientRect().width,
        current.element.getBoundingClientRect().height
      ) || 18
    );
    currentEl.innerHTML = `
      <div class="ia-panel__current-icon" aria-hidden>${current.element.outerHTML}</div>
      <div class="ia-panel__current-text">
        <div class="ia-panel__current-name">${escapeHtml(name)}</div>
        <div class="ia-panel__current-meta">${current.tag.toUpperCase()} · ${current.sourceKind ?? "unknown"} · ${size}×${size}</div>
      </div>
    `;
  }

  function renderPacks() {
    if (packs.length === 0) {
      packsEl.innerHTML = `<div class="ia-packs__empty">No packs yet. Drop SVGs above to install one.</div>`;
      return;
    }

    packsEl.innerHTML = packs
      .map((pack, index) => {
        const icon = index % 2 === 0 ? ICON_PACK : ICON_TRAY;
        return `
        <div class="ia-pack-row" data-pack-id="${pack.id}">
          <div class="ia-pack-row__icon">${icon}</div>
          <div class="ia-pack-row__body">
            <div class="ia-pack-row__title">${escapeHtml(pack.name)}</div>
            <div class="ia-pack-row__meta">${escapeHtml(formatPackMeta(pack))}</div>
          </div>
          <button type="button" class="ia-pack-row__browse" data-browse="${pack.id}">Browse</button>
        </div>`;
      })
      .join("");
  }

  function renderGrid() {
    const results =
      library === "custom" ? customIcons() : searchCatalog(library, query);
    const label =
      library === "custom"
        ? browsingPack()?.name ?? "Custom"
        : libraries.find((l) => l.id === library)?.label ?? library;

    metaCount.textContent = `${results.length} matches in ${label}`;
    backPacksBtn.hidden = !(library === "custom" && customMode === "browse");
    metaStyle.hidden = library === "custom";

    if (!selected || !results.some((r) => r.id === selected?.id)) {
      selected = results[0] ?? null;
    }

    if (results.length === 0) {
      gridEl.innerHTML = `<div class="ia-panel__empty">No icons in this pack yet.</div>`;
      return;
    }

    gridEl.innerHTML = results
      .map(
        (icon) => `
      <button type="button" class="ia-icon-cell${selected?.id === icon.id ? " is-selected" : ""}" data-icon-id="${icon.id}" title="${escapeHtml(icon.name)}">
        ${svgMarkupFor(icon, 22)}
        <span>${escapeHtml(icon.name)}</span>
      </button>`
      )
      .join("");
  }

  function renderMode() {
    const manage = isCustomManage();
    libraryEl.hidden = manage;
    customEl.hidden = !manage;
    actionsEl.hidden = manage;
    if (manage) {
      hintEl.textContent =
        "Packs stay in this browser session by default. Wire onPackImport to sync into your design system repo.";
      renderPacks();
    } else {
      hintEl.textContent =
        "Open in Cursor prefills chat via deeplink — review and send there. Copy keeps the prompt on the clipboard.";
      renderGrid();
      searchInput.value = query;
    }
  }

  function refresh() {
    renderTabs();
    renderCurrent();
    renderMode();
  }

  async function importFiles(files: FileList | File[]) {
    const { pack, skipped } = await createPackFromFiles(files);
    if (!pack) {
      if (skipped.length > 0) {
        hintEl.textContent =
          "Only SVG files and SVG sprite sheets are supported for now.";
      }
      return;
    }
    packs = [pack, ...packs];
    saveCustomPacks(packs);
    browsingPackId = pack.id;
    customMode = "browse";
    query = "";
    selected = pack.icons[0] ?? null;
    refresh();
  }

  tabsEl.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-lib]") as HTMLElement | null;
    if (!btn) return;
    library = btn.dataset.lib as IconLibraryId;
    selected = null;
    if (library === "custom") {
      customMode = packs.length > 0 && browsingPackId ? "browse" : "manage";
      if (customMode === "manage") browsingPackId = null;
      query = "";
    } else {
      customMode = "manage";
      browsingPackId = null;
    }
    refresh();
  });

  gridEl.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest(
      "[data-icon-id]"
    ) as HTMLElement | null;
    if (!btn?.dataset.iconId) return;
    const results =
      library === "custom" ? customIcons() : searchCatalog(library, query);
    selected = results.find((r) => r.id === btn.dataset.iconId) ?? null;
    renderGrid();
  });

  packsEl.addEventListener("click", (e) => {
    const browse = (e.target as HTMLElement).closest(
      "[data-browse]"
    ) as HTMLElement | null;
    if (!browse?.dataset.browse) return;
    browsingPackId = browse.dataset.browse;
    customMode = "browse";
    query = "";
    selected = null;
    refresh();
  });

  backPacksBtn.addEventListener("click", () => {
    customMode = "manage";
    browsingPackId = null;
    selected = null;
    refresh();
  });

  searchInput.addEventListener("input", () => {
    query = searchInput.value;
    selected = null;
    renderGrid();
  });

  chooseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("[data-choose]")) return;
    fileInput.click();
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files?.length) void importFiles(fileInput.files);
    fileInput.value = "";
  });

  dropzone.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dropzone.classList.add("is-dragging");
  });
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("is-dragging");
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("is-dragging");
  });
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("is-dragging");
    const files = e.dataTransfer?.files;
    if (files?.length) void importFiles(files);
  });

  closeBtn.addEventListener("click", () => callbacks.onClose());
  previewBtn.addEventListener("click", () => {
    if (selected) callbacks.onPreview(selected);
  });
  copyBtn.addEventListener("click", () => {
    if (selected) callbacks.onCopyPrompt(selected);
  });
  openCursorBtn.addEventListener("click", () => {
    if (selected) callbacks.onOpenInCursor(selected);
  });

  function open(scanned: ScannedElement) {
    current = scanned;
    const seed =
      scanned.src?.toLowerCase().match(/([a-z0-9-]+)\.(svg|png|jpg)/i)?.[1] ||
      scanned.element.getAttribute("alt")?.toLowerCase().replace(/\s+icon$/, "") ||
      "settings";
    query = seed;
    library = "lucide";
    selected = null;
    customMode = "manage";
    browsingPackId = null;
    packs = loadCustomPacks();
    root.hidden = false;
    refresh();
  }

  function close() {
    root.hidden = true;
    current = null;
  }

  function isOpen() {
    return !root.hidden;
  }

  function destroy() {
    root.remove();
  }

  return { open, close, isOpen, destroy };
}

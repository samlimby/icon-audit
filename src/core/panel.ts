import {
  CatalogIcon,
  IconLibraryId,
  isCatalogReady,
  preloadCatalog,
  renderModeFor,
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
  /** Apply draft on the page and enqueue the agent prompt. */
  onSelectIcon: (icon: CatalogIcon) => void | boolean | Promise<boolean | void>;
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
  let query = "";
  let selected: CatalogIcon | null = null;
  let current: ScannedElement | null = null;
  let packs: CustomPack[] = loadCustomPacks();
  let customMode: CustomMode = "manage";
  let browsingPackId: string | null = null;
  let customPos: { left: number; top: number } | null = null;
  let drag:
    | { pointerId: number; offsetX: number; offsetY: number }
    | null = null;
  let lastResults: CatalogIcon[] = [];
  let searchToken = 0;

  root.innerHTML = `
    <div class="ia-panel__header ia-panel__drag" data-drag>
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
        <button type="button" class="ia-btn ia-btn--primary" data-select>Select</button>
      </div>
      <div class="ia-panel__hint" data-hint>Adds a page draft and queues the agent prompt — open the queue to copy it into Cursor, Claude Code, Codex, or any AI chat.</div>
    </div>
  `;

  shadowRoot.appendChild(root);

  // Warm the default pack while the panel is idle.
  void preloadCatalog("lucide");

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
  const selectBtn = root.querySelector("[data-select]") as HTMLButtonElement;
  const chooseBtn = root.querySelector("[data-choose]") as HTMLButtonElement;
  const dragHandle = root.querySelector("[data-drag]") as HTMLElement;

  function applyPosition() {
    if (!customPos) {
      root.style.left = "";
      root.style.top = "";
      root.style.right = "";
      return;
    }
    root.style.right = "auto";
    root.style.left = `${customPos.left}px`;
    root.style.top = `${customPos.top}px`;
  }

  function clampPosition(left: number, top: number) {
    const margin = 8;
    const width = root.offsetWidth || 360;
    const height = root.offsetHeight || 200;
    return {
      left: Math.min(
        Math.max(margin, left),
        Math.max(margin, window.innerWidth - width - margin)
      ),
      top: Math.min(
        Math.max(margin, top),
        Math.max(margin, window.innerHeight - height - margin)
      ),
    };
  }

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

  async function renderGrid() {
    const token = ++searchToken;
    const label =
      library === "custom"
        ? browsingPack()?.name ?? "Custom"
        : libraries.find((l) => l.id === library)?.label ?? library;

    backPacksBtn.hidden = !(library === "custom" && customMode === "browse");
    metaStyle.hidden = library === "custom";

    let results: CatalogIcon[];
    let total: number;

    if (library === "custom") {
      results = customIcons();
      total = results.length;
    } else {
      const ready = isCatalogReady(library);
      if (!ready) {
        metaCount.textContent = `Loading ${label}…`;
        gridEl.innerHTML = `<div class="ia-panel__empty">Loading icons…</div>`;
      }
      try {
        const found = await searchCatalog(library, query);
        if (token !== searchToken) return;
        results = found.icons;
        total = found.total;
        const sample = results[0];
        metaStyle.textContent =
          sample && renderModeFor(sample) === "fill" ? "Solid" : "Outline";
      } catch (err) {
        if (token !== searchToken) return;
        console.error("[icon-audit] catalog load failed", err);
        metaCount.textContent = `Failed to load ${label}`;
        gridEl.innerHTML = `<div class="ia-panel__empty">Couldn’t load this icon pack. Try refreshing, or update icon-audit.</div>`;
        lastResults = [];
        selected = null;
        return;
      }
    }

    lastResults = results;
    metaCount.textContent =
      total > results.length
        ? `Showing ${results.length} of ${total} in ${label}`
        : `${total} matches in ${label}`;

    if (!selected || !results.some((r) => r.id === selected?.id)) {
      selected = results[0] ?? null;
    }

    if (results.length === 0) {
      gridEl.innerHTML = `<div class="ia-panel__empty">${
        query.trim()
          ? "No icons match that search."
          : "No icons in this pack yet."
      }</div>`;
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
        "Adds a page draft and queues the agent prompt — open the queue to copy it into Cursor, Claude Code, Codex, or any AI chat.";
      void renderGrid();
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
      void preloadCatalog(library);
    }
    refresh();
  });

  gridEl.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest(
      "[data-icon-id]"
    ) as HTMLElement | null;
    if (!btn?.dataset.iconId) return;
    selected = lastResults.find((r) => r.id === btn.dataset.iconId) ?? null;
    for (const cell of gridEl.querySelectorAll(".ia-icon-cell")) {
      cell.classList.toggle(
        "is-selected",
        (cell as HTMLElement).dataset.iconId === selected?.id
      );
    }
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

  let searchTimer: number | null = null;
  searchInput.addEventListener("input", () => {
    query = searchInput.value;
    selected = null;
    if (searchTimer != null) window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      searchTimer = null;
      void renderGrid();
    }, 80);
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

  dragHandle.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest("[data-close]")) return;
    if (e.button !== 0) return;
    const rect = root.getBoundingClientRect();
    root.style.right = "auto";
    root.style.left = `${rect.left}px`;
    root.style.top = `${rect.top}px`;
    drag = {
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    root.classList.add("is-dragging");
    dragHandle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  dragHandle.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    customPos = clampPosition(e.clientX - drag.offsetX, e.clientY - drag.offsetY);
    applyPosition();
  });

  function endDrag(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    drag = null;
    root.classList.remove("is-dragging");
    try {
      dragHandle.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
  }

  dragHandle.addEventListener("pointerup", endDrag);
  dragHandle.addEventListener("pointercancel", endDrag);

  closeBtn.addEventListener("click", () => callbacks.onClose());
  selectBtn.addEventListener("click", () => {
    if (!selected) return;
    void Promise.resolve(callbacks.onSelectIcon(selected));
  });

  function open(scanned: ScannedElement) {
    current = scanned;
    query = "";
    library = "lucide";
    selected = null;
    customMode = "manage";
    browsingPackId = null;
    packs = loadCustomPacks();
    applyPosition();
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

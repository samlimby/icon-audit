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
  collectFilesFromDataTransfer,
  CustomPack,
  formatPackMeta,
  loadCustomPacks,
  removeCustomPack,
  renameCustomPack,
} from "./icons/custom-packs";
import {
  persistCustomPacks,
  syncCustomPacks,
  type PackPersist,
} from "./icons/pack-sync";
import type { ScannedElement } from "./types";
import { emptyStateHtml } from "./empty-art";

const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
const ICON_SEARCH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>`;
const ICON_UPLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
const ICON_PACK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
const ICON_TRAY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`;
const ICON_KEBAB = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 5.2C7.227 5.2 6.6 4.573 6.6 3.8 6.6 3.028 7.227 2.4 8 2.4 8.772 2.4 9.4 3.028 9.4 3.8 9.4 4.573 8.772 5.2 8 5.2zM8 10.8C8.772 10.8 9.4 11.428 9.4 12.2 9.4 12.973 8.772 13.6 8 13.6 7.227 13.6 6.6 12.973 6.6 12.2 6.6 11.428 7.227 10.8 8 10.8zM9.4 8C9.4 8.773 8.772 9.4 8 9.4 7.227 9.4 6.6 8.773 6.6 8 6.6 7.228 7.227 6.6 8 6.6 8.772 6.6 9.4 7.228 9.4 8z"/></svg>`;

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

/** Chromium blocks file pickers for inputs inside Shadow DOM. Sit the inputs
 * on document.body and cover the visible buttons so the click is native. */
function createLightFileInput(options: {
  accept?: string;
  directory?: boolean;
}): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  if (options.accept) input.accept = options.accept;
  if (options.directory) {
    input.setAttribute("webkitdirectory", "");
    input.setAttribute("directory", "");
  }
  input.setAttribute("aria-hidden", "true");
  input.tabIndex = -1;
  input.style.cssText =
    "position:fixed;left:0;top:0;width:0;height:0;opacity:0;pointer-events:none;border:0;padding:0;margin:0;";
  document.body.appendChild(input);
  return input;
}

function coverButton(
  input: HTMLInputElement,
  btn: HTMLElement,
  show: boolean
) {
  if (!show) {
    input.style.cssText =
      "position:fixed;left:0;top:0;width:0;height:0;opacity:0;pointer-events:none;border:0;padding:0;margin:0;";
    return;
  }
  const r = btn.getBoundingClientRect();
  input.style.cssText = [
    "position:fixed",
    `left:${Math.round(r.left)}px`,
    `top:${Math.round(r.top)}px`,
    `width:${Math.max(Math.round(r.width), 1)}px`,
    `height:${Math.max(Math.round(r.height), 1)}px`,
    "opacity:0",
    "cursor:pointer",
    "z-index:2147483647",
    "margin:0",
    "padding:0",
    "border:0",
    "overflow:hidden",
  ].join(";");
}

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
  let persistKind: PackPersist = "local";
  let customMode: CustomMode = "manage";
  let browsingPackId: string | null = null;
  let renamingPackId: string | null = null;
  let packMenuEl: HTMLElement | null = null;
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
        <button type="button" class="ia-panel__meta-link" data-back-packs hidden>← Packs</button>
        <span data-meta-count>0 matches</span>
        <span data-meta-style>Outline</span>
      </div>
      <div class="ia-panel__grid" data-grid></div>
    </div>
    <div class="ia-panel__custom" data-custom hidden>
      <div class="ia-dropzone" data-dropzone>
        <div class="ia-dropzone__icon" aria-hidden>${ICON_UPLOAD}</div>
        <div class="ia-dropzone__title">Upload icon pack</div>
        <div class="ia-dropzone__actions">
          <button type="button" class="ia-dropzone__btn" data-choose>Choose files</button>
          <button type="button" class="ia-dropzone__btn ia-dropzone__btn--ghost" data-choose-folder>Choose folder</button>
        </div>
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
  const fileInput = createLightFileInput({
    accept: ".svg,image/svg+xml",
  });
  const folderInput = createLightFileInput({ directory: true });
  const searchInput = root.querySelector("[data-search]") as HTMLInputElement;
  const currentEl = root.querySelector("[data-current]") as HTMLElement;
  const metaEl = root.querySelector(".ia-panel__meta") as HTMLElement;
  const metaCount = root.querySelector("[data-meta-count]") as HTMLElement;
  const metaStyle = root.querySelector("[data-meta-style]") as HTMLElement;
  const backPacksBtn = root.querySelector("[data-back-packs]") as HTMLButtonElement;
  const actionsEl = root.querySelector("[data-actions]") as HTMLElement;
  const hintEl = root.querySelector("[data-hint]") as HTMLElement;
  const closeBtn = root.querySelector("[data-close]") as HTMLButtonElement;
  const selectBtn = root.querySelector("[data-select]") as HTMLButtonElement;
  const chooseBtn = root.querySelector("[data-choose]") as HTMLButtonElement;
  const chooseFolderBtn = root.querySelector(
    "[data-choose-folder]"
  ) as HTMLButtonElement;
  const dragHandle = root.querySelector("[data-drag]") as HTMLElement;
  let pickerRaf: number | null = null;

  function syncPickerInputs() {
    const show = !root.hidden && isCustomManage();
    coverButton(fileInput, chooseBtn, show);
    coverButton(folderInput, chooseFolderBtn, show);
    if (!show) {
      chooseBtn.classList.remove("is-hover");
      chooseFolderBtn.classList.remove("is-hover");
    }
    if (show && pickerRaf == null) {
      const loop = () => {
        const visible = !root.hidden && isCustomManage();
        coverButton(fileInput, chooseBtn, visible);
        coverButton(folderInput, chooseFolderBtn, visible);
        pickerRaf = visible ? requestAnimationFrame(loop) : null;
      };
      pickerRaf = requestAnimationFrame(loop);
    }
  }

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
    closePackMenu();
    if (packs.length === 0) {
      packsEl.innerHTML = emptyStateHtml(
        "folder",
        "No custom packs added"
      );
      return;
    }

    packsEl.innerHTML = packs
      .map((pack, index) => {
        const icon = index % 2 === 0 ? ICON_PACK : ICON_TRAY;
        const renaming = renamingPackId === pack.id;
        const title = renaming
          ? `<input class="ia-pack-row__rename" data-rename="${pack.id}" value="${escapeHtml(pack.name)}" aria-label="Pack name" spellcheck="false" />`
          : `<button type="button" class="ia-pack-row__title" data-rename-start="${pack.id}">${escapeHtml(pack.name)}</button>`;
        return `
        <div class="ia-pack-row" data-pack-id="${pack.id}">
          <div class="ia-pack-row__icon">${icon}</div>
          <div class="ia-pack-row__body">
            ${title}
            <div class="ia-pack-row__meta">${escapeHtml(formatPackMeta(pack, persistKind))}</div>
          </div>
          <button type="button" class="ia-pack-row__browse" data-browse="${pack.id}">Browse</button>
          <button type="button" class="ia-pack-row__kebab" data-pack-menu="${pack.id}" aria-label="Pack actions" aria-haspopup="menu" aria-expanded="false">${ICON_KEBAB}</button>
        </div>`;
      })
      .join("");

    if (renamingPackId) {
      const input = packsEl.querySelector(
        "[data-rename]"
      ) as HTMLInputElement | null;
      input?.focus();
      input?.select();
      if (input) sizeRenameInput(input);
    }
  }

  function sizeRenameInput(input: HTMLInputElement) {
    input.style.width = "0";
    input.style.width = `${Math.max(input.scrollWidth, 8)}px`;
  }

  function beginRename(id: string) {
    if (renamingPackId === id) return;
    if (renamingPackId) {
      const prev = packsEl.querySelector(
        "[data-rename]"
      ) as HTMLInputElement | null;
      if (prev) endRename(prev, true);
    }
    renamingPackId = id;
    renderPacks();
  }

  function endRename(input: HTMLInputElement, commit: boolean) {
    if (!input.isConnected) return;
    const id = input.dataset.rename;
    if (!id || renamingPackId !== id) return;
    renamingPackId = null;
    if (commit) {
      const next = renameCustomPack(packs, id, input.value);
      if (next !== packs) {
        packs = next;
        void persistCustomPacks(packs).then((kind) => {
          persistKind = kind;
        });
      }
    }
    const pack = packs.find((p) => p.id === id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ia-pack-row__title";
    btn.dataset.renameStart = id;
    btn.textContent = pack?.name ?? input.value;
    input.replaceWith(btn);
  }

  function closePackMenu() {
    packMenuEl?.remove();
    packMenuEl = null;
    for (const btn of packsEl.querySelectorAll("[data-pack-menu]")) {
      (btn as HTMLElement).setAttribute("aria-expanded", "false");
    }
  }

  function togglePackMenu(id: string, kebab: HTMLElement) {
    if (packMenuEl?.dataset.packId === id) {
      closePackMenu();
      return;
    }
    closePackMenu();
    const panelRect = root.getBoundingClientRect();
    const kebabRect = kebab.getBoundingClientRect();
    packMenuEl = document.createElement("div");
    packMenuEl.className = "ia-pack-menu";
    packMenuEl.dataset.packId = id;
    packMenuEl.setAttribute("role", "menu");
    packMenuEl.innerHTML = `<button type="button" class="ia-pack-menu__item" data-pack-delete="${id}" role="menuitem">Delete</button>`;
    packMenuEl.style.top = `${kebabRect.bottom - panelRect.top + 4}px`;
    packMenuEl.style.right = `${panelRect.right - kebabRect.right}px`;
    root.appendChild(packMenuEl);
    kebab.setAttribute("aria-expanded", "true");
  }

  async function deletePack(id: string) {
    closePackMenu();
    const next = removeCustomPack(packs, id);
    if (next === packs) return;
    packs = next;
    if (browsingPackId === id) {
      browsingPackId = null;
      customMode = "manage";
    }
    persistKind = await persistCustomPacks(packs);
    refresh();
  }

  async function renderGrid() {
    const token = ++searchToken;
    const label =
      library === "custom"
        ? browsingPack()?.name ?? "Custom"
        : libraries.find((l) => l.id === library)?.label ?? library;

    const browsingPacks = library === "custom" && customMode === "browse";
    backPacksBtn.hidden = !browsingPacks;
    metaEl.classList.toggle("ia-panel__meta--browse", browsingPacks);
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
      gridEl.innerHTML = emptyStateHtml(
        "icons",
        query.trim()
          ? "No icons match that search."
          : "No icons in this pack yet."
      );
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
      hintEl.hidden = false;
      hintEl.textContent =
        persistKind === "project"
          ? "Packs are saved in this project and persist across reloads and ports."
          : "Packs stay in this browser. Add the Vite plugin to save them in the project.";
      renderPacks();
    } else {
      // No footer hint on Lucide / Font Awesome / Iconoir (or custom browse).
      hintEl.hidden = true;
      hintEl.textContent = "";
      void renderGrid();
      searchInput.value = query;
    }
    syncPickerInputs();
  }

  function refresh() {
    renderTabs();
    renderCurrent();
    renderMode();
  }

  async function importFiles(files: FileList | File[]) {
    const list = Array.from(files);
    const { pack } = await createPackFromFiles(list);
    if (!pack) {
      if (list.length > 0) {
        hintEl.textContent =
          "No SVGs found. Drop a folder of .svg files, individual SVGs, or an SVG sprite sheet.";
      }
      return;
    }
    packs = [pack, ...packs];
    persistKind = await persistCustomPacks(packs);
    browsingPackId = pack.id;
    customMode = "browse";
    query = "";
    selected = pack.icons[0] ?? null;
    refresh();
    const saved =
      persistKind === "project" ? " Saved to the project." : "";
    hintEl.hidden = false;
    hintEl.textContent = `Imported ${pack.icons.length} icon${pack.icons.length === 1 ? "" : "s"} into “${pack.name}”.${saved}`;
  }

  async function hydratePacks() {
    const result = await syncCustomPacks();
    packs = result.packs;
    persistKind = result.persist;
    if (browsingPackId && !packs.some((p) => p.id === browsingPackId)) {
      browsingPackId = null;
      if (library === "custom") customMode = "manage";
    }
    if (!root.hidden && library === "custom") refresh();
  }

  tabsEl.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest("[data-lib]") as HTMLElement | null;
    if (!btn) return;
    renamingPackId = null;
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
    const start = (e.target as HTMLElement).closest(
      "[data-rename-start]"
    ) as HTMLElement | null;
    if (start?.dataset.renameStart) {
      beginRename(start.dataset.renameStart);
      return;
    }
    const kebab = (e.target as HTMLElement).closest(
      "[data-pack-menu]"
    ) as HTMLElement | null;
    if (kebab?.dataset.packMenu) {
      e.stopPropagation();
      togglePackMenu(kebab.dataset.packMenu, kebab);
      return;
    }
    const browse = (e.target as HTMLElement).closest(
      "[data-browse]"
    ) as HTMLElement | null;
    if (!browse?.dataset.browse) return;
    renamingPackId = null;
    browsingPackId = browse.dataset.browse;
    customMode = "browse";
    query = "";
    selected = null;
    refresh();
  });

  packsEl.addEventListener("input", (e) => {
    const input = e.target as HTMLInputElement;
    if (!input.dataset.rename) return;
    sizeRenameInput(input);
  });

  packsEl.addEventListener("keydown", (e) => {
    const input = e.target as HTMLInputElement;
    if (!input.dataset.rename) return;
    if (e.key === "Enter") {
      e.preventDefault();
      endRename(input, true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      endRename(input, false);
    }
  });

  packsEl.addEventListener(
    "blur",
    (e) => {
      const input = e.target as HTMLInputElement;
      if (!input.dataset.rename) return;
      endRename(input, true);
    },
    true
  );

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

  fileInput.addEventListener("change", () => {
    if (fileInput.files?.length) void importFiles(fileInput.files);
    fileInput.value = "";
  });

  folderInput.addEventListener("change", () => {
    if (folderInput.files?.length) void importFiles(folderInput.files);
    folderInput.value = "";
  });

  function bindPickerHover(input: HTMLInputElement, btn: HTMLElement) {
    input.addEventListener("pointerenter", () => {
      btn.classList.add("is-hover");
    });
    input.addEventListener("pointerleave", () => {
      btn.classList.remove("is-hover");
    });
  }
  bindPickerHover(fileInput, chooseBtn);
  bindPickerHover(folderInput, chooseFolderBtn);

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
    const dt = e.dataTransfer;
    if (!dt) return;
    void collectFilesFromDataTransfer(dt).then((files) => {
      if (files.length) void importFiles(files);
    });
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

  root.addEventListener("click", (e) => {
    const del = (e.target as HTMLElement).closest(
      "[data-pack-delete]"
    ) as HTMLElement | null;
    if (del?.dataset.packDelete) {
      void deletePack(del.dataset.packDelete);
      return;
    }
    if (
      !(e.target as HTMLElement).closest("[data-pack-menu], .ia-pack-menu")
    ) {
      closePackMenu();
    }
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
    void hydratePacks();
  }

  function close() {
    closePackMenu();
    root.hidden = true;
    current = null;
    syncPickerInputs();
  }

  function isOpen() {
    return !root.hidden;
  }

  function destroy() {
    closePackMenu();
    if (pickerRaf != null) cancelAnimationFrame(pickerRaf);
    pickerRaf = null;
    fileInput.remove();
    folderInput.remove();
    root.remove();
  }

  void hydratePacks();

  return { open, close, isOpen, destroy };
}

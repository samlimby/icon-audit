import { IconAuditOptions } from "./types";

const ICON_SCAN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V4a1 1 0 0 1 1-1h3"/><path d="M17 3h3a1 1 0 0 1 1 1v3"/><path d="M21 17v3a1 1 0 0 1-1 1h-3"/><path d="M7 21H4a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="3"/></svg>`;

const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

const ICON_TERMINAL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3"/><path d="M12 15h5"/></svg>`;

export interface ToolbarCallbacks {
  onOpen: () => void;
  onClose: () => void;
  onToggleQueue: () => void;
}

export interface ToolbarHandle {
  setCounts: (svgCount: number, imgCount: number) => void;
  setPromptBadge: (draftCount: number) => void;
  setActive: (active: boolean) => void;
  setQueueOpen: (open: boolean) => void;
  setPreviewCount: (count: number) => void;
  destroy: () => void;
}

export function createToolbar(
  shadowRoot: ShadowRoot,
  position: NonNullable<IconAuditOptions["position"]>,
  callbacks: ToolbarCallbacks
): ToolbarHandle {
  const root = document.createElement("div");
  root.className = `ia-toolbar ia-toolbar--${position}`;
  root.dataset.active = "false";

  let previewCount = 0;
  let queueOpen = false;

  const previewIndicator = document.createElement("div");
  previewIndicator.className = "ia-preview-indicator";
  previewIndicator.hidden = true;
  previewIndicator.setAttribute("aria-live", "polite");

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "ia-toggle";
  toggle.title = "Scan page for SVG/IMG icons";
  toggle.innerHTML = ICON_SCAN;
  toggle.addEventListener("click", callbacks.onOpen);

  const pill = document.createElement("div");
  pill.className = "ia-pill";

  const counts = document.createElement("div");
  counts.className = "ia-counts";

  const svgCount = document.createElement("span");
  svgCount.className = "ia-count ia-count--svg";
  svgCount.innerHTML = `<span data-count-svg>0</span>&nbsp;SVG`;

  const dividerCounts = document.createElement("div");
  dividerCounts.className = "ia-divider";

  const imgCount = document.createElement("span");
  imgCount.className = "ia-count ia-count--img";
  imgCount.innerHTML = `<span data-count-img>0</span>&nbsp;IMG`;

  counts.append(svgCount, dividerCounts, imgCount);

  const terminalWrap = document.createElement("div");
  terminalWrap.className = "ia-terminal-wrap";

  const terminalBtn = document.createElement("button");
  terminalBtn.type = "button";
  terminalBtn.className = "ia-icon-btn ia-terminal-btn";
  terminalBtn.title = "Agent prompts";
  terminalBtn.innerHTML = ICON_TERMINAL;
  terminalBtn.addEventListener("click", callbacks.onToggleQueue);

  const badge = document.createElement("span");
  badge.className = "ia-prompt-badge";
  badge.hidden = true;
  badge.textContent = "0";

  terminalWrap.append(terminalBtn, badge);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "ia-icon-btn";
  closeBtn.title = "Close";
  closeBtn.innerHTML = ICON_CLOSE;
  closeBtn.addEventListener("click", callbacks.onClose);

  pill.append(counts, terminalWrap, closeBtn);
  root.append(previewIndicator, toggle, pill);
  shadowRoot.appendChild(root);

  function syncPreviewIndicator() {
    const show = previewCount > 0 && !queueOpen && root.dataset.active === "true";
    previewIndicator.hidden = !show;
    if (!show) return;
    previewIndicator.textContent = `${previewCount} Draft icon${
      previewCount === 1 ? "" : "s"
    }`;
  }

  function setCounts(svg: number, img: number) {
    const svgEl = svgCount.querySelector("[data-count-svg]");
    const imgEl = imgCount.querySelector("[data-count-img]");
    if (svgEl) svgEl.textContent = String(svg);
    if (imgEl) imgEl.textContent = String(img);
  }

  function setPromptBadge(draftCount: number) {
    if (draftCount <= 0) {
      badge.hidden = true;
      return;
    }
    badge.hidden = false;
    badge.textContent = String(draftCount);
  }

  function setActive(active: boolean) {
    root.dataset.active = active ? "true" : "false";
    syncPreviewIndicator();
  }

  function setQueueOpen(open: boolean) {
    queueOpen = open;
    terminalBtn.classList.toggle("is-active", open);
    syncPreviewIndicator();
  }

  function setPreviewCount(count: number) {
    previewCount = Math.max(0, count);
    syncPreviewIndicator();
  }

  function destroy() {
    toggle.removeEventListener("click", callbacks.onOpen);
    closeBtn.removeEventListener("click", callbacks.onClose);
    terminalBtn.removeEventListener("click", callbacks.onToggleQueue);
    root.remove();
  }

  return {
    setCounts,
    setPromptBadge,
    setActive,
    setQueueOpen,
    setPreviewCount,
    destroy,
  };
}

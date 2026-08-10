import { IconAuditOptions } from "./types";

const ICON_SCAN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V4a1 1 0 0 1 1-1h3"/><path d="M17 3h3a1 1 0 0 1 1 1v3"/><path d="M21 17v3a1 1 0 0 1-1 1h-3"/><path d="M7 21H4a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="3"/></svg>`;

const ICON_REFRESH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.36L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.36L3 16"/><path d="M3 21v-5h5"/></svg>`;

const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

export interface ToolbarCallbacks {
  onOpen: () => void;
  onRescan: () => void;
  onClose: () => void;
}

export interface ToolbarHandle {
  setCounts: (svgCount: number, imgCount: number) => void;
  setActive: (active: boolean) => void;
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
  svgCount.className = "ia-count";
  svgCount.innerHTML = `<span class="ia-dot ia-dot--svg"></span><span data-count-svg>0</span> svg`;

  const imgCount = document.createElement("span");
  imgCount.className = "ia-count";
  imgCount.innerHTML = `<span class="ia-dot ia-dot--img"></span><span data-count-img>0</span> img`;

  counts.append(svgCount, imgCount);

  const divider1 = document.createElement("div");
  divider1.className = "ia-divider";

  const rescanBtn = document.createElement("button");
  rescanBtn.type = "button";
  rescanBtn.className = "ia-icon-btn";
  rescanBtn.title = "Rescan page";
  rescanBtn.innerHTML = ICON_REFRESH;
  rescanBtn.addEventListener("click", callbacks.onRescan);

  const divider2 = document.createElement("div");
  divider2.className = "ia-divider";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "ia-icon-btn";
  closeBtn.title = "Close";
  closeBtn.innerHTML = ICON_CLOSE;
  closeBtn.addEventListener("click", callbacks.onClose);

  pill.append(counts, divider1, rescanBtn, divider2, closeBtn);
  root.append(toggle, pill);
  shadowRoot.appendChild(root);

  function setCounts(svg: number, img: number) {
    const svgEl = svgCount.querySelector("[data-count-svg]");
    const imgEl = imgCount.querySelector("[data-count-img]");
    if (svgEl) svgEl.textContent = String(svg);
    if (imgEl) imgEl.textContent = String(img);
  }

  function setActive(active: boolean) {
    root.dataset.active = active ? "true" : "false";
  }

  function destroy() {
    toggle.removeEventListener("click", callbacks.onOpen);
    rescanBtn.removeEventListener("click", callbacks.onRescan);
    closeBtn.removeEventListener("click", callbacks.onClose);
    root.remove();
  }

  return { setCounts, setActive, destroy };
}

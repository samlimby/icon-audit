import type { CatalogIcon } from "./icons/catalog";
import { preloadBuiltinCatalogs, svgMarkupFor } from "./icons/catalog";
import { applyIconAppearance, readIconAppearance } from "./icon-appearance";
import { stampOrigin } from "./dom-context";
import { bindShortcut } from "./shortcut";
import { isDevEnvironment } from "./env";
import { createOverlay, DRAFT_ATTR, OverlayHandle } from "./overlay";
import { createReplacePanel, ReplacePanelHandle } from "./panel";
import {
  createQueuedPrompt,
  nearbyText,
  QueuedPrompt,
  readFiberMeta,
} from "./prompt";
import { createQueuePanel, QueuePanelHandle } from "./queue-panel";
import { scanPage } from "./scan";
import { STYLES } from "./styles";
import { createToolbar, ToolbarHandle } from "./toolbar";
import {
  ClassifyOptions,
  IconAuditController,
  IconAuditOptions,
  ScannedElement,
} from "./types";

const HOST_ID = "icon-audit-host";
const DEFAULT_SHORTCUT = "mod+shift+i";
const QUEUE_KEY = "icon-audit:prompt-queue";

function noopController(): IconAuditController {
  return { rescan() {}, destroy() {} };
}

function pickClassifyOptions(options: IconAuditOptions): Partial<ClassifyOptions> {
  const picked: Partial<ClassifyOptions> = {
    iconMaxSize: options.iconMaxSize,
    iconAspectRatioRange: options.iconAspectRatioRange,
    iconNamePattern: options.iconNamePattern,
  };
  (Object.keys(picked) as (keyof ClassifyOptions)[]).forEach((key) => {
    if (picked[key] === undefined) delete picked[key];
  });
  return picked;
}

function loadQueue(): QueuedPrompt[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedPrompt[];
  } catch {
    return [];
  }
}

function saveQueue(prompts: QueuedPrompt[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(prompts));
  } catch {
    // ignore quota / private mode
  }
}

function copyViaExecCommand(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.setAttribute("aria-hidden", "true");
  area.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(area);
  area.focus();
  area.select();
  area.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

/** Copy agent prompt text to the system clipboard for pasting into AI tools. */
async function copyText(text: string): Promise<boolean> {
  if (!text) return false;

  // Sync path first so we stay inside the click gesture.
  if (copyViaExecCommand(text)) return true;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Mounts the dev-only icon audit overlay: a floating toggle button that,
 * on click (or the keyboard shortcut), scans `options.root` for
 * icon-classified <svg>/<img> elements and highlights them - green
 * dashed for inline SVG, red dashed for <img>. Click a highlight to
 * open the replace panel and copy an agent prompt. No-ops outside
 * dev environments unless `options.enabled` forces it on.
 *
 * Runtime gating is not enough for production CI: a static import of this
 * module still has to resolve at compile time. Vite apps should mount via
 * `icon-audit/vite` instead of importing this from application source.
 */
export function mountIconAudit(options: IconAuditOptions = {}): IconAuditController {
  const enabled = options.enabled ?? isDevEnvironment();
  if (!enabled || typeof document === "undefined") return noopController();
  if (document.getElementById(HOST_ID)) return noopController();

  const classifyOptions = pickClassifyOptions(options);
  const scanRoot = options.root ?? document.body;
  const position = options.position ?? "bottom-left";

  const host = document.createElement("div");
  host.id = HOST_ID;
  document.body.appendChild(host);
  const shadowRoot = host.attachShadow({ mode: "open" });

  const styleEl = document.createElement("style");
  styleEl.textContent = STYLES;
  shadowRoot.appendChild(styleEl);

  // Start Lucide download as soon as the overlay mounts so replace is snappy.
  preloadBuiltinCatalogs();

  let active = false;
  let selected: ScannedElement | null = null;
  let prompts = loadQueue();
  let rescanTimer: number | null = null;
  let observer: MutationObserver | null = null;

  let toolbar!: ToolbarHandle;
  let overlay!: OverlayHandle;
  let replacePanel!: ReplacePanelHandle;
  let queuePanel!: QueuePanelHandle;

  function syncPromptBadge() {
    toolbar.setPromptBadge(prompts.filter((p) => p.status === "draft").length);
    queuePanel.setPrompts(prompts);
  }

  function enqueueFromIcon(
    icon: CatalogIcon,
    appearanceColor?: string
  ): QueuedPrompt | null {
    if (!selected) return null;
    const rect = selected.element.getBoundingClientRect();
    const size = Math.max(14, Math.round(Math.max(rect.width, rect.height) || 18));
    // Fiber often lives on the replaced host; walk up from drafts.
    const fiberHost =
      selected.element.closest(`[${DRAFT_ATTR}]`)?.parentElement ||
      selected.element;
    const fiber = readFiberMeta(fiberHost) || readFiberMeta(selected.element);
    const prompt = createQueuedPrompt(selected, icon, {
      size,
      fileHint: fiber.fileHint,
      componentName: fiber.componentName,
      nearbyText: nearbyText(selected.element),
      color: appearanceColor,
    });
    prompts = [prompt, ...prompts];
    saveQueue(prompts);
    syncPromptBadge();
    return prompt;
  }

  function markSent(id: string) {
    prompts = prompts.map((p) =>
      p.id === id ? { ...p, status: "sent" as const, sentAt: Date.now() } : p
    );
    saveQueue(prompts);
    syncPromptBadge();
    queuePanel.setPrompts(prompts);
  }

  overlay = createOverlay(shadowRoot, {
    onSelect(item) {
      selected = item;
      overlay.setSelected(item.element);
      queuePanel.close();
      toolbar.setQueueOpen(false);
      replacePanel.open(item);
    },
  });

  replacePanel = createReplacePanel(shadowRoot, {
    onClose() {
      selected = null;
      overlay.setSelected(null);
      replacePanel.close();
    },
    onSelectIcon(icon) {
      if (!selected) return false;
      const appearance = readIconAppearance(selected.element);
      // Queue prompt while we still have the original scanned target.
      const prompt = enqueueFromIcon(icon, appearance.color);
      if (prompt) {
        void copyText(prompt.markdown);
        queuePanel.open();
        toolbar.setQueueOpen(true);
      }

      const rect = selected.element.getBoundingClientRect();
      const size = Math.max(14, Math.round(Math.max(rect.width, rect.height) || 18));
      const wrap = document.createElement("span");
      wrap.setAttribute(DRAFT_ATTR, "true");
      stampOrigin(wrap, {
        html: selected.snapshotHtml,
        src: selected.src,
        tag: selected.tag,
      });
      wrap.style.display = "inline-flex";
      applyIconAppearance(wrap, appearance);
      wrap.innerHTML = svgMarkupFor(icon, size, appearance.color);
      const draftSvg = wrap.querySelector("svg");
      draftSvg?.setAttribute(DRAFT_ATTR, "true");
      selected.element.replaceWith(wrap);
      selected = null;
      overlay.setSelected(null);
      replacePanel.close();
      runScan();
      return Boolean(prompt);
    },
  });

  queuePanel = createQueuePanel(shadowRoot, {
    onClose() {
      queuePanel.close();
      toolbar.setQueueOpen(false);
    },
    onCopy(prompt) {
      const copied = copyText(prompt.markdown);
      if (prompt.status === "draft") markSent(prompt.id);
      return copied;
    },
    onDelete(prompt) {
      prompts = prompts.filter((p) => p.id !== prompt.id);
      saveQueue(prompts);
      syncPromptBadge();
    },
    onCopyAllDrafts() {
      const drafts = prompts.filter((p) => p.status === "draft");
      if (drafts.length === 0) return false;
      const copied = copyText(drafts.map((p) => p.markdown).join("\n\n---\n\n"));
      const now = Date.now();
      prompts = prompts.map((p) =>
        p.status === "draft" ? { ...p, status: "sent" as const, sentAt: now } : p
      );
      saveQueue(prompts);
      syncPromptBadge();
      return copied;
    },
  });

  function countDraftIcons(scanned: ScannedElement[]): number {
    return scanned.filter(
      (s) =>
        s.element.hasAttribute(DRAFT_ATTR) ||
        Boolean(s.element.closest(`[${DRAFT_ATTR}]`))
    ).length;
  }

  function runScan() {
    const scanned = scanPage(scanRoot, classifyOptions);
    overlay.update(scanned);
    toolbar.setCounts(
      scanned.filter((s) => s.tag === "svg").length,
      scanned.filter((s) => s.tag === "img").length
    );
    // When the agent applies the change, our draft wrapper disappears and the
    // new inline SVG rescans as a normal SVG (green) instead of Draft.
    toolbar.setPreviewCount(countDraftIcons(scanned));
  }

  function scheduleRescan() {
    if (!active) return;
    if (rescanTimer !== null) window.clearTimeout(rescanTimer);
    rescanTimer = window.setTimeout(() => {
      rescanTimer = null;
      runScan();
    }, 150);
  }

  function startObserving() {
    stopObserving();
    const rootNode =
      scanRoot instanceof Element || scanRoot instanceof Document
        ? scanRoot
        : document.body;
    observer = new MutationObserver(() => scheduleRescan());
    observer.observe(rootNode, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "class", DRAFT_ATTR],
    });
  }

  function stopObserving() {
    observer?.disconnect();
    observer = null;
    if (rescanTimer !== null) {
      window.clearTimeout(rescanTimer);
      rescanTimer = null;
    }
  }

  function open() {
    active = true;
    toolbar.setActive(true);
    runScan();
    syncPromptBadge();
    startObserving();
  }

  function close() {
    active = false;
    selected = null;
    stopObserving();
    toolbar.setActive(false);
    toolbar.setQueueOpen(false);
    toolbar.setPreviewCount(0);
    overlay.clear();
    replacePanel.close();
    queuePanel.close();
  }

  function toggle() {
    if (active) close();
    else open();
  }

  toolbar = createToolbar(shadowRoot, position, {
    onOpen: open,
    onClose: close,
    onToggleQueue() {
      if (!active) open();
      replacePanel.close();
      selected = null;
      overlay.setSelected(null);
      queuePanel.toggle();
      toolbar.setQueueOpen(queuePanel.isOpen());
    },
  });

  const shortcutSpec =
    options.shortcut === undefined ? DEFAULT_SHORTCUT : options.shortcut;
  const unbindShortcut = bindShortcut(shortcutSpec, toggle);

  function rescan() {
    if (active) runScan();
  }

  function destroy() {
    stopObserving();
    unbindShortcut();
    toolbar.destroy();
    overlay.destroy();
    replacePanel.destroy();
    queuePanel.destroy();
    host.remove();
  }

  syncPromptBadge();

  return { rescan, destroy };
}

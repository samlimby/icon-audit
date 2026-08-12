import type { CatalogIcon } from "./icons/catalog";
import { svgMarkupFor } from "./icons/catalog";
import { bindShortcut } from "./shortcut";
import { isDevEnvironment } from "./env";
import { createOverlay, OverlayHandle, PREVIEW_ATTR } from "./overlay";
import { createReplacePanel, ReplacePanelHandle } from "./panel";
import {
  createQueuedPrompt,
  nearbyText,
  openInCursor,
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

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

/**
 * Mounts the dev-only icon audit overlay: a floating toggle button that,
 * on click (or the keyboard shortcut), scans `options.root` for
 * icon-classified <svg>/<img> elements and highlights them - green
 * dashed for inline SVG, red dashed for <img>. Click a highlight to
 * open the replace panel and copy an agent prompt. No-ops outside
 * dev environments unless `options.enabled` forces it on.
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

  let active = false;
  let selected: ScannedElement | null = null;
  let prompts = loadQueue();
  let previewCount = 0;

  let toolbar!: ToolbarHandle;
  let overlay!: OverlayHandle;
  let replacePanel!: ReplacePanelHandle;
  let queuePanel!: QueuePanelHandle;

  function syncPromptBadge() {
    toolbar.setPromptBadge(prompts.filter((p) => p.status === "draft").length);
    queuePanel.setPrompts(prompts);
  }

  function enqueueFromIcon(icon: CatalogIcon): QueuedPrompt | null {
    if (!selected) return null;
    const rect = selected.element.getBoundingClientRect();
    const size = Math.max(14, Math.round(Math.max(rect.width, rect.height) || 18));
    const fiber = readFiberMeta(selected.element);
    const prompt = createQueuedPrompt(selected, icon, {
      size,
      fileHint: fiber.fileHint,
      componentName: fiber.componentName,
      nearbyText: nearbyText(selected.element),
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

  function openPromptInCursor(prompt: QueuedPrompt) {
    const result = openInCursor(prompt.markdown);
    void copyText(prompt.markdown);
    // Mark opened even when deeplink is too long — clipboard still handed off.
    markSent(prompt.id);
    return result;
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
    onCopyPrompt(icon) {
      const prompt = enqueueFromIcon(icon);
      if (prompt) void copyText(prompt.markdown);
      queuePanel.open();
      toolbar.setQueueOpen(true);
    },
    onOpenInCursor(icon) {
      const prompt = enqueueFromIcon(icon);
      if (!prompt) return;
      openPromptInCursor(prompt);
      queuePanel.open();
      toolbar.setQueueOpen(true);
    },
    onPreview(icon) {
      if (!selected) return;
      const rect = selected.element.getBoundingClientRect();
      const size = Math.max(14, Math.round(Math.max(rect.width, rect.height) || 18));
      const wrap = document.createElement("span");
      wrap.setAttribute(PREVIEW_ATTR, "true");
      wrap.style.display = "inline-flex";
      wrap.style.color = "currentColor";
      wrap.innerHTML = svgMarkupFor(icon, size);
      const previewSvg = wrap.querySelector("svg");
      previewSvg?.setAttribute(PREVIEW_ATTR, "true");
      selected.element.replaceWith(wrap);
      selected = null;
      overlay.setSelected(null);
      replacePanel.close();
      previewCount += 1;
      toolbar.setPreviewCount(previewCount);
      runScan();
    },
  });

  queuePanel = createQueuePanel(shadowRoot, {
    onClose() {
      queuePanel.close();
      toolbar.setQueueOpen(false);
    },
    onCopy(prompt) {
      void copyText(prompt.markdown);
    },
    onSend(prompt) {
      openPromptInCursor(prompt);
    },
    onCopyAllDrafts() {
      const drafts = prompts.filter((p) => p.status === "draft");
      if (drafts.length === 0) return;
      void copyText(drafts.map((p) => p.markdown).join("\n\n---\n\n"));
    },
    onSendAllDrafts() {
      const drafts = prompts.filter((p) => p.status === "draft");
      if (drafts.length === 0) return;
      // Open the newest draft in Cursor; copy the rest for manual handoff.
      void copyText(drafts.map((p) => p.markdown).join("\n\n---\n\n"));
      openPromptInCursor(drafts[0]);
      const now = Date.now();
      prompts = prompts.map((p) =>
        p.status === "draft" ? { ...p, status: "sent" as const, sentAt: now } : p
      );
      saveQueue(prompts);
      syncPromptBadge();
    },
  });

  function runScan() {
    const scanned = scanPage(scanRoot, classifyOptions);
    overlay.update(scanned);
    toolbar.setCounts(
      scanned.filter((s) => s.tag === "svg").length,
      scanned.filter((s) => s.tag === "img").length
    );
  }

  function open() {
    active = true;
    toolbar.setActive(true);
    runScan();
    syncPromptBadge();
  }

  function close() {
    active = false;
    selected = null;
    previewCount = 0;
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
    onRescan: runScan,
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

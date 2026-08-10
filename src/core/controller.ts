import { bindShortcut } from "./shortcut";
import { isDevEnvironment } from "./env";
import { createOverlay } from "./overlay";
import { scanPage } from "./scan";
import { STYLES } from "./styles";
import { createToolbar } from "./toolbar";
import { ClassifyOptions, IconAuditController, IconAuditOptions } from "./types";

const HOST_ID = "icon-audit-host";
const DEFAULT_SHORTCUT = "mod+shift+i";

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

/**
 * Mounts the dev-only icon audit overlay: a floating toggle button that,
 * on click (or the keyboard shortcut), scans `options.root` for
 * icon-classified <svg>/<img> elements and highlights them - green
 * dashed for inline SVG, red dashed for <img>. No-ops outside dev
 * environments unless `options.enabled` forces it on.
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

  const overlay = createOverlay(shadowRoot);
  let active = false;

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
  }

  function close() {
    active = false;
    toolbar.setActive(false);
    overlay.clear();
  }

  function toggle() {
    if (active) close();
    else open();
  }

  const toolbar = createToolbar(shadowRoot, position, {
    onOpen: open,
    onRescan: runScan,
    onClose: close,
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
    host.remove();
  }

  return { rescan, destroy };
}

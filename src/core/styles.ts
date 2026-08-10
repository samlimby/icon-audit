/**
 * Injected as a single <style> inside our shadow root. Shadow DOM already
 * stops host-page CSS leaking in (and this leaking out), the "ia-" prefix
 * is just for readability when inspecting the shadow tree.
 */
export const STYLES = /* css */ `
  :host {
    all: initial;
  }

  * {
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
  }

  .ia-overlay-layer {
    position: fixed;
    inset: 0;
    z-index: 2147483000;
    pointer-events: none;
  }

  .ia-box {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 6px;
    border: 2px dashed var(--ia-color);
    background: color-mix(in srgb, var(--ia-color) 8%, transparent);
    pointer-events: auto;
  }

  .ia-box--svg {
    --ia-color: #22c55e;
  }

  .ia-box--img {
    --ia-color: #ef4444;
  }

  .ia-badge {
    position: absolute;
    top: -9px;
    left: -2px;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.4;
    color: #fff;
    background: var(--ia-color);
    white-space: nowrap;
  }

  .ia-tooltip {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    max-width: 260px;
    padding: 6px 9px;
    border-radius: 6px;
    background: #18181b;
    color: #f4f4f5;
    font-size: 11px;
    line-height: 1.4;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
    opacity: 0;
    transform: translateY(-2px);
    transition: opacity 120ms ease, transform 120ms ease;
    pointer-events: none;
    z-index: 1;
  }

  .ia-box:hover .ia-tooltip {
    opacity: 1;
    transform: translateY(0);
  }

  .ia-toolbar {
    position: fixed;
    z-index: 2147483001;
    display: flex;
    align-items: center;
    pointer-events: auto;
  }

  .ia-toolbar--bottom-left { left: 20px; bottom: 20px; }
  .ia-toolbar--bottom-right { right: 20px; bottom: 20px; }
  .ia-toolbar--top-left { left: 20px; top: 20px; }
  .ia-toolbar--top-right { right: 20px; top: 20px; }

  .ia-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 999px;
    border: none;
    background: #18181b;
    color: #f4f4f5;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    cursor: pointer;
    transition: transform 120ms ease, background 120ms ease;
  }

  .ia-toggle:hover {
    background: #27272a;
    transform: scale(1.05);
  }

  .ia-toggle svg {
    width: 20px;
    height: 20px;
  }

  .ia-toolbar[data-active="true"] .ia-toggle {
    display: none;
  }

  .ia-pill {
    display: none;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 999px;
    background: #18181b;
    color: #f4f4f5;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    white-space: nowrap;
  }

  .ia-toolbar[data-active="true"] .ia-pill {
    display: flex;
  }

  .ia-counts {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 4px 0 6px;
    font-size: 12px;
    font-weight: 600;
  }

  .ia-count {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .ia-dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
  }

  .ia-dot--svg { background: #22c55e; }
  .ia-dot--img { background: #ef4444; }

  .ia-divider {
    width: 1px;
    height: 20px;
    background: rgba(255, 255, 255, 0.12);
  }

  .ia-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: #d4d4d8;
    cursor: pointer;
    transition: background 120ms ease, color 120ms ease;
  }

  .ia-icon-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .ia-icon-btn svg {
    width: 15px;
    height: 15px;
  }
`;

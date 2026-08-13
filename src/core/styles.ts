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

  button, input {
    font: inherit;
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
    cursor: pointer;
  }

  .ia-box--svg {
    --ia-color: #22c55e;
  }

  .ia-box--img {
    --ia-color: #ef4444;
  }

  .ia-box--draft {
    --ia-color: #a855f7;
    border-radius: 0;
  }

  .ia-box--selected {
    --ia-color: #0098ff;
    border-style: solid;
    box-shadow: 0 0 0 3px rgba(0, 152, 255, 0.25);
    background: rgba(0, 152, 255, 0.12);
  }

  .ia-box--draft.ia-box--selected {
    --ia-color: #a855f7;
    box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.28);
    background: rgba(168, 85, 247, 0.12);
  }

  .ia-badge {
    position: fixed;
    top: 0;
    left: 0;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.4;
    color: #fff;
    background: var(--ia-color);
    white-space: nowrap;
    pointer-events: none;
    z-index: 3;
    width: max-content;
  }

  .ia-badge--svg {
    --ia-color: #22c55e;
  }

  .ia-badge--img {
    --ia-color: #ef4444;
  }

  .ia-badge--draft {
    --ia-color: #a855f7;
    z-index: 4;
  }

  .ia-tooltip {
    position: fixed;
    top: 0;
    left: 0;
    width: max-content;
    max-width: 260px;
    padding: 6px 9px;
    border-radius: 6px;
    background: #18181b;
    color: #f4f4f5;
    font-size: 11px;
    line-height: 1.4;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
    opacity: 0;
    transition: opacity 120ms ease;
    pointer-events: none;
    z-index: 2;
    word-break: break-word;
  }

  .ia-box:hover .ia-tooltip,
  .ia-tooltip.is-visible {
    opacity: 1;
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

  .ia-preview-indicator {
    position: absolute;
    left: 0;
    bottom: calc(100% + 8px);
    padding: 8px 16px;
    border-radius: 999px;
    background: #18181b;
    color: #fafafa;
    font-size: 12px;
    font-weight: 600;
    line-height: 20px;
    white-space: nowrap;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
    pointer-events: none;
  }

  .ia-preview-indicator[hidden] {
    display: none !important;
  }

  .ia-toolbar--top-left .ia-preview-indicator,
  .ia-toolbar--top-right .ia-preview-indicator {
    bottom: auto;
    top: calc(100% + 8px);
  }

  .ia-toolbar--bottom-right .ia-preview-indicator,
  .ia-toolbar--top-right .ia-preview-indicator {
    left: auto;
    right: 0;
  }

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
    padding: 8px 10px 8px 12px;
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
    padding: 0 4px 0 2px;
    font-size: 12px;
    font-weight: 600;
  }

  .ia-count--svg { color: #22c55e; }
  .ia-count--img { color: #ef4444; }

  .ia-divider {
    width: 1px;
    height: 14px;
    background: #3f3f46;
  }

  .ia-icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: none;
    background: #27272a;
    color: #a1a1aa;
    cursor: pointer;
    transition: background 120ms ease, color 120ms ease;
  }

  .ia-icon-btn:hover,
  .ia-icon-btn.is-active {
    background: #3f3f46;
    color: #fff;
  }

  .ia-icon-btn svg {
    width: 14px;
    height: 14px;
  }

  .ia-terminal-wrap {
    position: relative;
  }

  .ia-prompt-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 999px;
    background: #fff;
    color: #18181b;
    font-size: 9px;
    font-weight: 700;
    line-height: 16px;
    text-align: center;
  }

  .ia-panel,
  .ia-queue {
    position: fixed;
    z-index: 2147483002;
    width: 360px;
    max-height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 14px;
    background: #18181b;
    color: #fafafa;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
    pointer-events: auto;
  }

  .ia-panel {
    top: 64px;
    right: 24px;
  }

  .ia-panel.is-dragging {
    user-select: none;
    cursor: grabbing;
  }

  .ia-panel__drag {
    cursor: grab;
    touch-action: none;
  }

  .ia-panel.is-dragging .ia-panel__drag {
    cursor: grabbing;
  }

  .ia-queue {
    left: 20px;
    bottom: 76px;
  }

  .ia-panel[hidden],
  .ia-queue[hidden] {
    display: none !important;
  }

  .ia-panel__header,
  .ia-queue__header {
    padding: 16px 16px 12px;
    border-bottom: 1px solid #27272a;
    flex-shrink: 0;
  }

  .ia-panel__title-row,
  .ia-queue__title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .ia-panel__title,
  .ia-queue__title {
    font-size: 13px;
    font-weight: 600;
    line-height: 18px;
  }

  .ia-queue__subtitle {
    margin-top: 2px;
    font-size: 11px;
    color: #a1a1aa;
    line-height: 14px;
  }

  .ia-panel__icon-btn {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 6px;
    background: #27272a;
    color: #a1a1aa;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  .ia-panel__icon-btn svg {
    width: 12px;
    height: 12px;
  }

  .ia-panel__current {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 10px;
    background: #27272a;
  }

  .ia-panel__current-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #3f3f46;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    color: #fafafa;
  }

  .ia-panel__current-icon svg,
  .ia-panel__current-icon img {
    width: 18px;
    height: 18px;
  }

  .ia-panel__current-name {
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
  }

  .ia-panel__current-meta {
    font-size: 11px;
    color: #a1a1aa;
    line-height: 14px;
  }

  .ia-panel__tabs,
  .ia-queue__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 12px 12px 0;
    flex-shrink: 0;
  }

  .ia-chip {
    border: none;
    border-radius: 999px;
    padding: 5px 10px;
    background: #27272a;
    color: #a1a1aa;
    font-size: 11px;
    font-weight: 500;
    line-height: 14px;
    cursor: pointer;
  }

  .ia-chip.is-active {
    background: #fff;
    color: #18181b;
    font-weight: 600;
  }

  .ia-panel__search {
    padding: 12px 12px 8px;
    flex-shrink: 0;
  }

  .ia-panel__search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 11px;
    border-radius: 8px;
    background: #27272a;
    border: 1px solid #3f3f46;
    color: #71717a;
  }

  .ia-panel__search-box svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  .ia-panel__search-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    color: #fafafa;
    font-size: 12px;
    line-height: 16px;
  }

  .ia-panel__meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 0 16px 8px;
    font-size: 11px;
    font-weight: 500;
    color: #71717a;
    flex-shrink: 0;
  }

  .ia-panel__meta-link {
    border: none;
    background: transparent;
    color: #fafafa;
    font-size: 11px;
    font-weight: 500;
    line-height: 14px;
    cursor: pointer;
    padding: 0;
    margin-left: auto;
  }

  .ia-panel__library {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .ia-panel__library[hidden],
  .ia-panel__custom[hidden],
  .ia-panel__actions[hidden],
  .ia-panel__meta-link[hidden] {
    display: none !important;
  }

  .ia-panel__custom {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .ia-dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin: 12px;
    padding: 28px 16px;
    border-radius: 12px;
    border: 1.5px dashed #52525b;
    background: #27272a;
    cursor: pointer;
    flex-shrink: 0;
    text-align: center;
  }

  .ia-dropzone.is-dragging {
    border-color: #0098ff;
    background: #1f2937;
  }

  .ia-dropzone__icon {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    background: #3f3f46;
    color: #fafafa;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ia-dropzone__icon svg {
    width: 18px;
    height: 18px;
  }

  .ia-dropzone__title {
    color: #fafafa;
    font-size: 13px;
    font-weight: 600;
    line-height: 18px;
  }

  .ia-dropzone__sub {
    color: #a1a1aa;
    font-size: 11px;
    line-height: 16px;
  }

  .ia-dropzone__btn {
    border: none;
    border-radius: 8px;
    background: #fff;
    color: #18181b;
    font-size: 11px;
    font-weight: 600;
    line-height: 14px;
    padding: 6px 12px;
    cursor: pointer;
  }

  .ia-dropzone__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }

  .ia-dropzone__btn--ghost {
    background: transparent;
    color: #fafafa;
    border: 1px solid #52525b;
  }

  .ia-dropzone__btn--ghost:hover {
    background: #3f3f46;
  }

  .ia-packs {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 12px;
    overflow: auto;
    flex: 1;
    min-height: 0;
  }

  .ia-packs__label {
    color: #71717a;
    font-size: 11px;
    font-weight: 500;
    line-height: 14px;
  }

  .ia-packs__empty {
    color: #a1a1aa;
    font-size: 11px;
    line-height: 16px;
    padding: 8px 2px 12px;
  }

  .ia-pack-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 10px;
    background: #27272a;
    border: 1px solid #3f3f46;
  }

  .ia-pack-row__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #3f3f46;
    color: #fafafa;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ia-pack-row__icon svg {
    width: 16px;
    height: 16px;
  }

  .ia-pack-row__body {
    flex: 1;
    min-width: 0;
  }

  .ia-pack-row__title {
    color: #fafafa;
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
  }

  .ia-pack-row__meta {
    margin-top: 2px;
    color: #a1a1aa;
    font-size: 11px;
    line-height: 14px;
  }

  .ia-pack-row__browse {
    border: none;
    background: transparent;
    color: #fff;
    font-size: 11px;
    font-weight: 500;
    line-height: 14px;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
  }

  .ia-panel__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0 12px;
    overflow: auto;
    flex: 1;
    align-content: flex-start;
  }

  .ia-icon-cell {
    width: calc(25% - 5px);
    min-width: 74px;
    height: 74px;
    border-radius: 10px;
    border: 1.5px solid transparent;
    background: #27272a;
    color: #fafafa;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
  }

  .ia-icon-cell span {
    font-size: 9px;
    font-weight: 500;
    color: #a1a1aa;
    line-height: 12px;
  }

  .ia-icon-cell.is-selected {
    border-color: #0098ff;
  }

  .ia-icon-cell svg {
    width: 22px;
    height: 22px;
  }

  .ia-panel__empty {
    width: 100%;
    padding: 24px 12px;
    text-align: center;
    color: #a1a1aa;
    font-size: 12px;
    line-height: 16px;
  }

  .ia-panel__footer,
  .ia-queue__footer {
    padding: 12px 16px 16px;
    border-top: 1px solid #27272a;
    flex-shrink: 0;
  }

  .ia-panel__actions {
    display: flex;
    gap: 8px;
  }

  .ia-panel__actions .ia-btn {
    flex: 1;
    min-width: 0;
    padding: 0 8px;
    font-size: 12px;
    white-space: nowrap;
  }

  .ia-btn {
    flex: 1;
    height: 36px;
    border-radius: 8px;
    border: 1px solid #3f3f46;
    background: transparent;
    color: #e4e4e7;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
  }

  .ia-btn--primary {
    border: none;
    background: #fff;
    color: #18181b;
    font-weight: 600;
  }

  .ia-btn.is-copied {
    pointer-events: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .ia-btn__icon {
    width: 14px;
    height: 14px;
    display: block;
    flex-shrink: 0;
  }

  .ia-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .ia-panel__hint {
    margin-top: 10px;
    font-size: 10px;
    color: #71717a;
    line-height: 14px;
  }

  .ia-panel__actions[hidden] + .ia-panel__hint {
    margin-top: 0;
  }

  .ia-queue__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    overflow: auto;
    flex: 1;
  }

  .ia-queue-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border-radius: 10px;
    background: #27272a;
    border: 1.5px solid transparent;
    cursor: pointer;
  }

  .ia-queue-card.is-selected {
    border-color: #0098ff;
  }

  .ia-queue-card__row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .ia-queue-card__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #3f3f46;
    color: #fafafa;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ia-queue-card__icon svg {
    width: 16px;
    height: 16px;
  }

  .ia-queue-card__body {
    flex: 1;
    min-width: 0;
  }

  .ia-queue-card__title {
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
  }

  .ia-queue-card__meta {
    margin-top: 3px;
    font-size: 11px;
    color: #a1a1aa;
    line-height: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ia-queue-card__trailing {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    flex-shrink: 0;
    min-width: 54px;
  }

  .ia-queue-card__delete {
    display: none;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    background: #ef444429;
    color: #ef4444;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    cursor: pointer;
    white-space: nowrap;
  }

  .ia-queue-card:hover .ia-queue-card__delete,
  .ia-queue-card.is-selected .ia-queue-card__delete,
  .ia-queue-card__delete:focus-visible {
    display: inline-flex;
  }

  .ia-queue-card:hover .ia-queue-card__tag--draft,
  .ia-queue-card.is-selected .ia-queue-card__tag--draft {
    display: none;
  }

  .ia-queue-card__delete:hover,
  .ia-queue-card__delete:focus-visible {
    background: #ef444440;
  }

  .ia-queue-card__tag {
    flex-shrink: 0;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
    line-height: 12px;
  }

  .ia-queue-card__tag--draft {
    background: #3f3f46;
    border: 1px solid #52525b;
    color: #e4e4e7;
  }

  .ia-queue-card__tag--sent {
    background: #14532d;
    color: #86efac;
  }

  .ia-queue-card__preview {
    padding: 10px;
    border-radius: 8px;
    background: #09090b;
    border: 1px solid #3f3f46;
  }

  .ia-queue-card__preview-label {
    font-size: 10px;
    font-weight: 600;
    color: #a1a1aa;
    line-height: 12px;
    margin-bottom: 6px;
  }

  .ia-queue-card__preview pre {
    margin: 0;
    white-space: pre-wrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    line-height: 15px;
    color: #d4d4d8;
  }

  .ia-queue-card__actions {
    display: flex;
    gap: 8px;
  }

  .ia-queue-card__actions .ia-btn {
    height: 30px;
    font-size: 11px;
  }
`;

import type { QueuedPrompt } from "./prompt";
import { flashCopied } from "./flash-copied";

const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
const ICON_TERMINAL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3"/><path d="M12 15h5"/></svg>`;

export interface QueuePanelCallbacks {
  onClose: () => void;
  onCopy: (prompt: QueuedPrompt) => void | boolean | Promise<boolean | void>;
  onCopyAllDrafts: () => void | boolean | Promise<boolean | void>;
  onDelete: (prompt: QueuedPrompt) => void;
}

export interface QueuePanelHandle {
  setPrompts: (prompts: QueuedPrompt[]) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
  destroy: () => void;
}

type Filter = "all" | "draft" | "sent";

export function createQueuePanel(
  shadowRoot: ShadowRoot,
  callbacks: QueuePanelCallbacks
): QueuePanelHandle {
  const root = document.createElement("div");
  root.className = "ia-queue";
  root.hidden = true;

  let prompts: QueuedPrompt[] = [];
  let filter: Filter = "all";
  let selectedId: string | null = null;

  root.innerHTML = `
    <div class="ia-queue__header">
      <div class="ia-queue__title-row">
        <div>
          <div class="ia-queue__title">Agent prompts</div>
          <div class="ia-queue__subtitle">Queued from icon-audit · ready for agents</div>
        </div>
        <button type="button" class="ia-panel__icon-btn" data-close title="Close">${ICON_CLOSE}</button>
      </div>
      <div class="ia-queue__filters" data-filters></div>
    </div>
    <div class="ia-queue__list" data-list></div>
    <div class="ia-queue__footer">
      <div class="ia-panel__actions">
        <button type="button" class="ia-btn ia-btn--primary" data-copy-all>Copy all drafts</button>
      </div>
    </div>
  `;

  shadowRoot.appendChild(root);

  const listEl = root.querySelector("[data-list]") as HTMLElement;
  const filtersEl = root.querySelector("[data-filters]") as HTMLElement;
  const copyAllBtn = root.querySelector(
    "[data-copy-all]"
  ) as HTMLButtonElement;

  function filtered(): QueuedPrompt[] {
    if (filter === "all") return prompts;
    return prompts.filter((p) => p.status === filter);
  }

  function syncCopyAllState() {
    const hasDrafts = prompts.some((p) => p.status === "draft");
    copyAllBtn.disabled = !hasDrafts;
  }

  function renderFilters() {
    const draftCount = prompts.filter((p) => p.status === "draft").length;
    const sentCount = prompts.filter((p) => p.status === "sent").length;
    filtersEl.innerHTML = `
      <button type="button" class="ia-chip${filter === "all" ? " is-active" : ""}" data-filter="all">All ${prompts.length}</button>
      <button type="button" class="ia-chip${filter === "draft" ? " is-active" : ""}" data-filter="draft">Draft ${draftCount}</button>
      <button type="button" class="ia-chip${filter === "sent" ? " is-active" : ""}" data-filter="sent">Sent ${sentCount}</button>
    `;
  }

  function renderList() {
    const items = filtered();
    if (items.length === 0) {
      listEl.innerHTML = `<div class="ia-panel__empty">No prompts yet. Select an icon from Replace icon to queue a draft.</div>`;
      return;
    }

    listEl.innerHTML = items
      .map((p) => {
        const selected = p.id === selectedId;
        return `
        <div class="ia-queue-card${selected ? " is-selected" : ""}" data-prompt-id="${p.id}">
          <div class="ia-queue-card__row">
            <div class="ia-queue-card__icon">${ICON_TERMINAL}</div>
            <div class="ia-queue-card__body">
              <div class="ia-queue-card__title">${escapeHtml(p.title)}</div>
              <div class="ia-queue-card__meta">${escapeHtml(p.packageName)} · ${escapeHtml(p.locationHint)}</div>
            </div>
            <div class="ia-queue-card__trailing">
              ${
                p.status === "draft"
                  ? `<button type="button" class="ia-queue-card__delete" data-delete title="Delete draft">Delete</button>`
                  : ""
              }
              <div class="ia-queue-card__tag ia-queue-card__tag--${p.status}">${p.status === "draft" ? "Draft" : "Sent"}</div>
            </div>
          </div>
          ${
            selected
              ? `<div class="ia-queue-card__preview">
                  <div class="ia-queue-card__preview-label">Prompt preview</div>
                  <pre>${escapeHtml(p.markdown)}</pre>
                </div>
                <div class="ia-queue-card__actions">
                  <button type="button" class="ia-btn ia-btn--primary" data-copy>Copy</button>
                </div>`
              : ""
          }
        </div>`;
      })
      .join("");
  }

  function refresh() {
    renderFilters();
    renderList();
    syncCopyAllState();
  }

  filtersEl.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest(
      "[data-filter]"
    ) as HTMLElement | null;
    if (!btn?.dataset.filter) return;
    filter = btn.dataset.filter as Filter;
    refresh();
  });

  listEl.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const card = target.closest("[data-prompt-id]") as HTMLElement | null;
    if (!card?.dataset.promptId) return;
    const prompt = prompts.find((p) => p.id === card.dataset.promptId);
    if (!prompt) return;

    if (target.closest("[data-copy]")) {
      const btn = target.closest("[data-copy]") as HTMLElement;
      void Promise.resolve(callbacks.onCopy(prompt)).then((ok) => {
        if (ok === false) return;
        flashCopied(btn, "Copy");
      });
      return;
    }
    if (target.closest("[data-delete]")) {
      callbacks.onDelete(prompt);
      return;
    }

    selectedId = selectedId === prompt.id ? null : prompt.id;
    renderList();
  });

  root.querySelector("[data-close]")?.addEventListener("click", () => {
    callbacks.onClose();
  });
  root.querySelector("[data-copy-all]")?.addEventListener("click", (e) => {
    if (copyAllBtn.disabled) return;
    const btn = (e.currentTarget || e.target) as HTMLElement;
    void Promise.resolve(callbacks.onCopyAllDrafts()).then((ok) => {
      if (ok === false) return;
      flashCopied(btn, "Copy all drafts");
    });
  });

  function setPrompts(next: QueuedPrompt[]) {
    prompts = next;
    if (selectedId && !prompts.some((p) => p.id === selectedId)) {
      selectedId = null;
    }
    refresh();
  }

  function open() {
    root.hidden = false;
    refresh();
  }

  function close() {
    root.hidden = true;
    selectedId = null;
  }

  function toggle() {
    if (root.hidden) open();
    else close();
  }

  function isOpen() {
    return !root.hidden;
  }

  function destroy() {
    root.remove();
  }

  return { setPrompts, open, close, toggle, isOpen, destroy };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

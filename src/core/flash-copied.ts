/** Font Awesome–style solid copy (clipboard) icon. */
const ICON_COPY = `<svg class="ia-btn__icon" viewBox="0 0 448 512" fill="currentColor" aria-hidden="true"><path d="M208 0H332.1c12.7 0 24.9 5.1 33.9 14.1l51.9 51.9c9 9 14.1 21.2 14.1 33.9V336c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V48c0-26.5 21.5-48 48-48zM48 128h80v64H64V448H256V416h64v48c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V176c0-26.5 21.5-48 48-48z"/></svg>`;

const timers = new WeakMap<HTMLElement, number>();

/** Swap a button's label for the copy icon for 1.5s after a successful copy. */
export function flashCopied(
  button: HTMLElement,
  label = "Copy",
  durationMs = 1500
): void {
  const existing = timers.get(button);
  if (existing) window.clearTimeout(existing);

  button.classList.add("is-copied");
  button.setAttribute("aria-label", "Copied");
  button.innerHTML = ICON_COPY;

  const timer = window.setTimeout(() => {
    timers.delete(button);
    button.classList.remove("is-copied");
    button.removeAttribute("aria-label");
    button.textContent = label;
  }, durationMs);

  timers.set(button, timer);
}

/**
 * Binds a shortcut spec like "mod+shift+i" ("mod" = Cmd on Mac, Ctrl elsewhere).
 * Pass null/undefined to no-op. Returns an unbind function.
 */
export function bindShortcut(
  spec: string | null | undefined,
  handler: () => void
): () => void {
  if (!spec) return () => {};

  const parts = spec
    .toLowerCase()
    .split("+")
    .map((p) => p.trim());
  const key = parts[parts.length - 1];
  const needsMod = parts.includes("mod");
  const needsShift = parts.includes("shift");
  const needsAlt = parts.includes("alt");

  function onKeyDown(e: KeyboardEvent) {
    if (e.key.toLowerCase() !== key) return;
    if (needsMod && !(e.metaKey || e.ctrlKey)) return;
    if (needsShift && !e.shiftKey) return;
    if (needsAlt && !e.altKey) return;
    e.preventDefault();
    handler();
  }

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}

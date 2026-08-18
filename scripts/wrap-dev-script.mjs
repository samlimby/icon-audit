/** @param {string | undefined} script */
export function wrapViteDevScript(script) {
  if (typeof script !== "string") {
    return { script, changed: false };
  }
  const trimmed = script.trim();
  if (trimmed.includes("icon-audit")) {
    return { script: trimmed, changed: false };
  }
  if (!/^vite(\s|$)/.test(trimmed)) {
    return { script: trimmed, changed: false };
  }
  if (/^vite\s+build(\s|$)/.test(trimmed)) {
    return { script: trimmed, changed: false };
  }
  if (/^vite\s+preview(\s|$)/.test(trimmed)) {
    return { script: trimmed, changed: false };
  }
  return {
    script: trimmed.replace(/^vite\b/, "icon-audit"),
    changed: true,
  };
}

const SCRIPT_KEYS = ["dev", "start"];

/** @param {{ name?: string, scripts?: Record<string, string> }} pkg */
export function patchPackageScripts(pkg) {
  if (!pkg.scripts) {
    return { pkg, changed: false, patched: [] };
  }
  const scripts = { ...pkg.scripts };
  /** @type {string[]} */
  const patched = [];
  for (const key of SCRIPT_KEYS) {
    const result = wrapViteDevScript(scripts[key]);
    if (result.changed) {
      scripts[key] = result.script;
      patched.push(key);
    }
  }
  if (patched.length === 0) {
    return { pkg, changed: false, patched };
  }
  return { pkg: { ...pkg, scripts }, changed: true, patched };
}

/** @param {{ ci?: boolean, consumerName?: string }} opts */
export function setupSkipReason(opts) {
  if (opts.ci) return "ci";
  if (opts.consumerName === "icon-audit") return "self";
  if (opts.consumerName === "icon-audit-example") return "example";
  return null;
}

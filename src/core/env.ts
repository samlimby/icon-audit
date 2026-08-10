const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

/**
 * Best-effort dev-environment detection. Combines hostname checks (works
 * regardless of bundler) with NODE_ENV / import.meta.env when statically
 * available, so the tool stays out of production even if a consumer
 * forgets to gate it explicitly.
 */
export function isDevEnvironment(): boolean {
  if (typeof window === "undefined") return false;

  const hostname = window.location?.hostname ?? "";
  if (LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith(".local")) {
    return true;
  }

  try {
    if (
      typeof process !== "undefined" &&
      process.env?.NODE_ENV &&
      process.env.NODE_ENV !== "production"
    ) {
      return true;
    }
  } catch {
    // process is undefined in some browser bundles; ignore.
  }

  return false;
}

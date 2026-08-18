import type { IconAuditOptions } from "../core/types";

export interface IconAuditProps extends IconAuditOptions {}

/**
 * Leftover no-op. `<IconAudit />` does not mount the overlay — a static
 * import of this module still breaks production builds that omit
 * devDependencies. Use the Vite plugin (`icon-audit/vite`) instead.
 */
export function IconAudit(_props?: IconAuditProps): null {
  return null;
}

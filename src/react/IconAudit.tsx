import { useEffect } from "react";
import { mountIconAudit } from "../core/controller";
import type { IconAuditOptions } from "../core/types";

export interface IconAuditProps extends IconAuditOptions {}

/**
 * Drop this near your app root (e.g. in a Next.js root layout). It's a
 * dev-only no-op in production builds - safe to leave mounted always.
 *
 * ```tsx
 * <IconAudit />
 * ```
 */
export function IconAudit(props: IconAuditProps) {
  const {
    enabled,
    shortcut,
    position,
    root,
    iconMaxSize,
    iconAspectRatioRange,
    iconNamePattern,
  } = props;

  useEffect(() => {
    const controller = mountIconAudit({
      enabled,
      shortcut,
      position,
      root,
      iconMaxSize,
      iconAspectRatioRange,
      iconNamePattern,
    });
    return () => controller.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, shortcut, position, root, iconMaxSize, iconNamePattern]);

  return null;
}

export { mountIconAudit } from "./controller";
export { isDevEnvironment } from "./env";
export { classifyIcon, determineSourceKind } from "./classify";
export { scanPage } from "./scan";
export type {
  ClassificationReason,
  ClassifyOptions,
  ElementNamingInput,
  ElementRect,
  ElementTag,
  IconAuditController,
  IconAuditOptions,
  ScannedElement,
  SourceKind,
} from "./types";

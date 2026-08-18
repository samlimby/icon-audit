import fs from "node:fs";
import path from "node:path";
import {
  patchPackageScripts,
  setupSkipReason,
} from "./wrap-dev-script.mjs";

const consumerRoot = process.env.INIT_CWD || process.cwd();
const pkgPath = path.join(consumerRoot, "package.json");

if (!fs.existsSync(pkgPath)) {
  process.exit(0);
}

const raw = fs.readFileSync(pkgPath, "utf8");
let pkg;
try {
  pkg = JSON.parse(raw);
} catch {
  process.exit(0);
}

if (
  setupSkipReason({
    ci: Boolean(process.env.CI),
    consumerName: typeof pkg.name === "string" ? pkg.name : undefined,
  })
) {
  process.exit(0);
}

const { pkg: next, changed, patched } = patchPackageScripts(pkg);
if (!changed) {
  process.exit(0);
}

const indentMatch = raw.match(/^\{[\r\n]+(\t+| +)/);
const indent = indentMatch?.[1]?.startsWith("\t") ? "\t" : indentMatch?.[1]?.length || 2;
const trailingNewline = raw.endsWith("\n") ? "\n" : "";
fs.writeFileSync(
  pkgPath,
  `${JSON.stringify(next, null, indent)}${trailingNewline}`
);

const names = patched.map((key) => `npm run ${key}`).join(", ");
console.log(
  `[icon-audit] ${names} now loads the overlay in Vite. Do not import icon-audit in App.tsx — production builds stay clean.`
);

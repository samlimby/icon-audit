# icon-audit

A dev-only overlay that scans the current page and flags icon-sized elements
that are rendered as `<img>` instead of inline `<svg>`.

Why: pulling icons in from Figma often lands them in the app as `<img
src="https://...">` rather than an inline, locally-bundled `<svg>`. That's two
problems at once — the icon isn't stored in the repo, and if the source URL
moves, times out, or the Figma MCP session expires, the icon silently breaks
into a missing-image glyph in production. `icon-audit` scans the rendered DOM
and draws a dashed outline over every icon it finds: **green** for inline
`<svg>` (bundled, safe), **red** for `<img>` (fetched, at risk).

It only activates in dev environments (`localhost`, `127.0.0.1`, `*.local`,
or `NODE_ENV !== "production"`) and is a safe no-op everywhere else, so it's
fine to leave mounted in your app permanently.

## Install

```sh
npm install --save-dev icon-audit
```

## Usage

### React

Mount it once near your app root (e.g. a Next.js root layout):

```tsx
import { IconAudit } from "icon-audit/react";

export default function RootLayout({ children }) {
  return (
    <>
      {children}
      <IconAudit />
    </>
  );
}
```

### Framework-agnostic

```ts
import { mountIconAudit } from "icon-audit";

const audit = mountIconAudit();

// later, if needed
audit.rescan();
audit.destroy();
```

## Using it

- A small dark toggle button appears in the bottom-left corner of the page.
- Click it (or press **Cmd/Ctrl+Shift+I**) to scan the page. Every element
  classified as an icon gets a dashed outline — green for `<svg>`, red for
  `<img>` — with an `SVG`/`IMG` badge and a hover tooltip explaining why it
  was flagged and, for `<img>` icons, whether the source is local or remote.
- Click a red highlight to open the replace panel. Search Lucide, Font Awesome
  Solid, or Iconoir (~5k icons, bundled), or upload your own SVG pack, then
  **Select** to draft the swap on the page and queue an agent prompt (also
  copied to the clipboard) for Cursor / Claude Code / Codex.
- The pill toolbar shows counts and a close button.

Regular images — photos, illustrations, banners — are left alone. Only
elements that look like icons are flagged.

Applying a replacement writes **inline SVG** into your source via the agent
prompt — no `lucide-react` / Font Awesome / Iconoir packages are required in
the target app. Catalogs are only used inside the icon-audit picker.

## How "icon" is determined

An element is classified as an icon if **either** of these match (either
signal is enough):

- **Size**: the rendered box is small and roughly square — by default, both
  width and height ≤ 48px with an aspect ratio between 0.4 and 2.5.
- **Naming**: `alt`, `aria-label`, `class`, `id`, or (for `<img>`) the
  filename in `src` contain icon-ish wording (`icon`, `glyph`, `chevron`,
  `caret`, etc).

## Options

```ts
mountIconAudit({
  enabled: true, // force on/off, overrides environment detection
  position: "bottom-left", // "bottom-left" | "bottom-right" | "top-left" | "top-right"
  shortcut: "mod+shift+i", // set to null to disable the keyboard shortcut
  root: document.body, // scan a subtree instead of the whole page
  iconMaxSize: 48,
  iconAspectRatioRange: [0.4, 2.5],
  iconNamePattern: /icon|glyph|chevron|caret|logo-mark|pictogram|ico-|-ico\b/i,
});
```

`<IconAudit />` accepts the same options as props.

## Persist custom packs (Vite)

By default, uploaded custom packs are stored in this origin's `localStorage`
(they survive refresh, but not a different port or host).

Add the Vite plugin so an upload is written immediately to
`.icon-audit/custom-packs.json` in the project — no refresh required. That
file is then loaded on any origin serving this app.

```ts
import { iconAudit } from "icon-audit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [iconAudit()],
});
```

Commit `.icon-audit/` to share packs with teammates, or gitignore it to keep
them local. Without the plugin, packs still persist across refresh on the
same origin.

## Development

You don't need to publish to npm to review overlay UI. `example/` is a fake
icon-heavy dashboard (nav, KPIs, table actions, integrations) that mounts
`<IconAudit />` the same way a consuming app would.

```sh
npm install
cd example && npm install && cd ..   # once — links the local package via file:..

# Fastest for CSS/layout tweaks: overlay source with Vite HMR
npm run example

# Same dashboard, but against dist/ — the files `npm publish` would ship
npm run example:dist

# Rebuild dist on save and reload the dashboard
npm run example:watch
```

Open [http://localhost:5173](http://localhost:5173). The header chip shows
whether you're on **source (HMR)** or **published dist/**. Press
**Cmd/Ctrl+Shift+I** (or the bottom-left toggle) to scan.

```sh
npm run generate:icons   # rebuild Lucide / FA / Iconoir catalogs
npm run build            # generate:icons + tsup -> dist/
npm test                 # vitest
npm run typecheck
```

Catalog JSON under `src/core/icons/generated/` is committed so consumers do not
need the icon pack packages at install time. Those packs are only
`devDependencies` used by `generate:icons`.

## License

MIT

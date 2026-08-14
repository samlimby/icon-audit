type EmptyKind = "folder" | "terminal" | "icons";

const FRAME = `
  <g opacity="0.55">
    <rect x="12" y="26" width="42" height="54" rx="10" fill="#27272A" stroke="#3F3F46" transform="rotate(-15 33 53)"/>
    <rect x="74" y="26" width="42" height="54" rx="10" fill="#27272A" stroke="#3F3F46" transform="rotate(15 95 53)"/>
  </g>
  <rect x="36" y="18" width="56" height="56" rx="12" fill="#18181B" stroke="#52525B" stroke-width="1.25" stroke-dasharray="3.5 3"/>
`;

const INNER = {
  folder: `
    <g transform="translate(52 34)" fill="none" stroke="#A1A1AA" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3.5 20h17a1.5 1.5 0 0 0 1.5-1.5V8.5A1.5 1.5 0 0 0 20.5 7h-7.2a1.5 1.5 0 0 1-1.2-.6l-.7-1A1.5 1.5 0 0 0 10.2 5H3.5A1.5 1.5 0 0 0 2 6.5v12A1.5 1.5 0 0 0 3.5 20Z"/>
      <path d="M2.5 11h19"/>
    </g>
  `,
  terminal: `
    <g transform="translate(52 34)" fill="none" stroke="#A1A1AA" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2.5" y="5" width="19" height="14" rx="3"/>
      <path d="M7 10.5 9.5 13 7 15.5"/>
      <path d="M12 15.5h5"/>
    </g>
  `,
  icons: `
    <g transform="translate(52 34)" fill="none" stroke="#A1A1AA" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4.5" width="18" height="15" rx="2.5"/>
      <circle cx="8.5" cy="9.5" r="1.2"/>
      <path d="M4.5 17.5 9 13l3 3 2.2-2.2 5.3 5.2"/>
    </g>
  `,
} as const;

function artSvg(kind: EmptyKind): string {
  return `<svg viewBox="0 0 128 96" fill="none" aria-hidden="true">${FRAME}${INNER[kind]}</svg>`;
}

export function emptyStateHtml(kind: EmptyKind, message: string): string {
  return `<div class="ia-empty">
    <div class="ia-empty__art">${artSvg(kind)}</div>
    <div class="ia-empty__copy">${message}</div>
  </div>`;
}

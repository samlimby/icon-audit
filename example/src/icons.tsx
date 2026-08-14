import type { ImgHTMLAttributes, ReactNode } from "react";

/** Remote URL that will fail to load — classic red IMG / remote-source case. */
export const REMOTE = {
  bell: "https://assets.example.com/icons/bell-icon.svg",
  users: "https://cdn.acme.test/icons/users-icon.svg",
  chart: "https://cdn.acme.test/icons/chart-icon.svg",
  globe: "https://cdn.figma.com/icons/globe-icon.svg",
  zap: "https://assets.example.com/icons/zap-icon.svg",
};

const DATA_URI_CLOCK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52525B" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
  );

export function LocalImg({
  name,
  alt,
  size = 16,
  ...rest
}: {
  name: string;
  alt: string;
  size?: number;
} & ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={`/icons/${name}.svg`}
      alt={alt}
      width={size}
      height={size}
      {...rest}
    />
  );
}

export function RemoteImg({
  src,
  alt,
  size = 16,
  ...rest
}: {
  src: string;
  alt: string;
  size?: number;
} & ImgHTMLAttributes<HTMLImageElement>) {
  return <img src={src} alt={alt} width={size} height={size} {...rest} />;
}

export function DataUriImg({
  alt = "Clock icon",
  size = 16,
}: {
  alt?: string;
  size?: number;
}) {
  return <img src={DATA_URI_CLOCK} alt={alt} width={size} height={size} />;
}

export function NavItem({
  label,
  icon,
  active,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
}) {
  return (
    <div className={`acme-nav-item${active ? " is-active" : ""}`}>
      <span className="acme-nav-item-icon">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

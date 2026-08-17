import type { ImgHTMLAttributes, ReactNode } from "react";

/** Remote URL that will fail to load — classic red IMG / remote-source case. */
export const REMOTE = {
  users: "https://cdn.acme.test/icons/users-icon.svg",
  globe: "https://cdn.figma.com/icons/globe-icon.svg",
  zap: "https://assets.example.com/icons/zap-icon.svg",
};

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

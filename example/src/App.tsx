import type { ReactNode } from "react";
import { Sliders } from "lucide-react";
import { IconAudit } from "icon-audit/react";

/** Remote-looking URL that will fail — classic red IMG case. */
const REMOTE_BELL =
  "https://assets.example.com/icons/bell-icon.svg";

export default function App() {
  return (
    <div className="acme">
      <IconAudit enabled />

      <header className="acme-nav">
        <div className="acme-brand">
          <span className="acme-mark" aria-hidden />
          <span className="acme-brand-name">Acme Console</span>
        </div>
        <div className="acme-nav-icons">
          <img
            className="acme-icon"
            src={REMOTE_BELL}
            alt="Notifications icon"
            width={18}
            height={18}
          />
          <Sliders className="acme-icon" size={18} aria-label="Sliders" />
          <svg
            className="acme-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-label="User"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </header>

      <div className="acme-body">
        <aside className="acme-sidebar">
          <NavItem
            active
            label="Overview"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            }
          />
          <NavItem
            label="Projects"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            }
          />
          <NavItem
            label="Team"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <NavItem
            label="Settings"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            }
          />
        </aside>

        <main className="acme-main">
          <div className="acme-heading">
            <h1>Project settings</h1>
            <p>Manage notifications, access, and visual assets for this workspace.</p>
          </div>

          <div className="acme-actions">
            <button type="button" className="acme-btn acme-btn--primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Add member
            </button>
            <button type="button" className="acme-btn acme-btn--secondary">
              <img
                src="/icons/export-icon.svg"
                alt="Export icon"
                width={14}
                height={14}
              />
              Export
            </button>
          </div>

          <div className="acme-cards">
            <div className="acme-card">
              <div className="acme-card-row">
                <div className="acme-card-icon acme-card-icon--danger">
                  <img
                    src={REMOTE_BELL}
                    alt="Alerts icon"
                    width={18}
                    height={18}
                  />
                </div>
                <div className="acme-card-title">Alerts</div>
              </div>
              <p className="acme-card-meta">Remote &lt;img&gt; icon — flagged red</p>
            </div>

            <div className="acme-card">
              <div className="acme-card-row">
                <div className="acme-card-icon acme-card-icon--ok">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-label="Status"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="acme-card-title">Status</div>
              </div>
              <p className="acme-card-meta">Inline SVG — flagged green</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({
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

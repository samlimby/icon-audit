import type { ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  GitBranch,
  Home,
  Plus,
  Puzzle,
  RotateCcw,
  Server,
  Settings,
  Sliders,
  TriangleAlert,
  Users,
} from "lucide-react";
import { IconAudit } from "icon-audit/react";
import {
  DataUriImg,
  LocalImg,
  NavItem,
  REMOTE,
  RemoteImg,
} from "./icons";

const DEPLOYS = [
  { env: "prod", service: "api-gateway", sha: "a1c8f2", status: "healthy", ago: "2m" },
  { env: "prod", service: "web-app", sha: "9e12bb", status: "healthy", ago: "14m" },
  { env: "staging", service: "worker", sha: "c4d01a", status: "degraded", ago: "1h" },
  { env: "prod", service: "billing", sha: "77af09", status: "healthy", ago: "3h" },
  { env: "dev", service: "edge-cache", sha: "b20e11", status: "failed", ago: "5h" },
  { env: "staging", service: "search", sha: "e91c44", status: "healthy", ago: "8h" },
  { env: "prod", service: "notifier", sha: "12ab90", status: "healthy", ago: "1d" },
  { env: "dev", service: "ml-ranker", sha: "f03c77", status: "degraded", ago: "2d" },
] as const;

const INTEGRATIONS = [
  { name: "GitHub", icon: <LocalImg name="github-icon" alt="GitHub icon" size={20} /> },
  { name: "Slack", icon: <LocalImg name="slack-icon" alt="Slack icon" size={20} /> },
  { name: "Linear", icon: <LocalImg name="linear-icon" alt="Linear icon" size={20} /> },
  { name: "S3", icon: <LocalImg name="s3-icon" alt="S3 icon" size={20} /> },
  { name: "Figma", icon: <RemoteImg src={REMOTE.globe} alt="Figma icon" size={20} /> },
  { name: "PagerDuty", icon: <RemoteImg src={REMOTE.zap} alt="PagerDuty icon" size={20} /> },
] as const;

const ACTIVITY = [
  { title: "Rolled back worker@staging", meta: "alex · 12m ago", kind: "warn" as const },
  { title: "api-gateway promoted to prod", meta: "deploy bot · 2h ago", kind: "ok" as const },
  { title: "New member invited", meta: "jordan · 5h ago", kind: "info" as const },
  { title: "Secret rotation completed", meta: "security · 1d ago", kind: "ok" as const },
];

export default function App() {
  const fromDist = __ICON_AUDIT_FROM_DIST__;

  return (
    <div className="acme">
      <IconAudit enabled />

      <header className="acme-nav">
        <div className="acme-brand">
          <span className="acme-mark" aria-hidden />
          <span className="acme-brand-name">Acme Console</span>
          <span className={`acme-chip${fromDist ? " acme-chip--dist" : ""}`}>
            {fromDist ? "published dist/" : "source (HMR)"}
          </span>
        </div>

        <label className="acme-search">
          <LocalImg name="search-icon" alt="Search icon" className="acme-icon" />
          <input type="search" placeholder="Search services, deploys…" />
        </label>

        <div className="acme-nav-icons">
          <LocalImg name="help-icon" alt="Help icon" className="acme-icon" />
          <RemoteImg src={REMOTE.bell} alt="Notifications icon" className="acme-icon" />
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
            icon={<Home size={16} strokeWidth={2} aria-hidden />}
          />
          <NavItem
            label="Projects"
            icon={<FolderKanban size={16} strokeWidth={2} aria-hidden />}
          />
          <NavItem
            label="Deploys"
            icon={<LocalImg name="deploy-icon" alt="Deploys icon" />}
          />
          <NavItem
            label="Analytics"
            icon={<BarChart3 size={16} strokeWidth={2} aria-hidden />}
          />
          <NavItem
            label="Team"
            icon={<RemoteImg src={REMOTE.users} alt="Team icon" />}
          />
          <NavItem
            label="Integrations"
            icon={<Puzzle size={16} strokeWidth={2} aria-hidden />}
          />
          <NavItem
            label="Billing"
            icon={<LocalImg name="billing-icon" alt="Billing icon" />}
          />
          <NavItem
            label="Settings"
            icon={<Settings size={16} strokeWidth={2} aria-hidden />}
          />

          <div className="acme-sidebar-foot">
            <p className="acme-hint">
              Toggle audit bottom-left, or press{" "}
              <kbd>⌘</kbd>
              <kbd>⇧</kbd>
              <kbd>I</kbd>
            </p>
          </div>
        </aside>

        <main className="acme-main">
          <div className="acme-heading-row">
            <div className="acme-heading">
              <h1>Deployments</h1>
              <p>Production and staging services for the acme-web workspace.</p>
            </div>
            <div className="acme-actions">
              <button type="button" className="acme-btn acme-btn--primary">
                <Plus size={14} strokeWidth={2} aria-hidden />
                New deploy
              </button>
              <button type="button" className="acme-btn acme-btn--secondary">
                <LocalImg name="export-icon" alt="Export icon" />
                Export
              </button>
              <button type="button" className="acme-btn acme-btn--secondary">
                <LocalImg name="share-icon" alt="Share icon" />
                Share
              </button>
              <button type="button" className="acme-btn acme-btn--ghost" aria-label="More actions">
                <LocalImg name="more-icon" alt="More icon" />
              </button>
            </div>
          </div>

          <div className="acme-kpis">
            <Kpi
              label="Healthy"
              value="18"
              meta="Inline SVG — green"
              tone="ok"
              icon={<Check size={18} strokeWidth={2} aria-label="Healthy" />}
            />
            <Kpi
              label="Degraded"
              value="3"
              meta="Remote <img> — red"
              tone="warn"
              icon={<RemoteImg src={REMOTE.chart} alt="Degraded icon" size={18} />}
            />
            <Kpi
              label="Failed"
              value="1"
              meta="Remote <img> — red"
              tone="danger"
              icon={
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgb(239, 68, 68)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  aria-label="Failed icon"
                >
                  <path d="m14 12 4 4 4-4" />
                  <path d="M18 16V7" />
                  <path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" />
                  <path d="M3.304 13h6.392" />
                </svg>
              }
            />
            <Kpi
              label="Mean deploy"
              value="4.2m"
              meta="Data URI <img> — red"
              tone="neutral"
              icon={<DataUriImg alt="Duration icon" size={18} />}
            />
          </div>

          <div className="acme-toolbar">
            <button type="button" className="acme-chip-btn is-active">
              <LocalImg name="filter-icon" alt="Filter icon" />
              All envs
              <ChevronDown size={12} aria-hidden />
            </button>
            <button type="button" className="acme-chip-btn">
              <GitBranch size={14} strokeWidth={2} aria-hidden />
              main
            </button>
            <button type="button" className="acme-chip-btn">
              <Server size={14} strokeWidth={2} aria-hidden />
              8 services
            </button>
            <button type="button" className="acme-chip-btn" aria-label="Refresh">
              <LocalImg name="refresh-icon" alt="Refresh icon" />
            </button>
          </div>

          <div className="acme-table-wrap">
            <table className="acme-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Env</th>
                  <th>SHA</th>
                  <th>Status</th>
                  <th>Age</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {DEPLOYS.map((row) => (
                  <tr key={`${row.service}-${row.env}`}>
                    <td>
                      <span className="acme-cell-icon">
                        <Activity size={14} strokeWidth={2} aria-hidden />
                        {row.service}
                      </span>
                    </td>
                    <td>
                      <span className={`acme-env acme-env--${row.env}`}>{row.env}</span>
                    </td>
                    <td className="acme-mono">{row.sha}</td>
                    <td>
                      <Status status={row.status} />
                    </td>
                    <td className="acme-muted">{row.ago}</td>
                    <td>
                      <span className="acme-row-actions">
                        <LocalImg name="logs-icon" alt="Logs icon" />
                        <RotateCcw size={14} strokeWidth={2} aria-label="Rollback" />
                        <LocalImg name="trash-icon" alt="Delete icon" />
                        <LocalImg name="more-icon" alt="Row menu icon" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="acme-split">
            <section className="acme-panel">
              <div className="acme-panel-head">
                <h2>Integrations</h2>
                <LocalImg name="more-icon" alt="Integrations menu icon" />
              </div>
              <div className="acme-integrations">
                {INTEGRATIONS.map((item) => (
                  <div key={item.name} className="acme-integration">
                    <span className="acme-integration-icon">{item.icon}</span>
                    <span>{item.name}</span>
                    <ChevronRight size={14} className="acme-muted" aria-hidden />
                  </div>
                ))}
              </div>
            </section>

            <section className="acme-panel">
              <div className="acme-panel-head">
                <h2>Activity</h2>
                <Users size={16} strokeWidth={2} aria-label="Team activity" />
              </div>
              <ul className="acme-activity">
                {ACTIVITY.map((item) => (
                  <li key={item.title}>
                    <span className={`acme-activity-icon acme-activity-icon--${item.kind}`}>
                      {item.kind === "ok" ? (
                        <Check size={14} strokeWidth={2} aria-hidden />
                      ) : item.kind === "warn" ? (
                        <TriangleAlert size={14} strokeWidth={2} aria-hidden />
                      ) : (
                        <RemoteImg src={REMOTE.users} alt="Activity icon" size={14} />
                      )}
                    </span>
                    <div>
                      <div className="acme-activity-title">{item.title}</div>
                      <div className="acme-muted">{item.meta}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="acme-panel acme-panel--photo">
            <div className="acme-panel-head">
              <h2>Workspace cover</h2>
              <p className="acme-muted">Large photo — should not be flagged as an icon</p>
            </div>
            <img
              className="acme-cover"
              src="https://picsum.photos/seed/acme-console/960/240"
              alt="Team working in the office"
              width={960}
              height={240}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  meta,
  tone,
  icon,
}: {
  label: string;
  value: string;
  meta: string;
  tone: "ok" | "warn" | "danger" | "neutral";
  icon: ReactNode;
}) {
  return (
    <div className="acme-card">
      <div className="acme-card-row">
        <div className={`acme-card-icon acme-card-icon--${tone}`}>{icon}</div>
        <div>
          <div className="acme-card-label">{label}</div>
          <div className="acme-card-value">{value}</div>
        </div>
      </div>
      <p className="acme-card-meta">{meta}</p>
    </div>
  );
}

function Status({ status }: { status: "healthy" | "degraded" | "failed" }) {
  if (status === "healthy") {
    return (
      <span className="acme-status acme-status--ok">
        <Check size={12} strokeWidth={2.5} aria-hidden />
        healthy
      </span>
    );
  }
  if (status === "degraded") {
    return (
      <span className="acme-status acme-status--warn">
        <TriangleAlert size={12} strokeWidth={2.5} aria-hidden />
        degraded
      </span>
    );
  }
  return (
    <span className="acme-status acme-status--danger">
      <RemoteImg src={REMOTE.zap} alt="Failed status icon" size={12} />
      failed
    </span>
  );
}

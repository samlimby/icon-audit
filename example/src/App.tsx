import { IconAudit } from "icon-audit/react";

const PLACEHOLDER_PHOTO =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="220">
      <rect width="420" height="220" fill="#a1a1aa"/>
    </svg>`
  );

export default function App() {
  return (
    <div className="page">
      {/* Mount once - it's dev-gated internally and no-ops in production */}
      <IconAudit />

      <header>
        <div className="brand">Sam Limby</div>
        <nav>
          {/* Inline SVG icon - should highlight GREEN */}
          <svg
            className="icon-btn icon-search"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-label="Search"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {/* <img> pointed at a same-origin local file - icon-shaped, RED */}
          <img
            className="icon-btn"
            src="/icons/menu-icon.svg"
            alt="Menu icon"
            width={24}
            height={24}
          />
        </nav>
      </header>

      <h1>Design portfolio</h1>
      <p className="subtitle">Showcasing the work of Sam Limby as a Product Designer.</p>

      <section>
        <h2>Featured work</h2>
        <img className="hero-photo" src={PLACEHOLDER_PHOTO} alt="Recent case study cover" />
      </section>

      <section>
        <h2>Get in touch</h2>
        <div className="row">
          <button className="contact-btn">Contact</button>

          {/* <img> pointed at a cross-origin URL that will never resolve -
              this is the "missing image" failure mode the tool exists to catch */}
          <img
            className="icon-btn"
            src="https://assets.example.com/icons/settings-icon.svg"
            alt="Settings icon"
            width={24}
            height={24}
          />
        </div>
      </section>
    </div>
  );
}

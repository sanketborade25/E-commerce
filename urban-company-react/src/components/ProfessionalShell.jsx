import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  PROFESSIONAL_NAV_ITEMS,
  clearPartnerSession,
  formatCurrency,
  getNotificationCount
} from "../utils/professional";
import AppLogo from "./AppLogo";

export function MiniIcon({ name }) {
  const icons = {
    dashboard: (
      <path d="M4 4h7v7H4zm9 0h7v4h-7zm0 6h7v10h-7zM4 13h7v7H4z" />
    ),
    bookings: (
      <path d="M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm3 7h4m-4 4h8" />
    ),
    availability: <path d="M12 6v6l4 2M12 22A10 10 0 1 0 12 2a10 10 0 0 0 0 20z" />,
    earnings: (
      <path d="M12 3v18M16.5 7.5A4.5 4.5 0 0 0 12 5c-2.5 0-4.5 1.3-4.5 3s2 3 4.5 3 4.5 1.3 4.5 3-2 3-4.5 3a4.5 4.5 0 0 1-4.5-2.5" />
    ),
    notifications: (
      <path d="M12 22a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1z" />
    ),
    profile: (
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0" />
    ),
    rating: (
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" />
    ),
    status: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />,
    money: (
      <path d="M7 6h10M7 11h8L9 18h8M9 3l6 18" />
    ),
    folder: (
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    ),
    list: (
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
    ),
    tools: (
      <path d="m14 7 3-3 3 3-3 3m-3-3 6 6M5 19l5-5m-3-7a3 3 0 1 0 0 6" />
    ),
    settings: (
      <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5zm7 3.5-.9-.5.1-1-.9-1.6-1 .1-.7-.8.1-1-1.6-.9-.8.6-.9-.3-.5-.9h-1.8l-.5.9-.9.3-.8-.6-1.6.9.1 1-.7.8-1-.1-.9 1.6.1 1-.9.5v1.8l.9.5-.1 1 .9 1.6 1-.1.7.8-.1 1 1.6.9.8-.6.9.3.5.9h1.8l.5-.9.9-.3.8.6 1.6-.9-.1-1 .7-.8 1 .1.9-1.6-.1-1 .9-.5z" />
    ),
    location: (
      <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
    ),
    image: (
      <path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm2 10 3-3 3 3 2-2 4 4M9 9h.01" />
    )
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name] || icons.dashboard}
    </svg>
  );
}

export default function ProfessionalShell({
  children,
  profile,
  bookings = [],
  title,
  subtitle,
  quickStats = [],
  actions,
  notificationCount: notificationCountProp
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = profile?.displayName || profile?.fullName || "Professional";
  const notificationCount = useMemo(
    () => notificationCountProp ?? getNotificationCount(bookings),
    [bookings, notificationCountProp]
  );

  const logout = () => {
    clearPartnerSession();
    navigate("/home");
  };

  return (
    <div className="pro-shell">
      <header className="pro-navbar">
        <div className="pro-navbar-inner">
          <div className="pro-brand-block">
            <button
              type="button"
              className="pro-mobile-toggle"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle professional navigation"
            >
              <span />
              <span />
              <span />
            </button>
            <AppLogo className="pro-brand-mark" />
            <div>
              <div className="pro-brand-eyebrow">Professional Console</div>
              <div className="pro-brand-title">{displayName}</div>
            </div>
          </div>

          <nav className={`pro-nav-links ${menuOpen ? "open" : ""}`}>
            {PROFESSIONAL_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `pro-nav-link${isActive || location.pathname === item.to ? " active" : ""}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <MiniIcon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="pro-navbar-actions">
            <button type="button" className="pro-icon-button">
              <MiniIcon name="notifications" />
              <span>Notifications</span>
              {notificationCount > 0 && <strong>{notificationCount}</strong>}
            </button>

            <details className="pro-profile-menu">
              <summary className="pro-profile-trigger">
                <span className="pro-profile-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
                <span className="pro-profile-copy">
                  <strong>{displayName}</strong>
                  <small>{profile?.isOnline ? "Online" : "Offline"}</small>
                </span>
              </summary>
              <div className="pro-profile-dropdown">
                <button type="button" onClick={() => navigate("/professional/dashboard")}>
                  Dashboard
                </button>
                <button type="button" onClick={() => navigate("/professional/earnings")}>
                  Earnings
                </button>
                <button type="button" className="danger" onClick={logout}>
                  Logout
                </button>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main className="pro-main">
        <section className="pro-page-head">
          <div>
            <p className="pro-section-kicker">Daily operations</p>
            <h1>{title}</h1>
            {subtitle && <p className="pro-page-subtitle">{subtitle}</p>}
          </div>

          <div className="pro-head-side">
            {quickStats.length > 0 && (
              <div className="pro-quick-stats">
                {quickStats.map((item) => (
                  <div key={item.label} className="pro-quick-card">
                    <span>{item.label}</span>
                    <strong>{item.currency ? formatCurrency(item.value) : item.value}</strong>
                  </div>
                ))}
              </div>
            )}
            {actions && <div className="pro-head-actions">{actions}</div>}
          </div>
        </section>

        {children}
      </main>
    </div>
  );
}

import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import AppLogo from "../AppLogo";
import "../../styles/pages/admin.css";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/subcategories", label: "Subcategories" },
  { to: "/admin/services", label: "Services" },
  { to: "/admin/service-options", label: "Service Options" },
  { to: "/admin/cities", label: "Cities" },
  { to: "/admin/bookings", label: "Bookings" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/professionals", label: "Professionals" }
];

export default function AdminLayout({ title, subtitle, actions, children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("auth_user");
    api.clearToken();
    navigate("/admin");
  };

  return (
    <div className="admin-page admin-shell-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-logo">
            <AppLogo />
          </div>
          <div>
            <p className="admin-console-kicker">Operations workspace</p>
            <h2>Admin Console</h2>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `admin-sidebar-link${isActive ? " active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="admin-btn admin-btn-ghost admin-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="admin-shell-main">
        <div className="admin-hero admin-shell-hero">
          <div>
            <p className="admin-console-kicker">Admin module</p>
            <h3>{title}</h3>
            {subtitle ? <p className="admin-hero-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="admin-shell-actions">{actions}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}

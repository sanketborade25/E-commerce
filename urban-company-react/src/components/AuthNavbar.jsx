import { Link } from "react-router-dom";
import AppLogo from "./AppLogo";
import "../styles/components/auth-navbar.css";

export default function AuthNavbar() {
  return (
    <header className="auth-navbar">
      <div className="auth-navbar-main">
        <Link to="/home" className="auth-brand">
          <AppLogo />
          <span className="auth-brand-title">Urban Services</span>
        </Link>
        <Link to="/home" className="auth-nav-link">
          Back to Home
        </Link>
      </div>
    </header>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api/client";
import "../styles/pages/admin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) {
      setError("Please enter email or phone and password.");
      return;
    }
    try {
      const isEmail = trimmedIdentifier.includes("@");
      const res = await api.login(
        isEmail
          ? { email: trimmedIdentifier, password }
          : { phone: trimmedIdentifier, password }
      );
      if (!res?.user?.role || res.user.role.toLowerCase() !== "admin") {
        setError("You are not authorized to access admin.");
        api.clearToken();
        localStorage.removeItem("auth_user");
        return;
      }
      api.setToken(res.accessToken);
      localStorage.setItem("auth_user", JSON.stringify(res.user));
      navigate("/admin/dashboard");
    } catch (e) {
      setError("Invalid credentials.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="admin-login">
        <div className="admin-login-card">
          <h2>Admin Login</h2>
          <p className="admin-login-sub">
            Use your admin credentials to continue.
          </p>
          <form onSubmit={handleSubmit}>
            <label>Email or Phone</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@example.com or 9999999999"
            />
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
            />
            {error && <p className="admin-error">{error}</p>}
            <button type="submit" className="admin-btn admin-btn-primary">
              Login
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

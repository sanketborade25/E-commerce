import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      setError("Please enter phone and password.");
      return;
    }
    try {
      const res = await api.login({ phone, password });
      if (!res?.user?.role || res.user.role.toLowerCase() !== "admin") {
        setError("You are not authorized to access admin.");
        api.clearToken();
        localStorage.removeItem("admin_authed");
        return;
      }
      api.setToken(res.accessToken);
      localStorage.setItem("admin_authed", "true");
      localStorage.setItem("admin_user", JSON.stringify(res.user));
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
            <label>Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9999999999"
            />
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin123"
            />
            {error && <p className="admin-error">{error}</p>}
            <button type="submit" className="admin-btn">
              Login
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

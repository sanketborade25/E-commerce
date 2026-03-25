import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api/client";
import { clearPartnerSession } from "../utils/professional";

export default function ProfessionalLogin() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError("");
    setLoading(true);

    try {
      clearPartnerSession();

      if (isSignup) {
        const response = await api.professionalPortalSignup({
          fullName: name,
          email: email || undefined,
          phone,
          password,
          cityId: city ? Number(city) || undefined : undefined,
          displayName: name
        });

        if (!response?.accessToken || !response?.user?.id) {
          throw new Error("Unable to authenticate professional.");
        }

        api.setToken(response.accessToken);
        localStorage.setItem("auth_user", JSON.stringify(response.user));
        localStorage.setItem("professional_authed", "true");
        navigate("/professional/dashboard");
        return;
      } else {
        const response = await api.professionalPortalLogin({ phone, password });
        if (response?.accessToken) {
          api.setToken(response.accessToken);
          if (response?.user) {
            localStorage.setItem("auth_user", JSON.stringify(response.user));
          }
          localStorage.setItem("professional_authed", "true");
          navigate("/professional/dashboard");
          return;
        }
      }
      setError("Unable to authenticate professional.");
    } catch (err) {
      setError(err?.message || "Professional auth failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="admin-login">
        <div className="admin-login-card">
          <h2>{isSignup ? "Professional Signup" : "Professional Login"}</h2>
          <p className="admin-login-sub">
            {isSignup
              ? "Register as a service professional"
              : "Use your professional credentials to continue."}
          </p>
          <form onSubmit={handleSubmit}>
            {isSignup && (
              <>
                <label>Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <label>City</label>
                <input
                  type="number"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City Id"
                  required
                />
              </>
            )}
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
            <label>Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="admin-error">{error}</p>}
            <button type="submit" className="admin-btn" disabled={loading}>
              {loading ? "Processing..." : isSignup ? "Sign up" : "Login"}
            </button>
          </form>
          <button
            className="admin-btn createProfessionBtn"
            type="button"
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? "Login instead" : "Create account"}
          </button>
        </div>
      </div>
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthNavbar from "../components/AuthNavbar";
import { api } from "../api/client";
import { clearPartnerSession } from "../utils/professional";
import "../styles/pages/professional-login.css";

export default function ProfessionalLogin() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedCityName, setSelectedCityName] = useState("");
  const [cities, setCities] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadCities = async () => {
      try {
        const data = await api.getCities();
        if (!mounted) return;
        setCities(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setCities([]);
      }
    };
    loadCities();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCities = useMemo(() => {
    const q = selectedCityName.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) =>
      String(c?.name || "").toLowerCase().includes(q)
    );
  }, [cities, selectedCityName]);

  const isValidEmail = (value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return false;
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setFieldErrors({});
    setLoading(true);

    try {
      clearPartnerSession();

      if (isSignup) {
        if (!name.trim()) {
          setFieldErrors({ name: "Full name is required." });
          setLoading(false);
          return;
        }
        if (!phone.trim()) {
          setFieldErrors({ phone: "Phone number is required." });
          setLoading(false);
          return;
        }
        if (!password.trim()) {
          setFieldErrors({ password: "Password is required." });
          setLoading(false);
          return;
        }
        if (!selectedCityId) {
          setFieldErrors({ city: "Please select a city." });
          setLoading(false);
          return;
        }
        const response = await api.professionalSignupV2({
          fullName: name,
          phone,
          password,
          cityId: selectedCityId ? Number(selectedCityId) || undefined : undefined,
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
        if (!isValidEmail(email)) {
          setFieldErrors({ email: "Invalid email." });
          setLoading(false);
          return;
        }
        if (!password.trim()) {
          setFieldErrors({ password: "Password is required." });
          setLoading(false);
          return;
        }

        const response = await api.professionalLoginV2({
          email: email.trim(),
          password
        });
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
      setFieldErrors({ form: "Unable to authenticate professional." });
    } catch (err) {
      const message = String(err?.message || "");
      if (message.toLowerCase().includes("password")) {
        setFieldErrors({ password: "Incorrect password." });
      } else if (message.toLowerCase().includes("email")) {
        setFieldErrors({ email: "Invalid email." });
      } else {
        setFieldErrors({ form: "Professional auth failed." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthNavbar />
      <div className="admin-login">
        <div className="admin-login-card">
          <div className="pro-login-header">
            <span className="pro-login-label">Professional Console</span>
            <h2>{isSignup ? "Create Professional Account" : "Professional Login"}</h2>
          </div>
          <p className="admin-login-sub pro-login-sub">
            {isSignup
              ? "Register to manage bookings, earnings, and availability."
              : "Sign in to manage your professional dashboard."}
          </p>
          <form className="pro-login-form" onSubmit={handleSubmit}>
            {isSignup && (
              <>
                <label className="pro-login-label-text">Full Name</label>
                <input
                  className="pro-login-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                {fieldErrors?.name && (
                  <span className="pro-login-error">{fieldErrors.name}</span>
                )}
                <label className="pro-login-label-text">Phone</label>
                <input
                  className="pro-login-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter mobile number"
                  required
                />
                {fieldErrors?.phone && (
                  <span className="pro-login-error">{fieldErrors.phone}</span>
                )}
                <label className="pro-login-label-text">City</label>
                <div className="pro-login-city">
                  <input
                    className="pro-login-input"
                    type="text"
                    value={selectedCityName}
                    onChange={(e) => {
                      setSelectedCityName(e.target.value);
                      setSelectedCityId("");
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    onBlur={() => {
                      window.setTimeout(() => setShowCityDropdown(false), 120);
                    }}
                    placeholder="Search city"
                    required
                  />
                  {showCityDropdown && filteredCities.length > 0 && (
                    <div className="pro-login-city-dropdown">
                      {filteredCities.map((city) => (
                        <button
                          type="button"
                          key={city.id}
                          className={`pro-login-city-item${
                            String(city.id) === String(selectedCityId)
                              ? " active"
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedCityId(String(city.id));
                            setSelectedCityName(city.name || "");
                            setShowCityDropdown(false);
                            console.log("Selected city:", {
                              selectedCityName: city.name || "",
                              selectedCityId: city.id
                            });
                          }}
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {fieldErrors?.city && (
                  <span className="pro-login-error">{fieldErrors.city}</span>
                )}
              </>
            )}

            {!isSignup && (
              <>
                <label className="pro-login-label-text">Email</label>
                <input
                  className="pro-login-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
                {fieldErrors?.email && (
                  <span className="pro-login-error">{fieldErrors.email}</span>
                )}
              </>
            )}

            <label className="pro-login-label-text">Password</label>
            <div className="pro-login-input-wrap">
              <input
                className="pro-login-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="pro-login-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {fieldErrors?.password && (
              <span className="pro-login-error">{fieldErrors.password}</span>
            )}
            {!isSignup && (
              <a className="pro-login-link" href="/professional/forgot-password">
                Forgot Password?
              </a>
            )}
            {fieldErrors?.form && (
              <p className="admin-error pro-login-error">{fieldErrors.form}</p>
            )}
            <button
              type="submit"
              className="pro-login-primary"
              disabled={loading}
            >
              {loading ? "Processing..." : isSignup ? "Create account" : "Login"}
            </button>
          </form>
          <div className="pro-login-secondary">
            <button
              className="pro-login-text-btn"
              type="button"
              onClick={() => setIsSignup(!isSignup)}
            >
              {isSignup ? "Login instead" : "Create account"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

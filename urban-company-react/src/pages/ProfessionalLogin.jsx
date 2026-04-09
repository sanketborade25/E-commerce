import { useEffect, useMemo, useRef, useState } from "react";
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
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [cities, setCities] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const cityDropdownRef = useRef(null);

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

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!cityDropdownRef.current?.contains(event.target)) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectedCity = useMemo(
    () => cities.find((city) => String(city?.id) === String(selectedCityId)) || null,
    [cities, selectedCityId]
  );

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
        if (email.trim() && !isValidEmail(email.trim())) {
          setFieldErrors({ email: "Enter a valid email address." });
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
          email: email.trim() || undefined,
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
        if (!identifier.trim()) {
          setFieldErrors({ identifier: "Email or phone is required." });
          setLoading(false);
          return;
        }
        if (!password.trim()) {
          setFieldErrors({ password: "Password is required." });
          setLoading(false);
          return;
        }

        const response = await api.professionalLoginV2({
          identifier: identifier.trim(),
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
      } else if (message.toLowerCase().includes("phone number")) {
        setFieldErrors({ phone: message });
      } else if (message.toLowerCase().includes("email")) {
        setFieldErrors(isSignup ? { email: message } : { identifier: "Invalid email or phone." });
      } else if (message.toLowerCase().includes("phone")) {
        setFieldErrors(isSignup ? { phone: message } : { identifier: "Invalid email or phone." });
      } else {
        setFieldErrors({ form: message || "Professional auth failed." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (value) => {
    const nextCity = cities.find((city) => String(city?.id) === String(value)) || null;

    console.log("Selected city:", {
      selectedCityId: value,
      selectedCityName: nextCity?.name || ""
    });

    setSelectedCityId(value);
    setFieldErrors((prev) => ({
      ...prev,
      city: ""
    }));
    setShowCityDropdown(false);
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
                <label className="pro-login-label-text">Email (Optional)</label>
                <input
                  className="pro-login-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
                {fieldErrors?.email && (
                  <span className="pro-login-error">{fieldErrors.email}</span>
                )}
                <label className="pro-login-label-text">City</label>
                <div className="pro-login-city" ref={cityDropdownRef}>
                  <button
                    type="button"
                    className={`pro-login-input pro-login-city-trigger${
                      showCityDropdown ? " open" : ""
                    }`}
                    onClick={() => setShowCityDropdown((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={showCityDropdown}
                  >
                    <span className={selectedCity ? "pro-login-city-value" : "pro-login-city-placeholder"}>
                      {selectedCity ? selectedCity.name : "Select your city"}
                    </span>
                    <span className={`pro-login-city-caret${showCityDropdown ? " open" : ""}`}>
                      ▾
                    </span>
                  </button>
                  {showCityDropdown ? (
                    <div className="pro-login-city-dropdown" role="listbox" aria-label="Select city">
                      {cities.length === 0 ? (
                        <div className="pro-login-city-empty">No cities available</div>
                      ) : (
                        cities.map((city) => (
                          <button
                            type="button"
                            key={city.id}
                            className={`pro-login-city-item${
                              String(city.id) === String(selectedCityId) ? " active" : ""
                            }`}
                            onClick={() => handleCityChange(String(city.id))}
                          >
                            {city.name}
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
                {selectedCity ? (
                  <span className="pro-login-subtle">Selected: {selectedCity.name}</span>
                ) : null}
                {fieldErrors?.city && (
                  <span className="pro-login-error">{fieldErrors.city}</span>
                )}
              </>
            )}

            {!isSignup && (
              <>
                <label className="pro-login-label-text">Email or Phone</label>
                <input
                  className="pro-login-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter email or phone"
                  required
                />
                {fieldErrors?.identifier && (
                  <span className="pro-login-error">{fieldErrors.identifier}</span>
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

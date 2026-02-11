import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import leftData from "../data/servicesLeftSidebarData";
import { useCart } from "../context/CartContext";
import { api } from "../api/client";
import { resolveImage } from "../utils/image";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileView, setProfileView] = useState("login");
  const [authUser, setAuthUser] = useState(() => {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [authError, setAuthError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const profileSuccessTimerRef = useRef(null);
  const [signupErrors, setSignupErrors] = useState({});
  const [authBusy, setAuthBusy] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");
  const { cartItems, removeFromCart } = useCart();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(
    () => localStorage.getItem("selected_city_id") || ""
  );
  const adminVersionRef = useRef(
    localStorage.getItem("admin_data_version") || ""
  );
  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const discount = subtotal >= 999 ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal - discount);

  const [searchIndex, setSearchIndex] = useState([]);
  const isAuthed = Boolean(authUser);

  const normalizeText = (text) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const tokenMatches = (token, haystack) => {
    if (!token) return true;
    if (haystack.includes(token)) return true;
    if (token.endsWith("ing") && token.length > 4) {
      const stem = token.slice(0, -3);
      if (haystack.includes(stem)) return true;
    }
    if (token.endsWith("s") && token.length > 2) {
      const singular = token.slice(0, -1);
      if (haystack.includes(singular)) return true;
    }
    return false;
  };

  const results = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return [];
    const tokens = q.split(" ");
    return (searchIndex || [])
      .filter((row) => {
        const haystack = normalizeText(
          `${row.name} ${row.sectionTitle} ${row.serviceTitle} ${row.tags.join(" ")}`
        );
        return tokens.every((t) => tokenMatches(t, haystack));
      })
      .slice(0, 8);
  }, [query, searchIndex]);

  useEffect(() => {
    let mounted = true;
    const loadCities = async () => {
      try {
        const data = await api.getCities();
        if (!mounted) return;
        setCities(data || []);
        if (!selectedCity && data?.length) {
          const firstId = String(data[0].id);
          setSelectedCity(firstId);
          localStorage.setItem("selected_city_id", firstId);
        }
      } catch {
        // ignore
      }
    };
    const handleAdminChange = () => loadCities();
    const handleStorage = (e) => {
      if (e.key === "admin_data_version") loadCities();
    };
    const handleFocus = () => loadCities();
    const handleVisibility = () => {
      if (!document.hidden) loadCities();
    };
    const poll = window.setInterval(() => {
      const next = localStorage.getItem("admin_data_version") || "";
      if (next && next !== adminVersionRef.current) {
        adminVersionRef.current = next;
        loadCities();
      }
    }, 2000);
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("admin-data");
    const handleChannel = (event) => {
      if (event?.data?.type === "refresh") loadCities();
    };
    window.addEventListener("admin-data-changed", handleAdminChange);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    channel?.addEventListener("message", handleChannel);
    loadCities();
    return () => {
      mounted = false;
      window.removeEventListener("admin-data-changed", handleAdminChange);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      channel?.removeEventListener("message", handleChannel);
      channel?.close();
      window.clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    if (!showProfile) return;
    setAuthError("");
    setProfileSuccess("");
    if (profileSuccessTimerRef.current) {
      window.clearTimeout(profileSuccessTimerRef.current);
      profileSuccessTimerRef.current = null;
    }
    setBookingsError("");
    if (isAuthed) {
      setProfileView("menu");
    } else {
      setProfileView("login");
    }
  }, [showProfile, isAuthed]);

  useEffect(() => {
    if (!authUser) return;
    setProfileName(authUser.fullName || "");
    setProfileEmail(authUser.email || "");
    setProfilePhone(authUser.phone || "");
  }, [authUser]);

  const slugify = (value = "") =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const resolveServiceKey = (category) => {
    if (!category) return "";
    const bySlug = Object.keys(leftData).find(
      (key) => slugify(key) === slugify(category.slug || category.name)
    );
    if (bySlug) return bySlug;
    const byTitle = Object.entries(leftData).find(
      ([, v]) => slugify(v.title) === slugify(category.name)
    );
    return byTitle?.[0] || slugify(category.name);
  };

  const pickImageForService = (serviceKey, label, fallbackUrl) => {
    if (fallbackUrl) return fallbackUrl;
    return "";
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [categories, services, options] = await Promise.all([
          api.getCategories(),
          api.getServices(),
          api.getServiceOptions()
        ]);
        if (!mounted) return;

        const optionsByService = new Map();
        options.forEach((opt) => {
          if (!optionsByService.has(opt.serviceId)) {
            optionsByService.set(opt.serviceId, []);
          }
          optionsByService.get(opt.serviceId).push(opt);
        });

        const topCategories = (categories || []).filter(
          (c) => c.parentCategoryId == null
        );
        const categoryMap = new Map(topCategories.map((c) => [c.id, c]));
        const rows = [];

        services.forEach((svc) => {
          const category = categoryMap.get(svc.categoryId);
          const serviceKey = resolveServiceKey(category);
          const serviceTitle =
            leftData[serviceKey]?.title || category?.name || serviceKey;
          const tags = [
            serviceKey,
            serviceKey.replace(/([a-z])([A-Z])/g, "$1 $2"),
            serviceTitle,
            category?.name || ""
          ];

          if (serviceKey.toLowerCase().includes("women"))
            tags.push("women", "ladies");
          if (serviceKey.toLowerCase().includes("men")) tags.push("men", "gents");
          if (serviceKey.toLowerCase().includes("spa")) tags.push("spa");
          if (serviceKey.toLowerCase().includes("salon")) tags.push("salon");
          if (serviceKey.toLowerCase().includes("hair")) tags.push("hair");
          if (serviceKey.toLowerCase().includes("makeup"))
            tags.push("makeup", "styling");

          const svcOptions = optionsByService.get(svc.id) || [];
          if (svcOptions.length === 0) {
            rows.push({
              serviceKey,
              serviceTitle,
              sectionId: slugify(svc.title),
              sectionTitle: svc.title,
              name: svc.title,
              img: pickImageForService(
                serviceKey,
                svc.title,
                svc.imageUrl || category?.imageUrl
              ),
              price: svc.basePrice,
              tags
            });
          } else {
            svcOptions.forEach((opt) => {
              rows.push({
                serviceKey,
                serviceTitle,
                sectionId: slugify(svc.title),
                sectionTitle: svc.title,
                name: opt.name || svc.title,
                img: pickImageForService(
                  serviceKey,
                  opt.name || svc.title,
                  opt.imageUrl || svc.imageUrl || category?.imageUrl
                ),
                price: opt.price || svc.basePrice,
                tags
              });
            });
          }
        });

        setSearchIndex(rows);
      } catch (e) {
        setSearchIndex([]);
      }
    };
    const handleAdminChange = () => load();
    const handleStorage = (e) => {
      if (e.key === "admin_data_version") load();
    };
    const handleFocus = () => load();
    const handleVisibility = () => {
      if (!document.hidden) load();
    };
    const poll = window.setInterval(() => {
      const next = localStorage.getItem("admin_data_version") || "";
      if (next && next !== adminVersionRef.current) {
        adminVersionRef.current = next;
        load();
      }
    }, 2000);
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("admin-data");
    const handleChannel = (event) => {
      if (event?.data?.type === "refresh") load();
    };
    window.addEventListener("admin-data-changed", handleAdminChange);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    channel?.addEventListener("message", handleChannel);
    load();
    return () => {
      mounted = false;
      window.removeEventListener("admin-data-changed", handleAdminChange);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      channel?.removeEventListener("message", handleChannel);
      channel?.close();
      window.clearInterval(poll);
    };
  }, []);

  const handleCityChange = (e) => {
    const value = e.target.value;
    setSelectedCity(value);
    localStorage.setItem("selected_city_id", value);
    window.dispatchEvent(
      new CustomEvent("city-changed", { detail: { cityId: value } })
    );
  };

  const persistAuth = (res) => {
    if (!res?.accessToken || !res?.user) {
      throw new Error("Invalid login response.");
    }
    api.setToken(res.accessToken);
    localStorage.setItem("auth_user", JSON.stringify(res.user));
    setAuthUser(res.user);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginPhone || !loginPassword) {
      setAuthError("Phone and password are required.");
      return;
    }
    setAuthBusy(true);
    setAuthError("");
    try {
      const res = await api.login({
        phone: loginPhone,
        password: loginPassword
      });
      persistAuth(res);
      setProfileView("menu");
      setLoginPassword("");
    } catch (err) {
      setAuthError(err?.message || "Login failed.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!signupName) nextErrors.fullName = "Full name is required.";
    if (!signupPhone) nextErrors.phone = "Mobile number is required.";
    if (!signupPassword) nextErrors.password = "New password is required.";
    setSignupErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setAuthBusy(true);
    setAuthError("");
    try {
      await api.createUser({
        fullName: signupName,
        email: signupEmail || null,
        phone: signupPhone,
        password: signupPassword
      });
      const res = await api.login({
        phone: signupPhone,
        password: signupPassword
      });
      persistAuth(res);
      setProfileView("menu");
      setSignupPassword("");
    } catch (err) {
      setAuthError(err?.message || "Signup failed.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!authUser) return;
    if (!profileName || !profilePhone) {
      setAuthError("Full name and phone are required.");
      return;
    }
    setAuthBusy(true);
    setAuthError("");
    try {
      await api.updateUser(authUser.id, {
        fullName: profileName,
        email: profileEmail || null,
        phone: profilePhone,
        password: profilePassword || null
      });
      const nextUser = {
        ...authUser,
        fullName: profileName,
        email: profileEmail || "",
        phone: profilePhone
      };
      localStorage.setItem("auth_user", JSON.stringify(nextUser));
      setAuthUser(nextUser);
      setProfilePassword("");
      setProfileView("menu");
      setProfileSuccess("Profile updated successfully.");
      if (profileSuccessTimerRef.current) {
        window.clearTimeout(profileSuccessTimerRef.current);
      }
      profileSuccessTimerRef.current = window.setTimeout(() => {
        setProfileSuccess("");
        profileSuccessTimerRef.current = null;
      }, 2000);
    } catch (err) {
      setAuthError(err?.message || "Update failed.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = () => {
    api.clearToken();
    localStorage.removeItem("auth_user");
    setAuthUser(null);
    setProfileView("login");
  };

  const loadBookings = async () => {
    if (!authUser) return;
    setBookingsLoading(true);
    setBookingsError("");
    try {
      const list = await api.getBookings();
      const mine = (list || []).filter((b) => b.userId === authUser.id);
      setBookings(mine);
    } catch (err) {
      setBookingsError(err?.message || "Unable to load bookings.");
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (profileView !== "bookings") return;
    if (!authUser) return;
    loadBookings();
  }, [profileView, authUser]);

  return (
    <header className="navbar">
      <div className="logo">
        <Link to="/">
          <img src="/images/1Homepage/logo (1).png" alt="Urban" />
        </Link>
      </div>

      <div className="nav-right">
        <select value={selectedCity} onChange={handleCityChange}>
          {cities.length === 0 && <option>Loading...</option>}
          {cities.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search for services"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {results.length > 0 && (
            <div className="search-results">
              {results.map((item) => (
                <Link
                  key={`${item.serviceKey}-${item.sectionId}-${item.name}`}
                  to={`/services/${item.serviceKey}#${item.sectionId}`}
                  className="search-result-item"
                  onClick={() => setQuery("")}
                >
                  {item.img && (
                    <img src={resolveImage(item.img)} alt={item.name} />
                  )}
                  <div className="search-result-text">
                    <span className="search-result-name">{item.name}</span>
                    <span className="search-result-meta">
                      {item.serviceTitle} · {item.sectionTitle} · Rs {item.price}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="icon cart-icon"
          onClick={() => setShowCart(true)}
          aria-label="Open cart"
        >
         <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-cart" viewBox="0 0 16 16">
  <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l1.313 7h8.17l1.313-7zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
</svg>
          {totalQty > 0 && <span className="cart-badge">{totalQty}</span>}
        </button>
        <button
          type="button"
          className="icon profile-trigger"
          onClick={() => setShowProfile(true)}
          aria-label="Open profile drawer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-person-fill" viewBox="0 0 16 16">
  <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
</svg>
        </button>
      </div>

      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div
            className="cart-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cart-drawer-header">
              <h3>Your Cart</h3>
              <button
                type="button"
                className="cart-close-btn"
                onClick={() => setShowCart(false)}
              >
                x
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="cart-empty">
                <p>No items in your cart.</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map((item) => (
                    <div key={item.key} className="cart-item">
                      {item.img && (
                        <img src={resolveImage(item.img)} alt={item.name} />
                      )}
                      <div className="cart-item-info">
                        <p className="cart-item-name">{item.name}</p>
                        <span className="cart-item-meta">
                          Qty {item.qty} · Rs {item.price}
                        </span>
                      </div>
                      <div className="cart-item-price">
                        Rs {item.price * item.qty}
                      </div>
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => removeFromCart(item.key)}
                        aria-label="Remove item"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="cart-summary-row">
                    <span>Subtotal</span>
                    <span>Rs {subtotal}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>Discount</span>
                    <span>- Rs {discount}</span>
                  </div>
                  <div className="cart-summary-row total">
                    <strong>Total</strong>
                    <strong>Rs {total}</strong>
                  </div>
                </div>

                <div className="cart-offer">
                  <img src="/images/1Homepage/logo (4).png" alt="Offer" />
                  <div>
                    <p>Extra 10% off on orders above Rs 999.</p>
                    <span>Applies automatically at checkout.</span>
                  </div>
                </div>

                <button type="button" className="checkout-btn">
                  Proceed to checkout
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showProfile && (
        <div className="profile-overlay" onClick={() => setShowProfile(false)}>
          <div
            className="profile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-drawer-header">
              <h3>Your Account</h3>
              <button
                type="button"
                className="cart-close-btn"
                onClick={() => setShowProfile(false)}
              >
                x
              </button>
            </div>
            {isAuthed && (
              <div className="profile-drawer-actions">
                <button
                  type="button"
                  className="profile-drawer-btn light"
                  onClick={() => {
                    setAuthError("");
                    setProfileView("profile");
                  }}
                >
                  Manage Profile
                </button>
                <button
                  type="button"
                  className="profile-drawer-btn"
                  onClick={() => {
                    setAuthError("");
                    setProfileView("bookings");
                  }}
                >
                  My Bookings
                </button>
                <button
                  type="button"
                  className="profile-drawer-btn outline"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
            <div className="profile-drawer-content">
              {isAuthed && profileSuccess && (
                <div className="profile-success">{profileSuccess}</div>
              )}
              {!isAuthed && (
                <>
                  {profileView === "login" && (
                    <form className="profile-login" onSubmit={handleLogin}>
                      <input
                        type="tel"
                        placeholder="Mobile number"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                      {authError && (
                        <span className="profile-error">{authError}</span>
                      )}
                      <div className="profile-login-actions">
                        <button
                          type="submit"
                          className="profile-login-btn"
                          disabled={authBusy}
                        >
                          {authBusy ? "Logging in..." : "Login"}
                        </button>
                        <button
                          type="button"
                          className="profile-login-btn outline"
                          onClick={() => {
                            setAuthError("");
                            setProfileView("signup");
                          }}
                        >
                          Sign Up
                        </button>
                      </div>
                    </form>
                  )}

                  {profileView === "signup" && (
                    <form className="profile-login" onSubmit={handleSignup}>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={signupName}
                        onChange={(e) => {
                          setSignupName(e.target.value);
                          if (signupErrors.fullName) {
                            setSignupErrors((prev) => ({ ...prev, fullName: "" }));
                          }
                        }}
                      />
                      {signupErrors.fullName && (
                        <span className="profile-error">{signupErrors.fullName}</span>
                      )}
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                      />
                      <input
                        type="tel"
                        placeholder="Mobile number"
                        value={signupPhone}
                        onChange={(e) => {
                          setSignupPhone(e.target.value);
                          if (signupErrors.phone) {
                            setSignupErrors((prev) => ({ ...prev, phone: "" }));
                          }
                        }}
                      />
                      {signupErrors.phone && (
                        <span className="profile-error">{signupErrors.phone}</span>
                      )}
                      <input
                        type="password"
                        placeholder="New password"
                        value={signupPassword}
                        onChange={(e) => {
                          setSignupPassword(e.target.value);
                          if (signupErrors.password) {
                            setSignupErrors((prev) => ({ ...prev, password: "" }));
                          }
                        }}
                      />
                      {signupErrors.password && (
                        <span className="profile-error">{signupErrors.password}</span>
                      )}
                      {authError && (
                        <span className="profile-error">{authError}</span>
                      )}
                      <button
                        type="submit"
                        className="profile-login-btn"
                        disabled={authBusy}
                      >
                        {authBusy ? "Creating..." : "Sign Up"}
                      </button>
                    </form>
                  )}
                </>
              )}

              {isAuthed && profileView === "profile" && (
                <form className="profile-edit" onSubmit={handleProfileSave}>
                  <div className="profile-title">Manage Profile</div>
                  <input
                    type="text"
                    placeholder="Full name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                  />
                  <input
                    type="tel"
                    placeholder="Mobile number"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder="New password (optional)"
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                  />
                  {authError && <span className="profile-error">{authError}</span>}
                  <button
                    type="submit"
                    className="profile-login-btn"
                    disabled={authBusy}
                  >
                    {authBusy ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              )}

              {isAuthed && profileView === "bookings" && (
                <div className="profile-bookings">
                  <div className="profile-title">My Bookings</div>
                  {bookingsLoading && <p>Loading bookings...</p>}
                  {bookingsError && (
                    <span className="profile-error">{bookingsError}</span>
                  )}
                  {!bookingsLoading && !bookingsError && bookings.length === 0 && (
                    <p>No bookings found.</p>
                  )}
                  <div className="booking-list">
                    {bookings.map((b) => (
                      <div key={b.id} className="booking-item">
                        <div className="booking-row">
                          <span className="booking-ref">
                            {b.bookingReference}
                          </span>
                          <span className="booking-status">{b.status}</span>
                        </div>
                        <div className="booking-row">
                          <span>
                            {new Date(b.scheduledAt).toLocaleString()}
                          </span>
                          <span>Rs {b.totalAmount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

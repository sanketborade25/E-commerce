import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../context/NotificationContext";
import { api } from "../api/client";
import { resolveImage } from "../utils/image";
import AppLogo from "./AppLogo";
import "../styles/components/navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
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
  const [locationQuery, setLocationQuery] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [activeLocationIndex, setActiveLocationIndex] = useState(-1);
  const [recentCityIds, setRecentCityIds] = useState(() => {
    try {
      const raw = localStorage.getItem("recent_city_ids");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const locationRef = useRef(null);
  const notificationRef = useRef(null);
  const adminVersionRef = useRef(
    localStorage.getItem("admin_data_version") || ""
  );
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    fetchNotifications,
    markAsRead
  } = useNotifications();
  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const discount = subtotal >= 999 ? Math.round(subtotal * 0.1) : 0;
  const total = Math.max(0, subtotal - discount);

  const [searchIndex, setSearchIndex] = useState([]);
  const isAuthed = Boolean(authUser);
  const selectedCityName = useMemo(() => {
    const match = (cities || []).find(
      (c) => String(c.id) === String(selectedCity)
    );
    return match?.name || "";
  }, [cities, selectedCity]);

  const filteredRecentCities = useMemo(() => {
    const recent = recentCityIds
      .map((id) => cities.find((c) => String(c.id) === String(id)))
      .filter(Boolean);
    const q = locationQuery.trim().toLowerCase();
    if (!q) return recent;
    return recent.filter((c) => String(c.name || "").toLowerCase().includes(q));
  }, [recentCityIds, cities, locationQuery]);

  const filteredCities = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return [];
    return (cities || []).filter((c) =>
      String(c.name || "").toLowerCase().includes(q)
    );
  }, [cities, locationQuery]);

  const recentIdSet = useMemo(
    () => new Set(filteredRecentCities.map((c) => String(c.id))),
    [filteredRecentCities]
  );

  const locationOptions = useMemo(() => {
    if (locationQuery.trim()) return filteredCities;
    return filteredRecentCities;
  }, [filteredCities, filteredRecentCities, locationQuery]);

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

  const visibleNotifications = useMemo(
    () => (notifications || []).slice(0, 6),
    [notifications]
  );

  const formatNotificationTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  useEffect(() => {
    let mounted = true;
    let inFlight = false;
    let retryTimer = null;
    let retryAttempt = 0;

    const clearRetry = () => {
      if (retryTimer) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const scheduleRetry = () => {
      if (!mounted || retryTimer) return;
      const delayMs = Math.min(15000, 1000 * 2 ** Math.min(retryAttempt, 4));
      retryAttempt += 1;
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        loadCities();
      }, delayMs);
    };

    const loadCities = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const data = await api.getCities();
        if (!mounted) return;
        setCities(data || []);
        if (!selectedCity && data?.length) {
          const firstId = String(data[0].id);
          setSelectedCity(firstId);
          localStorage.setItem("selected_city_id", firstId);
          window.dispatchEvent(
            new CustomEvent("city-changed", { detail: { cityId: firstId } })
          );
        }
        retryAttempt = 0;
        clearRetry();
      } catch {
        // ignore
        scheduleRetry();
      } finally {
        inFlight = false;
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
      clearRetry();
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
    if (!authUser?.id) return;
    fetchNotifications(authUser.id);
  }, [authUser?.id, fetchNotifications]);

  useEffect(() => {
    const syncAuthUser = () => {
      const raw = localStorage.getItem("auth_user");
      if (!raw) {
        setAuthUser(null);
        return;
      }
      try {
        setAuthUser(JSON.parse(raw));
      } catch {
        setAuthUser(null);
      }
    };

    window.addEventListener("auth-token-changed", syncAuthUser);
    return () => window.removeEventListener("auth-token-changed", syncAuthUser);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!notificationRef.current?.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const toggleNotifications = () => {
    const nextOpen = !showNotifications;
    setShowNotifications(nextOpen);

    if (nextOpen && unreadCount > 0) {
      markAsRead(notifications.filter((item) => !item.isRead).map((item) => item.id));
    }
  };

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
    return slugify(category.slug || category.name);
  };

  const pickImageForService = (serviceKey, label, fallbackUrl) => {
    if (fallbackUrl) return fallbackUrl;
    return "";
  };

  useEffect(() => {
    let mounted = true;
    let inFlight = false;
    let retryTimer = null;
    let retryAttempt = 0;

    const clearRetry = () => {
      if (retryTimer) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
    };

    const scheduleRetry = () => {
      if (!mounted || retryTimer) return;
      const delayMs = Math.min(15000, 1000 * 2 ** Math.min(retryAttempt, 4));
      retryAttempt += 1;
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        load();
      }, delayMs);
    };

    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const [categories, services, options] = await Promise.all([
          api.getCategories({ cityId: selectedCity || undefined }),
          api.getServices({ cityId: selectedCity || undefined }),
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
          const serviceTitle = category?.name || svc.title || serviceKey;
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
              price: 0,
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
                price: opt.price || 0,
                tags
              });
            });
          }
        });

        setSearchIndex(rows);
        retryAttempt = 0;
        clearRetry();
      } catch (e) {
        setSearchIndex([]);
        scheduleRetry();
      } finally {
        inFlight = false;
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
      clearRetry();
    };
  }, []);

  const saveRecentCity = (cityId) => {
    setRecentCityIds((prev) => {
      const next = [String(cityId), ...prev.filter((id) => String(id) !== String(cityId))];
      const trimmed = next.slice(0, 4);
      localStorage.setItem("recent_city_ids", JSON.stringify(trimmed));
      return trimmed;
    });
  };

  const handleCitySelect = (cityId) => {
    const value = String(cityId);
    setSelectedCity(value);
    localStorage.setItem("selected_city_id", value);
    saveRecentCity(value);
    setLocationQuery("");
    setShowLocationDropdown(false);
    setActiveLocationIndex(-1);
    window.dispatchEvent(
      new CustomEvent("city-changed", { detail: { cityId: value } })
    );
  };

  const handleLocationInputKeyDown = (e) => {
    if (!showLocationDropdown && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setShowLocationDropdown(true);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (locationOptions.length === 0) return;
      setActiveLocationIndex((prev) => {
        const next = prev + 1;
        return next >= locationOptions.length ? 0 : next;
      });
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (locationOptions.length === 0) return;
      setActiveLocationIndex((prev) => {
        const next = prev - 1;
        return next < 0 ? locationOptions.length - 1 : next;
      });
    }
    if (e.key === "Enter") {
      if (activeLocationIndex >= 0 && locationOptions[activeLocationIndex]) {
        e.preventDefault();
        handleCitySelect(locationOptions[activeLocationIndex].id);
      }
    }
    if (e.key === "Escape") {
      setShowLocationDropdown(false);
      setLocationQuery("");
      setActiveLocationIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!locationRef.current) return;
      if (!locationRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
        setLocationQuery("");
        setActiveLocationIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

    const normalizeId = (value) => String(value || "").trim().toLowerCase();
    const userId = normalizeId(authUser.id);
    let localBookings = [];
    try {
      localBookings = JSON.parse(localStorage.getItem("guest_bookings") || "[]");
    } catch {
      localBookings = [];
    }
    const mineLocal = (localBookings || []).filter((b) => {
      if (!b?.userId) return true; // back-compat for older local entries
      return normalizeId(b.userId) === userId;
    });

    try {
      const list = await api.getBookings();
      const mineRemote = (list || []).filter(
        (b) => normalizeId(b.userId) === userId
      );
      const merged = [...mineRemote, ...mineLocal];
      merged.sort((a, b) => {
        const t1 = new Date(b?.scheduledAt || 0).getTime();
        const t2 = new Date(a?.scheduledAt || 0).getTime();
        return t1 - t2;
      });
      setBookings(merged);
    } catch (err) {
      if (mineLocal.length > 0) {
        setBookings(mineLocal);
      } else {
        setBookingsError(err?.message || "Unable to load bookings.");
      }
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
      <div className="navbar-main">
      <div className="nav-left">
        <Link to="/home" className="app-brand">
          <AppLogo />
          <span className="app-brand-title">Urban Services</span>
        </Link>
      </div>

      {/* Admin Panel Navigation */}
      {authUser?.role === "admin" && (
        <nav className="admin-nav">
          <Link to="/admin/dashboard" className="admin-nav-link">Dashboard</Link>
          <Link to="/admin/bookings" className="admin-nav-link">Bookings</Link>
          <Link to="/admin/users" className="admin-nav-link">Users</Link>
          <Link to="/admin/professionals" className="admin-nav-link">Professionals</Link>
        </nav>
      )}

      <div className="nav-center">
        <div className="nav-location" ref={locationRef}>
          <span className="nav-location-icon" aria-hidden>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M8 16s6-5.5 6-10A6 6 0 1 0 2 6c0 4.5 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
            </svg>
          </span>
          <input
            type="text"
            className="nav-location-input"
            placeholder="Search for your city"
            value={showLocationDropdown ? locationQuery : locationQuery || selectedCityName}
            onChange={(e) => {
              setLocationQuery(e.target.value);
              setShowLocationDropdown(true);
              setActiveLocationIndex(-1);
            }}
            onFocus={() => setShowLocationDropdown(true)}
            onKeyDown={handleLocationInputKeyDown}
          />
          {showLocationDropdown && (
            <div className="nav-location-dropdown">
              {!locationQuery.trim() && filteredRecentCities.length > 0 && (
                <div className="nav-location-section">
                  <div className="nav-location-heading">Recent Locations</div>
                  {filteredRecentCities.map((city, idx) => {
                    const isSelected = String(city.id) === String(selectedCity);
                    const optionIndex = idx;
                    return (
                      <button
                        key={`recent-${city.id}`}
                        type="button"
                        className={`nav-location-item${
                          activeLocationIndex === optionIndex ? " active" : ""
                        }${isSelected ? " selected" : ""}`}
                        onClick={() => handleCitySelect(city.id)}
                      >
                        {city.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {locationQuery.trim() ? (
                <div className="nav-location-section">
                  <div className="nav-location-heading">Search Results</div>
                  {filteredCities.length === 0 ? (
                    <div className="nav-location-empty">No locations found.</div>
                  ) : (
                    filteredCities.map((city, idx) => {
                      const optionIndex = idx;
                      const isSelected = String(city.id) === String(selectedCity);
                      return (
                        <button
                          key={`search-${city.id}`}
                          type="button"
                          className={`nav-location-item${
                            activeLocationIndex === optionIndex ? " active" : ""
                          }${isSelected ? " selected" : ""}`}
                          onClick={() => handleCitySelect(city.id)}
                        >
                          {city.name}
                        </button>
                      );
                    })
                  )}
                </div>
              ) : !locationQuery.trim() && filteredRecentCities.length === 0 ? (
                <div className="nav-location-section">
                  <div className="nav-location-empty">No recent locations</div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="search-box">
          <span className="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11 6a5 5 0 1 1-1.001-3.001A5 5 0 0 1 11 6zm-1.5 5.5 3.5 3.5" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search for services, packages, or categories"
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

      </div>

      <div className="nav-right">
        <div className="nav-notification-wrap" ref={notificationRef}>
          <button
            type="button"
            className="nav-icon-button"
            onClick={toggleNotifications}
            aria-label="Open notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2m.104-14.804A1 1 0 0 0 7 2v.09a5 5 0 0 0-4 4.9v2.573l-.87 1.742A.5.5 0 0 0 2.577 12h10.846a.5.5 0 0 0 .447-.695L13 9.564V6.99a5 5 0 0 0-4-4.9z"/>
            </svg>
            {unreadCount > 0 && <span className="cart-badge">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="nav-notification-dropdown">
              <div className="nav-notification-header">
                <strong>Notifications</strong>
              </div>
              {!isAuthed ? (
                <div className="nav-notification-empty">Login to see your notifications.</div>
              ) : notificationsLoading ? (
                <div className="nav-notification-empty">Loading notifications...</div>
              ) : visibleNotifications.length === 0 ? (
                <div className="nav-notification-empty">No notifications yet.</div>
              ) : (
                visibleNotifications.map((item) => (
                  <div
                    key={item.id}
                    className={`nav-notification-item${item.isRead ? "" : " unread"}`}
                  >
                    <strong>{item.title}</strong>
                    <p>{item.message || "You have a new update."}</p>
                    <span>{formatNotificationTime(item.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="nav-icon-button"
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
          className="nav-icon-button"
          onClick={() => setShowProfile(true)}
          aria-label="Open profile drawer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-person-fill" viewBox="0 0 16 16">
  <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
</svg>
        </button>
      </div>

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

                <button
                  type="button"
                  className="checkout-btn"
                  onClick={() => {
                    setShowCart(false);
                    navigate("/checkout");
                  }}
                >
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

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5148";
const TOKEN_KEY = "auth_token";
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 10000);
const API_RETRIES = Number(import.meta.env.VITE_API_RETRIES || 2);
const API_RETRY_DELAY_MS = Number(
  import.meta.env.VITE_API_RETRY_DELAY_MS || 500
);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetriableStatus = (status) => status === 429 || status >= 500;

const isRetriableError = (error) => {
  const msg = String(error?.message || "").toLowerCase();
  return (
    error?.name === "AbortError" ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror")
  );
};

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const method = String(options.method || "GET").toUpperCase();
  const canRetry = method === "GET" || method === "HEAD" || method === "OPTIONS";
  const url = `${API_BASE}${path}`;

  for (let attempt = 0; attempt <= API_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {})
        },
        signal: controller.signal
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem(TOKEN_KEY);
          window.dispatchEvent(new Event("auth-token-changed"));
        }
        const text = await res.text();
        const error = new Error(text || `Request failed: ${res.status}`);
        error.status = res.status;

        if (canRetry && attempt < API_RETRIES && isRetriableStatus(res.status)) {
          await delay(API_RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        throw error;
      }

      if (res.status === 204) return null;
      const contentLength = res.headers.get("content-length");
      if (contentLength === "0") return null;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) return null;
      return res.json();
    } catch (error) {
      if (canRetry && attempt < API_RETRIES && isRetriableError(error)) {
        await delay(API_RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      if (error?.name === "AbortError") {
        throw new Error(`Request timed out after ${API_TIMEOUT_MS} ms`);
      }
      if (isRetriableError(error)) {
        throw new Error(
          `Cannot connect to API (${url}). Check if backend is running and API base URL/protocol is correct.`
        );
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  throw new Error("Request failed after retries");
}

async function upload(path, formData) {
  const token = localStorage.getItem(TOKEN_KEY);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData,
    signal: controller.signal
  }).finally(() => window.clearTimeout(timeoutId));
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getCities: (params = {}) => {
    const search = new URLSearchParams();
    if (params.includeInactive) search.set("includeInactive", "true");
    const qs = search.toString();
    return request(`/api/Cities${qs ? `?${qs}` : ""}`);
  },
  createCity: (body) =>
    request("/api/Cities", { method: "POST", body: JSON.stringify(body) }),
  updateCity: (id, body) =>
    request(`/api/Cities/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCity: (id) => request(`/api/Cities/${id}`, { method: "DELETE" }),
  updateCityStatus: (id, isActive) =>
    request(`/api/Cities/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive })
    }),
  getCategories: (params = {}) => {
    const search = new URLSearchParams();
    if (params.cityId) search.set("cityId", params.cityId);
    const qs = search.toString();
    return request(`/api/Categories${qs ? `?${qs}` : ""}`);
  },
  createCategory: (body) =>
    request("/api/Categories", { method: "POST", body: JSON.stringify(body) }),
  updateCategory: (id, body) =>
    request(`/api/Categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  deleteCategory: (id) => request(`/api/Categories/${id}`, { method: "DELETE" }),
  getSubCategories: (params = {}) => {
    const search = new URLSearchParams();
    if (params.cityId) search.set("cityId", params.cityId);
    const qs = search.toString();
    return request(`/api/SubCategories${qs ? `?${qs}` : ""}`);
  },
  createSubCategory: (body) =>
    request("/api/SubCategories", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  updateSubCategory: (id, body) =>
    request(`/api/SubCategories/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  deleteSubCategory: (id) =>
    request(`/api/SubCategories/${id}`, { method: "DELETE" }),
  getServices: (params = {}) => {
    const search = new URLSearchParams();
    if (params.cityId) search.set("cityId", params.cityId);
    if (params.categoryId) search.set("categoryId", params.categoryId);
    if (params.subCategoryId) search.set("subCategoryId", params.subCategoryId);
    const qs = search.toString();
    return request(`/api/Services${qs ? `?${qs}` : ""}`);
  },
  getAdminServices: () => request(`/api/admin/services`),
  enableService: (id, cityId) => request(`/api/service/${id}/enable?cityId=${cityId}`, { method: "PATCH" }),
  disableService: (id, cityId) => {
    const qs = cityId ? `?cityId=${cityId}` : "";
    return request(`/api/service/${id}/disable${qs}`, { method: "PATCH" });
  },
  getService: (id) => request(`/api/Services/${id}`),
  createService: (body) =>
    request("/api/Services", { method: "POST", body: JSON.stringify(body) }),
  updateService: (id, body) =>
    request(`/api/Services/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  deleteService: (id) => request(`/api/Services/${id}`, { method: "DELETE" }),
  getServiceOptions: () => request("/api/ServiceOptions"),
  createServiceOption: (body) =>
    request("/api/ServiceOptions", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  updateServiceOption: (id, body) =>
    request(`/api/ServiceOptions/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  deleteServiceOption: (id) =>
    request(`/api/ServiceOptions/${id}`, { method: "DELETE" }),
  getProfessionals: (params = {}) => {
    const search = new URLSearchParams();
    if (params.cityId) search.set("cityId", params.cityId);
    const qs = search.toString();
    return request(`/api/Professionals${qs ? `?${qs}` : ""}`);
  },
  getAdminBookings: (params = {}) => {
    const search = new URLSearchParams();
    if (params.search) search.set("search", params.search);
    if (params.status) search.set("status", params.status);
    if (params.cityId) search.set("cityId", params.cityId);
    if (params.dateFrom) search.set("dateFrom", params.dateFrom);
    if (params.dateTo) search.set("dateTo", params.dateTo);
    if (params.page) search.set("page", params.page);
    if (params.pageSize) search.set("pageSize", params.pageSize);
    const qs = search.toString();
    return request(`/api/admin/bookings${qs ? `?${qs}` : ""}`);
  },
  getAdminBooking: (id) => request(`/api/admin/bookings/${id}`),
  updateAdminBookingStatus: (id, body) =>
    request(`/api/admin/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),
  assignAdminBookingProfessional: (id, body) =>
    request(`/api/admin/bookings/${id}/assign-professional`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),
  uploadImage: (file) => {
    const form = new FormData();
    form.append("file", file);
    return upload("/api/Uploads/image", form);
  },
  getCart: () => request("/api/Cart"),
  addCartItem: (body) =>
    request("/api/Cart/items", { method: "POST", body: JSON.stringify(body) }),
  updateCartItem: (id, body) =>
    request(`/api/Cart/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  deleteCartItem: (id) =>
    request(`/api/Cart/items/${id}`, { method: "DELETE" }),
  clearCart: () => request("/api/Cart/clear", { method: "DELETE" }),
  login: (body) =>
    request("/api/Auth/login", { method: "POST", body: JSON.stringify(body) }),
  professionalSignup: (body) =>
    request("/api/professionals", { method: "POST", body: JSON.stringify(body) }),
  professionalLogin: (body) =>
    request("/api/Auth/login", { method: "POST", body: JSON.stringify(body) }),
  professionalLoginV2: (body) =>
    request("/api/professionals/login", { method: "POST", body: JSON.stringify(body) }),
  professionalSignupV2: (body) =>
    request("/api/professionals/signup", { method: "POST", body: JSON.stringify(body) }),
  getProfessionalProfileSummary: () => request("/api/professionals/profile"),
  updateProfessionalStatusSummary: (isOnline) =>
    request("/api/professionals/status", {
      method: "PATCH",
      body: JSON.stringify({ isOnline })
    }),
  getProfessionalBookingsByStatus: (status) =>
    request(`/api/professionals/bookings${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  getProfessionalDashboard: () => request("/api/professionals/dashboard"),
  getMyProfessionalProfile: () => request("/api/professionals/me"),
  updateMyProfessionalStatus: (isOnline) =>
    request("/api/professionals/me/online", {
      method: "PATCH",
      body: JSON.stringify({ isOnline })
    }),
  getProfessionalProfile: (id) => request(`/api/professionals/${id}`),
  updateProfessional: (id, body) =>
    request(`/api/professionals/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProfessional: (id) => request(`/api/professionals/${id}`, { method: "DELETE" }),
  getProfessionalBookings: () => request("/api/booking/my"),
  getProfessionalAvailability: (professionalId) =>
    request(`/api/Availabilities/professional/${professionalId}`),
  acceptBooking: (id) => request(`/api/booking/${id}/accept`, { method: "PATCH" }),
  rejectBooking: (id) => request(`/api/booking/${id}/reject`, { method: "PATCH" }),
  updateBookingStatus: (id, body) =>
    request(`/api/booking/${id}/status`, { method: "PATCH", body: JSON.stringify(body) }),
  createUser: (body) =>
    request("/api/Users", { method: "POST", body: JSON.stringify(body) }),
  updateUser: (id, body) =>
    request(`/api/Users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  getBookings: () => request("/api/Bookings"),
  createBooking: (body) =>
    request("/api/Bookings", { method: "POST", body: JSON.stringify(body) }),
  setToken: (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event("auth-token-changed"));
  },
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event("auth-token-changed"));
  }
};

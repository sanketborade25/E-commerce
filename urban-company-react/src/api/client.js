const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5148";
const TOKEN_KEY = "auth_token";

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  const contentLength = res.headers.get("content-length");
  if (contentLength === "0") return null;
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  return res.json();
}

async function upload(path, formData) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: formData
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getCities: () => request("/api/Cities"),
  createCity: (body) =>
    request("/api/Cities", { method: "POST", body: JSON.stringify(body) }),
  updateCity: (id, body) =>
    request(`/api/Cities/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteCity: (id) => request(`/api/Cities/${id}`, { method: "DELETE" }),
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
  createUser: (body) =>
    request("/api/Users", { method: "POST", body: JSON.stringify(body) }),
  updateUser: (id, body) =>
    request(`/api/Users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  getBookings: () => request("/api/Bookings"),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY)
};

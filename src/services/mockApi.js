// API service layer — now talks to the real Python backend (backend/app.py)
// over HTTP instead of using local mock data. Page components never touch
// fetch() directly; if the backend's routes ever change, only this file does.

// In dev this defaults to the local Python server. For a live deployment,
// set VITE_API_BASE in a .env file (see .env.example) to your deployed
// backend's URL, e.g. VITE_API_BASE=https://your-backend.onrender.com/api
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

function authHeaders() {
  const token = localStorage.getItem("fo-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return res.json();
}
async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw Object.assign(new Error(payload.error || `POST ${path} failed (${res.status})`), { status: res.status });
  }
  return res.json();
}
async function del(path) {
  const res = await fetch(`${BASE}${path}`, { method: "DELETE", headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(`DELETE ${path} failed (${res.status})`);
  return res.json();
}

export const getProducts = () => get("/products");
export const getProductById = id => get(`/products/${id}`).catch(() => null);
export const searchProducts = (query = "") => get(`/search?q=${encodeURIComponent(query)}`);
export const getPriceHistory = id => get(`/price-history/${id}`);
export const getSaleAuthenticity = id => get(`/sale-authenticity/${id}`);
export const getBrands = () => get("/brands");
export const getPriceIntelligence = () => get("/price-intelligence");

export const predictSize = measurements => post("/predict-size", measurements);
export const generateOutfit = prefs => post("/generate-outfit", prefs);
export const findVisualMatches = fileMeta => post("/visual-search", fileMeta);

export const getWishlist = () => get("/wishlist");
export const toggleWishlist = productId => post(`/wishlist/${productId}`);

export const signup = (name, email, password) => post("/auth/signup", { name, email, password });
export const login = (email, password) => post("/auth/login", { email, password });
export const logout = () => post("/auth/logout");
export const getMe = () => get("/auth/me");
export const getProfile = () => get("/profile");
export const saveProfile = profile => post("/profile", profile);

export const getAlerts = () => get("/alerts");
export const createAlert = (productId, kind = "price-drop") => post("/alerts", { productId, kind });
export const removeAlert = alertId => del(`/alerts/${alertId}`);

// Small helper so pages can show a clear message instead of a blank screen
// if the backend isn't running yet.
export function isBackendError(err) {
  return err instanceof TypeError; // fetch throws TypeError on connection refused
}

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Token refresh single-flight to prevent concurrent refresh requests
let refreshInFlight = null;

/**
 * Wrong credentials on login/register return 401 — must not trigger refresh flow
 * (same issue `main` avoids when no refresh token exists; this guards when a stale token exists).
 */
const isAuthCredentials401 = (config) => {
  if (!config?.url) return false;
  const path = String(config.url).split("?")[0];
  return path.includes("/api/auth/login") || path.includes("/api/auth/register");
};

const isOnAuthRoute = () => {
  const p = window.location.pathname;
  return p.includes("/login") || p.includes("/register") || p.includes("/auth");
};

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("accessToken");
    config.headers = config.headers || {};
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — token refresh pattern aligned with `main`
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthCredentials401(originalRequest)
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = sessionStorage.getItem("refreshToken");
        if (refreshToken) {
          // Single-flight refresh: avoid parallel refresh races clearing tokens.
          if (!refreshInFlight) {
            refreshInFlight = axios
              .post(`${API_URL}/api/auth/refresh`, { refreshToken })
              .finally(() => {
                refreshInFlight = null;
              });
          }
          const response = await refreshInFlight;

          // Backend returns { success, message, data: { accessToken } }
          if (response.data.success && response.data.data?.accessToken) {
            const { accessToken } = response.data.data;
            sessionStorage.setItem("accessToken", accessToken);

            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
          throw new Error("Invalid refresh token response");
        }
        throw new Error("No refresh token found");
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        if (!isOnAuthRoute()) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

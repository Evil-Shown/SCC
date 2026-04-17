import axios from "axios";
import {
  getAccessToken,
  getRefreshToken,
  persistAuth,
  clearAuthStorage
} from "../utils/authStorage.js";
import { API_BASE_URL } from "../config/apiBase.js";

const API_URL = API_BASE_URL;

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

function getTokenFromRedux() {
  if (typeof window === "undefined") return null;
  try {
    return window.__SCC_STORE__?.getState?.()?.auth?.accessToken || null;
  } catch {
    return null;
  }
}

function setRequestAuthHeader(config, token) {
  if (!token) return;
  const h = config.headers;
  if (h && typeof h.set === "function") {
    h.set("Authorization", `Bearer ${token}`);
  } else {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
}

// Synchronous interceptor: storage first, then Redux (via window store — no circular import).
api.interceptors.request.use(
  (config) => {
    let token = getAccessToken() || getTokenFromRedux();
    if (token && !getAccessToken()) {
      try {
        const st = window.__SCC_STORE__?.getState?.()?.auth;
        persistAuth({
          accessToken: token,
          ...(st?.refreshToken ? { refreshToken: st.refreshToken } : {})
        });
      } catch {
        /* ignore */
      }
    }
    setRequestAuthHeader(config, token);
    return config;
  },
  (error) => Promise.reject(error)
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
        const refreshToken = getRefreshToken();
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
            const nextRefresh = response.data.data?.refreshToken;
            persistAuth({
              accessToken,
              ...(nextRefresh ? { refreshToken: nextRefresh } : {})
            });

            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
          throw new Error("Invalid refresh token response");
        }
        throw new Error("No refresh token found");
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        clearAuthStorage();

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

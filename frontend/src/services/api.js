import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

let refreshInFlight = null;

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("accessToken");
    config.headers = config.headers || {};
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
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

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          } else {
            throw new Error("Invalid refresh token response");
          }
        }
        throw new Error("No refresh token found");
      } catch (refreshError) {
        // Refresh failed: don't aggressively clear storage here.
        // Let callers decide whether to redirect/login; avoids random token loss races.
        console.error("Token refresh failed:", refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

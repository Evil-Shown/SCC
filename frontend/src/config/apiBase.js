/**
 * Backend origin for HTTP calls. In Vite dev, default "" uses same origin + proxy (see vite.config.js).
 * Set VITE_API_URL when the API is on another host (e.g. production).
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "" : "http://localhost:5000");

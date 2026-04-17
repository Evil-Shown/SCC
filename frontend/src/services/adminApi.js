import axios from "axios";
import store from "../store/store";
import { getAccessToken } from "../utils/authStorage.js";
import { API_BASE_URL } from "../config/apiBase.js";

// DEV default "" → same-origin "/api" (Vite proxy). Otherwise full origin + "/api".
const API_BASE =
  API_BASE_URL === ""
    ? "/api"
    : `${String(API_BASE_URL).replace(/\/$/, "")}/api`;

const getAuthHeader = () => {
  const token =
    getAccessToken() || store.getState().auth.accessToken || null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

const adminApi = {
  // Analytics
  getAnalytics: () =>
    axios.get(`${API_BASE}/admin/analytics`, { headers: getAuthHeader() }),

  // System health
  getSystemHealth: () =>
    axios.get(`${API_BASE}/admin/system-health`, { headers: getAuthHeader() }),

  // Users
  getUsers: (params = {}) =>
    axios.get(`${API_BASE}/admin/users`, { params, headers: getAuthHeader() }),
  updateUser: (id, data) =>
    axios.put(`${API_BASE}/admin/users/${id}`, data, { headers: getAuthHeader() }),
  deleteUser: (id) =>
    axios.delete(`${API_BASE}/admin/users/${id}`, { headers: getAuthHeader() }),

  // Groups
  getGroups: (params = {}) =>
    axios.get(`${API_BASE}/admin/groups`, { params, headers: getAuthHeader() }),
  deleteGroup: (id) =>
    axios.delete(`${API_BASE}/admin/groups/${id}`, { headers: getAuthHeader() }),

  // Notes
  getNotes: (params = {}) =>
    axios.get(`${API_BASE}/admin/notes`, { params, headers: getAuthHeader() }),
  deleteNote: (id) =>
    axios.delete(`${API_BASE}/admin/notes/${id}`, { headers: getAuthHeader() }),

  // Kuppi Posts
  getKuppiPosts: (params = {}) =>
    axios.get(`${API_BASE}/admin/kuppi`, { params, headers: getAuthHeader() }),
  deleteKuppiPost: (id) =>
    axios.delete(`${API_BASE}/admin/kuppi/${id}`, { headers: getAuthHeader() }),
};

export default adminApi;

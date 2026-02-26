import api from "./api";

/**
 * Register a new user
 * Backend returns: { success, message, data: { user, accessToken, refreshToken } }
 * We return: { data: { user, accessToken, refreshToken } }
 */
export const register = async (userData) => {
  const response = await api.post("/api/auth/register", userData);
  
  // Check if registration was successful
  if (!response.data.success) {
    throw new Error(response.data.message || "Registration failed");
  }
  
  // Return the nested data object which contains user, accessToken, refreshToken
  return {
    data: response.data.data
  };
};

/**
 * Login user
 * Backend returns: { success, message, data: { user, accessToken, refreshToken } }
 * We return: { data: { user, accessToken, refreshToken } }
 */
export const login = async (credentials) => {
  const response = await api.post("/api/auth/login", {
    email: credentials.email,
    password: credentials.password
  });
  
  // Check if login was successful
  if (!response.data.success) {
    throw new Error(response.data.message || "Login failed");
  }
  
  // Return the nested data object which contains user, accessToken, refreshToken
  return {
    data: response.data.data
  };
};

/**
 * Logout user
 * Backend returns: { success, message }
 */
export const logout = async (refreshToken) => {
  const response = await api.post("/api/auth/logout", { refreshToken });
  
  if (!response.data.success) {
    throw new Error(response.data.message || "Logout failed");
  }
  
  return response.data;
};

/**
 * Get current user profile
 * Backend returns: { success, data: { user } }
 */
export const getMe = async () => {
  const response = await api.get("/api/auth/me");
  
  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to fetch profile");
  }
  
  return {
    data: response.data.data
  };
};

/**
 * Update user profile
 * Backend returns: { success, message, data: { user } }
 */
export const updateProfile = async (profileData) => {
  const response = await api.put("/api/auth/profile", profileData);
  
  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to update profile");
  }
  
  return {
    data: response.data.data
  };
};

/**
 * Refresh access token
 * Backend returns: { success, message, data: { accessToken } }
 */
export const refreshToken = async (refreshToken) => {
  const response = await api.post("/api/auth/refresh", { refreshToken });
  
  if (!response.data.success) {
    throw new Error(response.data.message || "Failed to refresh token");
  }
  
  return {
    data: response.data.data
  };
};

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authService from "../../services/authService";
import { initSocket, disconnectSocket } from "../../socket/socket";

// Get user from sessionStorage with error handling
const getStoredItem = (key) => {
  try {
    const item = sessionStorage.getItem(key);
    if (key === "user" && item) {
      return JSON.parse(item);
    }
    return item;
  } catch (error) {
    console.error(`Error reading ${key} from sessionStorage:`, error);
    return null;
  }
};

const user = getStoredItem("user");
const accessToken = getStoredItem("accessToken");
const refreshToken = getStoredItem("refreshToken");

const initialState = {
  user: user || null,
  accessToken: accessToken || null,
  refreshToken: refreshToken || null,
  isAuthenticated: !!user && !!accessToken, // Check both
  isLoading: false,
  error: null,
  lastActivity: Date.now() // Track last activity for session management
};

// Helper function to handle auth success
const handleAuthSuccess = (state, action) => {
  const { user, accessToken, refreshToken } = action.payload;
  
  state.isLoading = false;
  state.user = user;
  state.accessToken = accessToken;
  state.refreshToken = refreshToken;
  state.isAuthenticated = true;
  state.error = null;
  state.lastActivity = Date.now();

  // Save to sessionStorage
  try {
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("refreshToken", refreshToken);
  } catch (error) {
    console.error("Error saving to sessionStorage:", error);
  }

  // Initialize socket
  if (user?._id) {
    initSocket(user._id);
  }
};

// Async thunks with better typing
export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Registration failed. Please try again."
      );
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (error) {
      const data = error.response?.data;
      const fromErrors =
        Array.isArray(data?.errors) && data.errors.length
          ? data.errors.join(". ")
          : null;
      return rejectWithValue(
        fromErrors ||
          data?.message ||
          "Login failed. Please check your credentials."
      );
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { refreshToken } = getState().auth;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      // Disconnect socket
      disconnectSocket();
      
      // Clear all sessionStorage
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      
      return null;
    } catch (error) {
      // Even if logout API fails, clear local state
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      disconnectSocket();
      
      return rejectWithValue(
        error.response?.data?.message || "Logout failed"
      );
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  "auth/fetchUserProfile",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { accessToken } = getState().auth;
      if (!accessToken) {
        return rejectWithValue("No access token found");
      }
      
      const response = await authService.getMe();
      return response.data.user;
    } catch (error) {
      // If token expired, clear auth state
      if (error.response?.status === 401) {
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
      }
      
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch profile"
      );
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(profileData);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update profile"
      );
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { refreshToken } = getState().auth;
      if (!refreshToken) {
        return rejectWithValue("No refresh token available");
      }
      
      const response = await authService.refreshToken(refreshToken);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to refresh token"
      );
    }
  }
);

export const deleteUserAccount = createAsyncThunk(
  "auth/deleteAccount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.deleteAccount();
      
      // Clear all sessionStorage
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      disconnectSocket();
      
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete account"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.lastActivity = Date.now();
      
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("accessToken", accessToken);
      sessionStorage.setItem("refreshToken", refreshToken);
    },
    updateLastActivity: (state) => {
      state.lastActivity = Date.now();
    },
    resetAuth: (state) => {
      Object.assign(state, initialState);
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, handleAuthSuccess)
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Registration failed";
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, handleAuthSuccess)
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Login failed";
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        // Reset to initial state
        Object.assign(state, {
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastActivity: Date.now()
        });
      })
      .addCase(logout.rejected, (state) => {
        // Still reset state even if API fails
        Object.assign(state, {
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastActivity: Date.now()
        });
      })
      
      // Fetch profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        try {
          sessionStorage.setItem("user", JSON.stringify(action.payload));
        } catch (error) {
          console.error("Error saving user to sessionStorage:", error);
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        // If token was invalid/expired and refresh also failed, reset auth
        if (!sessionStorage.getItem("accessToken")) {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
        }
      })
      
      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        try {
          sessionStorage.setItem("user", JSON.stringify(action.payload));
        } catch (error) {
          console.error("Error saving user to sessionStorage:", error);
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Refresh token
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        // The payload contains { data: { accessToken } } from authService
        const { accessToken, refreshToken } = action.payload.data || action.payload;
        
        state.accessToken = accessToken;
        if (refreshToken) {
          state.refreshToken = refreshToken;
        }
        state.lastActivity = Date.now();
        
        sessionStorage.setItem("accessToken", accessToken);
        if (refreshToken) {
          sessionStorage.setItem("refreshToken", refreshToken);
        }
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        // If refresh fails, log out user
        Object.assign(state, {
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        });
        
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        disconnectSocket();
      })
      
      // Delete user account
      .addCase(deleteUserAccount.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteUserAccount.fulfilled, (state) => {
        Object.assign(state, {
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastActivity: Date.now()
        });
      })
      .addCase(deleteUserAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectRefreshToken = (state) => state.auth.refreshToken;

export const { clearError, setCredentials, updateLastActivity, resetAuth } = authSlice.actions;
export default authSlice.reducer;
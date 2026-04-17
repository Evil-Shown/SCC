import axios from "axios";
import api from "./api";
import {
  getAccessToken,
  getRefreshToken,
  persistAuth
} from "../utils/authStorage.js";
import { API_BASE_URL } from "../config/apiBase.js";

const API_URL = API_BASE_URL;

// 1️⃣ Save timetable (+ auto-generate optimized plan on backend)
export const createRawTimetable = async (
  universitySchedule,
  {
    difficultyLevels = {},
    preferredStudyHours = { startHour: 6, endHour: 22 },
    subjectPriorities = {},
    personalCommitments = [],
    balanceRules = {}
  } = {}
) => {
  const response = await api.post("/api/timetable", {
    universitySchedule,
    difficultyLevels,
    preferredStudyHours,
    subjectPriorities,
    personalCommitments,
    balanceRules
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to save timetable");
  }

  // data: { timetable, conflicts, hasConflicts }
  return response.data.data;
};

// Delete all timetable documents for the current user
export const deleteUserTimetable = async () => {
  const parse = (response) => {
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to delete timetable");
    }
    return response.data;
  };

  try {
    const response = await api.delete("/api/timetable/me");
    return parse(response);
  } catch (err) {
    const st = err?.response?.status;
    // Retry with POST if DELETE is blocked or missing on the server
    if (st === 404 || st === 405) {
      const response = await api.post("/api/timetable/clear-my-data");
      return parse(response);
    }
    const msg =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to delete timetable";
    throw new Error(msg);
  }
};

/** Remove only the AI / optimized plan; university timetable rows stay on the server. */
export const clearOptimizedSchedule = async () => {
  const response = await api.post("/api/timetable/clear-optimized");
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to clear AI / optimized plan");
  }
  return response.data.data; // { timetable }
};

/** Push the current saved optimized plan to Google (uses stored refresh token if body empty). */
export const syncGoogleCalendar = async (body = {}) => {
  const response = await api.post("/api/timetable/sync-google", body);
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to sync with Google Calendar");
  }
  return response.data.data;
};

// 2️⃣ Get User Timetable (latest)
export const getUserTimetable = async (userId) => {
  const response = await api.get(`/api/timetable/${userId}`);

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to fetch timetable");
  }

  return response.data.data;
};

// 3️⃣ Generate Optimized Timetable (rule-based)
export const generateOptimizedTimetable = async ({ difficultyLevels, preferredStudyHours }) => {
  const response = await api.post("/api/timetable/generate", {
    difficultyLevels,
    preferredStudyHours
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to generate optimized timetable");
  }

  // data: { timetable, conflicts, hasConflicts }
  return response.data.data;
};

// 4️⃣ Get ongoing event for dashboard
export const getOngoingEvent = async () => {
  const response = await api.get("/api/timetable/ongoing");

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to fetch ongoing event");
  }

  return response.data.data; // may be null
};

// Google OAuth URL (uses GOOGLE_CLIENT_ID from backend .env)
export const getGoogleAuthUrl = async ({ returnPath } = {}) => {
  // This endpoint is protected by JWT auth.
  // If accessToken is missing/expired, try refresh once before failing.
  let token = getAccessToken();
  if (!token) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshRes = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
      const next = refreshRes?.data?.data?.accessToken;
      if (next) {
        token = next;
        persistAuth({ accessToken: next });
      }
    }
  }

  if (!token) {
    throw new Error("Please login again to connect Google Calendar.");
  }

  // Use direct axios call (no interceptors) and send token in BOTH header + query.
  const response = await axios.get(`${API_URL}/api/timetable/google-auth-url`, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      token,
      ...(typeof returnPath === "string" && returnPath.trim()
        ? { returnPath: returnPath.trim() }
        : {})
    }
  });
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to get Google auth URL");
  }
  return response.data.data; // { url, redirectUri }
};

// Google connection status
export const getGoogleCalendarStatus = async () => {
  const response = await api.get("/api/timetable/google-status");
  if (!response.data?.success) {
    throw new Error(
      response.data?.message || "Failed to fetch Google Calendar connection status"
    );
  }
  return response.data.data; // { connected, lastSyncedAt }
};

// Upcoming Google Calendar events (read-only); backend uses a wide date window so timetable blocks aren’t hidden
export const getGoogleCalendarEvents = async ({
  maxResults = 40,
  pastDays = 180,
  futureDays = 180
} = {}) => {
  const response = await api.get("/api/timetable/google-events", {
    params: { maxResults, pastDays, futureDays }
  });
  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to fetch Google Calendar events");
  }
  return response.data.data; // { events }
};

// 5️⃣ AI timetable chat -> generate optimized timetable
export const aiTimetableChat = async ({
  message,
  universitySchedule,
  personalCommitments
} = {}) => {
  try {
    const body = { message };
    if (Array.isArray(universitySchedule) && universitySchedule.length > 0) {
      body.universitySchedule = universitySchedule;
    }
    if (Array.isArray(personalCommitments) && personalCommitments.length > 0) {
      body.personalCommitments = personalCommitments;
    }

    const response = await api.post("/api/timetable/ai-chat", body);

    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to generate timetable from AI chat");
    }

    return response.data.data;
  } catch (err) {
    const server = err.response?.data;

    // Backend returns { success:false, message, error } and error can contain OpenAI's { error:{message,code,...} }
    const openaiMessage =
      server?.error?.error?.message ||
      server?.error?.message ||
      server?.message;

    throw new Error(openaiMessage || err.message || "Failed to generate timetable from AI chat");
  }
};

// 6️⃣ Import timetable from uploaded image (OCR on backend)
export const importTimetableFromFile = async ({ file, prompt, personalCommitments } = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  if (typeof prompt === "string") formData.append("prompt", prompt);
  if (Array.isArray(personalCommitments) && personalCommitments.length > 0) {
    formData.append("personalCommitments", JSON.stringify(personalCommitments));
  }

  const response = await api.post("/api/timetable/import-timetable", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to import timetable from file");
  }

  return response.data.data;
};


import axios from "axios";
import mongoose from "mongoose";
import Timetable from "../models/Timetable.js";
import CalendarSync from "../models/CalendarSync.js";
import { generateOptimizedSchedule, findScheduleConflicts } from "../utils/timetableScheduler.js";
import { assertOpenAIConfigured, createChatCompletion, getChatCompletionText } from "../config/openai.js";
import { getGoogleAuthRedirectUri, getClientAppUrl } from "../config/googleOAuth.js";
import { upsertGoogleUserSession } from "../services/googleAuthFlow.js";
import fs from "fs/promises";
import Tesseract from "tesseract.js";
import { PDFParse } from "pdf-parse";

/**
 * Create Raw Timetable
 * POST /api/timetable
 *
 * Body:
 * {
 *   universitySchedule: [
 *     { title, subjectCode, type?, start, end, location? }
 *   ]
 * }
 */
export const createRawTimetable = async (req, res) => {
  try {
    const {
      universitySchedule,
      difficultyLevels = {},
      preferredStudyHours = { startHour: 6, endHour: 22 },
      subjectPriorities = {},
      personalCommitments = [],
      balanceRules = {}
    } = req.body || {};

    if (!Array.isArray(universitySchedule) || universitySchedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: "universitySchedule must be a non-empty array of subject blocks"
      });
    }

    // Save base timetable and auto-generate optimized plan in one step (user-friendly one-click flow).
    const optimizedSchedule = generateOptimizedSchedule(universitySchedule, {
      difficultyLevels,
      preferredStudyHours,
      subjectPriorities,
      personalCommitments,
      balanceRules
    });

    // Update the latest timetable instead of always creating a new document.
    const timetable = await Timetable.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          universitySchedule,
          optimizedSchedule
        }
      },
      { sort: { createdAt: -1 }, new: true, upsert: true }
    );

    const conflicts = findScheduleConflicts(optimizedSchedule);

    const googleCalendarSync = await tryAutoSyncGoogleCalendar(
      req.user._id,
      optimizedSchedule
    );

    return res.status(201).json({
      success: true,
      message: "Timetable saved and optimized plan generated successfully",
      data: {
        timetable,
        conflicts,
        hasConflicts: conflicts.length > 0,
        googleCalendarSync
      }
    });
  } catch (error) {
    console.error("Create timetable error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save timetable",
      error: error.message
    });
  }
};

/**
 * Get User Timetable
 * GET /api/timetable/:userId
 *
 * Returns the latest timetable for the user.
 */
export const getUserTimetable = async (req, res) => {
  try {
    const { userId } = req.params;

    // Only allow users to access their own timetable (or admins)
    if (req.user.role !== "admin" && String(req.user._id) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this timetable"
      });
    }

    const timetable = await Timetable.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "No timetable found for this user"
      });
    }

    return res.status(200).json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error("Get timetable error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch timetable",
      error: error.message
    });
  }
};

/**
 * Delete all timetable documents for the current user (full reset).
 * DELETE /api/timetable
 */
export const deleteUserTimetables = async (req, res) => {
  try {
    let googleCleanup = {
      removedFromGoogle: 0,
      attempted: 0,
      hadConnection: false
    };
    try {
      googleCleanup = await clearSccSyncedGoogleEventsOnly(req.user._id);
    } catch (gErr) {
      console.error("[delete timetable] Google cleanup error:", gErr?.message || gErr);
    }

    const raw = req.user._id;
    const idStr = raw?.toString?.() ?? String(raw);

    // Match `user` whether Mongo stored ObjectId or string (legacy / cast quirks).
    const or = [{ user: raw }, { user: idStr }];
    if (mongoose.Types.ObjectId.isValid(idStr)) {
      try {
        const asOid = new mongoose.Types.ObjectId(idStr);
        or.push({ user: asOid });
      } catch {
        /* ignore */
      }
    }

    // Also match when BSON type differs but string form is the same (some drivers / imports).
    or.push({
      $expr: {
        $eq: [{ $toString: { $ifNull: ["$user", ""] } }, idStr]
      }
    });

    let result = await Timetable.deleteMany({ $or: or });

    // Last resort: native collection (bypasses any Mongoose query transforms).
    if (result.deletedCount === 0) {
      result = await Timetable.collection.deleteMany({
        $or: [
          { user: raw },
          { user: idStr },
          ...(mongoose.Types.ObjectId.isValid(idStr)
            ? [{ user: new mongoose.Types.ObjectId(idStr) }]
            : []),
          { $expr: { $eq: [{ $toString: { $ifNull: ["$user", ""] } }, idStr] } }
        ]
      });
    }

    const total = typeof result.deletedCount === "number" ? result.deletedCount : 0;

    console.log("[delete timetable]", {
      userId: idStr,
      deletedCount: total
    });

    const gMsg =
      googleCleanup.attempted > 0
        ? ` Removed ${googleCleanup.removedFromGoogle}/${googleCleanup.attempted} synced Google Calendar event(s) created by SCC.`
        : "";

    return res.status(200).json({
      success: true,
      message:
        (total > 0
          ? "Timetable deleted successfully."
          : "No timetable was saved for your account.") + gMsg,
      data: {
        deletedCount: total,
        googleEventsRemoved: googleCleanup.removedFromGoogle,
        googleEventsRemovalAttempted: googleCleanup.attempted
      }
    });
  } catch (error) {
    console.error("Delete timetable error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete timetable",
      error: error.message
    });
  }
};

/**
 * Clear only the AI / rule-based optimized schedule; keep university timetable rows.
 * POST /api/timetable/clear-optimized
 */
export const clearOptimizedScheduleOnly = async (req, res) => {
  try {
    let googleCleanup = {
      removedFromGoogle: 0,
      attempted: 0,
      hadConnection: false
    };
    try {
      googleCleanup = await clearSccSyncedGoogleEventsOnly(req.user._id);
    } catch (gErr) {
      console.error("[clear-optimized] Google cleanup error:", gErr?.message || gErr);
    }

    const timetable = await Timetable.findOneAndUpdate(
      { user: req.user._id },
      { $set: { optimizedSchedule: [] } },
      { sort: { createdAt: -1 }, new: true }
    );

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "No timetable found for this user"
      });
    }

    const gHint =
      googleCleanup.attempted > 0
        ? ` Also removed ${googleCleanup.removedFromGoogle}/${googleCleanup.attempted} SCC-synced event(s) from Google Calendar.`
        : "";

    return res.status(200).json({
      success: true,
      message:
        "AI / optimized plan removed. Your university timetable (the table you edit) is unchanged." +
        gHint,
      data: {
        timetable,
        googleEventsRemoved: googleCleanup.removedFromGoogle,
        googleEventsRemovalAttempted: googleCleanup.attempted
      }
    });
  } catch (error) {
    console.error("Clear optimized schedule error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear optimized schedule",
      error: error.message
    });
  }
};

/**
 * Generate Optimized Timetable (Rule-based)
 * POST /api/timetable/generate
 *
 * Body:
 * {
 *   difficultyLevels: { [subjectCode]: "easy" | "medium" | "hard" },
 *   preferredStudyHours: { startHour: number, endHour: number }
 * }
 */
export const generateOptimizedTimetable = async (req, res) => {
  try {
    const { difficultyLevels, preferredStudyHours } = req.body || {};

    // Get latest timetable for the current user
    const timetable = await Timetable.findOne({ user: req.user._id })
      .sort({ createdAt: -1 });

    if (!timetable || !Array.isArray(timetable.universitySchedule) || timetable.universitySchedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No base university timetable found for this user"
      });
    }

    const optimizedSchedule = generateOptimizedSchedule(
      timetable.universitySchedule,
      { difficultyLevels, preferredStudyHours }
    );

    timetable.optimizedSchedule = optimizedSchedule;
    await timetable.save();

    const conflicts = findScheduleConflicts(optimizedSchedule);

    const googleCalendarSync = await tryAutoSyncGoogleCalendar(
      req.user._id,
      optimizedSchedule
    );

    return res.status(200).json({
      success: true,
      message: "Optimized timetable generated successfully",
      data: {
        timetable,
        conflicts,
        hasConflicts: conflicts.length > 0,
        googleCalendarSync
      }
    });
  } catch (error) {
    console.error("Generate optimized timetable error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate optimized timetable",
      error: error.message
    });
  }
};

/**
 * Dashboard Ongoing Event
 * GET /api/timetable/ongoing
 *
 * Returns the current active event from the optimized schedule (or fallback to university schedule).
 */
export const getOngoingEvent = async (req, res) => {
  try {
    const now = new Date();

    const timetable = await Timetable.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "No timetable found for this user"
      });
    }

    const sourceSchedule = (timetable.optimizedSchedule && timetable.optimizedSchedule.length > 0)
      ? timetable.optimizedSchedule
      : timetable.universitySchedule;

    const currentEvent = sourceSchedule.find((event) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      return start <= now && now <= end;
    });

    return res.status(200).json({
      success: true,
      data: currentEvent || null
    });
  } catch (error) {
    console.error("Get ongoing event error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ongoing event",
      error: error.message
    });
  }
};

// `calendar.events` allows create/update/delete for events we created (needed for sync + cleanup).
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

const parseGoogleState = (state) => {
  if (!state) {
    return { mode: "timetable", returnPath: "/timetable" };
  }

  try {
    const decoded = JSON.parse(Buffer.from(String(state), "base64url").toString("utf8"));
    if (decoded && typeof decoded === "object") {
      return decoded;
    }
  } catch {
    // Legacy timetable flow used a raw userId string.
  }

  return { mode: "timetable", userId: String(state), returnPath: "/timetable" };
};

const resolveClientReturnPath = (value) => {
  const fallback = "/timetable";
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  return trimmed;
};

/**
 * Get Google OAuth URL for Calendar (uses GOOGLE_CLIENT_ID from .env)
 * GET /api/timetable/google-auth-url
 */
export const getGoogleAuthUrl = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: "GOOGLE_CLIENT_ID is not configured"
      });
    }

    // Google requires the `redirect_uri` to match EXACTLY one of the
    // Authorized redirect URIs configured in Google Cloud Console.
    //
    // Use a dedicated env override so we can match whatever URI you registered
    // (localhost vs 127.0.0.1, http vs https, custom port, etc).
    const returnPath = resolveClientReturnPath(req.query?.returnPath);
    const redirectUri = getGoogleAuthRedirectUri(req);

    // Helpful for debugging OAuth flow mismatch.
    console.log("[Google OAuth Callback] redirectUri =", redirectUri);

    console.log("[Google OAuth] redirectUri =", redirectUri);
    const state = Buffer.from(
      JSON.stringify({
        mode: "timetable",
        userId: String(req.user._id),
        returnPath
      }),
      "utf8"
    ).toString("base64url");
    const url = `${GOOGLE_AUTH_URL}?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GOOGLE_CALENDAR_SCOPE,
      state,
      access_type: "offline",
      prompt: "consent"
    })}`;

    return res.status(200).json({
      success: true,
      data: { url, redirectUri }
    });
  } catch (error) {
    console.error("Google auth URL error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to build Google auth URL",
      error: error.message
    });
  }
};

/**
 * Google connection status for current user
 * GET /api/timetable/google-status
 */
export const getGoogleStatus = async (req, res) => {
  try {
    const sync = await CalendarSync.findOne({ user: req.user._id })
      .select("+googleRefreshToken lastSyncedAt")
      .lean();

    console.log("[Google status]", {
      user: String(req.user._id),
      found: Boolean(sync),
      hasRefreshToken: Boolean(sync?.googleRefreshToken),
      lastSyncedAt: sync?.lastSyncedAt ? String(sync.lastSyncedAt) : null
    });

    return res.status(200).json({
      success: true,
      data: {
        connected: Boolean(sync?.googleRefreshToken),
        lastSyncedAt: sync?.lastSyncedAt || null
      }
    });
  } catch (error) {
    console.error("Google status error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Google Calendar connection status",
      error: error.message
    });
  }
};

/**
 * Get upcoming Google Calendar events (read-only).
 * Requires the user to have connected Google (refresh token stored).
 * GET /api/timetable/google-events
 */
export const getGoogleEvents = async (req, res) => {
  try {
    const sync = await CalendarSync.findOne({ user: req.user._id })
      .select("+googleRefreshToken")
      .lean();

    if (!sync?.googleRefreshToken) {
      return res.status(400).json({
        success: false,
        message: "Google Calendar is not connected"
      });
    }

    const accessToken = await getAccessTokenFromRefreshToken(sync.googleRefreshToken);
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Unable to access Google Calendar. Reconnect your Google account."
      });
    }

    // SCC timetables often use class dates in the past or a fixed “study week”; listing only
    // events with start >= now hides them. Use a wide window around “today”.
    const nowMs = Date.now();
    const pastDays = Math.min(366, Math.max(1, Number(req.query?.pastDays || 180)));
    const futureDays = Math.min(366, Math.max(1, Number(req.query?.futureDays || 180)));
    const timeMin = new Date(nowMs - pastDays * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(nowMs + futureDays * 24 * 60 * 60 * 1000).toISOString();
    const maxResults = Math.min(250, Number(req.query?.maxResults || 40));

    const eventsRes = await axios.get(GOOGLE_CALENDAR_EVENTS_URL, {
      params: {
        timeMin,
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: "startTime"
      },
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const items = Array.isArray(eventsRes.data?.items) ? eventsRes.data.items : [];
    const events = items.map((e) => ({
      id: e.id,
      summary: e.summary || "(No title)",
      start: e.start?.dateTime || e.start?.date || null,
      end: e.end?.dateTime || e.end?.date || null,
      location: e.location || "",
      htmlLink: e.htmlLink || ""
    }));

    return res.status(200).json({
      success: true,
      data: { events }
    });
  } catch (error) {
    console.error("Google events error:", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Google Calendar events",
      error: error?.response?.data || error.message
    });
  }
};

/**
 * Google OAuth callback (no auth – called by Google with ?code= & state=userId)
 * GET /api/timetable/google-callback
 * Uses GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from .env.
 */
export const googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const clientUrl = getClientAppUrl();
    const authCallbackUrl = `${clientUrl}/auth/google/callback`;
    const parsedState = parseGoogleState(state);
    const isAuthFlow = parsedState.mode === "login" || parsedState.mode === "register";
    const returnPath = resolveClientReturnPath(parsedState.returnPath);
    const returnUrl = `${clientUrl}${returnPath}`;

    console.log(
      "[Google callback] received:",
      JSON.stringify({ hasCode: Boolean(code), code: code ? String(code).slice(0, 6) + "..." : null, state })
    );

    if (!code || !state) {
      return res.redirect(
        isAuthFlow
          ? `${authCallbackUrl}#google_error=missing_code_or_state`
          : `${returnUrl}?google_error=missing_code_or_state`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.redirect(
        isAuthFlow
          ? `${authCallbackUrl}#google_error=server_not_configured`
          : `${returnUrl}?google_error=server_not_configured`
      );
    }

    const redirectUri = getGoogleAuthRedirectUri(req);
    const tokenRes = await axios.post(
      GOOGLE_TOKEN_URL,
      new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    console.log(
      "[Google callback] tokenRes status =",
      tokenRes?.status,
      "refresh_token present =",
      Boolean(tokenRes?.data?.refresh_token),
      "refresh_token length =",
      tokenRes?.data?.refresh_token?.length
    );

    const accessToken = tokenRes.data?.access_token;
    const refreshToken = tokenRes.data?.refresh_token;

    if (!accessToken) {
      return res.redirect(
        isAuthFlow
          ? `${authCallbackUrl}#google_error=no_token`
          : `${returnUrl}?google_error=no_token`
      );
    }

    const profileRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const profile = profileRes.data;

    if (isAuthFlow) {
      try {
        const session = await upsertGoogleUserSession({ profile, mode: parsedState.mode });
        const payload = new URLSearchParams({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          user: JSON.stringify(session.userResponse),
          mode: session.mode,
          googleNewUser: session.isNewUser ? "1" : "0"
        });

        return res.redirect(`${authCallbackUrl}#${payload.toString()}`);
      } catch (authError) {
        console.error("Google auth session error:", authError.message);
        return res.redirect(`${authCallbackUrl}#google_error=auth_session_failed`);
      }
    }

    // Google may not return refresh_token after the first consent.
    // If it's missing, keep the existing stored value (if any).
    const update = { lastSyncedAt: new Date() };
    if (refreshToken) update.googleRefreshToken = refreshToken;

    await CalendarSync.findOneAndUpdate({ user: parsedState.userId || String(state) }, update, { upsert: true, new: true });

    return res.redirect(`${returnUrl}?google_connected=1`);
  } catch (error) {
    console.error("Google callback error:", error?.response?.data || error.message);
    const clientUrl = getClientAppUrl();
    const parsedState = parseGoogleState(req.query?.state);
    const isAuthFlow = parsedState.mode === "login" || parsedState.mode === "register";
    const returnPath = resolveClientReturnPath(parsedState.returnPath);
    return res.redirect(
      isAuthFlow
        ? `${clientUrl}/auth/google/callback#google_error=exchange_failed`
        : `${clientUrl}${returnPath}?google_error=exchange_failed`
    );
  }
};

/**
 * Get a new access token from stored refresh token (uses GOOGLE_CLIENT_* from .env)
 */
async function getAccessTokenFromRefreshToken(refreshToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const res = await axios.post(
    GOOGLE_TOKEN_URL,
    new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return res.data?.access_token ?? null;
}

/**
 * Match CalendarSync.user the same way as Timetable.user (ObjectId vs string / legacy).
 */
function buildCalendarSyncUserMatch(userId) {
  const raw = userId;
  const idStr = raw?.toString?.() ?? String(raw);
  const or = [{ user: raw }, { user: idStr }];
  if (mongoose.Types.ObjectId.isValid(idStr)) {
    try {
      or.push({ user: new mongoose.Types.ObjectId(idStr) });
    } catch {
      /* ignore */
    }
  }
  or.push({
    $expr: { $eq: [{ $toString: { $ifNull: ["$user", ""] } }, idStr] }
  });
  return { $or: or };
}

function eventHasSccTimetableTag(e) {
  const priv = e?.extendedProperties?.private;
  return priv?.sccTimetableSync === "1" || priv?.sccTimetableSync === 1;
}

/**
 * Paginate primary calendar and collect IDs of events SCC created (private sccTimetableSync).
 * Client-side filter is reliable; the events.list privateExtendedProperty query often misses events
 * depending on encoding/API behavior, leaving orphans after timetable delete.
 */
async function listAllSccTaggedGoogleEventIds(accessToken) {
  if (!accessToken) return [];
  const collected = [];
  let pageToken = null;
  const nowMs = Date.now();
  // Wide window so semester blocks from past/future years are still discoverable
  const timeMin = new Date(nowMs - 2500 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(nowMs + 2500 * 24 * 60 * 60 * 1000).toISOString();
  let pages = 0;
  const maxPages = 100;

  try {
    do {
      if (++pages > maxPages) {
        console.warn("[listAllSccTaggedGoogleEventIds] stopped at maxPages", maxPages);
        break;
      }
      const res = await axios.get(GOOGLE_CALENDAR_EVENTS_URL, {
        params: {
          timeMin,
          timeMax,
          maxResults: 250,
          singleEvents: true,
          orderBy: "startTime",
          ...(pageToken ? { pageToken } : {})
        },
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      for (const e of res.data?.items || []) {
        if (e?.id && eventHasSccTimetableTag(e)) collected.push(e.id);
      }
      pageToken = res.data?.nextPageToken || null;
    } while (pageToken);
  } catch (err) {
    console.error(
      "[listAllSccTaggedGoogleEventIds]",
      err?.response?.data || err.message
    );
  }
  return collected;
}

/**
 * Delete Google Calendar events by ID (best-effort; 404 ignored).
 */
async function deleteGoogleCalendarEventsById(accessToken, eventIds) {
  if (!accessToken || !Array.isArray(eventIds) || eventIds.length === 0) {
    return { removed: 0, attempted: 0 };
  }
  const ok = (s) =>
    (s >= 200 && s < 300) || s === 404 || s === 410;
  // Serial deletes reduce Google rate-limit failures vs a huge parallel burst.
  let removed = 0;
  for (const id of eventIds) {
    try {
      const res = await axios.delete(
        `${GOOGLE_CALENDAR_EVENTS_URL}/${encodeURIComponent(id)}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          validateStatus: ok
        }
      );
      if (ok(res.status)) removed += 1;
      else {
        console.error(
          "[deleteGoogleCalendarEventsById] non-OK status",
          id,
          res.status,
          res.data
        );
      }
    } catch (err) {
      console.error(
        "[deleteGoogleCalendarEventsById] failed for event",
        id,
        err?.response?.data || err.message
      );
    }
  }
  return { removed, attempted: eventIds.length };
}

/**
 * Remove previously synced SCC events from Google and clear stored IDs.
 * Uses DB event IDs plus a Calendar API scan for sccTimetableSync=1 (covers missing/stale ID lists).
 */
async function clearSccSyncedGoogleEventsOnly(userId) {
  const sync = await CalendarSync.findOne(buildCalendarSyncUserMatch(userId))
    .select("+googleRefreshToken syncedGoogleEventIds")
    .lean();

  const prevIds = Array.isArray(sync?.syncedGoogleEventIds)
    ? sync.syncedGoogleEventIds.filter(Boolean)
    : [];

  let accessToken = null;
  if (sync?.googleRefreshToken) {
    accessToken = await getAccessTokenFromRefreshToken(sync.googleRefreshToken);
  }

  const idSet = new Set(prevIds);
  if (accessToken) {
    const taggedIds = await listAllSccTaggedGoogleEventIds(accessToken);
    for (const id of taggedIds) idSet.add(id);
  }

  const allIds = [...idSet];

  let removedFromGoogle = 0;
  if (accessToken && allIds.length > 0) {
    const { removed } = await deleteGoogleCalendarEventsById(accessToken, allIds);
    removedFromGoogle = removed;
  }

  await CalendarSync.findOneAndUpdate(
    buildCalendarSyncUserMatch(userId),
    { $set: { syncedGoogleEventIds: [] } },
    { new: true }
  );

  return {
    removedFromGoogle,
    attempted: allIds.length,
    hadConnection: Boolean(accessToken),
    hadRefreshToken: Boolean(sync?.googleRefreshToken)
  };
}

/**
 * Replace Google events for this user: delete IDs we stored, insert new events from optimized schedule, save new IDs.
 */
async function replaceSccSyncedGoogleEvents(userId, accessToken, optimizedSchedule) {
  const sync = await CalendarSync.findOne({ user: userId })
    .select("+googleRefreshToken syncedGoogleEventIds")
    .lean();
  const prevIds = Array.isArray(sync?.syncedGoogleEventIds)
    ? sync.syncedGoogleEventIds.filter(Boolean)
    : [];

  if (accessToken && prevIds.length > 0) {
    await deleteGoogleCalendarEventsById(accessToken, prevIds);
  }

  if (!accessToken || !Array.isArray(optimizedSchedule) || optimizedSchedule.length === 0) {
    await CalendarSync.findOneAndUpdate(
      { user: userId },
      { $set: { syncedGoogleEventIds: [], lastSyncedAt: new Date() } },
      { upsert: true, new: true }
    );
    return { created: 0, removedOld: prevIds.length, failureCount: 0 };
  }

  const requests = optimizedSchedule.map((event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const googleEvent = {
      summary: event.title,
      location: event.location || undefined,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      extendedProperties: {
        private: { sccTimetableSync: "1" }
      }
    };
    return axios.post(GOOGLE_CALENDAR_EVENTS_URL, googleEvent, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });
  });

  const settled = await Promise.allSettled(requests);
  const newIds = [];
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value?.data?.id) newIds.push(r.value.data.id);
  }

  await CalendarSync.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        syncedGoogleEventIds: newIds,
        lastSyncedAt: new Date()
      }
    },
    { upsert: true, new: true }
  );

  return {
    created: newIds.length,
    removedOld: prevIds.length,
    failureCount: settled.filter((r) => r.status === "rejected").length
  };
}

/**
 * After saving an optimized plan, push to Google when the user has connected Calendar (stored refresh token).
 * Does not throw — logs and returns a result for optional API responses.
 */
async function tryAutoSyncGoogleCalendar(userId, optimizedSchedule) {
  if (!Array.isArray(optimizedSchedule) || optimizedSchedule.length === 0) {
    return null;
  }
  try {
    const syncDoc = await CalendarSync.findOne({ user: userId })
      .select("+googleRefreshToken")
      .lean();
    if (!syncDoc?.googleRefreshToken) return null;
    const accessToken = await getAccessTokenFromRefreshToken(
      syncDoc.googleRefreshToken
    );
    if (!accessToken) return null;
    const stats = await replaceSccSyncedGoogleEvents(
      userId,
      accessToken,
      optimizedSchedule
    );
    return { ok: true, ...stats };
  } catch (err) {
    console.error(
      "[auto Google Calendar sync]",
      err?.response?.data || err.message
    );
    return {
      ok: false,
      error: err?.response?.data || err.message
    };
  }
}

/**
 * Google Calendar Sync
 * POST /api/timetable/sync-google
 *
 * Body:
 * {
 *   accessToken?: string,   // optional if user already connected via OAuth (uses .env Google keys)
 *   refreshToken?: string   // optional, stored for future syncs
 * }
 * If accessToken is omitted, uses stored refresh token (from Connect Google flow) and GOOGLE_CLIENT_* from .env.
 */
export const syncGoogleCalendar = async (req, res) => {
  try {
    let accessToken = req.body?.accessToken;
    const refreshToken = req.body?.refreshToken;

    if (!accessToken) {
      const sync = await CalendarSync.findOne({ user: req.user._id }).select("+googleRefreshToken").lean();
      if (sync?.googleRefreshToken) {
        accessToken = await getAccessTokenFromRefreshToken(sync.googleRefreshToken);
      }
    }

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "No Google access token. Connect Google Calendar first (Connect Google button) or send accessToken."
      });
    }

    const timetable = await Timetable.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    if (!timetable || !Array.isArray(timetable.optimizedSchedule) || timetable.optimizedSchedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No optimized timetable available to sync"
      });
    }

    const schedule = timetable.optimizedSchedule;
    const syncStats = await replaceSccSyncedGoogleEvents(req.user._id, accessToken, schedule);

    const update = { lastSyncedAt: new Date() };
    if (refreshToken) update.googleRefreshToken = refreshToken;

    await CalendarSync.findOneAndUpdate(
      { user: req.user._id },
      update,
      { upsert: true, new: true }
    );

    if (typeof req.user.googleCalendarConnected !== "undefined") {
      req.user.googleCalendarConnected = true;
      await req.user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Timetable synced to Google Calendar (best-effort).",
      data: {
        eventsCreated: syncStats.created,
        previousEventsRemoved: syncStats.removedOld,
        failureCount: syncStats.failureCount
      }
    });
  } catch (error) {
    console.error("Google Calendar sync error:", error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to sync with Google Calendar",
      error: error?.response?.data || error.message
    });
  }
};

function normalizePersonalCommitmentsInput(input) {
  let list = input;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((c) => ({
      title: typeof c?.title === "string" ? c.title.trim() : "",
      dayOfWeek: c?.dayOfWeek,
      startHour: Number(c?.startHour),
      endHour: Number(c?.endHour)
    }))
    .filter(
      (c) =>
        c.title.length > 0 &&
        Number.isFinite(c.startHour) &&
        Number.isFinite(c.endHour) &&
        c.endHour > c.startHour
    );
}

function derivePlannerRulesFromMessage(message = "") {
  const text = String(message || "").toLowerCase();
  const out = {
    restDays: [],
    balanceRules: {}
  };

  if (/\bsunday\b/.test(text) && /\b(rest|off|break)\b/.test(text)) {
    out.restDays.push("Sun");
  }

  // Examples: "2 hours", "2hr", "2 h"
  const hoursMatch = text.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|hr|h)\b/);
  if (hoursMatch) {
    const h = Number(hoursMatch[1]);
    if (Number.isFinite(h) && h > 0) {
      const mins = Math.round(h * 60);
      out.balanceRules.sessionDurationMinutes = mins;
      // Usually means one focused block/day unless user asks otherwise.
      if (!("maxStudySessionsPerDay" in out.balanceRules)) {
        out.balanceRules.maxStudySessionsPerDay = 1;
      }
      if (!("maxStudyMinutesPerDay" in out.balanceRules)) {
        out.balanceRules.maxStudyMinutesPerDay = mins;
      }
    }
  }

  return out;
}

/**
 * AI Timetable Chat
 * POST /api/timetable/ai-chat
 *
 * Body:
 * {
 *   message: string,              // natural language description of classes/tasks
 *   googleAccessToken?: string    // optional, to immediately sync to Google Calendar
 * }
 *
 * Flow:
 * - Uses OpenAI to turn the message into structured events + preferences.
 * - Saves a new raw timetable for the user.
 * - Runs the rule-based optimizer.
 * - Optionally syncs the optimized schedule to Google Calendar.
 */
export const aiTimetableChat = async (req, res) => {
  try {
    const {
      message,
      googleAccessToken,
      universitySchedule: providedUniversitySchedule,
      personalCommitments: providedPersonalCommitmentsRaw
    } = req.body || {};
    const providedPersonalCommitments = normalizePersonalCommitmentsInput(
      providedPersonalCommitmentsRaw
    );

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "message is required and must be a string"
      });
    }

    try {
      assertOpenAIConfigured();
    } catch (e) {
      return res.status(e.status || 500).json({
        success: false,
        message: e.message || "OpenAI is not configured"
      });
    }

    // NEW FLOW:
    // If the frontend already provided the user's semester timetable (structured events),
    // we don't ask the AI to re-extract events. Instead, the AI only chooses:
    // - difficultyLevels (easy/medium/hard) per subject key
    // - preferredStudyHours window (startHour/endHour)
    if (Array.isArray(providedUniversitySchedule) && providedUniversitySchedule.length > 0) {
      const normalizedSchedule = providedUniversitySchedule
        .filter((e) => e && e.title && e.start && e.end)
        .map((e) => ({
          title: e.title,
          subjectCode: e.subjectCode || "",
          type: e.type || "lecture",
          start: new Date(e.start),
          end: new Date(e.end),
          location: e.location || ""
        }));

      if (normalizedSchedule.length === 0) {
        return res.status(400).json({
          success: false,
          message: "universitySchedule was provided but no valid events were found (need title, start, end)."
        });
      }

      // Ask AI to infer studying preferences only.
      const subjectKeys = Array.from(
        new Set(
          normalizedSchedule
            .map((e) => e.subjectCode || e.title)
            .filter((k) => typeof k === "string" && k.trim().length > 0)
        )
      );

      const systemPrompt = `You are an assistant that helps students improve their study plan.
You will receive:
1) The student's request/prompt
2) Their semester timetable events (JSON) for context

Return ONLY valid JSON (no markdown, no explanation) with this shape:
{
  "difficultyLevels": {
    "[subjectKey]": "easy | medium | hard"
  },
  "subjectPriorities": {
    "[subjectKey]": "low | medium | high"
  },
  "preferredStudyHours": {
    "startHour": number,   // 0-23
    "endHour": number      // 0-23
  },
  "personalCommitments": [
    {
      "title": "string",
      "dayOfWeek": "Mon | Tue | Wed | Thu | Fri | Sat | Sun",
      "startHour": number, // 0-23.99
      "endHour": number    // 0-23.99 and > startHour
    }
  ],
  "balanceRules": {
    "maxStudySessionsPerDay": number, // 1-6 (default 2)
    "maxStudyMinutesPerDay": number   // 30-360 (default 180)
  }
}

Rules:
- Use the subject keys from the provided timetable (subjectCode if available, otherwise title).
- preferredStudyHours must be numbers between 0 and 23.
- Infer subjectPriorities from the student's wording (e.g. "focus on math" => math high).
- If student mentions personal plans like gym/job/travel/club, return them in personalCommitments.
- Keep personalCommitments empty [] when not provided.
- If the student doesn't specify a preference, pick a reasonable window (default: 18-21).`;

      const data = await createChatCompletion({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Student prompt:\n${message}\n\nSubject keys:\n${JSON.stringify(subjectKeys)}\n\nUser-provided fixed commitments (must be respected):\n${JSON.stringify(
              providedPersonalCommitments
            )}\n\nSemester timetable events:\n${JSON.stringify(
              normalizedSchedule.map((e) => ({
                title: e.title,
                subjectCode: e.subjectCode,
                type: e.type,
                start: e.start.toISOString(),
                end: e.end.toISOString(),
                location: e.location
              }))
            )}`
          }
        ],
        temperature: 0.2
      });

      const rawContent = getChatCompletionText(data);
      if (!rawContent) {
        return res.status(500).json({
          success: false,
          message: "AI did not return a usable response"
        });
      }

      let parsed;
      try {
        parsed = JSON.parse(rawContent);
      } catch (e) {
        // Sometimes the model may wrap JSON in text; try best-effort extraction
        try {
          const first = rawContent.indexOf("{");
          const last = rawContent.lastIndexOf("}");
          if (first !== -1 && last !== -1 && last > first) {
            parsed = JSON.parse(rawContent.slice(first, last + 1));
          } else {
            throw e;
          }
        } catch (e2) {
          return res.status(500).json({
            success: false,
            message: "Failed to parse AI response as JSON",
            error: e2.message
          });
        }
      }

      const derived = derivePlannerRulesFromMessage(message);
      const difficultyLevels = parsed?.difficultyLevels || {};
      const subjectPriorities = parsed?.subjectPriorities || {};
      const preferredStudyHours = parsed?.preferredStudyHours || { startHour: 18, endHour: 21 };
      const personalCommitments = Array.isArray(parsed?.personalCommitments)
        ? parsed.personalCommitments
        : [];
      const mergedPersonalCommitments = [
        ...providedPersonalCommitments,
        ...personalCommitments
      ];
      const balanceRules =
        parsed?.balanceRules && typeof parsed.balanceRules === "object"
          ? parsed.balanceRules
          : {};
      const mergedBalanceRules = { ...balanceRules, ...derived.balanceRules };
      const mergedRestDays = [
        ...(Array.isArray(parsed?.restDays) ? parsed.restDays : []),
        ...derived.restDays
      ];

      const optimizedSchedule = generateOptimizedSchedule(normalizedSchedule, {
        difficultyLevels,
        preferredStudyHours,
        subjectPriorities,
        personalCommitments: mergedPersonalCommitments,
        balanceRules: mergedBalanceRules,
        restDays: mergedRestDays
      });
      
      // Update the latest timetable document for this user.
      const timetable = await Timetable.findOneAndUpdate(
        { user: req.user._id },
        {
          $set: {
            universitySchedule: normalizedSchedule,
            optimizedSchedule
          }
        },
        { sort: { createdAt: -1 }, new: true, upsert: true }
      );

      const conflicts = findScheduleConflicts(optimizedSchedule);

      let calendarSyncResult = null;
      if (googleAccessToken) {
        try {
          const stats = await replaceSccSyncedGoogleEvents(
            req.user._id,
            googleAccessToken,
            optimizedSchedule
          );
          calendarSyncResult = {
            attempted: true,
            successCount: stats.created,
            failureCount: stats.failureCount,
            removedPreviousFromGoogle: stats.removedOld
          };
        } catch (calendarError) {
          console.error("AI chat calendar sync error:", calendarError?.response?.data || calendarError.message);
          calendarSyncResult = {
            attempted: true,
            error: calendarError?.response?.data || calendarError.message
          };
        }
      } else {
        const auto = await tryAutoSyncGoogleCalendar(
          req.user._id,
          optimizedSchedule
        );
        if (auto?.ok) {
          calendarSyncResult = {
            attempted: true,
            successCount: auto.created,
            failureCount: auto.failureCount,
            removedPreviousFromGoogle: auto.removedOld,
            viaStoredGoogle: true
          };
        } else if (auto && auto.ok === false) {
          calendarSyncResult = {
            attempted: true,
            error: auto.error
          };
        }
      }

      const syncedToGoogle =
        Boolean(googleAccessToken) ||
        Boolean(calendarSyncResult?.viaStoredGoogle);

      return res.status(200).json({
        success: true,
        message: syncedToGoogle
          ? "AI-generated timetable created, optimized, and sent to Google Calendar (best-effort)."
          : "AI-generated timetable created and optimized.",
        data: {
          timetable,
          conflicts,
          hasConflicts: conflicts.length > 0,
          difficultyLevels,
          subjectPriorities,
          preferredStudyHours,
          personalCommitments: mergedPersonalCommitments,
          balanceRules: mergedBalanceRules,
          restDays: mergedRestDays,
          calendarSyncResult
        }
      });
    }

    // Ask OpenAI to extract a normalized timetable structure
    const systemPrompt = `You are an assistant that turns a student's free-text description of their classes,
deadlines, and study preferences into a structured timetable.

Return ONLY valid JSON (no markdown, no explanation) with this shape:
{
  "universitySchedule": [
    {
      "title": "string",
      "subjectCode": "string | null",
      "type": "lecture | lab | tutorial | exam | study | other",
      "start": "ISO 8601 datetime",
      "end": "ISO 8601 datetime",
      "location": "string | null"
    }
  ],
  "difficultyLevels": {
    "[subjectCode or title]": "easy | medium | hard"
  },
  "subjectPriorities": {
    "[subjectCode or title]": "low | medium | high"
  },
  "preferredStudyHours": {
    "startHour": number,   // 0-23
    "endHour": number      // 0-23
  },
  "personalCommitments": [
    {
      "title": "string",
      "dayOfWeek": "Mon | Tue | Wed | Thu | Fri | Sat | Sun",
      "startHour": number, // 0-23.99
      "endHour": number    // 0-23.99 and > startHour
    }
  ],
  "balanceRules": {
    "maxStudySessionsPerDay": number, // 1-6 (default 2)
    "maxStudyMinutesPerDay": number   // 30-360 (default 180)
  }
}`;

    const data = await createChatCompletion({
      // Allow switching models/providers via env (useful for OpenRouter).
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.2
    });

    const rawContent = getChatCompletionText(data);
    if (!rawContent) {
      return res.status(500).json({
        success: false,
        message: "OpenAI did not return a usable response"
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      // Sometimes the model may wrap JSON in text; try best-effort extraction
      try {
        const first = rawContent.indexOf("{");
        const last = rawContent.lastIndexOf("}");
        if (first !== -1 && last !== -1 && last > first) {
          parsed = JSON.parse(rawContent.slice(first, last + 1));
        } else {
          throw e;
        }
      } catch (e2) {
        return res.status(500).json({
          success: false,
          message: "Failed to parse AI response as JSON",
          error: e2.message
        });
      }
    }

    const universitySchedule = Array.isArray(parsed.universitySchedule)
      ? parsed.universitySchedule
      : [];

    if (universitySchedule.length === 0) {
      return res.status(400).json({
        success: false,
        message: "AI could not extract any timetable events from your message"
      });
    }

    // Basic normalization / safety
    const normalizedSchedule = universitySchedule
      .filter((e) => e.title && e.start && e.end)
      .map((e) => ({
        title: e.title,
        subjectCode: e.subjectCode || "",
        type: e.type || "lecture",
        start: new Date(e.start),
        end: new Date(e.end),
        location: e.location || ""
      }));

    const derived = derivePlannerRulesFromMessage(message);
    const difficultyLevels = parsed.difficultyLevels || {};
    const subjectPriorities = parsed.subjectPriorities || {};
    const preferredStudyHours = parsed.preferredStudyHours || {
      startHour: 18,
      endHour: 21
    };
    const personalCommitments = Array.isArray(parsed.personalCommitments)
      ? parsed.personalCommitments
      : [];
    const mergedPersonalCommitments = [
      ...providedPersonalCommitments,
      ...personalCommitments
    ];
    const balanceRules =
      parsed.balanceRules && typeof parsed.balanceRules === "object"
        ? parsed.balanceRules
        : {};
    const mergedBalanceRules = { ...balanceRules, ...derived.balanceRules };
    const mergedRestDays = [
      ...(Array.isArray(parsed.restDays) ? parsed.restDays : []),
      ...derived.restDays
    ];

      const optimizedSchedule = generateOptimizedSchedule(
        normalizedSchedule,
        {
          difficultyLevels,
          preferredStudyHours,
          subjectPriorities,
          personalCommitments: mergedPersonalCommitments,
          balanceRules: mergedBalanceRules,
          restDays: mergedRestDays
        }
      );

      // Update the latest timetable document for this user.
      const timetable = await Timetable.findOneAndUpdate(
        { user: req.user._id },
        {
          $set: {
            universitySchedule: normalizedSchedule,
            optimizedSchedule
          }
        },
        { sort: { createdAt: -1 }, new: true, upsert: true }
      );

    const conflicts = findScheduleConflicts(optimizedSchedule);

    // Optionally sync to Google Calendar in the same step
    let calendarSyncResult = null;
    if (googleAccessToken) {
      try {
        const stats = await replaceSccSyncedGoogleEvents(
          req.user._id,
          googleAccessToken,
          optimizedSchedule
        );
        calendarSyncResult = {
          attempted: true,
          successCount: stats.created,
          failureCount: stats.failureCount,
          removedPreviousFromGoogle: stats.removedOld
        };
      } catch (calendarError) {
        console.error("AI chat calendar sync error:", calendarError?.response?.data || calendarError.message);
        calendarSyncResult = {
          attempted: true,
          error: calendarError?.response?.data || calendarError.message
        };
      }
    } else {
      const auto = await tryAutoSyncGoogleCalendar(
        req.user._id,
        optimizedSchedule
      );
      if (auto?.ok) {
        calendarSyncResult = {
          attempted: true,
          successCount: auto.created,
          failureCount: auto.failureCount,
          removedPreviousFromGoogle: auto.removedOld,
          viaStoredGoogle: true
        };
      } else if (auto && auto.ok === false) {
        calendarSyncResult = {
          attempted: true,
          error: auto.error
        };
      }
    }

    const syncedToGoogle =
      Boolean(googleAccessToken) ||
      Boolean(calendarSyncResult?.viaStoredGoogle);

    return res.status(200).json({
      success: true,
      message: syncedToGoogle
        ? "AI-generated timetable created, optimized, and sent to Google Calendar (best-effort)."
        : "AI-generated timetable created and optimized.",
      data: {
        timetable,
        conflicts,
        hasConflicts: conflicts.length > 0,
        difficultyLevels,
        preferredStudyHours,
        subjectPriorities,
        personalCommitments: mergedPersonalCommitments,
        balanceRules: mergedBalanceRules,
        restDays: mergedRestDays,
        calendarSyncResult
      }
    });
  } catch (error) {
    console.error("AI timetable chat error:", error?.response?.data || error.message);

    // OpenAI-compatible providers return different error shapes.
    // Examples:
    // - OpenAI/Router: { error: { message, code, ... } }
    // - xAI: { code: "...", error: "Incorrect API key ..." }
    // - Groq: { error: { message, code, ... } } (varies)
    const payload = error?.response?.data;
    const openaiError = payload?.error ?? payload;
    const openaiCode = openaiError?.code ?? payload?.code;
    const openaiMessage =
      openaiError?.message ??
      (typeof openaiError === "string" ? openaiError : null) ??
      payload?.message ??
      payload?.error;

    if (openaiCode === "insufficient_quota") {
      return res.status(402).json({
        success: false,
        message:
          "OpenAI quota exceeded. Please check your OpenAI plan/billing and try again.",
        error: openaiError || error?.response?.data || error.message
      });
    }

    const status = error?.response?.status || 500;
    return res.status(status).json({
      success: false,
      message: openaiMessage || "Failed to process AI timetable request",
      error: openaiError || payload || error.message
    });
  }
};

/**
 * Import timetable from an uploaded image (weekly timetable screenshot).
 * POST /api/timetable/import-timetable
 *
 * Body (multipart/form-data):
 * - file: image/* or application/pdf
 * - prompt: string (optional) your request, e.g. "make a suitable working timetable and add study time"
 */
export const importTimetableFromFile = async (req, res) => {
  const uploaded = req.file;

  if (!uploaded) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded"
    });
  }

  try {
    const userPrompt =
      typeof req.body?.prompt === "string" && req.body.prompt.trim().length > 0
        ? req.body.prompt.trim()
        : "Make a suitable working timetable for me and add study time during my free hours.";

    let ocrText = "";
    if (uploaded.mimetype === "application/pdf") {
      // For PDFs, we try to extract selectable text first (fast + no rasterization needed).
      // If the PDF is scanned (no selectable text), extracted `text` can be empty.
      const pdfBuffer = await fs.readFile(uploaded.path);
      const parser = new PDFParse({ data: pdfBuffer });
      try {
        const result = await parser.getText({ first: 1, last: 3 });
        ocrText = (result?.text || "").trim();
      } finally {
        await parser.destroy().catch(() => {});
      }
    } else {
      // For images, run OCR using tesseract.js.
      const { data } = await Tesseract.recognize(uploaded.path, "eng");
      ocrText = (data?.text || "").trim();
    }

    if (!ocrText) {
      return res.status(400).json({
        success: false,
        message:
          "Could not extract text from the uploaded file. If your PDF is scanned (no selectable text), upload a clearer image/screenshot instead."
      });
    }

    // Remove uploaded file to avoid clutter.
    fs.unlink(uploaded.path).catch(() => {});

    // Feed OCR text into the existing AI generator by setting `req.body.message`.
    // The AI will parse universitySchedule + study preferences from the text.
    req.body.message = `${userPrompt}

This is a weekly timetable (it may list weekdays + times only, without specific dates).
When you output start/end as ISO 8601 datetimes, map each weekday to the NEXT occurrence in the upcoming week (Mon-Sun) using my local timezone.

Semester timetable text (OCR):
${ocrText}`;

    return aiTimetableChat(req, res);
  } catch (error) {
    console.error("Import OCR error:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Failed to import timetable from file",
      error: error?.message || String(error)
    });
  }
};


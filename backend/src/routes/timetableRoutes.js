import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  createRawTimetable,
  getUserTimetable,
  deleteUserTimetables,
  clearOptimizedScheduleOnly,
  generateOptimizedTimetable,
  getOngoingEvent,
  syncGoogleCalendar,
  aiTimetableChat,
  getGoogleAuthUrl,
  getGoogleStatus,
  getGoogleEvents,
  googleCallback
} from "../controllers/timetableController.js";
import {
  validateCreateTimetable,
  validateGenerateTimetable,
  validateGoogleSync
} from "../middlewares/timetableValidation.js";
import upload from "../middlewares/upload.js";
import { importTimetableFromFile } from "../controllers/timetableController.js";

const router = express.Router();

// Google OAuth callback (no auth – called by Google)
router.get("/timetable/google-callback", googleCallback);

// All other timetable routes require authentication
router.use(authenticate);

// ── Static paths first (before /timetable/:userId catches "ongoing", "me", etc.) ──
router.get("/timetable/google-auth-url", getGoogleAuthUrl);
router.get("/timetable/google-status", getGoogleStatus);
router.get("/timetable/google-events", getGoogleEvents);
router.get("/timetable/ongoing", getOngoingEvent);

router.post("/timetable", validateCreateTimetable, createRawTimetable);
router.post("/timetable/generate", validateGenerateTimetable, generateOptimizedTimetable);
router.post("/timetable/sync-google", validateGoogleSync, syncGoogleCalendar);
router.post("/timetable/ai-chat", aiTimetableChat);
router.post("/timetable/import-timetable", upload.single("file"), importTimetableFromFile);

// Delete all timetables for the logged-in user (explicit paths — reliable vs some proxies/clients)
router.delete("/timetable/me", deleteUserTimetables);
router.delete("/timetable", deleteUserTimetables);
// POST fallback (some networks block DELETE)
router.post("/timetable/clear-my-data", deleteUserTimetables);
// Remove only AI / optimized study blocks; keep editable university timetable
router.post("/timetable/clear-optimized", clearOptimizedScheduleOnly);

// Latest timetable for a user (param route last)
router.get("/timetable/:userId", getUserTimetable);

export default router;

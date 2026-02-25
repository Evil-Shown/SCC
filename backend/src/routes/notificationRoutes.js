import express from "express";
import {
    getNotifications,
    markAsRead,
    markAllAsRead
} from "../controllers/notificationController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// GET /api/notifications — Fetch user's notifications
router.get("/notifications", protect, getNotifications);

// PATCH /api/notifications/read-all — Mark all as read (must be before :id route)
router.patch("/notifications/read-all", protect, markAllAsRead);

// PATCH /api/notifications/:id/read — Mark single notification as read
router.patch("/notifications/:id/read", protect, markAsRead);

export default router;

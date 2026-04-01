import express from "express";
import {
  getAnalytics,
  getUsers,
  updateUser,
  deleteUser,
  getGroups,
  deleteGroup,
  getNotes,
  deleteNote,
  getKuppiPosts,
  deleteKuppiPost,
  getSystemHealth,
} from "../controllers/adminController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(authenticate, authorize("admin"));

// Analytics
router.get("/analytics", getAnalytics);

// System Health
router.get("/system-health", getSystemHealth);

// Users CRUD
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Groups
router.get("/groups", getGroups);
router.delete("/groups/:id", deleteGroup);

// Notes
router.get("/notes", getNotes);
router.delete("/notes/:id", deleteNote);

// Kuppi Posts
router.get("/kuppi", getKuppiPosts);
router.delete("/kuppi/:id", deleteKuppiPost);

export default router;

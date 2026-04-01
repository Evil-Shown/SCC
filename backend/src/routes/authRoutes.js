import express from "express";
import {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
  updateProfile,
  deleteAccount
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";
import { validateRegister, validateLogin } from "../middlewares/validation.js";

const router = express.Router();

// Public routes
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh", refreshAccessToken);

// Protected routes (require authentication)
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.put("/profile", authenticate, updateProfile);
router.delete("/account", authenticate, deleteAccount);

export default router;

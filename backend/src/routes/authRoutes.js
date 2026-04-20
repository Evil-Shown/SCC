import express from "express";
import {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
  updateProfile,
  deleteAccount,
  startGoogleAuth,
  handleGoogleAuthCallback
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";
import { validateRegister, validateLogin } from "../middlewares/validation.js";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *     AuthTokens:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         refreshToken:
 *           type: string
 *     UserProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *     RegisterRequest:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *     RefreshRequest:
 *       type: object
 *       properties:
 *         refreshToken:
 *           type: string
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         avatar:
 *           type: string
 *           description: URL or identifier for avatar
 *
 * /api/auth/google/start:
 *   get:
 *     tags: [Auth]
 *     summary: Start Google OAuth login
 *     responses:
 *       302:
 *         description: Redirects user to Google OAuth consent page
 *
 * /api/auth/google/callback:
 *   get:
 *     tags: [Auth]
 *     summary: Handle Google OAuth callback
 *     responses:
 *       200:
 *         description: Google login completed
 *       400:
 *         description: Invalid callback payload
 *
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation failed
 *
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user and return tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Refresh token missing or invalid
 *
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 *
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 *
 * /api/auth/profile:
 *   put:
 *     tags: [Auth]
 *     summary: Update current authenticated user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *
 * /api/auth/account:
 *   delete:
 *     tags: [Auth]
 *     summary: Delete current authenticated user account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *       401:
 *         description: Unauthorized
 */

// Public routes
router.get("/google/start", startGoogleAuth);
router.get("/google/callback", handleGoogleAuthCallback);
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh", refreshAccessToken);

// Protected routes (require authentication)
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);
router.put("/profile", authenticate, updateProfile);
router.delete("/account", authenticate, deleteAccount);

export default router;

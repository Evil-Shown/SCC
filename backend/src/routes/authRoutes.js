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
 *         faculty:
 *           type: string
 *         department:
 *           type: string
 *         year:
 *           type: integer
 *         phone:
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
 *         role:
 *           type: string
 *           enum: [student, teacher, admin]
 *           default: student
 *         faculty:
 *           type: string
 *         department:
 *           type: string
 *         studentId:
 *           type: string
 *         year:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *         phone:
 *           type: string
 *           pattern: '^0\\d{9}$'
 *         bio:
 *           type: string
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
 *         department:
 *           type: string
 *         faculty:
 *           type: string
 *         year:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *         phone:
 *           type: string
 *         bio:
 *           type: string
 *         profilePicture:
 *           type: string
 *           description: URL for profile picture
 *         location:
 *           type: string
 *         website:
 *           type: string
 *           format: uri
 *         github:
 *           type: string
 *         twitter:
 *           type: string
 *         linkedin:
 *           type: string
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
 *       302:
 *         description: Redirects to frontend callback URL with auth hash payload
 *       400:
 *         description: Invalid callback payload
 *
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account
 *     operationId: registerUser
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, department, phone]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: secret123
 *               role:
 *                 type: string
 *                 enum: [student, teacher, admin]
 *                 example: student
 *               faculty:
 *                 type: string
 *                 example: Faculty of Computing
 *               studentId:
 *                 type: string
 *                 example: TG-2026-0012
 *               department:
 *                 type: string
 *                 example: Information Technology
 *               year:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 4
 *                 example: 2
 *               phone:
 *                 type: string
 *                 example: '+94771234567'
 *               bio:
 *                 type: string
 *                 example: Undergraduate focused on backend engineering.
 *               location:
 *                 type: string
 *                 example: Colombo
 *               website:
 *                 type: string
 *                 format: uri
 *                 example: https://example.dev
 *               github:
 *                 type: string
 *                 example: johndoe
 *               twitter:
 *                 type: string
 *                 example: johndoe
 *               linkedin:
 *                 type: string
 *                 example: john-doe
 *           examples:
 *             minimal:
 *               summary: Minimal valid teacher registration payload
 *               value:
 *                 name: John Doe
 *                 email: john.doe+new1@example.com
 *                 password: secret123
 *                 role: teacher
 *                 department: Software Engineering
 *                 phone: '0771234567'
 *             student:
 *               summary: Student registration payload (matches current form)
 *               value:
 *                 name: John Doe
 *                 email: john.doe+new2@example.com
 *                 password: secret123
 *                 role: student
 *                 faculty: Faculty of Computing
 *                 studentId: TG-2026-0012
 *                 department: Information Technology
 *                 year: 2
 *                 phone: '0771234567'
 *                 bio: Undergraduate focused on backend engineering.
 *             teacher:
 *               summary: Teacher registration payload (matches current form)
 *               value:
 *                 name: Jane Lecturer
 *                 email: jane.lecturer+new1@example.com
 *                 password: secret123
 *                 role: teacher
 *                 faculty: Faculty of Computing
 *                 department: Software Engineering
 *                 phone: '0770000000'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserProfile'
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation failed
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
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
 *           examples:
 *             default:
 *               value:
 *                 email: john.doe@example.com
 *                 password: secret123
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *           example:
 *             refreshToken: your_refresh_token_here
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
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *           example:
 *             refreshToken: your_refresh_token_here
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
 *           examples:
 *             studentProfile:
 *               value:
 *                 name: John Doe
 *                 department: Information Technology
 *                 faculty: Faculty of Computing
 *                 year: 2
 *                 phone: '0771234567'
 *                 bio: Enthusiastic SCC user
 *                 profilePicture: https://example.com/john.jpg
 *                 location: Colombo
 *                 website: https://john.dev
 *                 github: johndoe
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
